/* SPDX-License-Identifier: MIT
 * Run from InDesign's Scripts panel. No source document is saved or closed.
 * Automation: set $.global.KURE_PRODUCTION_OPTIONS, or app.scriptArgs keys
 * prefixed "kure.". See ../docs/production.md for the complete parameter list.
 */
#target indesign

(function () {
    var COUNT = 16, PT_PER_MM = 72 / 25.4, TOLERANCE = 0.02 * PT_PER_MM;
    var owned = [], viewSnapshots = [], report = [], options = {};
    var tempFiles = [], tempFolder = null;
    var oldInteraction = app.scriptPreferences.userInteractionLevel;
    var oldUnits = app.scriptPreferences.measurementUnit;
    var oldPlace = {
        pageNumber: app.pdfPlacePreferences.pageNumber,
        pdfCrop: app.pdfPlacePreferences.pdfCrop,
        transparentBackground: app.pdfPlacePreferences.transparentBackground
    };
    var oldExport = app.pdfExportPreferences.properties;
    var interactive = true, result = "", success = false;

    function fail(message) { throw Error(message); }
    function option(name, fallback) {
        if (options[name] !== undefined) return options[name];
        var key = "kure." + name;
        if (app.scriptArgs.isDefined(key)) return app.scriptArgs.getValue(key);
        return fallback;
    }
    function booleanOption(name, fallback) {
        var value = option(name, fallback);
        if (value === true || value === "true") return true;
        if (value === false || value === "false") return false;
        fail(name + " must be true or false.");
    }
    function dimension(name, fallback) {
        var value = Number(option(name, fallback));
        if (!isFinite(value) || value <= 0) fail(name + " must be a positive millimeter dimension.");
        return value * PT_PER_MM;
    }
    function choose(name, prompt, save) {
        var value = option(name, ""), file;
        if (value) file = File(value);
        else if (interactive) file = save ? File.saveDialog(prompt) : File.openDialog(prompt);
        if (!file) fail("Cancelled or missing parameter: " + name);
        if (!save && !file.exists) fail("File not found: " + file.fsName);
        if (save && !file.parent.exists) fail("Output directory does not exist: " + file.parent.fsName);
        return file;
    }
    function key(file) { return file.fsName.toLowerCase(); }
    function extension(file, pattern, label) {
        if (!pattern.test(file.name)) fail(label + " has an unsupported extension: " + file.name);
    }
    function prepareView(doc) {
        var view = doc.viewPreferences;
        viewSnapshots.push({doc: doc, horizontal: view.horizontalMeasurementUnits,
            vertical: view.verticalMeasurementUnits, origin: view.rulerOrigin,
            zero: doc.zeroPoint});
        view.horizontalMeasurementUnits = MeasurementUnits.POINTS;
        view.verticalMeasurementUnits = MeasurementUnits.POINTS;
        view.rulerOrigin = RulerOrigin.SPREAD_ORIGIN;
        doc.zeroPoint = [0, 0];
    }
    function resources(doc, label) {
        var problems = [], i, font, link;
        for (i = 0; i < doc.fonts.length; i++) {
            font = doc.fonts[i];
            if (font.status !== FontStatus.INSTALLED)
                problems.push("Font: " + font.name + " (status " + font.status + ")");
        }
        for (i = 0; i < doc.links.length; i++) {
            link = doc.links[i];
            if (link.status !== LinkStatus.NORMAL && link.status !== LinkStatus.LINK_EMBEDDED)
                problems.push("Link: " + link.name + " (status " + link.status + ")");
        }
        if (problems.length) fail(label + ": missing/substituted fonts or missing/outdated links. " +
            "Resolve them in a separate copy yourself; this script never repairs resources.\n" + problems.join("\n"));
    }
    function pageSize(page, width, height, label) {
        var b = page.bounds;
        if (Math.abs((b[3] - b[1]) - width) > TOLERANCE ||
                Math.abs((b[2] - b[0]) - height) > TOLERANCE)
            fail(label + ": expected " + (width / PT_PER_MM) + " x " + (height / PT_PER_MM) +
                " mm; actual " + ((b[3] - b[1]) / PT_PER_MM) + " x " + ((b[2] - b[0]) / PT_PER_MM) + " mm.");
    }
    function frameFor(page, label) {
        var frame = page.rectangles.add({geometricBounds: page.bounds, name: label});
        frame.strokeWeight = 0;
        frame.fillColor = page.parent.parent.swatches.itemByName("None");
        frame.frameFittingOptions.autoFit = false;
        frame.label = label;
        return frame;
    }
    function place(frame, file, number, width, height) {
        app.pdfPlacePreferences.pageNumber = number;
        var placed = frame.place(file);
        if (!placed.length) fail("PDF page " + number + " could not be placed.");
        var pdf = placed[0];
        if (pdf.pdfAttributes.pageNumber !== number)
            fail("PDF must contain exactly 16 pages; requested page " + number + " wrapped to " + pdf.pdfAttributes.pageNumber + ".");
        frame.insertLabel("kure.sourcePage", String(number));
        // No fit-to-frame: scaling is explicitly 100%, never a disguised resize.
        pdf.absoluteHorizontalScale = 100;
        pdf.absoluteVerticalScale = 100;
        var b = pdf.geometricBounds;
        if (Math.abs((b[3] - b[1]) - width) > TOLERANCE ||
                Math.abs((b[2] - b[0]) - height) > TOLERANCE)
            fail("PDF MediaBox page " + number + " does not match the target page dimensions at 100%.");
        var target = frame.geometricBounds;
        pdf.move(undefined, [target[1] - b[1], target[0] - b[0]]);
        return pdf;
    }
    function verifyAppendix(doc, originalCount, width, height) {
        if (doc.pages.length !== originalCount + COUNT)
            fail("Page-count verification failed: expected " + (originalCount + COUNT) + ", found " + doc.pages.length + ".");
        if (doc.pages[originalCount].side !== PageSideOptions.LEFT_HAND)
            fail("Appendix must begin on a LEFT page. No blank pages were inserted.");
        for (var i = 0; i < COUNT; i++) {
            var page = doc.pages[originalCount + i];
            pageSize(page, width, height, "Appendix page " + (i + 1));
            if (page.appliedMaster !== null && page.appliedMaster !== NothingEnum.NOTHING)
                fail("An appendix page unexpectedly has a master/parent page.");
            if (page.rectangles.length !== 1 || page.rectangles[0].pdfs.length !== 1)
                fail("Appendix page " + (i + 1) + " does not contain exactly one PDF frame.");
            var frame = page.rectangles[0], pdf = frame.pdfs[0], b = page.bounds;
            // InDesign may renumber an embedded extracted PDF stream to page 1
            // after IDML round-trip. Validate source selection before embedding
            // (place()) and preserve that selection in the frame label.
            if (frame.extractLabel("kure.sourcePage") !== String(i + 1) ||
                    (pdf.pdfAttributes.pageNumber !== i + 1 && pdf.pdfAttributes.pageNumber !== 1) ||
                    pdf.pdfAttributes.pdfCrop !== PDFCrop.CROP_MEDIA)
                fail("Wrong PDF page or crop on appendix page " + (i + 1) +
                    ": stored page=" + pdf.pdfAttributes.pageNumber + ", crop=" + pdf.pdfAttributes.pdfCrop + ".");
            if (pdf.itemLink.status !== LinkStatus.LINK_EMBEDDED)
                fail("Appendix PDF page " + (i + 1) + " is not embedded.");
            if (Math.abs(pdf.absoluteHorizontalScale - 100) > 0.001 ||
                    Math.abs(pdf.absoluteVerticalScale - 100) > 0.001)
                fail("Appendix PDF is not placed at 100%.");
            var fb = frame.geometricBounds, pb = pdf.geometricBounds;
            for (var j = 0; j < 4; j++) {
                if (Math.abs(fb[j] - b[j]) > TOLERANCE || Math.abs(pb[j] - b[j]) > TOLERANCE)
                    fail("Appendix PDF/frame origin or bounds differ from its page.");
            }
        }
    }

    try {
        if ($.global.KURE_PRODUCTION_OPTIONS) options = $.global.KURE_PRODUCTION_OPTIONS;
        interactive = booleanOption("interactive", true);
        var overwrite = booleanOption("overwrite", false);
        var width = dimension("widthMm", 130), height = dimension("heightMm", 195);
        var source = choose("source", "Choose source IDML or INDD (will not be modified)", false);
        var pdfInput = choose("pdf", "Choose the explicitly clipped 16-page appendix PDF", false);
        var idmlOutput = choose("idml", "Save independent output IDML", true);
        var pdfOutput = choose("pdfOutput", "Save PDF proof exported from reopened IDML", true);
        extension(source, /\.(indd|idml)$/i, "Source");
        extension(pdfInput, /\.pdf$/i, "Appendix PDF");
        extension(idmlOutput, /\.idml$/i, "Output IDML");
        extension(pdfOutput, /\.pdf$/i, "Output PDF");
        var files = [source, pdfInput, idmlOutput, pdfOutput];
        for (var a = 0; a < files.length; a++)
            for (var b = a + 1; b < files.length; b++)
                if (key(files[a]) === key(files[b])) fail("Every input and output must use a distinct path.");
        if (!overwrite && (idmlOutput.exists || pdfOutput.exists))
            fail("Output already exists. Choose new filenames or explicitly set overwrite=true.");
        // Never overwrite an output document that the user currently has open.
        for (var d = 0; d < app.documents.length; d++) {
            var existing = app.documents[d];
            if (existing.saved && (key(existing.fullName) === key(idmlOutput) || key(existing.fullName) === key(pdfOutput)))
                fail("An output target is currently open. Choose another filename.");
        }
        app.scriptPreferences.userInteractionLevel = UserInteractionLevels.NEVER_INTERACT;
        app.scriptPreferences.measurementUnit = MeasurementUnits.POINTS;
        app.pdfPlacePreferences.pdfCrop = PDFCrop.CROP_MEDIA;
        app.pdfPlacePreferences.transparentBackground = true;

        // OPEN_COPY is essential for INDD: it does not reuse the user's open original.
        var doc = app.open(source, false, OpenOptions.OPEN_COPY);
        owned.push(doc);
        prepareView(doc);
        resources(doc, "Source preflight");
        if (!doc.documentPreferences.facingPages) fail("Source must be a facing-pages document; it is not changed automatically.");
        var originalCount = doc.pages.length;
        if (originalCount < 1) fail("Source document contains no pages.");
        for (var s = 0; s < originalCount; s++) pageSize(doc.pages[s], width, height, "Source page " + (s + 1));
        // Temporarily stop automatic story-driven page creation in the disposable copy.
        var oldReflow = doc.textPreferences.smartTextReflow;
        doc.textPreferences.smartTextReflow = false;
        var pages = [];
        for (var p = 0; p < COUNT; p++) pages.push(doc.pages.add(LocationOptions.AT_END));
        if (pages[0].side !== PageSideOptions.LEFT_HAND)
            fail("The first appended page is RIGHT. Adjust the source's page parity deliberately; no blank is added by this script.");
        for (var i = 0; i < COUNT; i++) {
            pageSize(pages[i], width, height, "New page " + (i + 1));
            pages[i].appliedMaster = null;
            var frame = frameFor(pages[i], "kure-appendix-" + (i + 1));
            place(frame, pdfInput, i + 1, width, height);
        }
        // InDesign wraps requests beyond the last PDF page back to page 1.
        // Page 16 above rules out shorter PDFs; this probe rules out longer PDFs.
        var probe = frameFor(pages[COUNT - 1], "kure-page-count-probe");
        app.pdfPlacePreferences.pageNumber = COUNT + 1;
        var probed = probe.place(pdfInput);
        if (!probed.length || probed[0].pdfAttributes.pageNumber !== 1)
            fail("Input PDF contains more than 16 pages (or page count could not be established).");
        probe.remove();
        // InDesign's embedded multi-page source can lose page selection in IDML.
        // Export each already-verified occurrence to its own one-page PDF first.
        tempFolder = Folder(Folder.temp + "/kure-" + new Date().getTime());
        if (!tempFolder.create()) fail("Could not create temporary PDF directory.");
        var scratch = app.documents.add(false);
        owned.push(scratch);
        scratch.documentPreferences.properties = {facingPages:false, pagesPerDocument:1,
            pageWidth:width, pageHeight:height};
        prepareView(scratch);
        app.pdfExportPreferences.properties = {pageRange:PageRange.ALL_PAGES,
            exportReaderSpreads:false,viewPDF:false,cropMarks:false,bleedMarks:false,
            registrationMarks:false,colorBars:false,pageInformationMarks:false,
            useDocumentBleedWithPDF:false,bleedTop:0,bleedBottom:0,bleedInside:0,bleedOutside:0};
        for (var e = 0; e < COUNT; e++) {
            var tempFrame = frameFor(scratch.pages[0], "kure-extract");
            place(tempFrame, pdfInput, e + 1, width, height);
            var single = File(tempFolder + "/page-" + (e + 1) + ".pdf");
            tempFiles.push(single);
            scratch.exportFile(ExportFormat.PDF_TYPE, single, false);
            tempFrame.remove();
        }
        scratch.close(SaveOptions.NO);
        for (var e = 0; e < COUNT; e++) {
            var targetFrame = pages[e].rectangles[0];
            targetFrame.pdfs[0].remove();
            var uniquePDF = place(targetFrame, tempFiles[e], 1, width, height);
            targetFrame.insertLabel("kure.sourcePage", String(e + 1));
            uniquePDF.itemLink.unlink();
        }
        doc.textPreferences.smartTextReflow = oldReflow;
        verifyAppendix(doc, originalCount, width, height);
        resources(doc, "Before IDML export");
        doc.exportFile(ExportFormat.INDESIGN_MARKUP, idmlOutput, false);
        // Prove the actual interchange artifact, not just the pre-export document.
        var reopened = app.open(idmlOutput, false, OpenOptions.OPEN_COPY);
        owned.push(reopened);
        prepareView(reopened);
        verifyAppendix(reopened, originalCount, width, height);
        resources(reopened, "Reopened IDML preflight");
        var presetName = String(option("pdfPreset", "")), preset = null;
        if (presetName) {
            preset = app.pdfExportPresets.itemByName(presetName);
            if (!preset.isValid) fail("PDF export preset not found: " + presetName);
            // Presets also expose metadata (for example name) that is not an
            // application export preference. Transfer only shared settings.
            var presetValues = preset.properties, exportValues = {};
            for (var setting in oldExport) {
                if (presetValues[setting] !== undefined) exportValues[setting] = presetValues[setting];
            }
            app.pdfExportPreferences.properties = exportValues;
        }
        app.pdfExportPreferences.pageRange = PageRange.ALL_PAGES;
        app.pdfExportPreferences.exportReaderSpreads = false;
        app.pdfExportPreferences.viewPDF = false;
        app.pdfExportPreferences.cropMarks = false;
        app.pdfExportPreferences.bleedMarks = false;
        app.pdfExportPreferences.registrationMarks = false;
        app.pdfExportPreferences.colorBars = false;
        app.pdfExportPreferences.pageInformationMarks = false;
        app.pdfExportPreferences.useDocumentBleedWithPDF = false;
        app.pdfExportPreferences.bleedTop = 0;
        app.pdfExportPreferences.bleedBottom = 0;
        app.pdfExportPreferences.bleedInside = 0;
        app.pdfExportPreferences.bleedOutside = 0;
        reopened.exportFile(ExportFormat.PDF_TYPE, pdfOutput, false);
        report.push("SUCCESS: reopened IDML verified: " + originalCount + " + 16 = " + reopened.pages.length + " pages.");
        report.push("Appendix begins LEFT; parent/master removed; PDFs embedded at 100%, crop MEDIA.");
        report.push("IDML: " + idmlOutput.fsName, "InDesign PDF proof: " + pdfOutput.fsName);
        if (reopened.pages.length % 4 !== 0)
            report.push("WARNING: total is not a multiple of four. Ask the binder; no blank pages were added.");
        if (!presetName) report.push("PDF proof uses current PDF settings, overridden to all single pages, no marks/bleed. Supply pdfPreset for a specific production preset.");
        success = true;
    } catch (error) {
        report.push("ERROR: " + error.message + (error.line ? " (script line " + error.line + ")" : ""));
        report.push("Source was not saved. Any output already written before this failure is NOT a successful proof; inspect/remove it manually.");
    } finally {
        for (var v = viewSnapshots.length - 1; v >= 0; v--) {
            var snap = viewSnapshots[v];
            try {
                if (snap.doc.isValid) {
                    snap.doc.viewPreferences.horizontalMeasurementUnits = snap.horizontal;
                    snap.doc.viewPreferences.verticalMeasurementUnits = snap.vertical;
                    snap.doc.viewPreferences.rulerOrigin = snap.origin;
                    snap.doc.zeroPoint = snap.zero;
                }
            } catch (restoreView) { report.push("WARNING: could not restore copy view preferences: " + restoreView.message); }
        }
        for (var c = owned.length - 1; c >= 0; c--) {
            try { if (owned[c].isValid) owned[c].close(SaveOptions.NO); }
            catch (closeError) { report.push("WARNING: could not close a created copy: " + closeError.message); }
        }
        for (var tf = 0; tf < tempFiles.length; tf++) {
            try { if (tempFiles[tf].exists) tempFiles[tf].remove(); } catch (cleanupFile) {}
        }
        try { if (tempFolder && tempFolder.exists) tempFolder.remove(); } catch (cleanupFolder) {}
        try { app.pdfPlacePreferences.properties = oldPlace; }
        catch (restorePlace) { report.push("WARNING: PDF placement preference restore failed: " + restorePlace.message); }
        try { app.pdfExportPreferences.properties = oldExport; }
        catch (restoreExport) { report.push("WARNING: PDF export preference restore failed: " + restoreExport.message); }
        try { app.scriptPreferences.measurementUnit = oldUnits; }
        catch (restoreUnits) { report.push("WARNING: measurement-unit restore failed: " + restoreUnits.message); }
        try { app.scriptPreferences.userInteractionLevel = oldInteraction; }
        catch (restoreInteraction) { report.push("WARNING: interaction preference restore failed: " + restoreInteraction.message); }
        result = report.join("\n");
        try {
            app.scriptArgs.setValue("kure.success", success ? "true" : "false");
            app.scriptArgs.setValue("kure.result", result);
        } catch (reportError) {}
        if (interactive) alert(result);
    }
    return result;
}());

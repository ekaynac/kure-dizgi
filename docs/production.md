# Production: browser → clipped PDF → InDesign

The toolchain was developed for A. Tolga Suyolcuğlu's Melissa Önermesi poem. The poem itself is not included, published, or licensed by this package. Use your own text or the neutral demonstration data.

## What each artifact proves

- The comparison page exports an eight-spread browser PDF and browser SVGs. At the default dimensions each spread is **260 × 195 mm**, comprising two **130 × 195 mm** pages. These are browser proofs, not evidence of a successful InDesign/IDML round trip.
- `tools/pdf_appendix.py split` makes one sixteen-page PDF, preserving drawing vectors and adding an explicit content clipping path to each page. It checks page count, unrotated MediaBox/CropBox dimensions, and serialized output dimensions. Input tolerance is 0.1 mm to accommodate Chromium paper-size rounding; outputs are generated at the exact requested size. Page order is spread 1 left, spread 1 right, spread 2 left, and so on.
- `tools/appendix-indesign.jsx` opens an independent source copy, appends the sixteen pages, embeds the placed PDFs, exports IDML, **reopens that IDML**, verifies its appendix, and exports a PDF from the reopened document. Only this last PDF is the native InDesign round-trip proof. Expected count is always **source page count + 16**, not a particular book's page count.
- The optional Python `append` command only concatenates a PDF book and appendix. It does not produce IDML, run InDesign, verify native stories, or replace native proofing.

Adobe InDesign is proprietary software and must be installed and appropriately licensed for the JSX workflow. The script is intended for desktop InDesign with ExtendScript support, including InDesign 2026 on Windows/macOS. There is no bundled free INDD converter, no server-side conversion service, and no claim that an SVG/PDF editor can faithfully open and resave native INDD.

## Licenses and installation

The project's own tools are MIT-licensed. **PyMuPDF is not MIT**: the pinned optional Python dependency is separately offered under **AGPL-3.0 or a commercial Artifex license**. It is not vendored here. Review the [PyMuPDF license documentation](https://pymupdf.readthedocs.io/en/latest/about.html#license-and-copyright) and [Artifex licensing information](https://artifex.com/licensing/) before installing, using, integrating, or distributing a solution containing it. Obtain appropriate legal advice for your deployment; an MIT notice on this repository does not remove dependency obligations. No alternate PDF backend or unimplemented licensing “fallback” is advertised.

Use Python **3.10 or newer** and a virtual environment. Run commands from the package root. The pinned dependency is in `tools/requirements.txt`.

Windows PowerShell:

```powershell
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r tools/requirements.txt
.\.venv\Scripts\python.exe tools/pdf_appendix.py split "spread-proof.pdf" "appendix-16.pdf"
```

macOS/Linux:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r tools/requirements.txt
.venv/bin/python tools/pdf_appendix.py split "spread-proof.pdf" "appendix-16.pdf"
```

No virtual-environment activation is necessary with these commands. Keep generated PDFs, private books, virtual environments, and manuscripts outside any distribution of the public package. Installation downloads the dependency; neither production tool sends document contents to a network service.

## 1. Export the browser proof

1. Serve the package locally using the repository's local-serving instructions, open the comparison tool, and load only the text you intend to process.
2. Set the target typography and projection, and review all eight spreads. The intended book-facing reference is configurable **Crimson Pro 10.5 pt with 13 pt leading near the spine**, with at least **20 mm text margins**. Projection distortion/compression can be a deliberate fit choice; a smaller silent replacement font size is not an equivalent result. If a chosen configuration cannot fit safely, revise it explicitly rather than accepting clipped text or concealed shrinking. The production tools below do not change font size, leading, or projection.
3. Export the comparison tool's eight-spread PDF, not a screenshot. Check that the PDF actually contains eight unrotated spread pages with the chosen dimensions. Browser “Print to PDF” can introduce paper-size changes, headers, footers, and scaling; it is not interchangeable unless you verify its boxes and physical scale.
4. Retain the SVGs/JSON as regeneration sources. An SVG can remain vector artwork but is not necessarily editable InDesign story text. A PDF can contain vectors, text operators, outlined glyphs, raster images, or a mixture: “vector PDF” alone does not promise searchable text, Unicode extraction, accessibility, editable paragraphs, or font embedding. These tools do not convert outlined glyphs into native text. Source raster images remain raster; splitting does not vectorize them.

### Margins, leading, and physical measurements

Twenty millimeters means the distance from the **visible ink** to the trim edge, including each side's gutter/spine edge—not just baseline coordinates or text-frame bounds. Italic overhang, transformed glyphs, ascenders/descenders, rotations, strokes, projection compression, and font substitutions affect visible ink. Thirteen-point leading is a baseline-spacing reference; after a nonuniform projection it is not necessarily a constant physical distance everywhere on the curved composition. A transformed glyph can have a nominal 10.5 pt source size and a different local apparent size.

The Python CLI checks PDF boxes, **not typographic margins or every glyph's outline**. The JSX checks placement/bounds/scale, not the internal artwork's safe area. Compare the browser's safe-area guides with a full-size output proof; measure visible ink in the final exported PDF and, for binding decisions, a physical print. Disable viewer/print “fit” scaling. Do not infer safe margins merely because a PDF page has the right dimensions.

## 2. Split with an explicit drawing clip

Default dimensions:

```sh
python tools/pdf_appendix.py split "spread-proof.pdf" "appendix-16.pdf"
```

Replace `python` with the virtual-environment interpreter shown above. The command requires exactly eight **260 × 195 mm** spreads and outputs exactly sixteen **130 × 195 mm** pages. Output directories must already exist. Input files are never overwritten. Existing output is refused unless you deliberately add `--overwrite`:

```sh
python tools/pdf_appendix.py split "spread-proof.pdf" "appendix-16.pdf" --overwrite
```

Custom dimensions must agree end to end. For 140 × 210 mm singles, export 280 × 210 mm spreads and use:

```sh
python tools/pdf_appendix.py split "spread-proof.pdf" "appendix-16.pdf" --page-width-mm 140 --page-height-mm 210
```

The CLI intentionally rejects rotated pages, nonzero MediaBox origins, mismatched CropBox/MediaBox, wrong dimensions, and wrong counts rather than guessing how to normalize a production file. Use normal browser export to correct these conditions. It does not perform bleed design, imposition, PDF/X certification, color conversion, annotation transfer from spread pages, or font repair.

### Why page boxes are not enough

A source page can contain drawing operators outside its MediaBox. Some consumers, including page-as-artwork placement pipelines, can expose that artwork after the page is imported as a Form XObject. A CropBox/MediaBox or a visually correct standalone PDF preview is not by itself a sufficient drawing clip.

The splitter places each selected half of the source as vector page artwork, then wraps the output drawing stream with a real PDF rectangle clipping operator (`q … re W n … Q`). Thus even content originating outside the selected page cannot paint across the page boundary when imported into an InDesign spread. This clip is at the **page edge**, not at the 20 mm safe-text boundary; it does not repair unsafe typography. Do not replace the splitter with page-box editing alone.

## 3. Run the native InDesign script

1. Back up the source book. Resolve missing/substituted fonts and missing/outdated links in your own working copy before running the script. **Save** changes you intend to use: the script reads the chosen file on disk, not unsaved edits in an open window. Existing embedded source links are accepted without needing their original external files.
2. The source must be a facing-pages IDML or INDD with every page already matching the appendix size. The script refuses dimension mismatches rather than resizing the source, stories, or artwork. It does not change existing fonts or repair resources.
3. In InDesign, open **Window → Utilities → Scripts**, reveal the User scripts folder using the panel's context menu, and copy `tools/appendix-indesign.jsx` there. Double-click it in the Scripts panel.
4. Choose the source IDML/INDD, the clipped **sixteen-single-page PDF**, a new output `.idml`, and a separate output `.pdf`. Do not select the eight-spread PDF. By default, existing output targets are refused.
5. Read the success/error report. The script opens hidden independent copies using `OpenOptions.OPEN_COPY`; it never saves the source and closes only documents it created. The user's already open source is neither edited nor closed. Application PDF-placement/export, interaction, measurement, and temporary view preferences are restored in `finally`.
6. Open the output IDML yourself for a final visual review. Inspect all eight appended spreads, the seam, page edges, and existing book pages in the **PDF exported from reopened IDML**, not only the browser proof.

The script appends exactly sixteen pages, requires the first to be **LEFT**, removes their parent/master assignments (so inherited visible folios are not added), places each PDF page at **100%**, uses **crop MEDIA**, checks its real bounds/origin, and embeds every appendix PDF. It validates exact input PDF count by checking pages 1–16 and probing the importer wrap at page 17. It then verifies the new count, left-page start, no applied parents, one PDF per new page, crop, scale, bounds, and embedded status again after reopening the exported IDML.

With no `pdfPreset` parameter, PDF proof export uses the current InDesign PDF settings, overridden to all pages, single pages, no printer marks, and zero bleed. This is not automatic press certification. For a specific installed print preset, pass its exact name as `pdfPreset`; the script applies its settings before the same proof-page/no-marks/no-bleed overrides. Agree on actual delivery settings with the printer, including whether a separate press PDF needs bleed/marks. A PDF export can fail when a source font license disallows embedding; that is not repaired or bypassed.

If an error occurs after IDML has already been written, that partial output is **not a successful round-trip proof**. The script reports this and does not delete arbitrary output files. Inspect/remove incomplete output manually before retrying, or choose new filenames. Restore warnings in the report also require attention.

### Parity and binding

“Left” is the actual InDesign `PageSideOptions.LEFT_HAND` result, not the printed page-number label. In a conventional right-starting facing-pages book, the source ends on a right page when its page count is odd; the next page is left. Sections, shuffling, and custom arrangements can affect this, so the native script checks the actual side. An incompatible source is rejected. It never adds blanks or silently changes numbering/section rules to force a result.

The final count is **original count + 16**. A total not divisible by four produces a warning, not invented blank pages. Whether blanks, endpapers, signatures, or a different gathering are needed is a binder/printer/editor decision. No general rule requires this script to pad every digital PDF. Decide deliberately where any blanks belong in the source book, then regenerate. The Python convenience command only has numeric PDF parity available, so it assumes a conventional page-1-on-right book.

### Embedding and the update workflow

Existing source links are preserved as they are; existing embedded links are acceptable. Missing or outdated external source links abort the process with names/statuses instead of being silently relinked or updated. The sixteen new PDFs are **embedded**, so moving/deleting `appendix-16.pdf` after successful export does not sever those new links in the IDML. This increases document size and prevents automatic external-PDF updates.

InDesign may lose selected page numbers when a shared multi-page PDF is embedded and round-tripped through IDML. The script therefore first verifies all original page selections, exports each to a unique temporary one-page PDF with InDesign, then places and embeds those unique sources. Temporary files are removed after closing the created documents. Embedding extracted streams may report page 1 internally; the original verified source page is stored on each frame. Native-render comparison of all sixteen pages—not only labels—is the release smoke proof.


To change appendix text or projection: edit the JSON/browser source, export the eight spreads, split them again, and rerun from the **original unappended book**, using fresh output filenames (or intentional overwrite). Do not run the script against a previous appended output unless you really want another sixteen pages. Do not expect edits to the external PDF to refresh embedded placements automatically. Keep the JSON/SVG/PDF sources separately as your regeneration record.

## Automation without dialogs

The script accepts a parameter object **before** it is evaluated in the same ExtendScript engine:

```javascript
$.global.KURE_PRODUCTION_OPTIONS = {
    source: File("source-book.indd").fsName,
    pdf: File("appendix-16.pdf").fsName,
    idml: File("book-with-appendix.idml").fsName,
    pdfOutput: File("book-with-appendix-proof.pdf").fsName,
    widthMm: 130,
    heightMm: 195,
    interactive: false,
    overwrite: false
};
try {
    $.evalFile(File("tools/appendix-indesign.jsx"));
    $.writeln(app.scriptArgs.getValue("kure.result"));
} finally {
    delete $.global.KURE_PRODUCTION_OPTIONS;
}
```

Use resolved paths appropriate to your working folder; examples intentionally contain no personal paths. The caller owns clearing a global parameter object it supplied. In Windows COM automation the same parameters can be supplied through `app.scriptArgs` before executing the JSX using InDesign's `DoScript` API. Set each input with `setValue("kure.NAME", "VALUE")`, for example `kure.interactive=false`, `kure.source`, `kure.pdf`, `kure.idml`, and `kure.pdfOutput`. Native COM member capitalization follows your automation binding. Clear only the keys you supplied afterward, rather than clearing another workflow's arguments.

| Parameter | Meaning/default |
| --- | --- |
| `source` | Existing source `.idml` or `.indd`; required without dialogs |
| `pdf` | Existing clipped sixteen-page single-page PDF; required |
| `idml` | Distinct output `.idml`; required |
| `pdfOutput` | Distinct output proof `.pdf`; required |
| `widthMm`, `heightMm` | Positive single-page dimensions; defaults `130`, `195` |
| `interactive` | Boolean or string `true`/`false`; default `true`; `false` forbids file dialogs and result alerts |
| `overwrite` | Boolean or string; default `false`; never permits input/output aliasing or overwriting an open output document |
| `pdfPreset` | Optional exact installed PDF export preset name; otherwise current settings with documented proof overrides |

A global object takes precedence over `kure.*` script arguments. Result keys are **`kure.success`** (`"true"`/`"false"`) and **`kure.result`** (the complete report), written even when processing fails. The returned JSX value is also the report. An automation caller must inspect `kure.success`, not merely process exit status or the existence of output files. InDesign must run in an appropriate logged-in desktop session; starting COM is not a substitute for a licensed installation.

## Optional PDF-only concatenation

For a simple combined PDF without native InDesign integration:

```sh
python tools/pdf_appendix.py append "book.pdf" "appendix-16.pdf" "book-plus-appendix.pdf"
```

Custom dimensions and overwrite are explicit:

```sh
python tools/pdf_appendix.py append "book.pdf" "appendix-16.pdf" "book-plus-appendix.pdf" --page-width-mm 140 --page-height-mm 210 --overwrite
```

The source book must contain at least one page and have an odd count for conventional left-start parity. Only appendix dimensions are constrained; the existing PDF book's page sizes/content are not normalized. The CLI appends sixteen pages, adds explicit content clips to them, verifies count/dimensions after saving, and warns about a total not divisible by four. Source files remain unchanged. PDF rewriting is not a guarantee of preservation of document-level features such as signatures, bookmarks, attachments, accessibility structure, or forms; do not use this convenience path for a signed archival master. It never proves that the book's native InDesign stories, links, fonts, or IDML interchange survive.

## Release smoke checks (run on neutral throwaway data)

Before relying on a release, a maintainer should exercise the CLI on a neutral eight-spread PDF; confirm sixteen 130 × 195 mm pages and refusal of accidental overwrites; inspect content-stream clips and a render of page seams; then run the JSX against an independently saved neutral facing-pages book with the expected left-start parity. Check source-file integrity, count `N + 16`, embedded links, no appendix folios, reopened-IDML output, final physical size, visible-ink margins, and preference restoration. Also exercise wrong-count/wrong-size/missing-font/missing-link/parity failures. These are suggested verification steps, not a claim that a particular release has passed them.

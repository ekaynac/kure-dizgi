#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Split eight spread PDFs or append sixteen single pages, without rasterizing.

Requires the separately licensed dependency in requirements.txt. See
../docs/production.md before installing PyMuPDF (AGPL/commercial).
"""
from __future__ import annotations

import argparse
import math
from pathlib import Path
import shutil
import sys
import tempfile

POINTS_PER_MM = 72 / 25.4
# Chromium rounds CSS paper sizes to PDF units (up to ~0.08 mm here).
# Input acceptance is tolerant; output dimensions are generated exactly.
TOLERANCE_MM = 0.1
SPREAD_COUNT = 8
PAGE_COUNT = 16


def positive_mm(value: str) -> float:
    number = float(value)
    if not math.isfinite(number) or number <= 0:
        raise argparse.ArgumentTypeError("Dimensions must be finite positive millimeters.")
    return number


def check_size(page, width: float, height: float, label: str) -> None:
    tolerance = TOLERANCE_MM * POINTS_PER_MM
    if page.rotation != 0:
        raise ValueError(f"{label}: rotated pages are unsupported; export unrotated pages.")
    media = page.mediabox
    crop = page.cropbox
    if abs(media.width - width) > tolerance or abs(media.height - height) > tolerance:
        raise ValueError(
            f"{label}: MediaBox is {media.width / POINTS_PER_MM:.4f} × "
            f"{media.height / POINTS_PER_MM:.4f} mm, expected "
            f"{width / POINTS_PER_MM:g} × {height / POINTS_PER_MM:g} mm."
        )
    if any(abs(a - b) > tolerance for a, b in zip(media, crop)):
        raise ValueError(f"{label}: CropBox and MediaBox must match; re-export without crop offsets.")
    if abs(media.x0) > tolerance or abs(media.y0) > tolerance:
        raise ValueError(f"{label}: nonzero MediaBox origin; re-export at origin (0, 0).")


def explicit_clip(document, page) -> None:
    """Put a real PDF clipping path around all page drawing operators.

    MediaBox/CropBox alone are not drawing clips when a consumer imports a page
    as a Form XObject. q/re/W/n/Q survives that import without rasterization.
    """
    width, height = page.mediabox.width, page.mediabox.height
    streams = [document.xref_stream(xref) for xref in page.get_contents()]
    stream = (
        f"q\n0 0 {width:.8f} {height:.8f} re W n\n".encode("ascii")
        + b"\n".join(streams)
        + b"\nQ\n"
    )
    xref = document.get_new_xref()
    document.update_object(xref, "<<>>")
    document.update_stream(xref, stream)
    page.set_contents(xref)


def open_pdf(pymupdf, path: Path):
    document = pymupdf.open(path)
    if not document.is_pdf or document.needs_pass:
        document.close()
        raise ValueError(f"Not an unencrypted, readable PDF: {path}")
    return document


def publish(document, output: Path, overwrite: bool, validate) -> None:
    if not output.parent.is_dir():
        raise ValueError(f"Output directory does not exist: {output.parent}")
    if output.exists() and not overwrite:
        raise ValueError(f"Refusing overwrite: {output}. Use --overwrite explicitly.")
    # Validate the serialized PDF, not merely the in-memory object. Finish the
    # temporary file before publishing. Exclusive creation protects existing data.
    with tempfile.TemporaryDirectory(prefix="kure-pdf-") as temporary:
        saved = Path(temporary) / "output.pdf"
        document.save(saved, garbage=4, deflate=True)
        validate(saved)
        mode = "wb" if overwrite else "xb"
        with output.open(mode) as destination, saved.open("rb") as source:
            shutil.copyfileobj(source, destination)


def run(args, pymupdf) -> None:
    width = args.page_width_mm * POINTS_PER_MM
    height = args.page_height_mm * POINTS_PER_MM
    output = args.output.expanduser().resolve()
    inputs = [args.input] if args.command == "split" else [args.book, args.appendix]
    inputs = [path.expanduser().resolve() for path in inputs]
    if output in inputs:
        raise ValueError("Output must be distinct from every input, even with --overwrite.")
    if args.command == "split":
        with open_pdf(pymupdf, inputs[0]) as source, pymupdf.open() as result:
            if source.page_count != SPREAD_COUNT:
                raise ValueError(f"Expected {SPREAD_COUNT} spreads; found {source.page_count}.")
            for index, page in enumerate(source):
                check_size(page, 2 * width, height, f"Spread {index + 1}")
                for half in range(2):
                    target = result.new_page(width=width, height=height)
                    half_width = page.rect.width / 2
                    clip = pymupdf.Rect(half * half_width, 0, (half + 1) * half_width, page.rect.height)
                    if page.get_contents():
                        target.show_pdf_page(target.rect, source, index, clip=clip)
                    explicit_clip(result, target)

            def validate(path):
                with open_pdf(pymupdf, path) as saved:
                    if saved.page_count != PAGE_COUNT:
                        raise ValueError("Serialized split PDF has an unexpected page count.")
                    for index, page in enumerate(saved):
                        check_size(page, width, height, f"Output page {index + 1}")

            publish(result, output, args.overwrite, validate)
        print(f"Created {output}: 16 explicitly clipped vector pages, left half before right half.")
    else:
        with open_pdf(pymupdf, inputs[0]) as book, open_pdf(pymupdf, inputs[1]) as appendix:
            if appendix.page_count != PAGE_COUNT:
                raise ValueError(f"Expected a 16-page appendix; found {appendix.page_count}.")
            if book.page_count == 0:
                raise ValueError("The source book must contain at least one page.")
            original_count = book.page_count
            if original_count % 2 == 0:
                raise ValueError(
                    "Appendix would begin on a right page under normal book parity. "
                    "Supply a book with an odd page count; no blank pages are inserted."
                )
            for index, page in enumerate(appendix):
                check_size(page, width, height, f"Appendix page {index + 1}")
            book.insert_pdf(appendix)
            for index in range(original_count, original_count + PAGE_COUNT):
                explicit_clip(book, book[index])

            def validate(path):
                with open_pdf(pymupdf, path) as saved:
                    if saved.page_count != original_count + PAGE_COUNT:
                        raise ValueError("Serialized combined PDF has an unexpected page count.")
                    for index in range(original_count, saved.page_count):
                        check_size(saved[index], width, height, f"Appended page {index + 1}")

            publish(book, output, args.overwrite, validate)
        total = original_count + PAGE_COUNT
        print(f"Created {output}: {original_count} + 16 = {total} pages. PDF-only convenience, not IDML proof.")
        if total % 4:
            print("WARNING: total is not a multiple of four. Ask the binder about blanks; none were added.")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    split = commands.add_parser("split", help="Split exactly eight spreads into sixteen explicitly clipped pages.")
    split.add_argument("input", type=Path)
    split.add_argument("output", type=Path)
    append = commands.add_parser("append", help="Append sixteen pages to a PDF book; this does not produce IDML.")
    append.add_argument("book", type=Path)
    append.add_argument("appendix", type=Path)
    append.add_argument("output", type=Path)
    for command in (split, append):
        command.add_argument("--page-width-mm", type=positive_mm, default=130)
        command.add_argument("--page-height-mm", type=positive_mm, default=195)
        command.add_argument("--overwrite", action="store_true")
    args = parser.parse_args()
    try:
        import pymupdf
    except ImportError:
        parser.error("Install tools/requirements.txt after reviewing the PyMuPDF license in docs/production.md.")
    try:
        run(args, pymupdf)
    except (ValueError, RuntimeError, OSError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

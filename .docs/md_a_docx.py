# -*- coding: utf-8 -*-
"""Convierte los documentos Markdown de .docs/ a .docx con formato Evently."""
import re
import sys
from pathlib import Path

from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH

DOCS_DIR = Path(__file__).parent
MORADO = RGBColor(0x7B, 0x2C, 0xBF)
GRIS = RGBColor(0x44, 0x44, 0x44)

ARCHIVOS = [
    "practica-09-widget-smart-tv-git.md",
    "practica-10-base-datos-estable.md",
]


def build_doc():
    doc = Document()
    style = doc.styles["Normal"]
    style.font.name = "Calibri"
    style.font.size = Pt(11)
    for i in range(1, 4):
        h = doc.styles[f"Heading {i}"]
        h.font.color.rgb = MORADO
        h.font.name = "Calibri"
    return doc


def add_inline(par, text, base_bold=False):
    for tok in re.split(r"(\*\*.+?\*\*|`[^`]+`)", text):
        if not tok:
            continue
        if tok.startswith("**") and tok.endswith("**"):
            r = par.add_run(tok[2:-2])
            r.bold = True
        elif tok.startswith("`") and tok.endswith("`"):
            r = par.add_run(tok[1:-1])
            r.font.name = "Consolas"
            r.font.size = Pt(10)
            r.font.color.rgb = RGBColor(0xC0, 0x26, 0xD3)
        else:
            r = par.add_run(tok)
            r.bold = base_bold
        if base_bold:
            r.bold = True


def add_code_block(doc, lines):
    for ln in lines:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.25)
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(ln if ln else " ")
        r.font.name = "Consolas"
        r.font.size = Pt(8.5)
        r.font.color.rgb = GRIS


def add_table(doc, rows):
    parsed = [
        [c.strip() for c in r.strip().strip("|").split("|")]
        for r in rows
        if not re.match(r"^\s*\|[\s:\-|]+\|\s*$", r)
    ]
    if not parsed:
        return
    t = doc.add_table(rows=len(parsed), cols=len(parsed[0]))
    t.style = "Light Grid Accent 4"
    for ri, row in enumerate(parsed):
        for ci, cell in enumerate(row):
            if ci >= len(t.rows[ri].cells):
                continue
            c = t.rows[ri].cells[ci]
            c.text = ""
            par = c.paragraphs[0]
            add_inline(par, cell.replace("\\|", "|"), base_bold=(ri == 0))
            for r in par.runs:
                r.font.size = Pt(9)
    doc.add_paragraph()


def convert(src: Path, dst: Path):
    doc = build_doc()
    lines = src.read_text(encoding="utf-8").splitlines()
    i = 0
    while i < len(lines):
        ln = lines[i]
        if ln.startswith("```"):
            block = []
            i += 1
            while i < len(lines) and not lines[i].startswith("```"):
                block.append(lines[i])
                i += 1
            add_code_block(doc, block)
            doc.add_paragraph()
        elif ln.startswith("|"):
            rows = []
            while i < len(lines) and lines[i].startswith("|"):
                rows.append(lines[i])
                i += 1
            add_table(doc, rows)
            continue
        elif ln.startswith("#### "):
            doc.add_heading(ln[5:], level=3)
        elif ln.startswith("### "):
            doc.add_heading(ln[4:], level=2)
        elif ln.startswith("## "):
            doc.add_heading(ln[3:], level=1)
        elif ln.startswith("# "):
            p = doc.add_heading(ln[2:], level=0)
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        elif re.match(r"^-{3,}$", ln.strip()):
            pass
        elif ln.startswith("> "):
            p = doc.add_paragraph(style="Intense Quote")
            add_inline(p, ln[2:])
        elif re.match(r"^\s*[-*] ", ln):
            p = doc.add_paragraph(style="List Bullet")
            add_inline(p, re.sub(r"^\s*[-*] ", "", ln))
        elif re.match(r"^\s*\d+\. ", ln):
            p = doc.add_paragraph(style="List Number")
            add_inline(p, re.sub(r"^\s*\d+\. ", "", ln))
        elif ln.strip():
            p = doc.add_paragraph()
            add_inline(p, ln)
        i += 1
    doc.save(dst)
    print(f"Generado: {dst}")


def main():
    targets = sys.argv[1:] if len(sys.argv) > 1 else ARCHIVOS
    for name in targets:
        src = DOCS_DIR / name
        if not src.exists():
            print(f"No encontrado: {src}")
            continue
        dst = src.with_suffix(".docx")
        convert(src, dst)


if __name__ == "__main__":
    main()

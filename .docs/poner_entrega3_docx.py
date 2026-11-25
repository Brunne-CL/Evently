# -*- coding: utf-8 -*-
"""Sustituye el texto de la Entrega 3 e inserta las figuras 21 y 22."""

from copy import deepcopy
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

BASE = Path(__file__).resolve().parent
path = BASE / "evently-preguntas-y-entregas.docx"
EVIDENCIA = BASE / "evidencia"
TEXTO = RGBColor(0x1F, 0x29, 0x33)
GRIS = RGBColor(0x5E, 0x6A, 0x63)

d = Document(str(path))
if any(p.text.strip().startswith("Figura 21.") for p in d.paragraphs):
    print("ya estaba")
    raise SystemExit(0)

cuerpos = [
    "En la aplicación del teléfono, una sesión ya guardada no muestra Evently hasta que la huella coincida con la del dispositivo. El primer acceso de esa apertura puede ser el código QR o el inicio de sesión. Después, cada vez que se abre la app, y también al volver desde segundo plano, aparece la pantalla de confirmación y el sensor del teléfono. Si la huella no coincide, o se cancela, el contenido sigue oculto.",
    "El sitio en el navegador de escritorio no pide huella. El reloj, desarrollado en Flutter, queda fuera de este flujo y solo consulta los eventos.",
]

inicio = next(i for i, p in enumerate(d.paragraphs) if p.text.strip().startswith("Entrega 3."))
# Los tres párrafos siguientes son el texto viejo. El cuarto es el título Prácticas.
viejos = [d.paragraphs[inicio + 1], d.paragraphs[inicio + 2], d.paragraphs[inicio + 3]]
ancla = d.paragraphs[inicio + 4]._p


def estilo(para, texto, *, size=11, color=TEXTO, italic=False):
    p = para._p
    for child in list(p):
        if child.tag != qn("w:pPr"):
            p.remove(child)
    run = para.add_run(texto)
    run.bold = False
    run.italic = italic
    run.font.name = "Calibri"
    run._element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")
    run.font.size = Pt(size)
    run.font.color.rgb = color


estilo(viejos[0], cuerpos[0])
estilo(viejos[1], cuerpos[1])
viejos[2]._p.getparent().remove(viejos[2]._p)


def nuevo_parrafo():
    p = d.add_paragraph()
    el = p._p
    el.getparent().remove(el)
    ancla.addprevious(el)
    return p


def figura(archivo, pie):
    p = nuevo_parrafo()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after = Pt(2)
    p.add_run().add_picture(str(EVIDENCIA / archivo), width=Cm(7.2))
    cap = nuevo_parrafo()
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cap.paragraph_format.space_after = Pt(10)
    estilo(cap, pie, size=10, color=GRIS, italic=True)


figura(
    "18-huella.png",
    "Figura 21. Al abrir la app con la sesión ya guardada, el teléfono pide confirmar la huella.",
)
figura(
    "19-huella-abierta.png",
    "Figura 22. Cuando la huella coincide con la del dispositivo, Evently muestra el inicio.",
)

d.save(str(path))
print("saved")

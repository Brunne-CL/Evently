# -*- coding: utf-8 -*-
"""Agrega (o repara) preguntas 6 y 7 en el DOCX de Evently."""

from copy import deepcopy
from pathlib import Path

from docx import Document
from docx.oxml.ns import qn
from docx.shared import Pt, RGBColor
from docx.text.paragraph import Paragraph

path = Path(__file__).resolve().parent / "evently-preguntas-y-entregas.docx"
d = Document(str(path))

TEXTO = RGBColor(0x1F, 0x1F, 0x1F)


def _copy_pPr(para):
    pPr = para._p.find(qn("w:pPr"))
    return deepcopy(pPr) if pPr is not None else None


def apply_pPr(dst_para, pPr):
    if pPr is None:
        return
    existing = dst_para._p.find(qn("w:pPr"))
    if existing is not None:
        dst_para._p.remove(existing)
    dst_para._p.insert(0, deepcopy(pPr))


def set_run_style(run, *, bold=False, size=12, color=TEXTO):
    run.bold = bold
    run.font.name = "Calibri"
    run._element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")
    run.font.size = Pt(size)
    run.font.color.rgb = color


def clear_paragraph(para):
    for child in list(para._p):
        if child.tag != qn("w:pPr"):
            para._p.remove(child)


def insert_before(ref_para):
    new_p = deepcopy(ref_para._p)
    for child in list(new_p):
        if child.tag != qn("w:pPr"):
            new_p.remove(child)
    ref_para._p.addprevious(new_p)
    return Paragraph(new_p, ref_para._parent)


def write_plain(para, texto, *, bold=False):
    clear_paragraph(para)
    apply_pPr(para, ref_body_pPr)
    run = para.add_run(texto)
    set_run_style(run, bold=bold, size=12, color=TEXTO)


def write_mixed(para, partes):
    clear_paragraph(para)
    apply_pPr(para, ref_body_pPr)
    for texto, bold in partes:
        run = para.add_run(texto)
        set_run_style(run, bold=bold, size=12, color=TEXTO)


# Quitar inserciones previas desordenadas (entre Figura 6 y Entregas)
figura_idx = None
entregas_idx = None
for i, p in enumerate(d.paragraphs):
    t = p.text.strip()
    if t.startswith("Figura 6."):
        figura_idx = i
    if t == "Entregas":
        entregas_idx = i
        break

if figura_idx is None or entregas_idx is None:
    raise SystemExit(f"No se localizó Figura 6 / Entregas ({figura_idx}, {entregas_idx})")

# Eliminar todo entre figura+imagen y Entregas
# Tras Figura 6 suele haber un párrafo de imagen sin texto.
to_delete = []
for i, p in enumerate(d.paragraphs):
    if figura_idx < i < entregas_idx:
        # Conservar solo párrafos de imagen inmediatamente después de Figura 6
        # si no tienen texto y tienen drawing: en la práctica, borrar todo lo
        # que diga sobre interfaz/navegación o Respuesta de esas preguntas.
        t = p.text.strip()
        has_img = bool(p._p.findall(".//{http://schemas.openxmlformats.org/drawingml/2006/main}blip"))
        if has_img and not t:
            continue
        if i == figura_idx + 1 and has_img:
            continue
        to_delete.append(p._p)

for el in to_delete:
    parent = el.getparent()
    if parent is not None:
        parent.remove(el)

# Recargar índices tras el borrado
d = Document(str(path)) if False else d  # mismo doc ya mutado
entregas_para = None
for p in d.paragraphs:
    if p.text.strip() == "Entregas":
        entregas_para = p
        break
if entregas_para is None:
    raise SystemExit("Entregas desapareció")

# Referencias de formato
ref_q_pPr = _copy_pPr(d.paragraphs[43])
ref_body_pPr = _copy_pPr(d.paragraphs[45])

bloques = [
    ("q", "6.- ¿Qué tipo de interfaz tiene la app?"),
    ("label", "Respuesta:"),
    (
        "mixed",
        [
            ("La interfaz de la aplicación es de ", False),
            ("tipo americano", True),
            (".", False),
        ],
    ),
    (
        "body",
        "Se caracteriza por una presentación limpia y directa: poco ruido visual, "
        "jerarquía clara (título, texto de apoyo y acción), espacios amplios entre "
        "bloques y controles fáciles de reconocer. En Evently la pantalla principal "
        "muestra el contenido principal de inmediato (eventos, búsqueda e inicio de "
        "sesión), con botones y enlaces visibles, sin saturar la vista con menús densos "
        "ni con demasiada información al mismo tiempo.",
    ),
    (
        "body",
        "Ese estilo encaja con una app pensada para usarse en el teléfono: el usuario "
        "encuentra rápido qué hacer (ver eventos, entrar o confirmar asistencia) sin "
        "recorrer una interfaz cargada.",
    ),
    ("q", "7.- ¿Qué tipo de navegación tiene la app?"),
    ("label", "Respuesta:"),
    (
        "mixed",
        [
            ("La navegación de la aplicación es de tipo ", False),
            ("scrolling", True),
            (".", False),
        ],
    ),
    (
        "body",
        "El contenido principal se recorre desplazando la pantalla de arriba hacia abajo. "
        "En la página de inicio las secciones (presentación, cómo funciona, listado de "
        "eventos y demás bloques) quedan en una misma vista continua; el usuario avanza "
        "haciendo scroll, en lugar de depender solo de pestañas o de una barra inferior "
        "para cambiar de pantalla.",
    ),
    (
        "body",
        "Los enlaces del menú llevan a puntos de esa misma página o a pantallas concretas "
        "(inicio de sesión, detalle de evento), pero el patrón base de la app móvil es el "
        "desplazamiento vertical para descubrir y consultar la información.",
    ),
]

# Insertar en orden: cada uno justo antes de Entregas → queda en secuencia correcta
for tipo, contenido in bloques:
    para = insert_before(entregas_para)
    if tipo == "q":
        clear_paragraph(para)
        apply_pPr(para, ref_q_pPr)
        run = para.add_run(contenido)
        set_run_style(run, bold=True, size=12, color=TEXTO)
    elif tipo == "label":
        write_plain(para, contenido, bold=True)
    elif tipo == "mixed":
        write_mixed(para, contenido)
    else:
        write_plain(para, contenido)

d.save(str(path))
print("saved", path)

d2 = Document(str(path))
for i, p in enumerate(d2.paragraphs):
    t = p.text.strip()
    if 43 <= i <= 70 and t:
        print(f"{i:03d} {t[:150]}")

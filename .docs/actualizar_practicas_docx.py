# -*- coding: utf-8 -*-
"""Actualiza la sección de prácticas en evently-preguntas-y-entregas.docx."""

from copy import deepcopy
from pathlib import Path

from docx import Document
from docx.oxml.ns import qn
from docx.shared import Pt, RGBColor

path = Path(__file__).resolve().parent / "evently-preguntas-y-entregas.docx"
d = Document(str(path))

TEXTO = RGBColor(0x1F, 0x29, 0x33)
VERDE = RGBColor(0x3D, 0x5C, 0x48)

def _copy_pPr(para):
    pPr = para._p.find(qn("w:pPr"))
    return deepcopy(pPr) if pPr is not None else None


ref_titulo_pPr = _copy_pPr(d.paragraphs[78])
ref_cuerpo_pPr = _copy_pPr(d.paragraphs[79])


def apply_pPr(dst_para, pPr):
    if pPr is None:
        return
    existing = dst_para._p.find(qn("w:pPr"))
    if existing is not None:
        dst_para._p.remove(existing)
    dst_para._p.insert(0, deepcopy(pPr))


def set_run_style(run, *, bold=False, size=11, color=TEXTO):
    run.bold = bold
    run.font.name = "Calibri"
    run._element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")
    run.font.size = Pt(size)
    run.font.color.rgb = color


def clear_paragraph(para):
    p = para._p
    for child in list(p):
        if child.tag != qn("w:pPr"):
            p.remove(child)


def write_titulo(para, texto):
    clear_paragraph(para)
    apply_pPr(para, ref_titulo_pPr)
    run = para.add_run(texto)
    set_run_style(run, bold=True, size=11, color=VERDE)


def write_cuerpo(para, texto):
    clear_paragraph(para)
    apply_pPr(para, ref_cuerpo_pPr)
    run = para.add_run(texto)
    set_run_style(run, bold=False, size=11, color=TEXTO)


def add_titulo(texto):
    p = d.add_paragraph()
    write_titulo(p, texto)
    return p


def add_cuerpo(texto):
    p = d.add_paragraph()
    write_cuerpo(p, texto)
    return p


practicas = [
    (
        "Práctica 1. Introducción al firmware mediante script — No aplica",
        "La práctica desarrolla un script de firmware para un ESP32 que controla un LED "
        "y lee el estado de un botón, para entender la interacción entre el software y "
        "los componentes físicos del dispositivo. Evently no programa un microcontrolador "
        "ni controla hardware de ese tipo. El proyecto vive en el sitio web (React), en la "
        "aplicación móvil y en el smartwatch (Flutter). La interacción es con pantallas, "
        "sesión, eventos y la API; no con un LED ni un botón físico cableado a un ESP32. "
        "Aunque la práctica sea de firmware y no de IoT con sensores remotos, el entregable "
        "exige un circuito y un script que Evently no incluye. Por eso esta práctica no "
        "forma parte del proyecto.",
    ),
    (
        "Práctica 2. Consumo de una URL preasignada (ConsultaWeb) — Sí aplica",
        "Evently no trae los eventos escritos en el código. Los pide a una URL ya definida, "
        "la de la API del sitio (por ejemplo el listado de eventos). Esa dirección está "
        "separada de la pantalla. Al consultar, la aplicación hace una petición HTTP, "
        "procesa la respuesta (JSON) y la muestra. Mientras espera, indica que está "
        "consultando. Si no hay conexión, avisa que no fue posible obtener la información "
        "y no presenta datos a medias. Es la misma técnica de ConsultaWeb como extensión "
        "del sitio personal: URL preasignada, solicitud HTTP y procesamiento de la "
        "respuesta. En Evently se usa para cargar eventos, sesión y confirmaciones de "
        "asistencia.",
    ),
    (
        "Práctica 3. Almacenamiento estructurado (SQLite / Room) — Sí aplica",
        "En el teléfono la información se guarda con campos fijos, no como un texto suelto. "
        "La sesión ya funciona así: el token y los datos del usuario quedan en el "
        "dispositivo (localStorage / sessionStorage) y siguen ahí al cerrar la aplicación. "
        "La práctica lleva esa idea a una base local estructurada (SQLite mediante Room): "
        "entidad, DAO y operaciones para registrar, consultar, modificar y eliminar, por "
        "ejemplo una tabla de usuarios. MySQL sigue siendo la base compartida del servidor. "
        "En el dispositivo queda la copia estructurada que la app necesita sin depender "
        "solo de la red. Si la tabla gana un campo, cambian la entidad, la base, la "
        "interfaz y las operaciones de inserción, consulta y actualización. Por eso esta "
        "práctica sí aplica al proyecto.",
    ),
    (
        "Práctica 4. Código seguro en aplicaciones móviles (AccesoSeguro) — Sí aplica",
        "Evently tiene inicio de sesión con correo y contraseña (y PIN). La práctica de "
        "AccesoSeguro exige validar que los campos no vayan vacíos, limitar la longitud de "
        "las entradas, ocultar la contraseña, mostrar errores genéricos sin datos sensibles "
        "y no imprimir credenciales en Logcat. Eso aplica directamente al acceso de Evently: "
        "si la app aceptara entradas sin validar, revelara detalles técnicos en errores o "
        "escribiera contraseñas en el registro, pondría en riesgo la sesión y los datos del "
        "usuario. Las medidas de AccesoSeguro (validación, manejo seguro de credenciales y "
        "mensajes genéricos) son las mismas que el login de Evently debe cumplir. Por eso "
        "esta práctica sí aplica.",
    ),
    (
        "Práctica 5. Interacción entre dispositivos (MobileConnect) — Sí aplica",
        "La práctica busca comprender cómo dos dispositivos intercambian información de "
        "forma inalámbrica: un mensaje enviado desde uno aparece en el otro. En Evently "
        "esa interacción ya existe entre varios dispositivos del mismo sistema. Primero, "
        "web y teléfono: la web genera un código QR de una sesión activa; la app móvil lo "
        "lee y recupera esa sesión sin volver a escribir correo y contraseña. Segundo, "
        "teléfono y smartwatch: el reloj consulta por la API los mismos eventos y permite "
        "ver o confirmar asistencia desde Wear OS. No es un chat entre dos teléfonos como "
        "MobileConnect, pero el objetivo de la práctica —intercambio de información entre "
        "instancias o dispositivos por un canal inalámbrico— es el mismo: la sesión viaja "
        "del sitio al móvil, y los eventos se comparten con el reloj. Por eso esta práctica "
        "sí aplica al proyecto.",
    ),
]

# Eliminar párrafos antiguos de prácticas (desde el índice 78)
for para in list(d.paragraphs[78:]):
    el = para._p
    parent = el.getparent()
    if parent is not None:
        parent.remove(el)

for titulo, cuerpo in practicas:
    add_titulo(titulo)
    add_cuerpo(cuerpo)

d.save(str(path))
print("saved", path)

d2 = Document(str(path))
print("paragraphs", len(d2.paragraphs))
for i, p in enumerate(d2.paragraphs):
    if i >= 75:
        t = p.text.strip()
        if t:
            print(f"{i:03d} {t[:130]}")

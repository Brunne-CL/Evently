# -*- coding: utf-8 -*-
"""Reporte breve de las prácticas 13 y 14."""

from pathlib import Path

from docx import Document
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

SALIDA = Path(__file__).resolve().parent / "Practica13-14-Automatizacion.docx"
COPIA = Path(__file__).resolve().parent.parent.parent / "Practicas" / "Practica13-14-Automatizacion.docx"
VERDE = RGBColor(0x0F, 0x6E, 0x56)
TEXTO = RGBColor(0x1A, 0x1F, 0x1C)


def estilo(run, size=11, bold=False, color=TEXTO):
    run.font.name = "Calibri"
    run._element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")
    run.font.size = Pt(size)
    run.bold = bold
    run.font.color.rgb = color


def parrafo(doc, texto, size=11, bold=False, color=TEXTO, space=6):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(space)
    p.paragraph_format.space_before = Pt(0)
    estilo(p.add_run(texto), size, bold, color)
    return p


def titulo(doc, texto):
    p = doc.add_heading(texto, level=1)
    for run in p.runs:
        run.font.color.rgb = VERDE
        run.font.name = "Calibri"


def sombra(celda):
    pr = celda._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), "0F6E56")
    shd.set(qn("w:val"), "clear")
    pr.append(shd)


def tabla(doc, encabezados, filas):
    t = doc.add_table(rows=1, cols=len(encabezados))
    t.style = "Table Grid"
    for i, texto in enumerate(encabezados):
        celda = t.rows[0].cells[i]
        celda.text = ""
        run = celda.paragraphs[0].add_run(texto)
        estilo(run, 10, True, RGBColor(255, 255, 255))
        sombra(celda)
    for fila in filas:
        celdas = t.add_row().cells
        for i, valor in enumerate(fila):
            celdas[i].text = ""
            estilo(celdas[i].paragraphs[0].add_run(str(valor)), 10)
    doc.add_paragraph()


def main():
    doc = Document()
    for seccion in doc.sections:
        seccion.top_margin = Cm(1.6)
        seccion.bottom_margin = Cm(1.6)
        seccion.left_margin = Cm(1.7)
        seccion.right_margin = Cm(1.7)

    parrafo(doc, "Dispositivos inteligentes", 12, True, VERDE, 2)
    parrafo(doc, "Prácticas 13 y 14. Automatización y validación continua", 18, True, TEXTO, 8)

    titulo(doc, "Componentes y defecto que la prueba evita")
    parrafo(
        doc,
        "De las prácticas 11 y 12 se tomaron tres piezas. La función crítica es isValidPin, porque el reloj y el registro aceptan o rechazan el acceso con ella. El servicio es GET /api/events junto con POST /api/auth/register. La persistencia es el alta del usuario: la contraseña debe quedar como hash y un correo repetido no puede responder 500. Ese 500, y el 500 de un JSON mal formado, son los defectos que ahora quedan atrapados por la suite. Si alguien revierte el catch de ER_DUP_ENTRY o el manejador del JSON, el push falla.",
    )

    titulo(doc, "Qué se ejecuta")
    parrafo(
        doc,
        "En local, npm test corrió 41 pruebas en 1.7 s: 41 aprobadas y 0 fallidas. Entran las cinco unitarias nuevas (PIN válido, nulo, fuera de rango, espera 200/400/800 ms y respuesta tardía), la integración del listado, el registro y el servidor apagado, y la suite de caja blanca que ya existía. Durante el armado, la integración reventó al cargar eventsController porque el sustituto de la base no entregaba un pool. Se corrigió el doble antes de subirlo. GitHub no llegó a ver ese fallo.",
    )
    tabla(
        doc,
        ["Id", "Tipo", "Resultado"],
        [
            ["AUT-01", "Unitaria: PIN de cuatro dígitos", "Aprobada"],
            ["AUT-02", "Unitaria: null, undefined y vacío", "Aprobada"],
            ["AUT-03", "Unitaria: 3 dígitos, 7 dígitos y número", "Aprobada"],
            ["AUT-04", "Unitaria e integración: reintento y GET /api/events en 200", "Aprobada"],
            ["AUT-05", "Unitaria e integración: no repetir un 400; registro 201 y 409", "Aprobada"],
            ["AUT-06", "Persistencia: 401 sin token, JSON en 400, mensaje si no hay red", "Aprobada"],
            ["AUT-07", "CI del primer push", "Exitosa"],
            ["AUT-08", "CI del segundo push", "Se comprueba al subir este informe"],
        ],
    )

    titulo(doc, "Integración continua")
    parrafo(
        doc,
        "El archivo .github/workflows/pruebas.yml corre en cada push y en cada pull request, con Node 22, npm ci y npm test dentro de eventos-backend. No abre MySQL: la integración sustituye la base y levanta la API en un puerto efímero. La primera ejecución, del commit dde98c4, terminó en success. El job duró 10 segundos (20:49:11 a 20:49:21, hora de México) y el paso de pruebas quedó en verde. La dirección es https://github.com/Brunne-CL/Evently/actions/runs/44226002650.",
    )
    parrafo(
        doc,
        "El segundo push sube este informe. Su resultado se anota en cuanto GitHub termina esa corrida.",
    )

    titulo(doc, "Conclusión")
    parrafo(
        doc,
        "La automatización no descubre sola un diseño nuevo, pero impide que una corrección ya hecha se pierda. El listado paginado, el 409 del correo repetido y el 400 del JSON inválido quedan escritos como resultado esperado. Un cambio posterior que vuelva a devolver el catálogo entero, que guarde la contraseña en claro o que trate un corte de red como éxito rompe npm test en la máquina y otra vez en GitHub, antes de que ese cambio se quede en main. El costo medido fue de 1.7 segundos en local y unos 10 segundos de job en el runner. Alcanza para correrlo en cada push.",
    )

    doc.save(SALIDA)
    COPIA.parent.mkdir(exist_ok=True)
    COPIA.write_bytes(SALIDA.read_bytes())
    print(SALIDA)


if __name__ == "__main__":
    main()

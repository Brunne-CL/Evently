# -*- coding: utf-8 -*-
"""Informe de comunicación de Evently Watch."""

from pathlib import Path

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor
from PIL import Image, ImageDraw, ImageFont

BASE = Path(__file__).resolve().parent
EVIDENCIA = BASE / "evidencia-comunicacion"
SHOTS = Path(r"C:\Users\bruno\AppData\Local\Temp\cursor\screenshots")
SALIDA_INFORME = BASE / "Evently-EvaluacionComunicacion.docx"
SALIDA_PRACTICAS = BASE.parent.parent / "Practicas" / "Evently-EvaluacionComunicacion.docx"

VERDE = RGBColor(0x0F, 0x6E, 0x56)
TEXTO = RGBColor(0x1A, 0x1F, 0x1C)
GRIS = RGBColor(0x5E, 0x6A, 0x63)

CONCLUSION = (
    "La conexión funcionó. Evently Watch habló por HTTP con la API "
    "del puerto 4000 y con MySQL. El alta respondió 201 en 523 ms y el acceso con teléfono "
    "y PIN respondió 200 en 287 ms desde la pantalla. La reserva de Fiesta de bienvenida "
    "estudiantil respondió 201, con el aviso Asistencia confirmada y 449 lugares. MySQL "
    "guardó una sola fila confirmada y el cupo ocupado pasó de 0 a 1. Al consultar otra "
    "vez, el reloj mostró ese evento como confirmado. Nombre, correo, teléfono e "
    "identificador coincidieron. La contraseña y el PIN no regresaron en claro: quedaron "
    "como hash bcrypt. Un segundo envío no duplicó la fila. En Chrome el navegador bloqueó "
    "el origen del puerto 8095, porque CORS solo admitía el 5173. La aplicación no marcó "
    "el acceso como exitoso y mostró Sin conexión al servidor. Ese aviso no distingue un "
    "origen rechazado de una red caída. Con la API apagada, la consulta falló en cerca de "
    "un segundo, los contadores quedaron en cero y no se fingió la carga. Al "
    "encender el servicio, Mis eventos volvió a mostrar el registro. Convendría usar HTTPS "
    "fuera del laboratorio, separar esos errores y reintentar al recuperar la conexión."
)


def palabras(texto):
    return len(texto.replace("—", " ").split())


def fuente(size):
    for ruta in (
        r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\calibri.ttf",
        r"C:\Windows\Fonts\arial.ttf",
    ):
        if Path(ruta).exists():
            return ImageFont.truetype(ruta, size)
    return ImageFont.load_default()


def fuente_bold(size):
    for ruta in (
        r"C:\Windows\Fonts\segoeuib.ttf",
        r"C:\Windows\Fonts\calibrib.ttf",
        r"C:\Windows\Fonts\arialbd.ttf",
    ):
        if Path(ruta).exists():
            return ImageFont.truetype(ruta, size)
    return fuente(size)


def caja(d, xy, texto, relleno, tinta=(255, 255, 255)):
    d.rounded_rectangle(xy, radius=18, fill=relleno)
    x1, y1, x2, y2 = xy
    f = fuente_bold(22)
    lineas = texto.split("\n")
    alto = sum(f.getbbox(linea)[3] - f.getbbox(linea)[1] + 6 for linea in lineas)
    y = y1 + (y2 - y1 - alto) / 2
    for linea in lineas:
        ancho = f.getbbox(linea)[2]
        d.text(((x1 + x2 - ancho) / 2, y), linea, font=f, fill=tinta)
        y += f.getbbox(linea)[3] - f.getbbox(linea)[1] + 6


def flecha(d, x1, x2, y, color):
    d.line((x1, y, x2 - 14, y), fill=color, width=4)
    d.polygon([(x2 - 16, y - 8), (x2, y), (x2 - 16, y + 8)], fill=color)


def diagrama():
    im = Image.new("RGB", (1400, 360), (248, 250, 249))
    d = ImageDraw.Draw(im)
    caja(d, (40, 110, 360, 250), "Evently Watch\nEventlyApi", (15, 110, 86))
    caja(d, (540, 110, 860, 250), "API REST\npuerto 4000", (16, 70, 58))
    caja(d, (1040, 110, 1360, 250), "MySQL\nevently_db", (30, 58, 48))
    flecha(d, 370, 530, 160, (16, 185, 129))
    flecha(d, 870, 1030, 160, (16, 185, 129))
    flecha(d, 1030, 880, 210, (90, 110, 100))
    flecha(d, 530, 380, 210, (90, 110, 100))
    f = fuente(18)
    d.text((390, 122), "HTTP  JSON", font=f, fill=(15, 110, 86))
    d.text((890, 122), "SQL", font=f, fill=(15, 110, 86))
    d.text((860, 222), "fila guardada", font=f, fill=(90, 110, 100))
    d.text((390, 222), "JSON + código", font=f, fill=(90, 110, 100))
    ruta = EVIDENCIA / "00-diagrama.png"
    im.save(ruta)
    return ruta


def recortar():
    EVIDENCIA.mkdir(parents=True, exist_ok=True)
    pares = {
        "01-login.png": ("computer-1793921061266-c422d1.webp", (20, 80, 700, 360)),
        "02-login-error.png": ("computer-1793921241112-2e8113.webp", (20, 80, 700, 430)),
        "03-recibido.png": ("computer-1793921312903-01f608.webp", (10, 70, 710, 280)),
        "04-sin-conexion.png": ("computer-1793921491057-2f225d.webp", (10, 70, 710, 520)),
        "05-recuperacion.png": ("computer-1793921446760-3bc363.webp", (10, 70, 710, 280)),
    }
    for nombre, (archivo, caja_recorte) in pares.items():
        im = Image.open(SHOTS / archivo).convert("RGB")
        im.crop(caja_recorte).save(EVIDENCIA / nombre)
    aviso = Image.open(SHOTS / "computer-1793921491057-2f225d.webp").convert("RGB")
    detalle = aviso.crop((80, 400, 680, 500))
    detalle = detalle.resize((detalle.width * 2, detalle.height * 2), Image.Resampling.LANCZOS)
    detalle.save(EVIDENCIA / "04b-aviso.png")


def sombra_celda(cell, fill):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), fill)
    shd.set(qn("w:val"), "clear")
    tc_pr.append(shd)


def configurar(doc):
    seccion = doc.sections[0]
    seccion.top_margin = Cm(1.8)
    seccion.bottom_margin = Cm(1.8)
    seccion.left_margin = Cm(2.0)
    seccion.right_margin = Cm(2.0)
    seccion.page_width = Cm(21.59)
    seccion.page_height = Cm(27.94)
    normal = doc.styles["Normal"]
    normal.font.name = "Calibri"
    normal.font.size = Pt(11)
    normal.font.color.rgb = TEXTO
    normal.paragraph_format.space_after = Pt(8)
    normal.paragraph_format.line_spacing = 1.12
    for nombre, tam in (("Heading 1", 16), ("Heading 2", 13)):
        estilo = doc.styles[nombre]
        estilo.font.name = "Calibri"
        estilo.font.bold = True
        estilo.font.color.rgb = VERDE
        estilo.font.size = Pt(tam)
        estilo.paragraph_format.space_before = Pt(14)
        estilo.paragraph_format.space_after = Pt(6)
    pie = seccion.footer.paragraphs[0]
    pie.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = pie.add_run("Evently Watch  ·  Evaluación de comunicación")
    run.font.size = Pt(9)
    run.font.color.rgb = GRIS
    run.font.name = "Calibri"


def parrafo(doc, texto, *, size=11, bold=False, color=None, align="left", after=8, before=0, italic=False):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(after)
    p.paragraph_format.space_before = Pt(before)
    p.paragraph_format.line_spacing = 1.12
    if align == "center":
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    elif align == "justify":
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    run = p.add_run(texto)
    run.font.name = "Calibri"
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    run.font.color.rgb = color or TEXTO
    return p


def tabla(doc, encabezados, filas, anchos):
    t = doc.add_table(rows=1 + len(filas), cols=len(encabezados))
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, texto in enumerate(encabezados):
        celda = t.rows[0].cells[i]
        celda.text = ""
        r = celda.paragraphs[0].add_run(texto)
        r.bold = True
        r.font.name = "Calibri"
        r.font.size = Pt(10)
        r.font.color.rgb = RGBColor(255, 255, 255)
        sombra_celda(celda, "0F6E56")
    for r_i, fila in enumerate(filas):
        for c_i, texto in enumerate(fila):
            celda = t.rows[r_i + 1].cells[c_i]
            celda.text = ""
            run = celda.paragraphs[0].add_run(str(texto))
            run.font.name = "Calibri"
            run.font.size = Pt(10)
            run.font.color.rgb = TEXTO
            if r_i % 2 == 1:
                sombra_celda(celda, "F3F7F5")
    for fila in t.rows:
        for i, ancho in enumerate(anchos):
            fila.cells[i].width = Cm(ancho)
    doc.add_paragraph().paragraph_format.space_after = Pt(4)
    return t


def imagen(doc, ruta, ancho, pie):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(2)
    p.add_run().add_picture(str(ruta), width=Cm(ancho))
    parrafo(doc, pie, size=9, italic=True, color=GRIS, align="center", after=10)


def construir():
    n = palabras(CONCLUSION)
    if not 150 <= n <= 200:
        raise SystemExit(f"La conclusión tiene {n} palabras; debe quedar entre 150 y 200.")

    recortar()
    fig = diagrama()
    doc = Document()
    configurar(doc)

    parrafo(doc, "Evaluación de comunicación", size=22, bold=True, color=VERDE, align="center", after=2)
    parrafo(doc, "Evently Watch", size=16, bold=True, align="center", after=2)
    parrafo(
        doc,
        "Conexión, transferencia, integridad de datos e interrupción",
        size=12,
        color=GRIS,
        align="center",
        after=2,
    )
    parrafo(doc, "5 de noviembre de 2026", size=11, color=GRIS, align="center", after=12)

    doc.add_heading("1. Aplicación", level=1)
    parrafo(
        doc,
        "Evently Watch es la aplicación móvil de Evently para Wear OS. Permite entrar con "
        "teléfono y PIN, consultar el catálogo de eventos y confirmar asistencia. No se "
        "desarrolló una aplicación nueva: la prueba usa la función que ya intercambia datos "
        "con el servicio externo, la confirmación de asistencia.",
        align="justify",
    )
    parrafo(
        doc,
        "La funcionalidad elegida es confirmar asistencia a un evento y volver a consultarla. "
        "Ese recorrido envía un registro, lo guarda en el servidor y lo recibe otra vez en la "
        "pantalla Mis eventos.",
        align="justify",
    )

    doc.add_heading("2. Qué se conecta y cómo", level=1)
    tabla(
        doc,
        ["Pregunta", "Respuesta"],
        [
            ["Componente", "EventlyApi, usado por LoginScreen, EventDetailScreen y WatchHomeScreen"],
            ["Servicio", "API REST Evently (Express) y MySQL evently_db en Laragon"],
            ["Dirección", "http://127.0.0.1:4000  (en el emulador, http://10.0.2.2:4000)"],
            ["Protocolo", "HTTP. Cuerpo JSON. Sesión con JWT en el encabezado Authorization: Bearer"],
            ["Envía", "Teléfono y PIN. Después, POST /api/events/4/reservation con el token"],
            ["Recibe", "Usuario, token y código HTTP. Luego el evento confirmado y los lugares libres"],
        ],
        [4.2, 13.2],
    )
    parrafo(
        doc,
        "El reloj no escribe en la base. EventlyApi llama a la API y la API guarda en las "
        "tablas usuarios y reservas. La reserva tiene una llave única por usuario y evento, "
        "así que un segundo envío del mismo evento no crea otra fila.",
        align="justify",
    )

    doc.add_heading("3. Diagrama del flujo", level=1)
    parrafo(
        doc,
        "La flecha verde es la petición. La flecha gris es la respuesta que regresa hasta la pantalla.",
        align="justify",
    )
    imagen(doc, fig, 16.2, "Figura 1. Evently Watch → API REST → MySQL, y la respuesta de regreso.")

    doc.add_heading("4. Conexión exitosa", level=1)
    parrafo(
        doc,
        "Se levantó MySQL y la API. La comprobación de salud respondió HTTP 200 en 48 ms, "
        "con ok en verdadero, el servicio evently-api y la base en estado up. En la pantalla "
        "se ingresó el teléfono 4429001122 y el PIN de prueba. El acceso respondió HTTP 200 "
        "en 287 ms y la aplicación pasó a Mis eventos.",
        align="justify",
    )
    imagen(doc, EVIDENCIA / "01-login.png", 14.5, "Figura 2. Pantalla de acceso de Evently Watch antes de enviar el PIN.")
    tabla(
        doc,
        ["Operación", "Método y ruta", "Código", "Tiempo"],
        [
            ["Salud del servicio", "GET /api/health", "200", "48 ms"],
            ["Alta de la cuenta de prueba", "POST /api/auth/register", "201", "523 ms"],
            ["Acceso desde la pantalla", "POST /api/auth/pin-login", "200", "287 ms"],
            ["Catálogo", "GET /api/events", "200", "32 ms"],
        ],
        [5.6, 5.8, 2.2, 2.4],
    )
    parrafo(
        doc,
        "Registro del servicio durante el acceso desde la aplicación: "
        "POST /api/auth/pin-login 200 en 286.7 ms; GET /api/health 200; "
        "GET /api/auth/mis-eventos 200 en 26.6 ms; GET /api/events 200 en 31.7 ms.",
        align="justify",
    )

    doc.add_heading("5. Transferencia e integridad", level=1)
    parrafo(
        doc,
        "Se envió la reserva del evento 4, Fiesta de bienvenida estudiantil. El servicio "
        "respondió HTTP 201: ok verdadero, confirmed verdadero, mensaje Asistencia confirmada "
        "y 449 lugares libres. Antes de la reserva ese evento tenía 450 lugares y 0 ocupados.",
        align="justify",
    )
    parrafo(doc, "Datos enviados en el alta de la cuenta y en la reserva", bold=True, after=4)
    tabla(
        doc,
        ["Campo enviado", "Valor", "Qué regresó o quedó guardado"],
        [
            ["name", "Prueba Comunicacion", "name: Prueba Comunicacion"],
            ["email", "prueba.comunicacion@evently.test", "El mismo correo"],
            ["telefono", "4429001122", "4429001122"],
            ["password", "Practica2026", "No regresa. Hash bcrypt de 60 caracteres ($2b$)"],
            ["pin", "482915", "No regresa. hasPin verdadero. Hash bcrypt"],
            ["ciudad", "No se envió", "Querétaro, valor que asigna el servidor"],
            ["evento", "POST /api/events/4/reservation", "id 4, estado confirmada, una fila"],
        ],
        [3.6, 6.2, 6.6],
    )
    parrafo(
        doc,
        "En MySQL la fila de reservas quedó con id 8, usuario 5, evento 4 y estado confirmada, "
        "confirmada a las 17:20:08 hora local. Ese instante es el mismo que "
        "2026-11-05T23:20:08Z devuelto por la API. El cupo ocupado pasó a 1 y la respuesta "
        "indicó 449 lugares, es decir 450 menos 1. No faltó el título, la fecha, la hora ni "
        "la ubicación: la pantalla mostró Fiesta de bienvenida estudiantil con la marca de confirmado, "
        "25 eventos en el catálogo y 1 confirmado.",
        align="justify",
    )
    imagen(
        doc,
        EVIDENCIA / "03-recibido.png",
        15.2,
        "Figura 3. Mis eventos muestra el registro recibido, con un confirmado y la paloma verde.",
    )
    parrafo(
        doc,
        "Se repitió el mismo POST. El servicio respondió HTTP 200 con el mensaje "
        "Tu asistencia ya estaba confirmada. La consulta a MySQL siguió devolviendo una sola "
        "fila y el cupo ocupado siguió en 1. No hubo un segundo descuento ni un registro duplicado.",
        align="justify",
    )

    doc.add_heading("6. Interrupción y recuperación", level=1)
    parrafo(
        doc,
        "La API está en la misma computadora, así que apagar el Wi-Fi no corta 127.0.0.1. "
        "La interrupción se hizo deteniendo el proceso que escucha en el puerto 4000, que es "
        "el canal real de la aplicación. Un intento de salud falló a los 1.03 s con el error "
        "de conexión rechazada y sin código HTTP.",
        align="justify",
    )
    parrafo(
        doc,
        "Antes de ese corte ya había aparecido otro fallo, con la API encendida. Al abrir el "
        "reloj en Chrome, el navegador bloqueó el origen http://localhost:8095 porque CORS "
        "solo admitía http://localhost:5173. La pantalla no entró y mostró en rojo: "
        "Sin conexión al servidor (http://127.0.0.1:4000). Revisa IP y Laragon. "
        "No presentó el acceso como exitoso. Para continuar la prueba de la interfaz se "
        "admitió también ese origen. En un reloj Wear OS la petición no pasa por el CORS del navegador.",
        align="justify",
    )
    imagen(
        doc,
        EVIDENCIA / "02-login-error.png",
        14.5,
        "Figura 4. Con el origen bloqueado, el acceso no se marca como exitoso y se informa el fallo.",
    )
    parrafo(
        doc,
        "Con la API ya detenida se recargó la aplicación. Los contadores quedaron en 0, "
        "no apareció el evento como si se hubiera cargado y el mismo aviso rojo se mostró "
        "en el centro de la pantalla.",
        align="justify",
    )
    imagen(
        doc,
        EVIDENCIA / "04-sin-conexion.png",
        14.8,
        "Figura 5. Sin el servicio, la lista no se presenta como cargada y el aviso queda visible.",
    )
    parrafo(
        doc,
        "Se volvió a levantar la API y se recargó la aplicación. El acceso de comprobación "
        "respondió HTTP 200 en 304 ms y la consulta de mis eventos respondió HTTP 200 en 32 ms. "
        "La pantalla recuperó los 25 eventos del catálogo, 1 confirmado y el mismo título. "
        "La fila en MySQL no cambió.",
        align="justify",
    )
    imagen(
        doc,
        EVIDENCIA / "05-recuperacion.png",
        15.2,
        "Figura 6. Al volver el servicio, Mis eventos muestra otra vez la reserva íntegra.",
    )

    doc.add_heading("7. Última transferencia", level=1)
    tabla(
        doc,
        ["Aspecto", "Resultado"],
        [
            ["Tiempo de respuesta", "Acceso 304 ms. Consulta de mis eventos 32 ms. Reserva original 10 ms."],
            ["Integridad", "El evento 4 sigue confirmado, una sola vez, con los mismos campos."],
            ["Errores", "La aplicación avisa en rojo y no da por buena una operación caída."],
            ["Resultado general", "Las siete pruebas pasaron. El aviso de error es genérico."],
        ],
        [4.4, 13.0],
    )

    doc.add_heading("8. Matriz de pruebas", level=1)
    tabla(
        doc,
        ["Caso", "Esperado", "Resultado", "Observación"],
        [
            [
                "TC-01",
                "La aplicación establece comunicación con el servicio.",
                "Pasó",
                "Salud HTTP 200 en 48 ms. Acceso desde la pantalla HTTP 200 en 287 ms.",
            ],
            [
                "TC-02",
                "El servicio recibe correctamente los datos.",
                "Pasó",
                "Reserva HTTP 201. MySQL: usuario 5, evento 4, estado confirmada, cupo 1 de 450.",
            ],
            [
                "TC-03",
                "La aplicación muestra los datos recibidos.",
                "Pasó",
                "Mis eventos muestra Fiesta de bienvenida estudiantil, 1 confirmado y la paloma.",
            ],
            [
                "TC-04",
                "Los datos enviados y recibidos coinciden.",
                "Pasó",
                "Nombre, correo, teléfono y evento coinciden. PIN y contraseña solo quedan como hash.",
            ],
            [
                "TC-05",
                "La aplicación detecta e informa el fallo.",
                "Pasó",
                "Aviso rojo y contadores en 0. No marca la carga como exitosa. El texto no distingue CORS de red caída.",
            ],
            [
                "TC-06",
                "La aplicación vuelve a transferir información.",
                "Pasó",
                "Al encender la API, la consulta respondió 200 en 32 ms y la pantalla recuperó el evento.",
            ],
            [
                "TC-07",
                "La operación no genera registros duplicados.",
                "Pasó",
                "El segundo POST respondió que ya estaba confirmada. Siguió existiendo una sola fila.",
            ],
        ],
        [1.8, 4.6, 2.0, 7.0],
    )

    doc.add_heading("9. Conclusión técnica", level=1)
    parrafo(doc, CONCLUSION, align="justify")
    parrafo(doc, f"{n} palabras.", size=9, italic=True, color=GRIS, after=4)

    SALIDA_INFORME.parent.mkdir(parents=True, exist_ok=True)
    SALIDA_PRACTICAS.parent.mkdir(parents=True, exist_ok=True)
    doc.save(SALIDA_INFORME)
    doc.save(SALIDA_PRACTICAS)
    print(f"palabras={n}")
    print(SALIDA_INFORME)
    print(SALIDA_PRACTICAS)


if __name__ == "__main__":
    construir()

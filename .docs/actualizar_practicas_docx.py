# -*- coding: utf-8 -*-
"""Actualiza la sección de prácticas en evently-preguntas-y-entregas.docx."""

from copy import deepcopy
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor
from PIL import Image, ImageDraw, ImageFont

BASE = Path(__file__).resolve().parent
EVIDENCIA = BASE / "evidencia"
path = BASE / "evently-preguntas-y-entregas.docx"

TEXTO = RGBColor(0x1F, 0x29, 0x33)
VERDE = RGBColor(0x3D, 0x5C, 0x48)
GRIS = RGBColor(0x5E, 0x6A, 0x63)


def tarjeta_suite(ruta):
    im = Image.new("RGB", (1100, 420), "white")
    d = ImageDraw.Draw(im)
    fuente_b = ImageFont.truetype(r"C:\Windows\Fonts\segoeuib.ttf", 32)
    fuente = ImageFont.truetype(r"C:\Windows\Fonts\segoeui.ttf", 24)
    d.rounded_rectangle((24, 24, 1076, 396), radius=16, fill=(15, 110, 86))
    d.rounded_rectangle((36, 96, 1064, 384), radius=12, fill=(255, 255, 255))
    d.text((52, 42), "Prácticas 13 y 14  ·  suite y validación continua", font=fuente_b, fill=(255, 255, 255))
    lineas = [
        "Local, npm test: 41 pruebas, 0 fallidas, 1.7 s",
        "PIN válido, nulo y fuera de rango",
        "Listado, registro con hash, correo repetido en 409",
        "JSON inválido en 400; ruta protegida sin token en 401",
        "GitHub, commit dde98c4: run 44226002650, éxito, 10 s",
        "GitHub, commit 084caf8: run 44226206075, éxito",
    ]
    y = 120
    for linea in lineas:
        d.text((64, y), linea, font=fuente, fill=(26, 31, 28))
        y += 40
    im.save(ruta)


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


def set_run_style(run, *, bold=False, size=11, color=TEXTO, italic=False):
    run.bold = bold
    run.italic = italic
    run.font.name = "Calibri"
    run._element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")
    run.font.size = Pt(size)
    run.font.color.rgb = color


def clear_paragraph(para):
    p = para._p
    for child in list(p):
        if child.tag != qn("w:pPr"):
            p.remove(child)


d = Document(str(path))
inicio = next(i for i, p in enumerate(d.paragraphs) if p.text.strip().startswith("Práctica 1."))
ref_titulo_pPr = _copy_pPr(d.paragraphs[inicio])
ref_cuerpo_pPr = _copy_pPr(d.paragraphs[inicio + 1])

for para in list(d.paragraphs[inicio:]):
    el = para._p
    parent = el.getparent()
    if parent is not None:
        parent.remove(el)


def add_titulo(texto):
    p = d.add_paragraph()
    clear_paragraph(p)
    apply_pPr(p, ref_titulo_pPr)
    set_run_style(p.add_run(texto), bold=True, size=11, color=VERDE)


def add_cuerpo(texto):
    p = d.add_paragraph()
    clear_paragraph(p)
    apply_pPr(p, ref_cuerpo_pPr)
    set_run_style(p.add_run(texto), bold=False, size=11, color=TEXTO)


def add_figura(archivo, pie, ancho):
    p = d.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after = Pt(2)
    p.add_run().add_picture(str(EVIDENCIA / archivo), width=Cm(ancho))
    cap = d.add_paragraph()
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cap.paragraph_format.space_after = Pt(10)
    set_run_style(cap.add_run(pie), bold=False, size=10, color=GRIS, italic=True)


tarjeta_suite(EVIDENCIA / "17-suite-ci.png")

bloques = [
    (
        "Práctica 1. Introducción al firmware mediante script — No aplica",
        [
            "La práctica desarrolla un script de firmware para un ESP32 que controla un LED y lee el estado de un botón, para entender la interacción entre el software y los componentes físicos del dispositivo. Evently no programa un microcontrolador ni controla hardware de ese tipo. El proyecto vive en el sitio web (React), en la aplicación móvil y en el smartwatch (Flutter). La interacción es con pantallas, sesión, eventos y la API; no con un LED ni un botón físico cableado a un ESP32. Aunque la práctica sea de firmware y no de IoT con sensores remotos, el entregable exige un circuito y un script que Evently no incluye. Por eso esta práctica no forma parte del proyecto.",
        ],
        [],
    ),
    (
        "Práctica 2. Consumo de una URL preasignada (ConsultaWeb) — Sí aplica",
        [
            "Evently no trae los eventos escritos en el código. Los pide a una URL ya definida, la de la API del sitio (por ejemplo el listado de eventos). Esa dirección está separada de la pantalla. Al consultar, la aplicación hace una petición HTTP, procesa la respuesta (JSON) y la muestra. Mientras espera, indica que está consultando. Si no hay conexión, avisa que no fue posible obtener la información y no presenta datos a medias. Es la misma técnica de ConsultaWeb como extensión del sitio personal: URL preasignada, solicitud HTTP y procesamiento de la respuesta. En Evently se usa para cargar eventos, sesión y confirmaciones de asistencia.",
        ],
        [("05-movil-inicio.png", "Figura 8. El teléfono muestra el catálogo que llegó de la API. Esos eventos no están escritos en la pantalla.", 8)],
    ),
    (
        "Práctica 3. Almacenamiento estructurado (SQLite / Room) — Sí aplica",
        [
            "En el teléfono la información se guarda con campos fijos, no como un texto suelto. La sesión ya funciona así: el token y los datos del usuario quedan en el dispositivo (localStorage / sessionStorage) y siguen ahí al cerrar la aplicación. La práctica lleva esa idea a una base local estructurada (SQLite mediante Room): entidad, DAO y operaciones para registrar, consultar, modificar y eliminar, por ejemplo una tabla de usuarios. MySQL sigue siendo la base compartida del servidor. En el dispositivo queda la copia estructurada que la app necesita sin depender solo de la red. Si la tabla gana un campo, cambian la entidad, la base, la interfaz y las operaciones de inserción, consulta y actualización. Por eso esta práctica sí aplica al proyecto.",
        ],
        [("06-movil-login.png", "Figura 9. Acceso en el teléfono. Al entrar, el token y el usuario se guardan en el dispositivo y permanecen al cerrar la aplicación.", 8)],
    ),
    (
        "Práctica 4. Código seguro en aplicaciones móviles (AccesoSeguro) — Sí aplica",
        [
            "Evently tiene inicio de sesión con correo y contraseña (y PIN). La práctica de AccesoSeguro exige validar que los campos no vayan vacíos, limitar la longitud de las entradas, ocultar la contraseña, mostrar errores genéricos sin datos sensibles y no imprimir credenciales en el registro. Eso aplica directamente al acceso de Evently: si la app aceptara entradas sin validar, revelara detalles técnicos en errores o escribiera contraseñas en el registro, pondría en riesgo la sesión y los datos del usuario. Las medidas de AccesoSeguro son las mismas que el login de Evently debe cumplir. La contraseña se guarda como hash bcrypt y la respuesta de la API no la devuelve. Por eso esta práctica sí aplica.",
        ],
        [("04-login.png", "Figura 10. Acceso con la contraseña oculta. Un intento vacío o incorrecto no indica si falló el correo o la clave.", 12)],
    ),
    (
        "Práctica 5. Interacción entre dispositivos (MobileConnect) — Sí aplica",
        [
            "La práctica busca comprender cómo dos dispositivos intercambian información de forma inalámbrica: un mensaje enviado desde uno aparece en el otro. En Evently esa interacción ya existe entre varios dispositivos del mismo sistema. Primero, web y teléfono: con la sesión iniciada, la web muestra en Entrar en el teléfono un código QR de un solo uso; la app móvil lo lee y recupera esa sesión sin volver a escribir correo y contraseña. Segundo, teléfono y smartwatch: el reloj consulta por la API los mismos eventos y permite ver o confirmar asistencia desde Wear OS. No es un chat entre dos teléfonos como MobileConnect, pero el objetivo es el mismo: la sesión viaja del sitio al móvil, y los eventos se comparten con el reloj. Por eso esta práctica sí aplica al proyecto.",
        ],
        [("08-qr-login.png", "Figura 11. Código QR de un solo uso. La web lo muestra y el teléfono lo canjea por la sesión, sin llevar la contraseña.", 8)],
    ),
    (
        "Práctica 6. Evaluación de la comunicación con un servicio externo — Sí aplica",
        [
            "La práctica pide usar una función que la app ya tenga para hablar con un servicio externo. Hay que comprobar que la conexión se establece, que lo enviado y lo recibido coinciden, y que un corte de red no se presenta como una operación exitosa. En Evently esa función es el reloj. Evently Watch entra con teléfono y PIN, consulta los eventos en la API y confirma la asistencia. El protocolo es HTTP. Si el servidor no responde, el reloj avisa y no da la operación por hecha. Al volver la red, la misma consulta se repite. En esa corrida quedaron cubiertos el establecimiento de la conexión, el envío, la recepción, la integridad de los datos, la interrupción, la recuperación y la reserva que no se duplica.",
        ],
        [
            ("09-reloj-login.png", "Figura 12. Acceso del reloj: teléfono y PIN de 4 a 6 dígitos, contra la API de Evently.", 14),
            ("10-reloj-sin-conexion.png", "Figura 13. Con el servidor apagado, el reloj informa que no hay conexión.", 14),
        ],
    ),
    (
        "Práctica 7. Asignación de roles e interacción entre dispositivos — Sí aplica",
        [
            "En Evently el papel vive en la misma cuenta y en la misma API. Hay dos roles: usuario y administrador. Quien no ha entrado ve el catálogo. Quien inicia sesión confirma asistencia y guarda eventos. Solo el administrador abre el panel, ve a las personas y el rol de cada una, y puede cambiarlo. Si la sesión no es admin, esa pantalla no carga los datos.",
        ],
        [("11-roles-admin.png", "Figura 14. Panel de Evently. La cuenta administrador aparece con rol Admin; las demás cuentas quedan como Usuario.", 14)],
    ),
    (
        "Práctica 8. Pruebas de caja negra — Sí aplica",
        [
            "La práctica mira el proyecto por fuera: si hace lo que se pidió, si rechaza entradas inválidas, si los datos quedan consistentes y si un error no se muestra como éxito. En Evently eso se comprueba en el acceso y en la reserva. La contraseña va oculta. Un correo que no existe y una clave incorrecta reciben el mismo aviso, sin decir cuál de los dos falló. Un código QR vencido o ya usado no abre la sesión. Confirmar dos veces el mismo evento no duplica el cupo.",
        ],
        [("12-login-error.png", "Figura 15. Acceso de Evently. La contraseña queda oculta y el aviso no revela si falló el correo o la clave.", 10)],
    ),
    (
        "Práctica 9. Conexiones y base de datos compartida entre dispositivos — Sí aplica",
        [
            "La práctica comprueba que dos dispositivos de la misma aplicación lean y escriban la misma base. Lo que uno registra tiene que aparecer en el otro, y dos cambios a la vez no deben dejar un dato a medias. Evently ya trabaja así. El sitio, el teléfono y el reloj consultan la misma base MySQL por la API. Un evento publicado en la web se lista en el teléfono y en el reloj. En el sitio está Fiesta de bienvenida estudiantil; el reloj, con la sesión iniciada, muestra ese mismo evento entre los 25 del catálogo. Una asistencia confirmada queda en el servidor y se vuelve a leer igual.",
        ],
        [("13-reloj-eventos.png", "Figura 16. El reloj de Evently leyendo el mismo catálogo de la API: 25 eventos, entre ellos Fiesta de bienvenida estudiantil.", 14)],
    ),
    (
        "Práctica 10. Seguridad, autenticación y control de acceso — Sí aplica",
        [
            "La práctica exige que cada persona solo haga en la base remota lo que su sesión autoriza. La interfaz no basta: el servidor tiene que rechazar la operación. Evently lo hace con la sesión. La contraseña y el PIN se guardan con bcrypt, nunca en texto plano. El token es un JWT con vencimiento. Sin ese token, las rutas protegidas responden 401 y Mis eventos pide iniciar sesión. El panel de administración no se abre si el rol no es admin. Una reserva queda ligada al usuario del token, no a un identificador que el cliente pueda cambiar.",
        ],
        [("14-no-admin.png", "Figura 17. Cuenta de usuario dentro de Evently. El panel de administración no se abre.", 12)],
    ),
    (
        "Práctica 11. Pruebas de caja blanca — Sí aplica",
        [
            "La práctica audita el interior del proyecto, no solo lo que se ve en pantalla. Entran el servicio, la aplicación y la base: ramas, validaciones, consultas y el código de respuesta. En Evently se recorrió el código de la API. El PIN solo es válido si es texto de 4 a 6 dígitos. El registro rechaza una contraseña corta y no devuelve el hash. La reserva abre una transacción, bloquea el evento y hace rollback si el cupo no alcanza o si el identificador no sirve. Esas rutas se ejecutaron con la base sustituida, para medir las ramas del código real. El grafo siguiente es el de isValidPin.",
        ],
        [("15-grafo-pin.png", "Figura 18. Ramas de isValidPin: tipo de dato, longitud de 4 a 6 dígitos, y las dos salidas en falso.", 14)],
    ),
    (
        "Práctica 12. Optimización, estrés y resiliencia — Sí aplica",
        [
            "La práctica mide el proyecto con varios usuarios a la vez, localiza el cuello de botella, aplica una optimización y vuelve a medir. También comprueba qué pasa si la red o el servicio fallan. El listado GET /api/events devolvía el catálogo completo y armaba un formateador de fecha por cada evento. Con 50 usuarios la latencia media pasó de centenares de milisegundos a más de 8 segundos, y una parte de las solicitudes se quedó sin respuesta. La optimización deja como máximo 50 eventos por página y crea esos formateadores una sola vez. En la misma máquina, con un usuario, la media bajó de 582 ms a 7 ms. Un JSON mal formado responde 400, no 500. Si el puerto está cerrado, la app no trata la consulta como exitosa. La reserva lleva Idempotency-Key para no descontar el cupo dos veces.",
        ],
        [("16-latencia.png", "Figura 19. Latencia media del listado antes y después de paginar a 50 eventos.", 15)],
    ),
    (
        "Práctica 13. Automatización de pruebas — Sí aplica",
        [
            "La práctica toma piezas ya medidas y las deja como pruebas que se vuelven a ejecutar solas. Si alguien deshace una corrección, la suite falla. De las prácticas 11 y 12 se tomaron el PIN, el listado de eventos y el alta de usuario. npm test corrió 41 pruebas en 1.7 segundos: las del PIN válido, nulo y fuera de rango, el reintento a 200, 400 y 800 ms, el listado, el registro con hash y el 409 cuando el correo ya existe. Un JSON inválido queda en 400. Sin token, la ruta protegida queda en 401.",
        ],
        [],
    ),
    (
        "Práctica 14. Validación continua — Sí aplica",
        [
            "La misma suite corre en cada push y en cada pull request. El archivo .github/workflows/pruebas.yml prepara Node 22, instala con npm ci y ejecuta npm test dentro de eventos-backend. No abre MySQL: la integración sustituye la base y levanta la API en un puerto efímero. La primera ejecución, en el commit dde98c4, terminó en éxito (run 44226002650). El job duró 10 segundos. El segundo push, el del informe en 084caf8, también terminó en éxito (run 44226206075). Un cambio que vuelva a devolver el catálogo entero, que guarde la contraseña en claro o que trate un corte de red como éxito rompe la prueba en la máquina y otra vez en GitHub, antes de quedarse en main.",
        ],
        [("17-suite-ci.png", "Figura 20. Resultado registrado de la suite local y de las dos ejecuciones en GitHub.", 15)],
    ),
]

for titulo, cuerpos, figuras in bloques:
    add_titulo(titulo)
    for cuerpo in cuerpos:
        add_cuerpo(cuerpo)
    for archivo, pie, ancho in figuras:
        add_figura(archivo, pie, ancho)

d.save(str(path))
print("saved", path)

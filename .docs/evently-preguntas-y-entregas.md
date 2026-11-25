# Evently — Preguntas y entregas

Materia: Dispositivos inteligentes

---

# Preguntas

## 1.- ¿Qué framework móvil seleccionas y describe los criterios por los cuales lo seleccionaste?

**Respuesta:**

El framework de la aplicación móvil es **React**, con **JavaScript**. **Flutter** se usa únicamente en el smartwatch.

Criterios de selección:

1. **Mismo lenguaje que el sitio.** Evently ya está desarrollado en React, así que la app móvil continúa en ese mismo lenguaje y se conecta a la misma API.

2. **Reutilización de lo ya hecho.** Se pueden aprovechar los componentes, el cliente de la API y la autenticación que ya existen en el sitio.

3. **Pensada para el teléfono.** La interfaz del sitio ya se adapta a pantalla pequeña e incluye la opción de instalarse en el dispositivo.

4. **Inicio de sesión con código QR.** La web en React genera el código de una sesión activa y la app móvil, también en React, lo lee para entrar. Ya está en el sitio: con la sesión iniciada, el menú **Entrar en el teléfono** muestra ese código.

5. **Huella dactilar.** Al abrir la app móvil se solicita la huella del dispositivo para desbloquear el contenido.

6. **El reloj queda aparte.** El smartwatch sigue en Flutter, en su propio proyecto, y no forma parte de la app móvil.

## 2.- ¿Cómo piensas implementar el framework alrededor de tu proyecto en Flutter?

**Respuesta:**

La aplicación móvil se implementa en **React**, alrededor del sitio y de la API que ya existen. **Flutter** permanece solo en el smartwatch.

Organización:

- **Sitio web:** React, con las pantallas de eventos, registro, inicio de sesión y confirmación de asistencia.
- **App móvil:** también en React. Desde ahí se escanea el código QR y se pide la huella.
- **Smartwatch:** proyecto aparte en Flutter. Solo muestra los eventos en el reloj.

Implementación del flujo:

1. El usuario inicia sesión en la versión web de Evently.
2. En el menú de la cuenta, con **Entrar en el teléfono**, la web genera un código QR de un solo uso, válido 3 minutos, asociado a esa sesión.
3. La app móvil en React lee el código QR, con la cámara del teléfono o desde Iniciar sesión → QR, y recupera la sesión.
4. La sesión queda guardada en el dispositivo.
5. Cada vez que se abre la app móvil, se solicita la huella antes de mostrar el contenido.
6. Con la sesión desbloqueada, la app consulta los eventos y permite confirmar la asistencia, usando los mismos datos que el sitio web.

El código QR, que la web muestra en **Entrar en el teléfono**, vincula el teléfono con una sesión que ya existe en la web. La huella desbloquea esa sesión cada vez que se abre la aplicación móvil. El reloj en Flutter solo consulta esos mismos eventos.

## 3.- ¿Saber si está orientado a objetos o a funcionalidad?

**Respuesta:**

La aplicación móvil está **orientada a la funcionalidad**.

React organiza la interfaz en componentes de función. El estado de la pantalla, de la sesión y de los eventos se maneja con funciones y con los hooks de React. Las pantallas del sitio, como la página principal, el inicio de sesión y el detalle del evento, están escritas de esa forma.

El smartwatch está **orientado a objetos**, porque Flutter organiza cada pantalla en clases. Ese desarrollo queda únicamente en el reloj.

En resumen, la app móvil de Evently se implementa en React con un enfoque funcional, y el reloj se mantiene en Flutter con un enfoque orientado a objetos.

## 4.- Tipo de gestionamiento de almacenamiento en mi app

**Respuesta:**

Evently usa dos tipos de almacenamiento: uno en el dispositivo y otro en el servidor.

**En el dispositivo**

1. **localStorage.** Guarda la sesión de forma permanente en el teléfono o en el navegador. Ahí quedan el token y los datos del usuario cuando se elige recordar la sesión. También se guarda el enlace con el dispositivo. Esos datos siguen disponibles aunque se cierre la aplicación.

2. **sessionStorage.** Guarda información solo durante la visita. Si no se elige recordar la sesión, el token vive aquí y se pierde al cerrar la pestaña. Los avisos que el usuario ya cerró, como el de notificaciones o el de instalación, también se guardan aquí para no volver a mostrarlos en la misma visita.

Al cerrar sesión se borran el token y el usuario tanto de `localStorage` como de `sessionStorage`.

**En el servidor**

Los eventos, los usuarios, las contraseñas y las confirmaciones de asistencia se guardan en **MySQL**. La app móvil no copia esa base en el teléfono: consulta esos datos por la API y en el dispositivo solo conserva la sesión.

## 5.- ¿Qué clase de widget va a tener tu app móvil?

**Respuesta:**

La app móvil va a tener un widget de información en la pantalla de inicio. Esa clase muestra unos pocos datos importantes sin abrir la aplicación, sin una lista para desplazarse y sin botones de control. Se usa porque lo que hace falta ver de un vistazo es un solo evento: el confirmado que ocurre antes que los demás, con su nombre, su fecha, su hora y su dirección.

El widget consulta los eventos de la sesión y se queda con el de fecha más cercana. Si no hay ninguno pendiente, indica que no hay un evento próximo. En el ejemplo, el más cercano es el Festival Universitario QRO 2026.

**Figura 6.** Así debe quedar el widget en el teléfono: evento más próximo, con fecha y dirección.

![Widget del evento más próximo](evidencia/07-widget-proximo.png)

## 6.- ¿Qué tipo de interfaz tiene la app?

**Respuesta:**

La interfaz de la aplicación es de **tipo americano**.

Se caracteriza por una presentación limpia y directa: poco ruido visual, jerarquía clara (título, texto de apoyo y acción), espacios amplios entre bloques y controles fáciles de reconocer. En Evently la pantalla principal muestra el contenido principal de inmediato (eventos, búsqueda e inicio de sesión), con botones y enlaces visibles, sin saturar la vista con menús densos ni con demasiada información al mismo tiempo.

Ese estilo encaja con una app pensada para usarse en el teléfono: el usuario encuentra rápido qué hacer (ver eventos, entrar o confirmar asistencia) sin recorrer una interfaz cargada.

## 7.- ¿Qué tipo de navegación tiene la app?

**Respuesta:**

La navegación de la aplicación es de tipo **scrolling**.

El contenido principal se recorre desplazando la pantalla de arriba hacia abajo. En la página de inicio las secciones (presentación, cómo funciona, listado de eventos y demás bloques) quedan en una misma vista continua; el usuario avanza haciendo scroll, en lugar de depender solo de pestañas o de una barra inferior para cambiar de pantalla.

Los enlaces del menú llevan a puntos de esa misma página o a pantallas concretas (inicio de sesión, detalle de evento), pero el patrón base de la app móvil es el desplazamiento vertical para descubrir y consultar la información.

---

# Entregas

## Entrega 1. Sitio web desarrollado y funciones actuales

El sitio web desarrollado se llama **Evently**. Es una plataforma de asistencia a eventos en la que se pueden publicar eventos, conferencias y otros tipos de actividades. Los usuarios pueden registrarse en los eventos publicados y confirmar su asistencia. Además, permite visualizar los eventos desde un dispositivo inteligente tipo reloj (smartwatch).

### Evidencia

Esta parte ya está hecha. Las siguientes capturas son del sitio Evently en funcionamiento.

**Figura 1.** Página de inicio, con buscador, acceso a eventos, inicio de sesión y registro.

![Página de inicio de Evently](evidencia/01-inicio.png)

**Figura 2.** Inicio de sesión ya implementado, con acceso por correo, registro y PIN.

![Inicio de sesión de Evently](evidencia/04-login.png)

**Figura 3.** Funciones actuales del sitio: descubrir eventos, guardarlos, confirmar asistencia desde el reloj y asistir.

![Cómo funciona Evently](evidencia/03-como-funciona.png)

En el teléfono, la misma aplicación muestra la página principal y el inicio de sesión.

**Figura 4.** Página principal en el teléfono, con buscador, menú y acceso a eventos.

![Página principal de Evently en el teléfono](evidencia/05-movil-inicio.png)

**Figura 5.** Inicio de sesión en el teléfono, con correo, contraseña, registro y PIN.

![Inicio de sesión de Evently en el teléfono](evidencia/06-movil-login.png)

## Entrega 2. Inicio de sesión mediante código QR — Hecho

Esta entrega ya está en el sitio. Con la sesión iniciada, el menú de la cuenta muestra **Entrar en el teléfono**. Ahí aparece un código QR de un solo uso, válido 3 minutos. El código no lleva la contraseña ni el token: es un enlace temporal que la API canjea una sola vez.

La aplicación móvil es la misma app en React. En el teléfono se entra de dos maneras: escaneando el QR con la cámara del sistema, que abre Evently con la sesión, o dentro de Iniciar sesión, en la pestaña QR, leyendo el código con la cámara de la app.

1. El usuario inicia sesión en la versión web de Evently.
2. En el menú elige **Entrar en el teléfono**. La web pide el código a la API y lo muestra como QR.
3. El teléfono escanea ese código, con la cámara del sistema o desde la pestaña QR de la app.
4. La API entrega la sesión de esa cuenta, guarda el token en el teléfono y marca el código como usado.

Si el código expira o ya se usó, la web genera otro. Así el teléfono queda vinculado a la sesión que ya existía en el sitio, sin volver a escribir correo y contraseña.

**Figura 7.** Código QR de la sesión web para entrar en el teléfono.

![Código QR para entrar en el teléfono](evidencia/08-qr-login.png)

## Entrega 3. Autenticación biométrica (huella dactilar)

En la aplicación del teléfono, una sesión ya guardada no muestra Evently hasta que la huella coincida con la del dispositivo. El primer acceso de esa apertura puede ser el código QR o el inicio de sesión. Después, cada vez que se abre la app, y también al volver desde segundo plano, aparece la pantalla de confirmación y el sensor del teléfono. Si la huella no coincide, o se cancela, el contenido sigue oculto.

El sitio en el navegador de escritorio no pide huella. El reloj, desarrollado en Flutter, queda fuera de este flujo y solo consulta los eventos.

**Figura 21.** Al abrir la app con la sesión ya guardada, el teléfono pide confirmar la huella.

![Pantalla de confirmación de huella en la app de Evently](evidencia/18-huella.png)

**Figura 22.** Cuando la huella coincide con la del dispositivo, Evently muestra el inicio.

![Inicio de Evently después de confirmar la huella](evidencia/19-huella-abierta.png)

---

# Prácticas

## Práctica 1. Introducción al firmware mediante script — No aplica

La práctica desarrolla un script de firmware para un ESP32 que controla un LED y lee el estado de un botón, para entender la interacción entre el software y los componentes físicos del dispositivo.

Evently no programa un microcontrolador ni controla hardware de ese tipo. El proyecto vive en el sitio web (React), en la aplicación móvil y en el smartwatch (Flutter). La interacción es con pantallas, sesión, eventos y la API; no con un LED ni un botón físico cableado a un ESP32. Aunque la práctica sea de firmware y no de IoT con sensores remotos, el entregable exige un circuito y un script que Evently no incluye. Por eso esta práctica no forma parte del proyecto.

## Práctica 2. Consumo de una URL preasignada (ConsultaWeb) — Sí aplica

Evently no trae los eventos escritos en el código. Los pide a una URL ya definida, la de la API del sitio (por ejemplo el listado de eventos). Esa dirección está separada de la pantalla. Al consultar, la aplicación hace una petición HTTP, procesa la respuesta (JSON) y la muestra. Mientras espera, indica que está consultando. Si no hay conexión, avisa que no fue posible obtener la información y no presenta datos a medias.

Es la misma técnica de ConsultaWeb como extensión del sitio personal: URL preasignada, solicitud HTTP y procesamiento de la respuesta. En Evently se usa para cargar eventos, sesión y confirmaciones de asistencia.

**Figura 8.** El teléfono muestra el catálogo que llegó de la API. Esos eventos no están escritos en la pantalla.

![Catálogo de eventos cargado desde la API](evidencia/05-movil-inicio.png)

## Práctica 3. Almacenamiento estructurado (SQLite / Room) — Sí aplica

En el teléfono la información se guarda con campos fijos, no como un texto suelto. La sesión ya funciona así: el token y los datos del usuario quedan en el dispositivo (`localStorage` / `sessionStorage`) y siguen ahí al cerrar la aplicación. La práctica lleva esa idea a una base local estructurada (SQLite mediante Room): entidad, DAO y operaciones para registrar, consultar, modificar y eliminar, por ejemplo una tabla de usuarios.

MySQL sigue siendo la base compartida del servidor. En el dispositivo queda la copia estructurada que la app necesita sin depender solo de la red. Si la tabla gana un campo, cambian la entidad, la base, la interfaz y las operaciones de inserción, consulta y actualización. Por eso esta práctica sí aplica al proyecto.

**Figura 9.** Acceso en el teléfono. Al entrar, el token y el usuario se guardan en el dispositivo y permanecen al cerrar la aplicación.

![Inicio de sesión cuya sesión queda en el dispositivo](evidencia/06-movil-login.png)

## Práctica 4. Código seguro en aplicaciones móviles (AccesoSeguro) — Sí aplica

Evently tiene inicio de sesión con correo y contraseña (y PIN). La práctica de AccesoSeguro exige validar que los campos no vayan vacíos, limitar la longitud de las entradas, ocultar la contraseña, mostrar errores genéricos sin datos sensibles y no imprimir credenciales en Logcat.

Eso aplica directamente al acceso de Evently: si la app aceptara entradas sin validar, revelara detalles técnicos en errores o escribiera contraseñas en el registro, pondría en riesgo la sesión y los datos del usuario. Las medidas de AccesoSeguro (validación, manejo seguro de credenciales y mensajes genéricos) son las mismas que el login de Evently debe cumplir. La contraseña se guarda como hash bcrypt y la respuesta de la API no la devuelve. Por eso esta práctica sí aplica.

**Figura 10.** Acceso con la contraseña oculta. Un intento vacío o incorrecto no indica si falló el correo o la clave.

![Contraseña oculta en el inicio de sesión](evidencia/04-login.png)

## Práctica 5. Interacción entre dispositivos (MobileConnect) — Sí aplica

La práctica busca comprender cómo dos dispositivos intercambian información de forma inalámbrica: un mensaje enviado desde uno aparece en el otro.

En Evently esa interacción ya existe entre varios dispositivos del mismo sistema:

1. **Web y teléfono.** Con la sesión iniciada, la web muestra en Entrar en el teléfono un código QR de un solo uso; la app móvil lo lee y recupera esa sesión sin volver a escribir correo y contraseña.
2. **Teléfono y smartwatch.** El reloj consulta por la API los mismos eventos y permite ver o confirmar asistencia desde Wear OS.

No es un chat entre dos teléfonos como MobileConnect, pero el objetivo de la práctica —intercambio de información entre instancias o dispositivos por un canal inalámbrico— es el mismo: la sesión viaja del sitio al móvil, y los eventos se comparten con el reloj. Por eso esta práctica sí aplica al proyecto.

**Figura 11.** Código QR de un solo uso. La web lo muestra y el teléfono lo canjea por la sesión, sin llevar la contraseña.

![Código QR para pasar la sesión al teléfono](evidencia/08-qr-login.png)

## Práctica 6. Evaluación de la comunicación con un servicio externo — Sí aplica

La práctica pide usar una función que la app ya tenga para hablar con un servicio externo. Hay que comprobar que la conexión se establece, que lo enviado y lo recibido coinciden, y que un corte de red no se presenta como una operación exitosa.

En Evently esa función es el reloj. Evently Watch entra con teléfono y PIN, consulta los eventos en la API y confirma la asistencia. El protocolo es HTTP. Si el servidor no responde, el reloj avisa y no da la operación por hecha. Al volver la red, la misma consulta se repite. En esa corrida quedaron cubiertos el establecimiento de la conexión, el envío, la recepción, la integridad de los datos, la interrupción, la recuperación y la reserva que no se duplica.

**Figura 12.** Acceso del reloj: teléfono y PIN de 4 a 6 dígitos, contra la API de Evently.

![Inicio de sesión del reloj](evidencia/09-reloj-login.png)

**Figura 13.** Con el servidor apagado, el reloj informa que no hay conexión.

![Reloj sin conexión al servidor](evidencia/10-reloj-sin-conexion.png)

## Práctica 7. Asignación de roles e interacción entre dispositivos — Sí aplica

En Evently el papel vive en la misma cuenta y en la misma API. Hay dos roles: usuario y administrador. Quien no ha entrado ve el catálogo. Quien inicia sesión confirma asistencia y guarda eventos. Solo el administrador abre el panel, ve a las personas y el rol de cada una, y puede cambiarlo. Si la sesión no es admin, esa pantalla no carga los datos.

**Figura 14.** Panel de Evently. La cuenta administrador aparece con rol Admin; las demás cuentas quedan como Usuario.

![Roles de administrador y usuario en Evently](evidencia/11-roles-admin.png)

## Práctica 8. Pruebas de caja negra — Sí aplica

La práctica mira el proyecto por fuera: si hace lo que se pidió, si rechaza entradas inválidas, si los datos quedan consistentes y si un error no se muestra como éxito.

En Evently eso se comprueba en el acceso y en la reserva. La contraseña va oculta. Un correo que no existe y una clave incorrecta reciben el mismo aviso, sin decir cuál de los dos falló. Un código QR vencido o ya usado no abre la sesión. Confirmar dos veces el mismo evento no duplica el cupo.

**Figura 15.** Acceso de Evently. La contraseña queda oculta y el aviso no revela si falló el correo o la clave.

![Aviso genérico en el inicio de sesión de Evently](evidencia/12-login-error.png)

## Práctica 9. Conexiones y base de datos compartida entre dispositivos — Sí aplica

La práctica comprueba que dos dispositivos de la misma aplicación lean y escriban la misma base. Lo que uno registra tiene que aparecer en el otro, y dos cambios a la vez no deben dejar un dato a medias.

Evently ya trabaja así. El sitio, el teléfono y el reloj consultan la misma base MySQL por la API. Un evento publicado en la web se lista en el teléfono y en el reloj. En el sitio está Fiesta de bienvenida estudiantil; el reloj, con la sesión iniciada, muestra ese mismo evento entre los 25 del catálogo. Una asistencia confirmada queda en el servidor y se vuelve a leer igual.

**Figura 16.** El reloj de Evently leyendo el mismo catálogo de la API: 25 eventos, entre ellos Fiesta de bienvenida estudiantil.

![Catálogo de Evently en el reloj](evidencia/13-reloj-eventos.png)

## Práctica 10. Seguridad, autenticación y control de acceso — Sí aplica

La práctica exige que cada persona solo haga en la base remota lo que su sesión autoriza. La interfaz no basta: el servidor tiene que rechazar la operación.

Evently lo hace con la sesión. La contraseña y el PIN se guardan con bcrypt, nunca en texto plano. El token es un JWT con vencimiento. Sin ese token, las rutas protegidas responden 401 y Mis eventos pide iniciar sesión. El panel de administración no se abre si el rol no es admin. Una reserva queda ligada al usuario del token, no a un identificador que el cliente pueda cambiar.

**Figura 17.** Cuenta de usuario dentro de Evently. El panel de administración no se abre.

![Acceso de administrador rechazado en Evently](evidencia/14-no-admin.png)

## Práctica 11. Pruebas de caja blanca — Sí aplica

La práctica audita el interior del proyecto, no solo lo que se ve en pantalla. Entran el servicio, la aplicación y la base: ramas, validaciones, consultas y el código de respuesta.

En Evently se recorrió el código de la API. El PIN solo es válido si es texto de 4 a 6 dígitos. El registro rechaza una contraseña corta y no devuelve el hash. La reserva abre una transacción, bloquea el evento y hace rollback si el cupo no alcanza o si el identificador no sirve. Esas rutas se ejecutaron con la base sustituida, para medir las ramas del código real. El grafo de abajo es el de `isValidPin`.

**Figura 18.** Ramas de `isValidPin`: tipo de dato, longitud de 4 a 6 dígitos, y las dos salidas en falso.

![Grafo de la validación del PIN](evidencia/15-grafo-pin.png)

## Práctica 12. Optimización, estrés y resiliencia — Sí aplica

La práctica mide el proyecto con varios usuarios a la vez, localiza el cuello de botella, aplica una optimización y vuelve a medir. También comprueba qué pasa si la red o el servicio fallan.

El listado `GET /api/events` devolvía el catálogo completo y armaba un formateador de fecha por cada evento. Con 50 usuarios la latencia media pasó de centenares de milisegundos a más de 8 segundos, y una parte de las solicitudes se quedó sin respuesta. La optimización deja como máximo 50 eventos por página y crea esos formateadores una sola vez. En la misma máquina, con un usuario, la media bajó de 582 ms a 7 ms. Un JSON mal formado responde 400, no 500. Si el puerto está cerrado, la app no trata la consulta como exitosa. La reserva lleva `Idempotency-Key` para no descontar el cupo dos veces.

**Figura 19.** Latencia media del listado antes y después de paginar a 50 eventos.

![Latencia del listado antes y después](evidencia/16-latencia.png)

## Práctica 13. Automatización de pruebas — Sí aplica

La práctica toma piezas ya medidas y las deja como pruebas que se vuelven a ejecutar solas. Si alguien deshace una corrección, la suite falla.

De las prácticas 11 y 12 se tomaron el PIN, el listado de eventos y el alta de usuario. `npm test` corrió 41 pruebas en 1.7 segundos: las del PIN válido, nulo y fuera de rango, el reintento a 200, 400 y 800 ms, el listado, el registro con hash y el 409 cuando el correo ya existe. Un JSON inválido queda en 400. Sin token, la ruta protegida queda en 401.

## Práctica 14. Validación continua — Sí aplica

La misma suite corre en cada push y en cada pull request. El archivo `.github/workflows/pruebas.yml` prepara Node 22, instala con `npm ci` y ejecuta `npm test` dentro de `eventos-backend`. No abre MySQL: la integración sustituye la base y levanta la API en un puerto efímero.

La primera ejecución, en el commit `dde98c4`, terminó en éxito: [run 44226002650](https://github.com/Brunne-CL/Evently/actions/runs/44226002650). El job duró 10 segundos. El segundo push, el del informe en `084caf8`, también terminó en éxito: [run 44226206075](https://github.com/Brunne-CL/Evently/actions/runs/44226206075). Un cambio que vuelva a devolver el catálogo entero, que guarde la contraseña en claro o que trate un corte de red como éxito rompe la prueba en la máquina y otra vez en GitHub, antes de quedarse en `main`.

**Figura 20.** Resultado registrado de la suite local y de las dos ejecuciones en GitHub.

![Resultado de la suite y de la integración continua](evidencia/17-suite-ci.png)

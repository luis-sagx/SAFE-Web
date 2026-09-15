# Portada pública, capacitación en video y práctica de formadores

Fecha: 2026-09-15
Estado: diseño solicitado para revisión; implementación pendiente

## Problema y objetivo

SAFE-Web entra hoy por un formulario de acceso en `/`. La explicación para participantes está en una bienvenida obligatoria y el dashboard conduce directamente al curso. Se necesitan ocho videos públicos: uno general y uno por cada uno de los siete módulos actuales. Tanto participantes como formadores deben poder consultarlos sin interrumpir escenarios. Los formadores, además, necesitan explorar y repetir cualquier escenario sin alterar los resultados oficiales del estudio.

El resultado será una portada pública en `/`, con introducción textual y ocho espacios de video organizados por módulo; el formulario de acceso estará en `/login`. Los roles internos serán exactamente `ADMIN`, `TRAINER` y `PARTICIPANT`. `ADMIN` podrá crear cuentas `TRAINER`; `TRAINER` podrá practicar cualquier escenario cuantas veces quiera; `PARTICIPANT` conservará el recorrido actual. `SUPERVISOR` dejará de ser el nombre interno del rol administrativo.

## Alcance y decisiones

- Los ocho videos se alojarán como videos públicos de YouTube. El catálogo de la portada tendrá un registro general y uno por cada entrada de `SECTIONS`: `phishing`, `smishing`, `vishing`, `suplantacion`, `estafa`, `fisico` y `asistentes-ia`. El orden visible seguirá el catálogo existente.
- Los videos serán visibles a visitantes, participantes, formadores y administradores. La página no requiere sesión ni consume API de progreso.
- Los identificadores de YouTube y guiones finales son datos de publicación que todavía no se proporcionaron. No se inventarán enlaces: cada espacio sin identificador mostrará “Video próximamente” y no montará un reproductor. La implementación admite activarlos individualmente cuando se entreguen las ocho URL. Antes de presentar los ocho como disponibles, deben cargarse ocho identificadores válidos, comprobarse los videos publicados y revisar sus subtítulos en español. La portada aporta una descripción textual breve de cada video para quien no pueda reproducirlo.
- El contenido textual de la portada explica qué es SAFE-Web, que los escenarios son simulaciones y cómo aprovechar la revisión de señales y decisiones. La introducción general se dirigirá a cualquier persona. Cada tarjeta de módulo tendrá título, descripción breve y enlace/reproductor del video; las recomendaciones para conducir un grupo se podrán leer públicamente, sin exigir rol.
- La portada ofrece “Iniciar sesión” → `/login`; para una sesión `PARTICIPANT`, “Ir a mi entrenamiento” → `/dashboard`; para `TRAINER`, “Explorar escenarios” → un índice de práctica; para `ADMIN`, “Administrar” → `/admin`. No sustituye la bienvenida obligatoria del participante ni convierte ver videos en requisito de progreso.
- El frontend seguirá el sistema de diseño de `docs/DESIGN.md`, incluidos tema claro/oscuro, enlaces subrayados en texto y foco visible. Los iframes se montarán al pedir reproducción para no cargar ocho reproductores al abrir `/`. Tendrán título accesible, controles del reproductor y opción de abrir el video en YouTube. Se usará `youtube-nocookie.com` para la incrustación; eso no vuelve privado un video público.
- La CSP de `frontend/nginx.conf` permitirá exclusivamente el origen de iframe necesario. Las URL de YouTube se construirán a partir de identificadores validados, no de HTML de incrustación suministrado como texto.

## Navegación y cuentas

| Ruta | Visitante | PARTICIPANT | TRAINER | ADMIN |
| --- | --- | --- | --- | --- |
| `/` portada y ocho espacios de video | Sí | Sí | Sí | Sí |
| `/login`, `/registro` | Sí | Redirección según rol | Redirección según rol | Redirección según rol |
| `/bienvenida`, `/dashboard`, `/recorrido` | No | Sí, con onboarding actual | No | No |
| `/seccion/:seccionId` y rutas de escenarios | No | Curso con gating actual | Práctica sin gating | No |
| `/admin` | No | No | No | Sí |

La ruta `/` es una portada pública, no un router de roles que reemplace los paneles. El logo de la barra de aplicación volverá a `/`; las páginas de curso conservarán enlaces explícitos al dashboard. La ruta comodín irá a `/`. La pantalla de login autenticado y el flujo tras iniciar sesión enviarán a `ADMIN` a `/admin`, `TRAINER` al índice de práctica y `PARTICIPANT` a `/dashboard`. Solo `PARTICIPANT` pasará por `Bienvenida`; su contenido actual aún habla de seis módulos aunque el catálogo tiene siete, así que el plan incluye corregir ese texto.

`TRAINER` no se autoinscribe. El endpoint de creación será `POST /api/admin/trainers`, protegido por JWT y permiso `ADMIN`. Recibe nombre, apellido y correo; genera una contraseña inicial fuerte en el servidor y la devuelve una sola vez al administrador, como hace el restablecimiento actual. En el esquema de identidad no se exigirá cédula al formador, pues no es participante del estudio. Se reutilizarán el cifrado de datos personales, la huella de correo y el hash de contraseña actuales; se rechazará un correo ya registrado. El administrador podrá listar y desactivar cuentas `TRAINER`. La edición o eliminación de formadores queda fuera de este primer alcance.

La migración de identidad renombrará el valor del enum PostgreSQL `SUPERVISOR` a `ADMIN` y añadirá `TRAINER`; las cuentas administrativas existentes quedarán remapeadas. Prisma, JWT, guardas, seed, tipos de API y textos de interfaz usarán los nombres nuevos. Los tokens de acceso emitidos antes de migrar pueden contener `SUPERVISOR`; deben expirar naturalmente y no otorgar permisos después del despliegue. Los refresh tokens se rehidratan contra la base y reciben el rol nuevo al emitir una sesión. El despliegue aplicará migración y código en una ventana coordinada; no habrá coexistencia indefinida de los dos nombres.

## Práctica de formadores

El índice de práctica mostrará los siete módulos y enlaces a todos los escenarios, sin estado “bloqueado”, puntuación oficial, barra de aprobación ni opción “Repetir módulo”. Las rutas de escenario existentes admitirán `TRAINER` y saltarán `RequireAvailableScenario`, pero conservarán el montaje del escenario y su veredicto. Tras un final, el formador verá “Volver a probar este escenario”, “Otro escenario” y “Volver al índice de práctica”. El reinicio se realizará en el motor del escenario o remontando su componente con una clave nueva; no se navegará por la lógica de ronda del participante.

`useScenarioRun` es el único punto actual de guardado. Para `TRAINER`, `finish` registrará el resultado local necesario para el veredicto, pero no llamará a `createRun` ni a `queueRun`; el estado será `practice` y la interfaz dirá “Práctica: este intento no se guarda”. El formador no consultará `/runs/progreso`, `/runs/me`, `/runs/atestacion`, ni `/certificados`. `RunNotifications` solo sincronizará corridas pendientes cuando el rol sea `PARTICIPANT`; las corridas pendientes de una antigua sesión participante no se enviarán bajo una cuenta formadora.

El backend aplicará la separación, no solo la interfaz: `POST /runs`, `GET /runs/me`, progreso, reinicio y atestación exigirán `PARTICIPANT`. Las rutas de resultados y gestión exigirán `ADMIN`. El servidor verificará el rol en cada solicitud; un `TRAINER` que llame directamente a `/runs` recibirá 403 y no aparecerá en los resultados del estudio. La emisión de certificados exigirá también `PARTICIPANT`. No se añadirá una tabla de práctica: los intentos del formador no son datos de investigación.

## Criterios de aceptación

1. `/` muestra introducción, ocho espacios en el orden indicado y enlaces correctos según el estado de sesión. Los espacios sin URL son honestos y no cargan iframe.
2. `/login` funciona como el antiguo `/`; abrir `/` nunca fuerza login ni onboarding.
3. Los participantes pueden ver cualquier video y seguir el curso, con gating, corridas, progreso y certificado iguales a los actuales.
4. Un administrador existente aparece como `ADMIN` tras la migración, conserva gestión y resultados, y puede crear/listar/desactivar cuentas `TRAINER`; registro público no puede elegir rol.
5. Un formador puede abrir y repetir inmediatamente cualquier escenario; sus intentos no generan filas `ScenarioRun`, corridas pendientes, progreso oficial ni certificado.
6. Solicitudes directas a endpoints protegidos se deniegan según la matriz de roles, especialmente `TRAINER → POST /runs` y `TRAINER → /admin`.
7. La portada y práctica son utilizables con teclado, tema claro/oscuro y móvil; la CSP permite el iframe de YouTube sin ampliar `script-src` ni `connect-src` propios.

## Entregas independientes

El [plan de portada y videos](../plans/2026-09-15-portada-videos-publicos.md) puede publicarse primero usando los roles actuales; el nuevo catálogo no requiere backend. El [plan de roles y práctica](../plans/2026-09-15-roles-y-practica-formadores.md) aplica después, migrando permisos y añadiendo el índice de práctica. La primera entrega se acepta aunque los identificadores de YouTube aún no estén disponibles: muestra ocho espacios preparados y rotulados como pendientes. La publicación de cada video es una actualización de datos del catálogo, no una migración de la aplicación.

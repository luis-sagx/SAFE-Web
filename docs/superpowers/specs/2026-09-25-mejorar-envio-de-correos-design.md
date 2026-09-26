# Mejorar envío de correos

**Fecha:** 2026-09-25
**Proyecto:** SAFE Web
**Estado:** diseño aprobado; pendiente de plan e implementación

Issue #295 pedía cuatro cosas: investigar por qué los correos caen en spam,
decidir código-o-link para recuperación de clave, agregar el mismo mecanismo
al registro por consistencia, y que los tres correos se vean profesionales.
Este diseño resuelve la investigación de spam (sin cambios de código, ver
más abajo), agrega un flujo de confirmación de registro que **bloquea el
acceso** hasta confirmar (revierte una decisión documentada anteriormente en
`docs/superpowers/specs/2026-09-03-gamificacion-y-certificado-design.md` y
`2026-08-22-dominios-correo-registro-design.md`, que descartaban verificar
correo), y agrega una plantilla visual compartida para los tres correos.

## Investigación de spam (resuelta; no genera tareas de código)

Se revisaron los registros DNS reales de `safe-web.site` (dominio de
producción, confirmado por el usuario):

- **SPF**: correcto. Resend firma desde el subdominio `send.safe-web.site`
  (CNAME a `send.forge.rmta.net`), con SPF autorizando las IPs de Resend
  (`v=spf1 ip4:52.3.252.119 ip4:44.222.39.36 ip4:199.249.231.0/24 ~all`).
- **DKIM**: correcto. `resend._domainkey.safe-web.site` publica la clave
  pública.
- **DMARC**: existe pero es `p=none` (solo observa, no exige alineación).
  Débil, pero no es la causa principal.
- **Causa más probable**: el dominio `safe-web.site` se registró hace 5 días
  (WHOIS: `Creation Date: 2026-09-20`). Un dominio sin historial de envíos es
  una señal fuerte de spam para Gmail/Outlook, independiente de que SPF/DKIM
  estén perfectos. Se resuelve solo en 2-4 semanas de envío consistente
  ("calentar" el dominio) — no hay ninguna configuración pendiente para esto.
- **Contribuye, y sí se arregla en este diseño**: los correos actuales son
  HTML mínimo (un párrafo, un link, sin pie de página ni texto plano en el
  caso del certificado) — un patrón que los filtros asocian con phishing. La
  plantilla compartida de este diseño agrega pie de página y texto plano a
  los tres correos.

No hay tarea de "arreglar DNS": ya está bien configurado. Queda como
recomendación, no como trabajo: subir DMARC a `p=quarantine` más adelante,
una vez que haya confianza en que el flujo de envío está estable.

## Resultado esperado

Alguien que se registra ve una pantalla de "revisa tu correo" en vez de
entrar directo a la app. No puede iniciar sesión hasta hacer clic en el link
de confirmación que le llega (mismo patrón que recuperar clave: link con
token de un solo uso, no código). Si el correo no le llega, tiene un botón
para reenviarlo. Las cuentas que ya existen hoy no se ven afectadas: quedan
confirmadas automáticamente. Los tres correos (confirmación, recuperación de
clave, certificado) comparten una misma plantilla visual con la paleta de
marca de la app en pantalla (`docs/DESIGN.md`).

## Decisiones de diseño

| Tema | Decisión |
|---|---|
| Código vs. link | Link, en los dos flujos (recuperación ya lo usa; confirmación de registro lo copia). Un clic, sin escribir nada; con HTTPS + token de un solo uso la seguridad es equivalente a un código. |
| Bloquea o informa | Bloquea: no se puede iniciar sesión hasta confirmar. Revierte la decisión previa de no verificar correo — la cédula sigue evitando cuentas duplicadas, pero ya no evita que alguien se registre con un correo que no es suyo o que escribió mal. |
| Alcance por rol | Solo `PARTICIPANT`. Las cuentas `TRAINER`/`ADMIN` las da de alta alguien del equipo a mano, así que ya pasan por una verificación humana; no se les exige confirmar correo. |
| Cuentas existentes | Todas quedan confirmadas automáticamente en la migración (`emailConfirmedAt = now()`). Nadie pierde acceso por un cambio de regla posterior a su registro. |
| Expiración del token | 24 horas (vs. 30 minutos de recuperación de clave): confirmar cuenta es menos urgente que resetear una clave comprometida. |
| Reenviar confirmación | Sí, con su propio endpoint y su propio rate limit, mismo patrón "responde igual exista o no la cuenta" que `forgot-password` (issue #256), para no delatar qué correos están registrados. |
| Plantilla visual | Un solo helper compartido (`emailLayout`), sin librería nueva (CSS inline, por compatibilidad con clientes de correo que recortan `<style>` en `<head>`). Paleta: la del sistema de diseño en pantalla (`docs/DESIGN.md`: `--color-primary #006837`, tinta `#171717`, fondo `#f7f7f8`, borde `#e6e6ea`) — **no** la del PDF del certificado, que es deliberadamente más ornamentada (dorado, crema) y está reservada por diseño para el documento impreso, no para pantalla. Los tres correos lo usan. Cada uno mantiene (o gana, en el caso del certificado) su versión en texto plano. |

## Componentes y flujo de datos

**Base de datos (`prisma/identidad/schema.prisma`, modelo `Participant`):**
Tres campos nuevos, mismo patrón que los ya existentes para
`passwordResetTokenHash`/`passwordResetExpiresAt`:

```prisma
/// Null = pendiente de confirmar. Con fecha = confirmó su correo (o la
/// cuenta se creó antes de este cambio y se marcó confirmada en la
/// migración). Solo aplica a PARTICIPANT: TRAINER/ADMIN no nacen confirmados, pero no se les exige confirmar para iniciar sesión.
emailConfirmedAt DateTime?

/// Hash SHA-256 del token de un solo uso para confirmar el correo, mismo
/// patrón que passwordResetTokenHash.
emailConfirmationTokenHash String? @unique

/// Vence a las 24 horas de pedirse. Null cuando no hay ninguna confirmación
/// pendiente (ya confirmó, o la cuenta nació confirmada).
emailConfirmationExpiresAt DateTime?
```

Migración: además de agregar las columnas, un `UPDATE` que marca
`emailConfirmedAt = now()` en toda fila existente con `role = 'PARTICIPANT'
AND emailConfirmedAt IS NULL` — para que ninguna cuenta ya registrada quede
bloqueada.

**Backend (`identidad`):**

- `MailService` gana un tercer método, `sendEmailConfirmation(email, name,
  confirmLink)`, mismo patrón que `sendPasswordReset` (HTML + texto plano).
- Nuevo helper compartido `emailLayout(tituloVisible: string, cuerpoHtml:
  string): string` en `mail/` (archivo nuevo, p. ej. `mail/plantilla.ts`),
  usado por los tres métodos de `MailService`. Los tres correos ganan un pie
  de página común (nombre del remitente, aviso de "no respondas a este
  correo", nada más — no hace falta domicilio postal: es correo
  transaccional de una app de estudio, no marketing).
- `AuthService.register()`: ya no arma una sesión. Crea el participante con
  `emailConfirmedAt: null`, genera el token de confirmación (mismo
  `randomBytes(32).toString('base64url')` que `forgotPassword`), llama a
  `mail.sendEmailConfirmation(...)`, y devuelve solo una confirmación de que
  la cuenta se creó — sin `accessToken` ni cookie de refresh.
- `AuthService.login()`: agrega una comprobación antes de emitir la sesión —
  si `participant.role === 'PARTICIPANT' && !participant.emailConfirmedAt`,
  rechaza con un mensaje claro y accionable ("Confirma tu correo antes de
  iniciar sesión. Revisa tu bandeja o pide que te lo reenviemos.").
- Nuevo `AuthService.confirmEmail(token: string): Promise<void>`: busca por
  `emailConfirmationTokenHash`, valida vigencia (mismo mensaje genérico de
  error que `resetPassword`, sin distinguir token inexistente/vencido/ya
  usado), marca `emailConfirmedAt = now()` y limpia los dos campos de token.
- Nuevo `AuthService.resendConfirmation(email: string): Promise<void>`:
  mismo patrón "responde igual exista o no la cuenta, o ya esté confirmada"
  que `forgotPassword`. Genera un token nuevo y reemplaza el anterior (uno
  vigente a la vez, igual que el de clave).
- Nuevos endpoints en `AuthController`: `POST /auth/confirm-email` (body:
  `{ token }`, sin guard, `@HttpCode(204)`) y `POST /auth/resend-confirmation`
  (body: `{ email }`, mismo `@Throttle` que `forgot-password`: 5/min/IP).
- `RegisterDto`/`ForgotPasswordDto` ya validan formato de correo; no hace
  falta un DTO nuevo aparte de `ConfirmEmailDto` (`{ token: string }`) y
  `ResendConfirmationDto` (`{ email: string }`, igual que
  `ForgotPasswordDto`).

**Frontend:**

- `Registro.tsx`: tras `register()`, en vez de `navigate('/dashboard')`,
  navega a una pantalla nueva `RevisaTuCorreo.tsx` ("Creamos tu cuenta. Te
  mandamos un correo a {email} para confirmarla.") con un botón "Reenviar
  correo" que llama al endpoint nuevo.
- `AuthContext.register()`: cambia su tipo de retorno — ya no resuelve a un
  `Participant` autenticado (no hay sesión todavía). El componente que llama
  decide qué mostrar, no el contexto.
- Nueva página `ConfirmarCorreo.tsx`, reachable en `/confirmar-correo?token=…`
  (mismo patrón de ruta que `RestablecerPassword.tsx`): al montar, llama
  `POST /auth/confirm-email`, y según el resultado muestra éxito (con link a
  `/login`) o error (token vencido/inválido, con el mismo botón de reenviar).
- `login()` en `AuthContext`/`api.ts` ya maneja errores del backend
  (`ApiError`) — el mensaje de "confirma tu correo" llega como cualquier
  otro error de login, sin necesitar un camino especial en el frontend más
  allá de mostrarlo.

## Testing

- Backend: `mail.service.spec.ts` — nuevo método `sendEmailConfirmation`
  probado igual que `sendPasswordReset`; `emailLayout` probado por separado
  (contiene el contenido pasado, no revienta con HTML con caracteres
  especiales). `auth.service.spec.ts` — registro ya no arma sesión, sí manda
  correo; login rechaza sin confirmar (solo `PARTICIPANT`, no
  `TRAINER`/`ADMIN`); `confirmEmail` (token válido, vencido, inexistente,
  reutilizado); `resendConfirmation` (respuesta idéntica exista o no la
  cuenta, o ya esté confirmada). `auth.controller.spec.ts` — los dos
  endpoints nuevos delegan correctamente y respetan el throttle donde
  aplica.
- Frontend: `Registro.test.tsx` — navega a la pantalla nueva, no a
  `/dashboard`. `RevisaTuCorreo.test.tsx`, `ConfirmarCorreo.test.tsx` —
  nuevos, cubriendo éxito/error/reenviar. `AuthContext.test.tsx` — el nuevo
  tipo de retorno de `register()`.
- Migración: probar contra una base con filas `PARTICIPANT` preexistentes
  que el `UPDATE` las deja todas con `emailConfirmedAt` no nulo.

## Fuera de alcance

- No se toca el flujo de recuperación de clave más allá de que ahora
  comparte `emailLayout`.
- No se agrega verificación de correo para `TRAINER`/`ADMIN`.
- No se sube DMARC a `p=quarantine` en este cambio (queda como
  recomendación operativa, no como tarea).
- No se migra de Resend a otro proveedor.
- No se agrega un sistema de plantillas con librería externa (MJML,
  react-email): con tres correos, un helper propio alcanza.

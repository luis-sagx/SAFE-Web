# Reporte: arreglo de la suite e2e tras el flujo de confirmación de correo (issue #295)

## Resumen

El cambio de contrato de `POST /auth/register` (ya no abre sesión; crea la
cuenta sin confirmar y devuelve solo `{ email }`) rompía 30 de 48 tests en
`auth.e2e-spec.ts`, más los helpers locales de `admin.e2e-spec.ts` y
`certificados.e2e-spec.ts` que asumían sesión inmediata al registrar.

Se reprodujo el fallo original (`cd backend && pnpm test:e2e -- --testPathPattern auth.e2e`
→ 30/48 fallando, la mayoría 500 en el propio POST /auth/register porque el
mock de `MailService` no tenía `sendEmailConfirmation`), se arregló toda la
cadena, y ahora la suite completa pasa en verde: **94/94 tests, 5/5 suites**.

## Archivos tocados

- `backend/test/identidad.e2e.ts`
- `backend/test/auth.e2e-spec.ts`
- `backend/test/admin.e2e-spec.ts`
- `backend/test/certificados.e2e-spec.ts`

`backend/test/throttling.e2e-spec.ts` y `backend/test/runs.e2e-spec.ts` se
leyeron enteros y **no se tocaron**:
- `throttling.e2e-spec.ts` nunca registra una cuenta nueva: prueba el límite
  de peticiones contra `/auth/login` y `/auth/forgot-password` con correos
  que no existen (`atacante@ejemplo.ec`, `otro@ejemplo.ec`,
  `quien-sea@ejemplo.ec`), y el 429/401 que verifica no depende de si una
  cuenta está confirmada.
- `runs.e2e-spec.ts` pertenece al servicio `entrenamiento`, no `identidad`:
  usa el helper `./entrenamiento.e2e` (`token()` que firma JWTs directamente
  con `JwtService`, sin pasar nunca por `/auth/register`). No tiene ninguna
  dependencia del flujo de auth de `identidad`.

## Paso 1 — `identidad.e2e.ts` (la base)

1. El mock de `MailService` en `createTestApp()` ahora incluye
   `sendEmailConfirmation: jest.fn().mockResolvedValue(true)`, igual patrón
   que `sendPasswordReset`. Sin esto, `AuthService.register()` revienta con
   500 al intentar llamar un método que no existe en el mock — esta era la
   causa raíz de la mayoría de los 30 fallos.
2. Se agregó y exportó `tokenFromLink(link: string): string`, movido desde
   `auth.e2e-spec.ts` (donde vivía duplicado como función privada) para que
   lo puedan usar también `registerConfirmedSession` y cualquier otro
   archivo.
3. Se agregó `registerConfirmedSession(app, suffix)`, que registra, lee el
   token real del último `mock.calls` de `sendEmailConfirmation`, confirma
   el correo con `POST /auth/confirm-email`, e inicia sesión — devuelve
   `{ session, datos }`. Es el reemplazo directo de "registro = sesión
   inmediata" para todo test que solo necesita una cuenta lista para usar,
   sin estar probando el registro en sí.

Se agregaron los imports que hacían falta (`request` de `supertest`, `type
App` de `supertest/types`).

## Paso 2 — `auth.e2e-spec.ts` (reescrito, ~30 tests afectados)

### `describe('POST /api/auth/register', ...)`
Siguen llamando `POST /auth/register` directo (son los que prueban el
registro en sí, no debían usar el helper):

- **`'crea el participante sin confirmar y solo devuelve el correo'`**
  (antes `'crea el participante y devuelve un token'`): reescrita para
  reflejar el contrato real — `expect(201)`, cuerpo `{ email: '...' }`
  exacto (nada de `accessToken`/`participant`), se verifica que
  `sendEmailConfirmation` se llamó con ese correo (prueba de que la cuenta
  se creó e intentó notificarse) y que la fila creada tiene
  `emailConfirmedAt: null`.
- **`'no devuelve el hash de la contraseña, el seudónimo ni la cédula'`**:
  se mantiene, pero ahora inspecciona el cuerpo `{ email }` completo en vez
  de `session.participant` (que ya no existe).
- **`'nunca guarda la cédula en claro...'`** y
  **`'nunca guarda nombre, apellido ni correo en claro...'`**: seguían
  siendo relevantes (protegen contra guardar PII en claro), pero ya no
  pueden sacar el `id` de la respuesta de registro. Se cambiaron a buscar
  `prisma.participant.findFirst({ orderBy: { createdAt: 'desc' }, take: 1 })`
  justo después del registro — seguro en este archivo porque no hay
  registros concurrentes y cada test usa un sufijo único, tal como sugería
  el encargo. La comprobación de "la app sí lo descifra de vuelta" se quitó
  de la segunda (ya no hay respuesta descifrada que comparar; el registro ya
  no expone nombre/correo en claro por diseño del nuevo contrato) — sigue
  probando lo mismo del lado de la base, que es lo que sostenía el issue
  #95.
- **`'normaliza el correo y acepta la cédula con guiones'`**: en vez de leer
  el correo normalizado de la respuesta (que ya no lo trae), se verifica
  contra el argumento con el que se llamó `sendEmailConfirmation` (el
  correo normalizado que ve el enlace de confirmación).
- Duplicado de correo/cédula, mismo error para ambos, validaciones de
  campos, campos fuera del DTO: sin cambios — no dependían de la forma de
  la respuesta 201.

### `describe('POST /api/auth/login', ...)`
El `beforeAll` pasó de un `POST /auth/register` esperando `201` con token, a
`registerConfirmedSession(app, 'login')`. Los tests existentes no cambiaron
de lógica.

**Test nuevo**: `'rechaza el login de un participante que no confirmó su
correo'` — registra sin confirmar y verifica `401` con un mensaje que
contiene `'Confirma tu correo'` (el mensaje real de `AuthService` es
`'Confirma tu correo antes de iniciar sesión. Revisa tu bandeja o pide que
te lo reenviemos.'`).

### `describe('GET /api/auth/me', ...)` y `describe('PATCH /api/auth/me', ...)`
Mismo cambio: `beforeAll` ahora usa `registerConfirmedSession` y saca
`session.accessToken`. Lógica de los tests intacta.

### `describe('POST /api/auth/refresh', ...)`
Reescrita para reflejar que el registro ya no pone la cookie de refresh por
sí solo (eso ahora lo hace login). Cada test que antes registraba y usaba
directamente `res` para sacar la cookie ahora usa
`registerConfirmedSession` + un `POST /auth/login` explícito para obtener
la respuesta con la cookie (o el token) que necesita. La intención de cada
test (rotación, rechazo sin cookie, rechazo de token inventado, `typ`
cruzado entre access/refresh, rechazo con cuenta desactivada) no cambió.

### `describe('POST /api/auth/confirm-email', ...)` — nuevo
- Token vigente: confirma y deja iniciar sesión.
- Token inventado/inexistente: `401` con el mensaje genérico exacto
  `'El enlace no es válido o ya venció.'` (se confirmó en el código que
  `CONFIRMATION_LINK_INVALID` y `RESET_LINK_INVALID` son el mismo literal,
  a propósito, comentado explícitamente en `auth.service.ts`).
- Token ya usado: la segunda confirmación da `401`.

### `describe('POST /api/auth/resend-confirmation', ...)` — nuevo
- Reenviar genera un token nuevo que invalida el viejo (el viejo da `401`
  al confirmar, el nuevo da `204`).
- Reenviar a un correo inexistente responde el mismo `204` sin llamar al
  mock (mismo patrón de no revelar qué correos existen que ya usaba
  `forgot-password`).

### `describe('POST /api/auth/forgot-password', ...)` y `describe('POST /api/auth/reset-password', ...)`
Se confirmó leyendo `AuthService.forgotPassword()` completo (incluido su
`select` de Prisma, que ni siquiera trae `emailConfirmedAt`) que **no**
exige el correo confirmado. Por eso:
- Los tests que solo llegan hasta `reset-password` (sin loguearse después
  con la contraseña nueva) siguen registrando directo con
  `POST /auth/register`, sin confirmar — así probado, sigue siendo
  representativo del comportamiento real.
- `'con un token vigente, cambia la contraseña y deja entrar con la nueva'`,
  `'un token ya usado no sirve una segunda vez'`, e
  `'invalida un refresh token emitido antes del restablecimiento'` sí
  terminan haciendo login con la contraseña (nueva o vieja), así que usan
  `registerConfirmedSession` para llegar confirmados antes de
  forgot/reset/login.

## Paso 3 — `admin.e2e-spec.ts`

- `newParticipant(suffix)` ahora llama `registerConfirmedSession(app, suffix)`
  y devuelve `id` directamente de `session.participant.id` (el perfil que
  trae el login sí incluye `id`; no hizo falta decodificar el JWT).
- El setup del supervisor en `beforeAll` hace lo mismo: registra, confirma
  e inicia sesión con `registerConfirmedSession`, y solo después le sube el
  rol a `ADMIN` en la base y vuelve a loguear con las credenciales
  originales para obtener el token de supervisor.
- Se quitó el import de `registrationData`, que quedó sin uso en este
  archivo.

**Decisión no especificada en el encargo**: se subió el rol a `ADMIN`
*después* de que `registerConfirmedSession` ya hizo login como
`PARTICIPANT` confirmado, en vez de intentar registrar directo como si
fuera admin. Esto evita depender de si `login()` exime a `ADMIN` de la
comprobación de correo confirmado (de hecho sí lo exime, según el código:
el chequeo es `role === 'PARTICIPANT' && !emailConfirmedAt`), y mantiene el
mismo comportamiento que tenía el test antes del cambio de contrato.

## Paso 4 — `certificados.e2e-spec.ts`

- El helper local `participant(suffix)` ahora usa
  `registerConfirmedSession(app, suffix)` para obtener `accessToken`, y
  sigue decodificando el JWT con `jwt.decode<JwtPayload>(...)` para sacar
  `sub`/`seq` (esos campos no vienen en el perfil por diseño, así que ahí sí
  seguía haciendo falta el JWT, tal como preveía el encargo).
- Se quitaron los imports que quedaron sin uso (`registrationData`,
  `type SessionBody`) y se agregó `responseBody`, que ya se usaba más abajo
  en el archivo (se había perdido al reescribir el bloque de imports; el
  lint lo habría marcado, y de hecho el propio `tsc`/eslint del paso final
  lo habría atrapado — se corrigió antes de correr las pruebas).

## Paso 5 — `throttling.e2e-spec.ts` y `runs.e2e-spec.ts`

Confirmado por lectura completa (ver "Resumen"): **no se tocaron**, no
dependen del contrato de registro.

## Decisiones no especificadas explícitamente en el encargo

1. En el test de "pone la cookie del refresh token" y varios de
   `POST /auth/refresh`, se separó `registerConfirmedSession` (que ya hace
   su propio login interno) de un `POST /auth/login` adicional explícito
   cuando el test necesitaba inspeccionar la respuesta cruda de login (por
   ejemplo, sus cabeceras `Set-Cookie`). Es un login de más por test, pero
   mantiene cada test enfocado en lo que realmente verifica.
2. Se usó el mensaje de error de `login()` con `toContain('Confirma tu
   correo')` en vez de comparar el string completo, para no acoplar el test
   al texto exacto del mensaje (que no formaba parte del contrato que
   describía el encargo) mientras sigue siendo una prueba fuerte de que es
   el error de confirmación y no otro 401.
3. En `identidad.e2e.ts`, la promesa de `registerConfirmedSession` no
   captura la respuesta completa de `POST /auth/register` (solo hace
   `expect(201)`) porque ese cuerpo ya no aporta nada útil para el flujo de
   "solo necesito una cuenta lista".
4. Se agregó `// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion`
   antes de la aserción de tipo sobre `app.get(MailService)` dentro de
   `registerConfirmedSession`, siguiendo exactamente el mismo patrón que ya
   existía en `auth.e2e-spec.ts` para `sendPasswordReset` (el linter marca
   esa aserción como "innecesaria" aunque en la práctica hace falta para
   acceder a `.mock.calls`, que no existe en el tipo real de
   `MailService`).

## Output de `pnpm test:e2e -- --testPathPattern auth.e2e` (antes del arreglo)

30 de 48 tests fallando, en su mayoría con `500 Internal Server Error` en
`POST /api/auth/register` (el mock de `MailService` no tenía
`sendEmailConfirmation`, así que `AuthService.register()` reventaba al
llamarlo), y el resto porque los tests asumían que el registro devolvía
sesión inmediata (`accessToken`/`participant` en el cuerpo). Reproducido
localmente antes de tocar nada, confirmando el reporte original.

## Output de `pnpm test:e2e -- --testPathPattern auth.e2e` (después del arreglo)

```
$ jest --config ./test/jest-e2e.json -- --testPathPattern auth.e2e
Test Suites: 1 passed, 1 total
Tests:       54 passed, 54 total
Snapshots:   0 total
Time:        14.9 s
Ran all test suites matching --testPathPattern|auth.e2e.
```

(54 tests: los ~24 originales que sobrevivieron sin cambios de contrato +
los reescritos + los nuevos de confirm-email/resend-confirmation/login
bloqueado.)

## Output de `pnpm test:e2e` (suite completa, todos los archivos)

```
$ jest --config ./test/jest-e2e.json
Test Suites: 5 passed, 5 total
Tests:       94 passed, 94 total
Snapshots:   0 total
Time:        25.52 s
Ran all test suites.
```

Se corrió también con `--verbose` para revisar nombre por nombre; el
reporter de este entorno solo mostró el resumen final (no imprimió las
líneas por test individuales pese a `--verbose`), pero el resultado
agregado es el mismo: **5/5 suites, 94/94 tests, sin fallos**, incluyendo
`admin.e2e-spec.ts`, `certificados.e2e-spec.ts`, `throttling.e2e-spec.ts` y
`runs.e2e-spec.ts` sin haberlos tocado.

## Output de `pnpm exec eslint "{apps,libs,test}/**/*.ts"`

Primera pasada, dos errores:

```
/home/snowmanst/Desktop/MIC/trampa-digital/backend/test/auth.e2e-spec.ts
  787:56  error  Replace `⏎········app,⏎········'reset-sesiones',⏎······` with `app,·'reset-sesiones'`  prettier/prettier

/home/snowmanst/Desktop/MIC/trampa-digital/backend/test/identidad.e2e.ts
  166:16  error  This assertion is unnecessary since it does not change the type of the expression  @typescript-eslint/no-unnecessary-type-assertion

✖ 2 problems (2 errors, 0 warnings)
```

Corregidos (formato con `--fix` para el primero, y el mismo patrón de
`eslint-disable-next-line` que ya usaba el archivo para el segundo — ver
decisión #4 arriba). Segunda pasada:

```
$ pnpm exec eslint "{apps,libs,test}/**/*.ts"
(sin salida — 0 errores, 0 warnings)
```

## Output de typecheck

`pnpm exec tsc --noEmit -p apps/identidad/tsconfig.app.json` no incluye
`test/` (confirmado: ese `tsconfig.app.json` solo cubre `apps/identidad/src`
y `libs/`). El comando que sí cubre `test/` es el `tsconfig.json` raíz del
backend (sin `include`/`exclude` propios, así que TypeScript toma todo el
árbol del proyecto por defecto):

```
$ pnpm exec tsc --noEmit -p tsconfig.json
prisma/backfill-pii.mts(23,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
prisma/reset-un-escenario.mts(13,27): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
prisma/seed-insignia-prueba.mts(16,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
prisma/seed.mts(14,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
```

Los 4 errores son preexistentes en scripts de `prisma/*.mts` que no forman
parte de esta tarea (no se tocó ningún archivo de `prisma/`) y no
mencionan ningún archivo de `test/`. Ninguno de los 4 archivos que edité
(`identidad.e2e.ts`, `auth.e2e-spec.ts`, `admin.e2e-spec.ts`,
`certificados.e2e-spec.ts`) aparece en la salida de `tsc`, así que
type-checkean limpio bajo la configuración que sí los cubre. No pude
confirmar con `git stash` que estos 4 errores ya existían antes de mis
cambios (la sandbox bloqueó el `git stash` por ser una operación
potencialmente destructiva), pero por construcción no pueden originarse en
mis ediciones: no toqué ningún archivo `.mts` de `prisma/`.

## Comandos git pendientes (NO ejecutados — norma del usuario)

```
git add backend/test/identidad.e2e.ts backend/test/auth.e2e-spec.ts backend/test/admin.e2e-spec.ts backend/test/certificados.e2e-spec.ts
git commit -m "test: adapt e2e suite to mandatory email confirmation flow (#295)

POST /auth/register no longer returns a session (only { email }); accounts
must be confirmed via POST /auth/confirm-email before login succeeds.
Rewrites auth.e2e-spec.ts (~30 affected tests), adds a shared
registerConfirmedSession() helper in identidad.e2e.ts, updates the local
helpers in admin.e2e-spec.ts and certificados.e2e-spec.ts that assumed
immediate sessions, and adds new coverage for confirm-email,
resend-confirmation, and login blocked by an unconfirmed email.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

(`throttling.e2e-spec.ts` y `runs.e2e-spec.ts` no se incluyen porque no se
tocaron.)

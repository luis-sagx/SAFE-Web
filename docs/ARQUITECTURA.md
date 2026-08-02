# Arquitectura de la plataforma

**Proyecto:** Ambientes interactivos de simulación para educación de usuarios no técnicos frente a ciberamenazas en el Ecuador (Trabajo de Integración Curricular).

Este documento es **normativo**. Describe cómo está construida la plataforma y
cómo debe seguir construyéndose. Cualquier persona o agente de IA que vaya a
escribir código en este repositorio debe leerlo antes y ajustarse a él.

Documentos relacionados:

- `docs/justificacion-tecnologias.md` — por qué se eligió cada tecnología, con fuentes.
- `docs/superpowers/specs/2026-07-25-escenarios-ciberamenazas-design.md` — diseño pedagógico de los 35 escenarios.
- `docs/ANEXO-2-...md` — perfil del trabajo, objetivos y metodología del estudio.

---

## 1. Qué es esto, en una frase

Una aplicación web donde un participante **se registra con su nombre, correo y
teléfono**, juega **escenarios simulados de fraude** que registran cada
decisión, y el investigador exporta esos resultados —**identificados solo por un
seudónimo**— para compararlos con un pre-test y un post-test aplicados aparte en
Google Forms.

De ahí salen las tres restricciones que gobiernan todo lo demás:

1. **Es un instrumento de investigación.** Un resultado perdido o mal formado es
   un dato perdido del estudio. La validación y el registro de corridas no son
   negociables.
2. **Los datos personales no llegan al análisis.** Sirven para dar acceso y
   nada más: la exportación identifica cada fila con un seudónimo (`P001`), y al
   cerrar la recolección un comando borra nombre, correo y teléfono.
3. **La usan personas no técnicas.** La interfaz se mantiene simple y en
   lenguaje claro; los escenarios simulan, nunca conectan con sistemas reales.

---

## 2. Arquitectura general: tres capas

Arquitectura de tres capas clásica (presentación / lógica de aplicación /
datos), desplegada completa en un servidor propio mediante contenedores.

```
                    ┌──────────────────────────────────────┐
   Navegador ──────▶│  web  ·  Nginx + React SPA (:8080)   │
                    │  sirve el bundle y delega /api/       │
                    └───────────────┬──────────────────────┘
                                    │  /api/*  (red interna de compose)
                    ┌───────────────▼──────────────────────┐
                    │  api  ·  NestJS (:3000)              │
                    │  auth JWT, validación DTO, corridas  │
                    └───────────────┬──────────────────────┘
                                    │  Prisma + driver adapter
                    ┌───────────────▼──────────────────────┐
                    │  db  ·  PostgreSQL (sin puerto host) │
                    └──────────────────────────────────────┘
```

Decisiones estructurales que **no** se cambian sin actualizar este documento:

| Decisión | Motivo |
|---|---|
| Frontend y API comparten origen; Nginx delega `/api/` | Elimina CORS en producción y evita exponer el API directamente. |
| `db` y `api` no publican puertos al host | Solo `web` es alcanzable desde afuera. Reduce la superficie expuesta del servidor propio. |
| El catálogo de escenarios vive en el frontend, no en la base | El contenido no es dato sensible ni cambia por usuario; meterlo en la base agregaría una capa sin beneficio. |
| El API solo guarda resultados | Su única responsabilidad es la integridad de los datos del estudio. |

---

## 3. Estructura del repositorio

```
trampa-digital/
├── frontend/                 # SPA React + Vite + TypeScript (pnpm)
│   ├── src/
│   │   ├── components/       # UI compartida entre escenarios
│   │   │   ├── Campo.tsx          # campo de formulario
│   │   │   ├── RequireAuth.tsx
│   │   │   └── ui/                # StoryChoices, RiskGauge, …
│   │   ├── context/
│   │   │   └── AuthContext.tsx    # sesión del participante
│   │   ├── data/
│   │   │   └── catalogo.ts        # ← catálogo de secciones y escenarios
│   │   ├── hooks/
│   │   │   ├── useScenarioRun.ts  # ← registro de resultados
│   │   │   ├── useStoryEngine.ts  # motor de escenarios de grafo
│   │   │   ├── useCountdown.ts
│   │   │   └── useFlashTransition.ts
│   │   ├── lib/
│   │   │   ├── api.ts             # ← único punto de contacto con el API
│   │   │   └── pendingRuns.ts     # cola de reintento de corridas
│   │   ├── pages/                 # Login, Registro, Dashboard, Seccion
│   │   ├── secciones/<amenaza>/   # ← un archivo por escenario
│   │   ├── index.css              # ← tokens de diseño (@theme)
│   │   └── styles/
│   ├── tsconfig.json
│   ├── nginx.conf
│   └── Dockerfile
│
├── backend/                  # API NestJS (pnpm)
│   ├── prisma/
│   │   ├── schema.prisma     # ← modelo de datos
│   │   ├── migrations/
│   │   ├── seed.mts          # crea la cuenta de investigador
│   │   └── anonimizar.mts    # ← cierra la recolección de datos
│   ├── prisma.config.ts
│   ├── src/
│   │   ├── auth/             # login, JWT, guards
│   │   ├── runs/             # corridas de escenario + exportación CSV
│   │   ├── prisma/           # PrismaService
│   │   ├── app.controller.ts # health check
│   │   └── main.ts
│   └── Dockerfile
│
├── docs/
├── .github/workflows/ci.yml
├── docker-compose.yml
└── .env.example
```

### Reglas de dependencia

- `frontend/` y `backend/` son **proyectos independientes**, cada uno con su
  `package.json` y su `pnpm-lock.yaml`. No hay workspace compartido, no se
  importan archivos entre ellos. Lo único que comparten es el contrato HTTP.
- Dentro del frontend: `secciones/` puede importar de `components/`, `hooks/`,
  `lib/` y `context/`. **Nunca al revés.** Un componente compartido que sepa de
  un escenario concreto es un error de diseño.
- Ningún componente llama a `fetch` directamente: todo pasa por `src/lib/api.ts`.
- Dentro del backend: un módulo (`auth/`, `runs/`) no importa archivos internos
  de otro; solo su módulo público (Nest resuelve el resto por inyección).

### Gestor de paquetes

**pnpm en ambos proyectos**, con la versión fijada en `packageManager`. No
mezclar con npm ni yarn — un `package-lock.json` en este repositorio es un error.

Dos ajustes de `backend/pnpm-workspace.yaml` que **no se deben quitar**:

- `allowBuilds` para `prisma` y `@prisma/engines`: sin esto pnpm ignora sus
  scripts de instalación y el cliente no se genera.
- `publicHoistPattern: ['@prisma/*']`: el Prisma Client se genera fuera de
  `node_modules` (en `generated/prisma`), y con el `node_modules` aislado de
  pnpm no logra resolver `@prisma/client-runtime-utils`. Sin el hoisting, el
  API compila pero **falla al arrancar**.

---

## 4. El contrato de un escenario

Esta es la parte más importante del documento: es lo que permite construir 35
escenarios sin que se conviertan en 35 implementaciones distintas.

Un escenario son **dos cosas**: una entrada en el catálogo y un componente React.

### 4.1 Entrada en el catálogo (`frontend/src/data/catalogo.ts`)

```ts
{
  seccionId: 'smishing',
  escenarioId: 'cambio-numero',
  titulo: 'Cambio de número',
  descripcion: 'Un contacto conocido escribe desde otro número…',
  version: 1,
  naturaleza: 'fraude',      // 'fraude' | 'legitimo'
  dificultad: 1,             // 1..5
  espeja: null,              // id del escenario espejo, o null
  Component: lazy(() => import('../secciones/smishing/CambioNumero')),
}
```

El catálogo deriva `id = "<seccionId>/<escenarioId>"`. Ese id:

- es la clave que se guarda en la base de datos;
- **no puede cambiar** una vez que existan corridas registradas;
- solo admite minúsculas, números y guiones (el API lo valida con
  `/^[a-z0-9-]+\/[a-z0-9-]+$/`).

Reglas de contenido que vienen del diseño pedagógico:

- **`titulo` describe la situación, jamás el veredicto.** «Un mensaje del
  colegio», nunca «Correo falso del colegio». El menú no puede delatar cuáles
  casos son fraude y cuáles son legítimos.
- `naturaleza` es metadato de análisis. **No se muestra en pantalla** antes del
  debrief.
- `version` sube en +1 cada vez que se edita el guion de un escenario ya
  publicado, para no mezclar corridas de versiones distintas en el análisis.

### 4.2 El componente del escenario

Vive en `frontend/src/secciones/<seccionId>/<NombreEscenario>.tsx`, con su
`.module.css` al lado si necesita estilos propios.

Reglas:

- **Asume que hay sesión.** `RequireAuth` ya lo garantiza; no repitas la
  comprobación ni redirijas al login por tu cuenta.
- Muestra al participante con `displayName` / `roleLabel` / `initials` de
  `useAuth()`. No inventes tu propio formato.
- Toda señal del fraude vive **dentro de la interfaz simulada**, no en el texto
  de instrucciones (regla del diseño pedagógico: el gesto de revisar es parte de
  lo que se aprende).
- El escenario nunca hace peticiones de red propias. Su única salida de datos es
  el registro de la corrida.

### 4.3 Registro de la corrida

Hay dos caminos según la mecánica del escenario.

**A) Escenario de grafo (el caso normal).** Se define un objeto `STORY` con
nodos y se usa `useStoryEngine`, que registra la corrida automáticamente. El
escenario declara su propio tipo de nodo para conservar el tipado:

```ts
interface ChatNode extends StoryNode {
  msgs?: Msg[]
}

const STORY: Story<ChatNode> = { … }

const engine = useStoryEngine(STORY, 'n1', 'smishing/cambio-numero')
```

Los nodos finales declaran su resultado con `kind`:

```ts
e_pago:     { kind: 'bad',     verdict: '…', outcome: 'prosa…' }  // → INCORRECTO
e_verifica: { kind: 'good',    verdict: '…', outcome: 'prosa…' }  // → CORRECTO
e_dudo:     { kind: 'partial', verdict: '…', score: 50 }          // → PARCIAL
```

**Cuidado con `outcome`:** es la prosa que narra el final, no el resultado. El
resultado que va al backend se deriva de `kind`, y solo se sobrescribe con el
campo `resultado`.

**B) Mecánica propia** (mapas de zonas, cuestionarios, temporizadores). Se usa
`useScenarioRun` directamente:

```ts
const run = useScenarioRun('fisico/foto')

run.recordDecision({ zona: 'monitor', accion: 'tapar' })
void run.finish({ endingId: 'todo-cubierto', outcome: 'CORRECTO' })
run.restart()
```

**Ningún escenario guarda resultados por su cuenta.** Un escenario que llame a
`createRun` directamente rompe el estudio en silencio: se salta la traza, la
versión y la guarda contra envíos duplicados.

### 4.4 Vocabulario de resultados

Tres valores, y solo tres. Corresponden a los tres finales del diseño
pedagógico:

| `outcome` | Escenario de fraude | Escenario legítimo | Puntaje por defecto |
|---|---|---|---|
| `CORRECTO` | Lo evitó verificando | Verificó y actuó | 100 |
| `PARCIAL` | Dudó pero cayó | Dudó y actuó tarde | 50 |
| `INCORRECTO` | Cayó | Desconfianza excesiva: no actuó | 0 |

La última fila es la que hace que el instrumento mida criterio y no
desconfianza: en un caso legítimo, **tratarlo como fraude y no actuar cuenta
como error**.

### 4.5 Checklist para agregar un escenario

1. Crear `frontend/src/secciones/<seccion>/<Nombre>.tsx`.
2. Agregar la entrada al array `ESCENARIOS` de `catalogo.ts` con su `lazy(...)`.
3. Registrar la corrida por la vía A o la B de §4.3.
4. Verificar que los tres finales existan y que cada uno mapee a un `outcome`.
5. Cerrar con debrief: señales reveladas, regla de oro y qué hacer si ya caíste.
6. `pnpm lint && pnpm build` en `frontend/` (el build incluye `tsc`).

**No hay que tocar `App.tsx`.** Las rutas se generan desde el catálogo.

---

## 5. Contrato del API

Prefijo global `/api`. Todas las respuestas son JSON salvo la exportación CSV.

| Método | Ruta | Auth | Qué hace |
|---|---|---|---|
| `GET` | `/api/health` | — | Health check (Docker y CI). |
| `POST` | `/api/auth/register` | — | `{ nombre, email, telefono, password }` → `{ accessToken, participant }`. Máx. 5/min por IP. |
| `POST` | `/api/auth/login` | — | `{ email, password }` → `{ accessToken, participant }`. Máx. 5 intentos/min por IP. |
| `GET` | `/api/auth/me` | JWT | Devuelve el participante del token. |
| `POST` | `/api/runs` | JWT | Registra una corrida. |
| `GET` | `/api/runs/me` | JWT | Corridas del participante autenticado. |
| `GET` | `/api/runs/export.csv` | JWT + rol `RESEARCHER` | Exporta todas las corridas para el análisis. |

Cuerpo de `POST /api/runs`:

```json
{
  "scenarioId": "smishing/cambio-numero",
  "version": 1,
  "outcome": "INCORRECTO",
  "score": 0,
  "endingId": "e_pago",
  "durationMs": 84000,
  "startedAt": "2026-08-02T15:04:05.000Z",
  "decisions": [{ "desde": "n1", "hacia": "n2", "eleccion": "…", "at": "…" }]
}
```

Reglas del API que no se relajan:

- **El `participantId` sale siempre del token, nunca del cuerpo.** Un
  participante no puede escribir resultados a nombre de otro.
- `ValidationPipe` global con `whitelist` y `forbidNonWhitelisted`: cualquier
  campo no declarado en el DTO hace fallar la petición. Es lo que garantiza que
  a la tabla del estudio solo entren registros con la forma esperada.
- Un endpoint nuevo que reciba datos **necesita su DTO** con `class-validator`.
  No se aceptan `any` ni cuerpos sin validar.
- Todo endpoint que lea datos de terceros va detrás de `ResearcherGuard`.

---

## 6. Modelo de datos

Definido en `backend/prisma/schema.prisma`. Dos tablas:

- **`Participant`** — `seq` (autoincremental, del que se deriva el seudónimo),
  `nombre`, `email` (único, es el usuario de login), `telefono`, `passwordHash`,
  `role`, `cohort`, `anonymizedAt`. Los tres campos personales son *nullable*
  porque `pnpm anonimizar` los pone en null.
- **`ScenarioRun`** — una fila por escenario terminado: `scenarioId`, `version`,
  `outcome`, `score`, `endingId`, `durationMs`, `startedAt`, `finishedAt` y
  `decisions` (JSONB).

`decisions` es JSONB a propósito: cada escenario produce una traza con forma
distinta (secuencia de nodos, zonas tocadas, tiempos), y JSONB permite guardarlas
sin una tabla por tipo de escenario.

Cambios de esquema: siempre por migración (`pnpm prisma:migrate`), nunca
editando la base a mano. Las migraciones se versionan en el repositorio y se
aplican solas al arrancar el contenedor del API.

---

## 7. Autenticación y privacidad

El participante se registra con datos familiares porque un código asignado
confunde a un público no técnico. Eso obliga a una separación estricta entre
**los datos que dan acceso** y **los datos que se analizan**.

```
REGISTRO                    BASE DE DATOS                 EXPORTACIÓN
nombre, correo,   ───▶   Participant                ───▶  seudonimo,cohort,
teléfono                   nombre, email, telefono        scenarioId,outcome…
                           seq  ──────────────────▶       P001
                         ScenarioRun                      (sin PII)
```

Reglas que **no se negocian**:

1. **La exportación nunca incluye datos personales.** `RunsService.exportCsv`
   hace un `select` explícito de `seq` y `cohort`; agregar un campo personal al
   modelo no puede filtrarlo. Hay una prueba que lo verifica.
2. **El seudónimo se deriva de `seq`, no se guarda.** El participante nunca lo
   ve; es solo la llave con la que el investigador cruza estos resultados con
   las respuestas de Forms.
3. **Al cerrar la recolección se ejecuta `pnpm anonimizar -- --confirmar`.**
   Borra nombre, correo y teléfono, invalida el acceso y conserva las corridas.
   Ahí la pseudonimización pasa a ser anonimización real (NIST SP 800-188) y es
   irreversible.
4. **Contraseñas con bcrypt** (factor 12). Nunca en texto plano ni en logs.
5. **Login y registro con límite de 5/min por IP.** El login responde el mismo
   error para correo inexistente y contraseña incorrecta, y compara siempre
   contra un hash señuelo, para no revelar quién está registrado.
6. **JWT de expiración corta** (2 h) y sin datos personales en el payload: solo
   lleva el id y el rol.
7. **HTTPS obligatorio en producción.** El servidor propio debe terminar TLS
   delante de Nginx (Let's Encrypt). Un registro sobre HTTP no es aceptable.

El consentimiento informado debe decir explícitamente que se recogen nombre,
correo y teléfono para dar acceso, que no se usan en el análisis, y que se
borran al terminar el estudio.

Los pre-test y post-test se aplican **fuera** de la plataforma (Google Forms).
La plataforma no envía nada a Forms ni consume su API.

---

## 8. Despliegue

Servidor propio, con Docker Compose. Tres servicios: `db`, `api`, `web`.

```bash
cp .env.example .env          # rellenar POSTGRES_PASSWORD y JWT_SECRET
docker compose up -d --build
docker compose exec api node prisma/seed.mts --email tu.correo@espe.edu.ec
```

El `seed` solo crea la cuenta de investigador e imprime su contraseña una vez.
Los participantes se registran solos desde la plataforma.

Configuración de seguridad de los contenedores (OWASP Docker Security Cheat
Sheet), ya aplicada en `docker-compose.yml` y en los `Dockerfile`:

- ningún contenedor privilegiado; `no-new-privileges` en los tres;
- `cap_drop: ALL` en `api` y `web`;
- el API corre como usuario `node`, el frontend sobre la imagen no privilegiada
  de Nginx (puerto 8080);
- límites de memoria por servicio;
- `db` y `api` sin puertos publicados al host.

Pendiente al desplegar de verdad: **TLS delante de `web`** (reverse proxy con
Let's Encrypt) y una rutina de respaldo del volumen `pgdata`.

### CI

`.github/workflows/ci.yml` corre en cada push y PR a `main`: build y lint del
frontend, build y pruebas del backend, y construcción de las imágenes Docker.
Detectar un fallo de empaquetado en CI evita descubrirlo en el servidor durante
una sesión de pruebas con usuarios.

---

## 9. Comandos

```bash
# Frontend
cd frontend && pnpm install && pnpm dev      # http://localhost:5173
pnpm build && pnpm lint

# Backend
cd backend && pnpm install
pnpm prisma:migrate                          # crea/aplica migraciones en dev
pnpm start:dev                               # http://localhost:3000/api
pnpm test
pnpm seed -- --email tu.correo@espe.edu.ec   # cuenta de investigador
pnpm anonimizar                              # al cerrar la recolección

# Todo junto
docker compose up -d --build
```

Los scripts de `prisma/` corren con el soporte nativo de TypeScript de Node 24,
no con ts-node: así funcionan dentro del contenedor de producción, donde las
dependencias de desarrollo no están. La extensión `.mts` los marca como ESM (el
resto del backend compila a CommonJS).

En desarrollo, el frontend apunta al API con `VITE_API_URL`
(por defecto `/api`; para `vite dev` conviene `http://localhost:3000/api`), y el
backend debe declarar ese origen en `CORS_ORIGINS`.

---

## 10. Reglas para agentes de IA

Antes de escribir código en este repositorio:

**Hacer**

- Leer este documento y el diseño de escenarios antes de tocar `secciones/`.
- Agregar escenarios por el catálogo (§4). Nunca agregando rutas a mano.
- Registrar resultados solo por `useStoryEngine` o `useScenarioRun`.
- Escribir DTO con `class-validator` para todo endpoint que reciba datos.
- Tipar de verdad: el frontend está en TypeScript `strict`. Nada de `any`.
- Correr `pnpm lint && pnpm build` en el proyecto tocado, y `pnpm test` si fue
  el backend, antes de dar el trabajo por terminado.
- Escribir el código y los comentarios en español, como el resto del repositorio.
- **Comentar poco y concreto.** Un comentario explica *por qué*, nunca *qué*. Si
  el código ya lo dice, sobra. Si describe una trampa (un orden que importa, una
  decisión de seguridad, un comportamiento raro de una librería), se queda —
  corto.
- Usar los tokens de `DESIGN.md` mediante clases de Tailwind. Solo modo claro.

**No hacer**

- No dejar que un dato personal llegue a la exportación de resultados. Es la
  regla que sostiene el diseño ético del estudio (§7).
- No pedir datos personales que no sean nombre, correo y teléfono. Nada de
  cédula, dirección ni fecha de nacimiento.
- No llamar a `fetch` fuera de `src/lib/api.ts`.
- No leer el `participantId` del cuerpo de una petición.
- No cambiar el `id` de un escenario ya publicado; para un cambio de guion, subir
  `version`.
- No agregar dependencias nuevas si la biblioteca estándar, una dependencia ya
  instalada o unas pocas líneas resuelven el caso.
- No mezclar gestores de paquetes: pnpm en ambos proyectos.
- No añadir estado global ni capas de abstracción «por si acaso». La aplicación
  no las necesita hoy.

---

## 11. Decisiones cerradas

| Tema | Decisión | Por qué |
|---|---|---|
| Framework frontend | React + Vite + TypeScript `strict` | Los tipos atrapan errores de contrato entre el frontend y el API antes de ejecutar; en un instrumento de investigación un dato mal formado es un dato perdido. |
| Acceso | Registro con nombre, correo y teléfono | Un código asignado confunde al público no técnico. La separación de §7 mantiene el anonimato del análisis. |
| Estado global | Context API | Solo hay un estado compartido (la sesión). Redux sería sobreingeniería. |
| Contenido de escenarios | En el repositorio, no en la base | No es dato del estudio ni varía por usuario. |
| Pre/post-test | Google Forms, fuera de la plataforma | Ya resuelto y validado; construirlo dentro no aportaría al objetivo. |
| Analítica dentro de la app | Fuera de alcance | El análisis se hace sobre el CSV exportado. |
| Multi-idioma | Fuera de alcance | El estudio es en Ecuador, en español. |

---

## 12. Estado actual

Implementado: las tres capas en TypeScript, registro y login por correo,
seudonimización, registro y exportación de corridas sin datos personales,
comando de anonimización, catálogo con rutas generadas, sistema de diseño en
Tailwind, contenerización y CI.

Pendiente: los 35 escenarios del diseño pedagógico (hay 5 migrados al contrato
nuevo y todos registran resultados), la terminación TLS en el servidor propio y
el respaldo del volumen de la base.

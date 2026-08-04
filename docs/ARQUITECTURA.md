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

Una aplicación web donde un participante **se registra con su nombre, apellido,
correo y cédula**, juega **escenarios simulados de fraude** que registran cada
decisión, y el investigador exporta esos resultados —**identificados solo por un
seudónimo**— para compararlos con un pre-test y un post-test aplicados aparte en
Google Forms.

De ahí salen las tres restricciones que gobiernan todo lo demás:

1. **Es un instrumento de investigación.** Un resultado perdido o mal formado es
   un dato perdido del estudio. La validación y el registro de corridas no son
   negociables.
2. **Los datos personales no llegan al análisis.** Sirven para dar acceso y
   nada más: la exportación identifica cada fila con un seudónimo (`P001`), la
   cédula ni siquiera se almacena (§7.1), y al cerrar la recolección un comando
   borra el resto.
3. **La usan personas no técnicas.** La interfaz se mantiene simple y en
   lenguaje claro; los escenarios simulan, nunca conectan con sistemas reales.

---

## 2. Arquitectura general: dos microservicios tras un gateway

La lógica de aplicación está partida en **dos servicios cortados por
sensibilidad del dato**, no por capas ni por tamaño. Todo se despliega en un
servidor propio mediante contenedores.

```
                          Navegador
                              │  HTTPS
                    ┌─────────▼──────────┐
                    │  web · Nginx :8080 │   SPA + gateway
                    └─────────┬──────────┘
                    ┌─────────┴─────────┐
              /api/auth/*          /api/runs/*
                    │                   │
             ┌──────▼──────┐    ┌───────▼────────┐
             │  identidad  │    │  entrenamiento │
             │    :3001    │    │     :3002      │
             │ PII · JWT   │    │ corridas · CSV │
             └──────┬──────┘    └───────┬────────┘
                    │                   │
             ┌──────▼───────────────────▼────────┐
             │  db · PostgreSQL (sin puerto host)│
             │   schema identidad     ← rol propio
             │   schema entrenamiento ← rol propio
             └───────────────────────────────────┘
```

Decisiones estructurales que **no** se cambian sin actualizar este documento:

| Decisión | Motivo |
|---|---|
| Frontend y servicios comparten origen; Nginx enruta por prefijo | Elimina CORS en producción y evita exponer los servicios directamente. |
| `db`, `identidad` y `entrenamiento` no publican puertos al host | Solo `web` es alcanzable desde afuera. Reduce la superficie expuesta del servidor propio. |
| Los dos servicios **no se llaman entre sí** | El JWT lleva todo lo que ambos necesitan. Si `identidad` cae, las corridas en curso se siguen registrando. |
| Un schema y un **rol de Postgres por servicio**, sin permisos cruzados | Es lo que convierte la regla de privacidad en una imposibilidad técnica (§2.1). |
| El catálogo de escenarios vive en el frontend, no en la base | El contenido no es dato sensible ni cambia por usuario; meterlo en la base agregaría una capa sin beneficio. |

### 2.1 El corte es por sensibilidad del dato

- **`identidad`** es el único que conoce nombre, apellido, correo y contraseña.
- **`entrenamiento`** conoce `participantId` (un uuid opaco), `participantSeq`
  (el seudónimo del análisis) y `participantCohort` (el grupo de la muestra).
  Los tres llegan **dentro del JWT**, no de una consulta.

Consecuencia: `GET /api/runs/export.csv` **no puede** filtrar un dato personal.
No hay tabla que consultar, no hay llave foránea que seguir, y el rol de
Postgres del servicio recibe `permission denied for schema identidad` si lo
intenta con SQL crudo. Antes esto lo sostenía un `select` bien escrito más una
prueba unitaria; ahora lo sostiene la arquitectura, y hay un paso de CI que lo
verifica contra la base real.

### 2.2 Lo que este corte cuesta

Se declara para que no aparezca como sorpresa:

1. **No hay `ON DELETE CASCADE`** de `Participant` a `ScenarioRun`. Para el
   estudio es lo correcto —borrar la identidad no debe borrar el dato que la
   persona aportó— pero deja de haber integridad referencial entre servicios.
2. **`pnpm anonimizar` solo toca `identidad`.** Ya no cuenta corridas ni podría
   borrarlas: no las alcanza. Que es justamente lo que se quiere.
3. **Dos servicios que operar**: dos health checks, dos imágenes, dos juegos de
   migraciones.

---

## 3. Estructura del repositorio

```
safe-web/
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
├── backend/                  # Monorepo NestJS con los dos servicios (pnpm)
│   ├── apps/
│   │   ├── identidad/        # ← registro, login, JWT, datos personales
│   │   │   ├── src/{auth,prisma}/
│   │   │   └── tsconfig.app.json
│   │   └── entrenamiento/    # ← corridas del estudio + exportación CSV
│   │       ├── src/{runs,prisma}/
│   │       └── tsconfig.app.json
│   ├── libs/
│   │   └── comun/            # ← JwtAuthGuard, @CurrentParticipant, ValidationPipe
│   ├── prisma/
│   │   ├── identidad/{schema.prisma,migrations/}
│   │   ├── entrenamiento/{schema.prisma,migrations/}
│   │   ├── seed.mts          # crea la cuenta de investigador
│   │   └── anonimizar.mts    # ← cierra la recolección de datos
│   ├── prisma.identidad.config.ts
│   ├── prisma.entrenamiento.config.ts
│   ├── nest-cli.json         # modo monorepo
│   └── Dockerfile            # una imagen, ARG APP decide cuál arranca
│
├── db-init/                  # ← un rol y un schema por servicio
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
- Dentro del backend: `apps/*` importa de `libs/comun` con el alias `@comun`.
  **`libs/comun` nunca importa de `apps/*`, y un servicio nunca importa archivos
  del otro.** Si algo tiene que viajar entre servicios, viaja en el JWT.
- `libs/comun` guarda **solo** lo que ambos necesitan de verdad: la verificación
  del token, el decorador que extrae al participante, la configuración del
  `ValidationPipe` y los helpers de transformación. No es un cajón de sastre —
  un archivo que solo usa un servicio vive en ese servicio.

El alias `@comun` se declara en `tsconfig.json` **sin extensión**
(`libs/comun/src/index`). Con `.ts` al final, tsc emite
`require(".../index.ts")` literal y el servicio no arranca.

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

- **Las seis secciones son fijas:** phishing, smishing, vishing, suplantación
  de identidad, estafa electrónica y físico. Un escenario nuevo entra en una de
  ellas; no se crean secciones nuevas sin actualizar este documento.
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

Prefijo global `/api` en ambos servicios. Todas las respuestas son JSON salvo
la exportación CSV. Nginx enruta por prefijo: `/api/auth/*` a `identidad`,
`/api/runs/*` a `entrenamiento`.

| Método | Ruta | Servicio | Auth | Qué hace |
|---|---|---|---|---|
| `GET` | `/api/health` | ambos | — | Health check (Docker y CI). Nginx expone el de `identidad`. |
| `POST` | `/api/auth/register` | identidad | — | `{ nombre, apellido, email, cedula, password }` → `{ accessToken, participant }`. Máx. 5/min por IP. |
| `POST` | `/api/auth/login` | identidad | — | `{ email, password }` → `{ accessToken, participant }`. Máx. 5 intentos/min por IP. |
| `GET` | `/api/auth/me` | identidad | JWT | Devuelve el participante del token. |
| `POST` | `/api/runs` | entrenamiento | JWT | Registra una corrida. |
| `GET` | `/api/runs/me` | entrenamiento | JWT | Corridas del participante autenticado. |
| `GET` | `/api/runs/export.csv` | entrenamiento | JWT + rol `RESEARCHER` | Exporta todas las corridas para el análisis. |

### 5.1 Contrato del token

```json
{ "sub": "<uuid>", "seq": 42, "cohort": "comerciantes", "role": "PARTICIPANT" }
```

`seq` y `cohort` viajan en el token porque son los dos únicos campos del
participante que el análisis necesita, y ninguno lo identifica. Es lo que
permite a `entrenamiento` etiquetar cada corrida y exportar el CSV sin consultar
jamás a `identidad`.

Las cabeceras de proxy de Nginx (`X-Real-IP`, `X-Forwarded-For`) van en
`frontend/proxy-comun.inc` y se incluyen en **cada** `location`: nginx no hereda
`proxy_set_header`, y sin ellas el límite de 5 intentos de login por minuto
contaría todas las peticiones como si vinieran del contenedor de nginx.

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

Un schema de Prisma por servicio, y **una tabla en cada uno**:

- `backend/prisma/identidad/schema.prisma` → **`Participant`**: `seq`
  (autoincremental, del que se deriva el seudónimo), `nombre`, `apellido`,
  `email` (único, es el usuario de login), `cedulaHash` (único, §7.1),
  `passwordHash`, `role`, `cohort`, `anonymizedAt`. Los campos personales son
  *nullable* porque `pnpm anonimizar` los pone en null.
- `backend/prisma/entrenamiento/schema.prisma` → **`ScenarioRun`**: una fila por
  escenario terminado, con `participantId`, `participantSeq`,
  `participantCohort`, `scenarioId`, `version`, `outcome`, `score`, `endingId`,
  `durationMs`, `startedAt`, `finishedAt` y `decisions` (JSONB).

**No hay llave foránea entre ellas y no debe haberla.** `participantId` es un
uuid opaco: el servicio que lo guarda no tiene la tabla que lo resolvería.

`decisions` es JSONB a propósito: cada escenario produce una traza con forma
distinta (secuencia de nodos, zonas tocadas, tiempos), y JSONB permite guardarlas
sin una tabla por tipo de escenario.

Cambios de esquema: siempre por migración (`pnpm prisma:migrate`), nunca
editando la base a mano. Las migraciones se versionan en el repositorio y cada
contenedor aplica **solo las suyas** al arrancar.

Los schemas de Postgres los crea `db-init/01-roles-y-schemas.sh` la primera vez
que se inicializa el volumen; las migraciones asumen que ya existen. Cambiar los
roles después obliga a recrear el volumen (`docker compose down -v`).

**El schema se pasa al driver adapter, no en la URL.** El CLI de Prisma honra
`?schema=`, pero `PrismaPg` no: se queda en `public` y toda consulta falla con
`permission denied for schema public`. Por eso `PrismaService` lo declara como
segundo argumento.

---

## 7. Autenticación y privacidad

El participante se registra con datos familiares porque un código asignado
confunde a un público no técnico. Eso obliga a una separación estricta entre
**los datos que dan acceso** y **los datos que se analizan**.

```
REGISTRO                  identidad                    entrenamiento
nombre, apellido,  ───▶   Participant                  ScenarioRun
correo, cédula            nombre, apellido, email      participantSeq  ──▶ CSV
                          cedulaHash (HMAC)            participantCohort   P001
                          seq, cohort ──── JWT ──────▶ scenarioId, outcome…
                                                       (sin PII, y sin acceso
                                                        posible a ella)
```

### 7.1 La cédula

Se pide **para garantizar una cuenta por persona**, y por nada más. El correo ya
era único, pero nada impide que alguien se registre dos veces con dos correos, y
dos cuentas de la misma persona parten sus corridas en el análisis.

Cómo se trata:

1. **Se valida con el algoritmo módulo 10** del Registro Civil. Eso detecta
   cédulas *inventadas*; **no prueba identidad** —una cédula ajena pero válida
   pasa— y no pretende hacerlo. Es todo lo que se puede comprobar sin consultar
   al Registro Civil, y alcanza para el objetivo declarado.
2. **Nunca se guarda.** De ella solo queda `HMAC-SHA256(cédula,
   CEDULA_PEPPER)`. El valor en claro vive lo que dura la petición.
3. **HMAC y no un hash simple**, porque el espacio de cédulas son 10 dígitos y
   un SHA-256 sin secreto se invierte por fuerza bruta en segundos. El pepper es
   lo que lo hace irreversible.
4. **HMAC y no bcrypt**, porque para servir de índice único tiene que ser
   determinista: no es una contraseña que se verifica, es una llave que se
   compara.
5. **Cédula repetida y correo repetido dan el mismo error y el mismo tiempo de
   respuesta.** Distinguirlos permitiría averiguar si una persona concreta
   participó en el estudio.

Reglas que **no se negocian**:

1. **La exportación nunca incluye datos personales.** Ya no es una regla de
   disciplina: el servicio que exporta el CSV vive en otro schema, con otro rol
   de Postgres, y no tiene ninguna tabla con datos personales ni permiso para
   alcanzarlos. Hay una prueba unitaria, una e2e y un paso de CI que lo
   verifican contra la base real.
2. **El seudónimo se deriva de `seq`, no se guarda.** El participante nunca lo
   ve; es solo la llave con la que el investigador cruza estos resultados con
   las respuestas de Forms.
3. **Al cerrar la recolección se ejecuta `pnpm anonimizar -- --confirmar`.**
   Borra nombre, apellido, correo y la huella de la cédula, invalida el acceso y
   conserva las corridas. Ahí la pseudonimización pasa a ser anonimización real
   (NIST SP 800-188) y es irreversible.

   **Ese comando deja un paso manual, y hay que hacerlo:** borrar
   `CEDULA_PEPPER` del `.env` del servidor y de cualquier respaldo. Mientras ese
   secreto exista, una huella que se hubiera copiado antes seguiría siendo
   reproducible. Sin él, no.
4. **Contraseñas con bcrypt** (factor 12). Nunca en texto plano ni en logs.
5. **Login y registro con límite de 5/min por IP.** El login responde el mismo
   error para correo inexistente y contraseña incorrecta, y compara siempre
   contra un hash señuelo, para no revelar quién está registrado.
6. **JWT de expiración corta** (2 h) y sin datos personales en el payload: solo
   el id, el seudónimo, la cohorte y el rol.
7. **HTTPS obligatorio en producción.** El servidor propio debe terminar TLS
   delante de Nginx (Let's Encrypt). Un registro sobre HTTP no es aceptable.
8. **`CEDULA_PEPPER` solo lo recibe `identidad`.** `entrenamiento` no lo tiene y
   no lo necesita: es el único servicio que llega a ver una cédula.

El consentimiento informado debe decir explícitamente:

- que se recogen **nombre, apellido, correo y cédula** para dar acceso;
- que **la cédula no se almacena**: se guarda solo un código derivado del que no
  se puede reconstruir, y su único fin es evitar registros duplicados;
- que ninguno de esos datos se usa en el análisis;
- que todos se borran al terminar el estudio, de forma irreversible.

Los pre-test y post-test se aplican **fuera** de la plataforma (Google Forms).
La plataforma no envía nada a Forms ni consume su API.

---

## 8. Despliegue

Servidor propio, con Docker Compose. Cuatro servicios: `db`, `identidad`,
`entrenamiento` y `web`.

```bash
cp .env.example .env          # contraseñas de los dos roles y JWT_SECRET
docker compose up -d --build
docker compose exec identidad node prisma/seed.mts --email tu.correo@espe.edu.ec
```

El `seed` solo crea la cuenta de investigador e imprime su contraseña una vez.
Los participantes se registran solos desde la plataforma.

Los dos servicios de aplicación salen de **una sola imagen**: comparten
dependencias y `libs/comun`, así que construirlas por separado duplicaría el
`pnpm install` sin ganar nada. El `ARG APP` decide qué migraciones se aplican y
qué `main.js` arranca.

Configuración de seguridad de los contenedores (OWASP Docker Security Cheat
Sheet), ya aplicada en `docker-compose.yml` y en los `Dockerfile`:

- ningún contenedor privilegiado; `no-new-privileges` en los cuatro;
- `cap_drop: ALL` en `identidad`, `entrenamiento` y `web`;
- los servicios corren como usuario `node`, el frontend sobre la imagen no
  privilegiada de Nginx (puerto 8080);
- límites de memoria por servicio;
- solo `web` publica puertos al host;
- un rol de Postgres por servicio, sin permisos sobre el schema del otro.

Pendiente al desplegar de verdad: **TLS delante de `web`** (reverse proxy con
Let's Encrypt) y una rutina de respaldo del volumen `pgdata`.

### CI

`.github/workflows/ci.yml` corre en cada push y PR a `main`: build y lint del
frontend, build y pruebas del backend, y construcción de las imágenes Docker.
Detectar un fallo de empaquetado en CI evita descubrirlo en el servidor durante
una sesión de pruebas con usuarios.

Dos pasos que existen por la arquitectura de microservicios y no deben quitarse:

- **Los roles de Postgres se crean con `db-init/01-roles-y-schemas.sh`**, el
  mismo script que corre en producción, no una copia. Si los permisos se
  aflojan ahí, las pruebas dejan de reflejarlo.
- **Un paso comprueba que el rol `entrenamiento` recibe `permission denied` al
  leer `identidad."Participant"`.** Es la verificación directa de la regla de
  privacidad del estudio contra una base real.

---

## 9. Comandos

```bash
# Frontend
cd frontend && pnpm install && pnpm dev      # http://localhost:5173
pnpm build && pnpm lint

# Backend (los dos servicios comparten instalación)
cd backend && pnpm install
pnpm prisma:migrate                          # migra los DOS schemas
pnpm start:identidad                         # http://localhost:3001/api
pnpm start:entrenamiento                     # http://localhost:3002/api
pnpm build && pnpm lint:ci
pnpm test && pnpm test:e2e
pnpm seed -- --email tu.correo@espe.edu.ec   # cuenta de investigador
pnpm anonimizar                              # al cerrar la recolección

# Todo junto
docker compose up -d --build
```

Los scripts de `prisma/` corren con el soporte nativo de TypeScript de Node 24,
no con ts-node: así funcionan dentro del contenedor de producción, donde las
dependencias de desarrollo no están. La extensión `.mts` los marca como ESM (el
resto del backend compila a CommonJS).

En desarrollo, `vite dev` hace de gateway igual que Nginx en producción: su
`server.proxy` enruta `/api/auth` a `localhost:3001` y `/api/runs` a
`localhost:3002`. Por eso `VITE_API_URL` se queda en su valor por defecto
(`/api`) y **no hace falta CORS**: el frontend nunca sabe en qué puerto vive
cada servicio, que es justo lo que el gateway existe para evitar.

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
- Usar los tokens de `docs/DESIGN.md` mediante clases de Tailwind. Solo modo
  claro, salvo el interior de un escenario que simula una app oscura.

**No hacer**

- No dejar que un dato personal llegue a la exportación de resultados. Es la
  regla que sostiene el diseño ético del estudio (§7).
- No pedir datos personales que no sean **nombre, apellido, correo y cédula**.
  Nada de dirección, fecha de nacimiento ni teléfono.
- No guardar la cédula en claro, nunca, en ningún sitio: base, log, respuesta o
  archivo temporal. Solo existe su HMAC (§7.1).
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
| Acceso | Registro con nombre, apellido, correo y cédula | Un código asignado confunde al público no técnico. La cédula da una cuenta por persona sin almacenarse (§7.1), y la separación de §7 mantiene el anonimato del análisis. |
| Estado global | Context API | Solo hay un estado compartido (la sesión). Redux sería sobreingeniería. |
| Backend | Dos microservicios cortados por sensibilidad del dato | Hace que la regla de privacidad del estudio deje de depender de la disciplina al escribir consultas y pase a ser una imposibilidad técnica (§2.1). |
| Comunicación entre servicios | Ninguna: todo lo que necesitan viaja en el JWT | Evita acoplamiento en tiempo de ejecución y una cadena de fallos donde un servicio caído tumba al otro. |
| Base de datos | Un Postgres, un schema y un rol por servicio | Dos contenedores de base complicarían la operación de una sesión presencial sin añadir aislamiento que los roles no den ya. |
| Contenido de escenarios | En el repositorio, no en la base | No es dato del estudio ni varía por usuario. |
| Pre/post-test | Google Forms, fuera de la plataforma | Ya resuelto y validado; construirlo dentro no aportaría al objetivo. |
| Analítica dentro de la app | Fuera de alcance | El análisis se hace sobre el CSV exportado. |
| Multi-idioma | Fuera de alcance | El estudio es en Ecuador, en español. |

---

## 12. Estado actual

Implementado: el corte en dos microservicios con un rol de Postgres por
servicio, registro y login por correo, seudonimización, registro y exportación
de corridas sin datos personales, comando de anonimización, catálogo con rutas
generadas, sistema de diseño en Tailwind (marca verde `#006837`),
contenerización y CI. Registro con nombre, apellido, correo y cédula validada
por módulo 10 y guardada solo como HMAC. El MVP de solo phishing completo:
catálogo recortado a 3 escenarios activos (las otras cinco secciones quedan
"Pronto"), marco de escritorio para correo/web en vez de celular, gating 6/8
(`GET /api/runs/progreso/:modulo`, último intento manda) reflejado en Dashboard
y Seccion, y pantalla de bienvenida con el flag `onboardingVisto` persistido
(`PATCH /api/auth/me`) y accesible siempre desde el ícono ⓘ.

Pendiente, en el orden del spec
`docs/superpowers/specs/2026-08-03-safe-web-mvp-phishing-design.md`:

1. Los 5 escenarios de phishing que faltan para llegar a 8 (F4).
2. Certificado, verificación de correo y servicio `notificaciones`.
3. Terminación TLS en el servidor propio y respaldo del volumen de la base.

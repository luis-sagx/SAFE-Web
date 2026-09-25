# AGENTS.md

Guía para agentes de IA (y personas) que trabajan en SAFE-Web. Es el punto de
entrada: resume lo esencial y enlaza al detalle. Si algo aquí contradice a
[`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md), manda este archivo en reglas de
escritura y ARQUITECTURA en todo lo demás.

## Qué es

SAFE-Web (https://safe-web.site) es el prototipo del Trabajo de Integración
Curricular *"Diseño y desarrollo de ambientes interactivos de simulación para
educación de usuarios no técnicos frente a ciberamenazas seleccionadas en el
Ecuador"* (Ingeniería de Software, ESPE). Personas no técnicas juegan
escenarios simulados de fraude (phishing, smishing, vishing, suplantación,
estafa, riesgo físico, asistentes de IA); cada decisión se registra con un
seudónimo para el estudio, y al aprobar todo obtienen un certificado.

Público: ecuatorianos no técnicos. Todo lo que ven está en **español**.

## Mapa del repositorio

| Ruta | Qué hay |
|---|---|
| `frontend/` | SPA React 19 + Vite + TypeScript `strict` + Tailwind v4. Nginx de producción (`nginx.conf`) hace de gateway. |
| `frontend/src/data/catalogo.ts` | Catálogo de secciones y escenarios. Las rutas de escenario salen de aquí. |
| `frontend/src/secciones/<amenaza>/` | Un archivo por escenario. |
| `frontend/src/lib/api.ts` | Único punto que habla con el API. |
| `frontend/src/data/project.ts` | Título del proyecto y correos de contacto (política y términos los leen de aquí). |
| `backend/apps/identidad` | :3001 — registro, login, JWT, admin de cuentas, certificados. Tiene los datos personales. |
| `backend/apps/entrenamiento` | :3002 — corridas del estudio, solo con seudónimo. No puede leer datos personales. |
| `backend/libs/comun` | Solo lo que ambos servicios necesitan (guards JWT, decoradores, pipes). Alias `@comun`. |
| `backend/prisma/{identidad,entrenamiento}` | Un schema y un rol de Postgres por servicio. |
| `docs/` | `ARQUITECTURA.md` (normativo), `DESIGN.md` (tokens y estilo), specs y planes. |

Los servicios no se llaman entre sí: lo que ambos necesitan viaja en el JWT.
`frontend/` y `backend/` son proyectos independientes (cada uno con su
`pnpm-lock.yaml`).

## Comandos

```bash
# Frontend (desde frontend/)
pnpm dev                 # http://localhost:5173, proxy /api a los servicios
pnpm typecheck && pnpm lint && pnpm test && pnpm build

# Backend (desde backend/)
pnpm prisma:generate     # después de cada pull que traiga cambios de schema
pnpm start:identidad     # http://localhost:3001/api
pnpm start:entrenamiento # http://localhost:3002/api
pnpm lint:ci && pnpm test && pnpm build
pnpm test:e2e            # necesita Postgres

# Todo junto
docker compose up -d --build
```

Solo **pnpm**. Un `package-lock.json` o `yarn.lock` es un error.

Antes de dar un trabajo por terminado: los comandos de verificación del
proyecto tocado en verde (o cada fallo reportado con su salida).

## Idioma: código en inglés, interfaz en español

**En inglés** — todo identificador nuevo:

- variables, constantes, funciones, clases, tipos, interfaces, enums nuevos;
- componentes y hooks (`ConfirmDialog`, `PageMeta`, `useScenarioRun`);
- nombres de archivo nuevos (`TermsOfUse.tsx`, `resultsCsv.ts`);
- props de componentes nuevos.

**En español** — todo lo que ve o recibe el usuario final:

- textos de la UI, `alt`, `aria-label`, `title`, placeholders;
- mensajes de error que llegan a la pantalla, también los que lanza el backend
  (`throw new NotFoundException('No existe ese participante.')`);
- correos, PDF del certificado, títulos de pestaña, meta descripciones;
- las URLs públicas (`/politica-de-datos`, `/terminos`).

**No se renombra sin que se pida** lo que ya existe y es contrato, aunque esté
en español:

- archivos existentes (`Campo.tsx`, `PoliticaDatos.tsx`, `catalogo.ts`);
- rutas del API (`/admin/participantes`, `/runs/resultados`);
- columnas y campos de datos (`nombre`, `apellido`, `activo`, `seudonimo`);
- props existentes (`titulo`, `variante`, `etiqueta`);
- valores persistidos o de protocolo (`localStorage 'tema'`,
  `data-tema="oscuro"`, `CORRECTO`/`PARCIAL`/`INCORRECTO`, enum `TRAINER`).

Cambiar uno de esos rompe datos guardados, sesiones o el análisis del estudio.
Si al tocar código viejo un identificador interno (no contrato) está en
español, se puede traducir en el mismo cambio; no se hace una pasada masiva
aparte.

**Comentarios y pruebas**: en español, como el resto del repositorio
(`describe('ConfirmDialog', () => it('cancelar cierra sin ejecutar la acción'))`).
Un comentario explica *por qué*, nunca *qué*; corto.

**Commits**: Conventional Commits con tipo y ámbito en inglés y descripción en
español: `fix(admin): cerrar modal de confirmación al cancelar`.

## Reglas que no se negocian

Privacidad del estudio (detalle en ARQUITECTURA §7):

- Ningún dato personal sale en resultados ni en la exportación CSV: solo el
  seudónimo (`P001`).
- El seudónimo **nunca** se muestra junto al nombre o correo (ni la fecha de
  alta, ni un orden por alta): es el orden de registro y los enlazaría.
- La cédula no se guarda en claro en ningún sitio (base, log, respuesta): solo
  su HMAC. Nombre, apellido y correo se guardan cifrados (`pii.ts`).
- No se piden más datos que nombre, apellido, correo y cédula.
- No se lee `participantId` del cuerpo de una petición: sale del JWT.
- `entrenamiento` nunca importa ni consulta nada de `identidad`.

Código:

- Nada de `fetch` fuera de `frontend/src/lib/api.ts`.
- `secciones/` importa de `components/`, `hooks/`, `lib/`, `context/`; nunca al revés.
- Escenarios nuevos por el catálogo; nunca rutas a mano. No cambiar el `id` de
  un escenario publicado: para un cambio de guion se sube `version`.
- Todo endpoint que recibe datos valida con un DTO de `class-validator`.
- TypeScript `strict`, sin `any`.
- Sin dependencias nuevas si alcanza con la biblioteca estándar, algo ya
  instalado o unas pocas líneas. Sin abstracciones "por si acaso".
- Estilos con los tokens de `docs/DESIGN.md` (clases de Tailwind como
  `text-ink`, `bg-surface`), que ya cubren tema claro y oscuro. Íconos de
  `lucide-react`, nunca emojis en la UI.

## Trampas conocidas

- **Lint con "type could not be resolved" en el backend**: el cliente Prisma
  generado (`backend/generated/`, fuera de git) quedó viejo. `pnpm prisma:generate`.
- **Base de datos**: `docker-compose.yml` y `docker-compose.db.yml` usan el
  mismo volumen `pgdata`. Nunca los dos arriba a la vez (corrompe el WAL);
  revisa `docker ps` antes de migrar.
- **CSP** (`nginx.conf`): `script-src 'self'`, sin scripts inline. Por eso el
  tema se aplica desde `public/tema.js`; si cambia la lógica del tema, cambia
  también en `ThemeContext.tsx`.
- **Caché de nginx**: `.js .css .png .jpg .webp .mp3…` se sirven como
  `immutable` un año. Un archivo nuevo en `public/` con esas extensiones lleva
  versión en el nombre (`og-safeweb-v1.jpg`).
- **SEO**: las rutas públicas indexables están en `PUBLIC_TITLES`
  (`components/PageMeta.tsx`) y en `public/sitemap.xml`; se mantienen iguales.
  `robots.txt` nunca nombra rutas privadas.
- **Roles**: en la UI el rol `TRAINER` se llama "Tester" (cuentas de prueba).
- **Modales**: patrón `div role="dialog"` (`components/Modal.tsx`,
  `ConfirmDialog.tsx`); jsdom no implementa `<dialog>.showModal()`.
- **Pruebas del frontend**: Testing Library + `fireEvent`; no hay `user-event`
  ni `jest-dom` instalados.

# Portada pública y videos de SAFE-Web Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir `/` en una portada pública con introducción y ocho espacios de video de YouTube, y mover el acceso a `/login`.

**Architecture:** Un catálogo estático de videos enlaza el video general con las siete entradas de `SECTIONS`. La portada pública usa el contexto de sesión solo para mostrar enlaces útiles; un componente de video monta el iframe tras un clic. La primera entrega conserva los roles y guardas actuales, para poder publicarse antes de la migración de roles.

**Tech Stack:** React 19, React Router 8, Tailwind CSS 4, Vitest, Nginx/CSP.

**Spec:** `docs/superpowers/specs/2026-09-15-portada-videos-y-formadores-design.md`

## Global Constraints

- Exactamente un espacio de video general y uno por `phishing`, `smishing`, `vishing`, `suplantacion`, `estafa`, `fisico`, `asistentes-ia`.
- Los videos son públicos y se alojan en YouTube; no se inventan identificadores antes de recibir las URL reales.
- `/` es público; `/login` contiene el formulario actual; `/dashboard` mantiene el curso.
- El video no suma progreso ni desbloquea escenarios.
- El iframe se carga al reproducir y usa `youtube-nocookie.com`; el CSS sigue `docs/DESIGN.md`.
- Este plan conserva temporalmente `SUPERVISOR` y `PARTICIPANT`; el plan de roles cambia a `ADMIN`, `TRAINER`, `PARTICIPANT` después.

---

## Mapa de archivos

`frontend/src/data/videosCapacitacion.ts` define los ocho registros y valida identificadores. `frontend/src/components/VideoCapacitacion.tsx` presenta un video y su estado pendiente. `frontend/src/pages/Portada.tsx` presenta la explicación y enlaza a los paneles. `frontend/src/App.tsx` y las páginas de acceso ajustan rutas/redirecciones. `frontend/nginx.conf` limita el iframe permitido. Las pruebas de cada unidad viven junto al código.

### Task 1: Catálogo público de ocho videos

**Files:**
- Create: `frontend/src/data/videosCapacitacion.ts`
- Create: `frontend/src/data/videosCapacitacion.test.ts`
- Consumes: `SECTIONS` de `frontend/src/data/catalogo.ts`
- Produces: `TRAINING_VIDEOS: TrainingVideo[]`, `getYouTubeId(url: string): string | null`

- [ ] **Step 1: Escribir pruebas fallidas.** Probar que el arreglo tiene ocho elementos, que los siete `sectionId` siguen exactamente el orden de `SECTIONS`, y que la extracción acepta `youtu.be/<id>`, `youtube.com/watch?v=<id>` y `youtube.com/embed/<id>`, rechazando otros hosts o ids que no midan once caracteres. Fixture: `getYouTubeId('https://youtu.be/abcdefghijk') === 'abcdefghijk'`.
- [ ] **Step 2: Confirmar rojo.** Ejecutar `pnpm --dir frontend test -- src/data/videosCapacitacion.test.ts`; la prueba debe fallar porque el módulo aún no existe.
- [ ] **Step 3: Implementar el mínimo.** Definir `TrainingVideo = { id: 'general' | string; sectionId: string | null; title: string; description: string; youtubeUrl: string | null }`. Crear el registro general y mapear `SECTIONS` a los otros siete. Dejar `youtubeUrl: null` en los ocho registros hasta recibir enlaces reales. Validar URL mediante `new URL`, lista explícita de hosts de YouTube y regex `/^[A-Za-z0-9_-]{11}$/` para el identificador; no aceptar HTML suministrado como URL.

  ```ts
  export interface TrainingVideo {
    id: string
    sectionId: string | null
    title: string
    description: string
    youtubeUrl: string | null
  }

  export const TRAINING_VIDEOS: TrainingVideo[] = [
    { id: 'general', sectionId: null, title: 'Introducción a SAFE-Web', description: 'Cómo funciona la práctica.', youtubeUrl: null },
    ...SECTIONS.map(({ id, titulo }) => ({ id, sectionId: id, title: titulo, description: `Conoce el módulo ${titulo}.`, youtubeUrl: null })),
  ]
  ```
- [ ] **Step 4: Confirmar verde.** Repetir la prueba focalizada; debe pasar.
- [ ] **Step 5: Revisar y registrar.** `git diff --check`; commit sugerido: `feat: add public training video catalog`.

### Task 2: Reproductor diferido y portada

**Files:**
- Create: `frontend/src/components/VideoCapacitacion.tsx`
- Create: `frontend/src/components/VideoCapacitacion.test.tsx`
- Create: `frontend/src/pages/Portada.tsx`
- Create: `frontend/src/pages/Portada.test.tsx`
- Consumes: `TrainingVideo`, `getYouTubeId`, `TRAINING_VIDEOS`, `useAuth()`
- Produces: `<Portada />` para la ruta `/`

- [ ] **Step 1: Escribir pruebas fallidas.** El componente con `youtubeUrl: null` debe mostrar “Video próximamente” y cero iframes. Con `https://youtu.be/abcdefghijk`, debe mostrar “Reproducir” y cero iframes hasta pulsarlo; después, exactamente un iframe con `src=https://www.youtube-nocookie.com/embed/abcdefghijk`, `title` no vacío y enlace para abrir YouTube. La portada debe tener ocho espacios, encabezado único, introducción textual, enlace `/login` para visitante, `/dashboard` para participante y `/admin` para supervisor.
- [ ] **Step 2: Confirmar rojo.** Ejecutar `pnpm --dir frontend test -- src/components/VideoCapacitacion.test.tsx src/pages/Portada.test.tsx`; debe fallar por componentes ausentes.
- [ ] **Step 3: Implementar el reproductor.** Usar un botón de reproducción con foco visible; tras el clic montar `<iframe title={video.title} src={...} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />`. Cuando falta URL, presentar el estado pendiente como texto. Mantener el enlace externo a `https://www.youtube.com/watch?v=<id>` con `target="_blank"` y `rel="noopener noreferrer"`.

  ```tsx
  const id = video.youtubeUrl ? getYouTubeId(video.youtubeUrl) : null
  if (!id) return <p>Video próximamente</p>
  return playing
    ? <iframe title={video.title} src={`https://www.youtube-nocookie.com/embed/${id}`} allowFullScreen />
    : <button type="button" onClick={() => setPlaying(true)}>Reproducir {video.title}</button>
  ```
- [ ] **Step 4: Implementar la portada.** Usar `AppHeader`, la misma anchura `max-w-6xl` y tokens de `docs/DESIGN.md`. Copy inicial: “SAFE-Web es un entorno de práctica con situaciones simuladas para reconocer engaños y decidir cómo verificarlos. Puedes revisar los videos antes o después de los escenarios; verlos no cambia tu avance.” Mostrar un bloque de video general y una grilla de siete módulos en el orden del catálogo. El enlace principal se deriva del estado de sesión, sin llamar a API de progreso.
- [ ] **Step 5: Confirmar verde y registrar.** Repetir pruebas focalizadas, revisar a 320 px y con teclado, `git diff --check`; commit sugerido: `feat: add public training home`.

### Task 3: Rutas y política de iframe

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/pages/Login.tsx`
- Modify: `frontend/src/pages/Registro.tsx`
- Modify: `frontend/src/components/RequireAuth.tsx`
- Modify: `frontend/src/components/RequireSupervisor.tsx`
- Modify: `frontend/src/components/AppHeader.tsx`
- Modify: `frontend/nginx.conf`
- Test: pruebas existentes de rutas y guardas más `frontend/src/App.test.tsx`
- Consumes: `<Portada />`
- Produces: ruta pública `/`, ruta `/login`, rutas de curso intactas

- [ ] **Step 1: Escribir pruebas de rutas fallidas.** `MemoryRouter` debe mostrar portada sin sesión en `/`, login en `/login`, y redirigir una ruta desconocida a `/`. Un visitante que intenta `/dashboard` o `/admin` debe acabar en `/login`. Login y registro completados mantienen su destino actual por rol. La marca del header debe enlazar a `/`. Sin sesión, el header no debe mostrar menú de cuenta ni enlace a recorrido.
- [ ] **Step 2: Confirmar rojo.** Ejecutar `pnpm --dir frontend test -- src/App.test.tsx src/components/RequireAuth.test.tsx src/components/RequireSupervisor.test.tsx src/components/AppHeader.test.tsx`; las nuevas expectativas deben fallar.
- [ ] **Step 3: Cambiar rutas.** En `App.tsx`, montar `<Route path="/" element={<Portada />} />` y `<Route path="/login" element={<Login />} />`; cambiar el comodín a `/`. En los guardas, enviar ausencia de sesión a `/login`. Actualizar el logo y los enlaces de acceso que asumían que `/` era login. En `AppHeader`, montar `UserMenu` solo si `isAuthenticated`; `InfoLink` solo si hay participante autenticado. No cambiar el destino autenticado de `SUPERVISOR` o `PARTICIPANT` en esta entrega.

  ```tsx
  <Route path="/" element={<Portada />} />
  <Route path="/login" element={<Login />} />
  <Route path="*" element={<Navigate to="/" replace />} />
  ```
- [ ] **Step 4: Ajustar CSP.** Añadir `frame-src 'self' https://www.youtube-nocookie.com` a la directiva `Content-Security-Policy` de `frontend/nginx.conf`. Mantener `script-src 'self'`, `connect-src 'self'` y `frame-ancestors 'none'`. No habilitar `youtube.com` como origen de iframe, pues el componente usa el dominio indicado.
- [ ] **Step 5: Verificar entrega.** Ejecutar `pnpm --dir frontend test`, `pnpm --dir frontend typecheck`, `pnpm --dir frontend build`, `git diff --check`. Revisar que la cadena final de CSP contiene `frame-src` y que los ocho registros siguen sin URL inventada. Commit sugerido: `feat: route public home and login`.

## Publicación de los ocho videos

Al recibir las ocho URL públicas, sustituir únicamente los ocho valores `youtubeUrl` del catálogo. Para cada URL, abrir el video original, comprobar título/contenido, revisar los subtítulos en español, validar el identificador con `getYouTubeId` y verificar la reproducción en la portada desplegada. El video general y los siete de módulo pueden activarse por separado; un registro sin URL conserva el estado pendiente. Esta actualización de datos no requiere introducir proveedor alternativo ni endpoint de contenido.

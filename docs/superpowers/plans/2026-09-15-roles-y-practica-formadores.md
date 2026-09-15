# Roles ADMIN y TRAINER con práctica libre Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar los roles a `ADMIN`, `TRAINER` y `PARTICIPANT`, permitir que solo `ADMIN` cree formadores y ofrecer a `TRAINER` práctica repetible sin corridas oficiales.

**Architecture:** Identidad almacena y emite los tres roles, y el administrador provisiona cuentas formadoras. Entrenamiento y certificados autorizan cada endpoint según rol. En frontend, un índice de práctica y ramas pequeñas en los componentes compartidos separan la navegación y el guardado del formador de la ronda oficial del participante.

**Tech Stack:** PostgreSQL/Prisma 7, NestJS 11/Jest, React 19/React Router 8/Vitest.

**Spec:** `docs/superpowers/specs/2026-09-15-portada-videos-y-formadores-design.md`

## Global Constraints

- Los nombres internos son exactamente `ADMIN`, `TRAINER`, `PARTICIPANT`.
- Solo `ADMIN` crea cuentas `TRAINER`; el registro público sigue creando `PARTICIPANT` sin parámetro de rol.
- `TRAINER` abre cualquier escenario y lo repite de inmediato; su práctica no crea `ScenarioRun`, cola local, progreso oficial ni certificado.
- `PARTICIPANT` conserva la ronda completa, bloqueo, progreso y certificado actuales.
- Los videos de la portada son públicos; el rol no controla su reproducción.
- Despliegue después del plan `2026-09-15-portada-videos-publicos.md`; el login está en `/login`.

---

## Mapa de archivos

`backend/prisma/identidad/schema.prisma` y una migración cambian los roles persistidos. `backend/libs/comun/src/jwt-auth.guard.ts` define los guardas `AdminGuard` y `ParticipantGuard`. Los controladores de identidad y entrenamiento aplican los guardas. `backend/apps/identidad/src/admin/` crea y lista formadores. `frontend/src/context/AuthContext.tsx` expone el rol; `frontend/src/pages/Practica.tsx` lista módulos; los guards de ruta, `Seccion`, `RequireEscenarioDisponible`, `useScenarioRun` y `AccionesFinal` bifurcan solo el comportamiento necesario para práctica. El catálogo y los componentes concretos de escenarios siguen compartidos.

### Task 1: Migración de roles y autorización del servidor

**Files:**
- Modify: `backend/prisma/identidad/schema.prisma`
- Create: `backend/prisma/identidad/migrations/20260915000000_admin_trainer_roles/migration.sql`
- Modify: `backend/libs/comun/src/jwt-auth.guard.ts`, `backend/libs/comun/src/index.ts`
- Modify: `backend/apps/identidad/src/admin/admin.controller.ts`, `backend/apps/identidad/src/admin/admin-certificados.controller.ts`
- Modify: `backend/apps/entrenamiento/src/runs/runs.controller.ts`
- Modify: `backend/apps/identidad/src/certificados/certificados.controller.ts`
- Modify: `backend/prisma/seed.mts`
- Test: pruebas de guardas y controladores existentes más `backend/libs/comun/src/jwt-auth.guard.spec.ts`
- Produces: `AdminGuard`, `ParticipantGuard`

- [ ] **Step 1: Escribir pruebas fallidas de permisos.** Para `AdminGuard`, `ADMIN` permite y `TRAINER`/`PARTICIPANT` responden 403. Para `ParticipantGuard`, solo `PARTICIPANT` permite. Probar que `POST /runs`, progreso, reinicio y atestación rechazan `TRAINER` y `ADMIN`; resultados y gestión rechazan `TRAINER`; emisión/PDF de certificados rechaza `TRAINER`. Probar que un administrador existente conserva acceso tras la migración.
- [ ] **Step 2: Confirmar rojo.** Ejecutar `pnpm --dir backend test -- jwt-auth.guard.spec.ts runs.controller.spec.ts certificados.controller.spec.ts`; las nuevas expectativas deben fallar.
- [ ] **Step 3: Migrar enum.** Cambiar el enum Prisma a `PARTICIPANT`, `ADMIN`, `TRAINER`. En SQL: `ALTER TYPE "Role" RENAME VALUE 'SUPERVISOR' TO 'ADMIN';` seguido de `ALTER TYPE "Role" ADD VALUE 'TRAINER';`. No actualizar filas a mano: PostgreSQL remapea el valor renombrado. Cambiar el seed para crear `ADMIN` y para no rebajar una cuenta existente de otro rol al regenerar contraseña.

  ```sql
  ALTER TYPE "Role" RENAME VALUE 'SUPERVISOR' TO 'ADMIN';
  ALTER TYPE "Role" ADD VALUE 'TRAINER';
  ```
- [ ] **Step 4: Implementar guardas.** `AdminGuard` exige `request.participant?.role === 'ADMIN'`; `ParticipantGuard` exige `=== 'PARTICIPANT'`. `JwtAuthGuard` sigue verificando token y tipo. Sustituir `SupervisorGuard` en rutas administrativas y de resultados; añadir `ParticipantGuard` a todas las rutas oficiales citadas. Mantener el endpoint público de verificación de certificado.

  ```ts
  if (request.participant?.role !== 'ADMIN') {
    throw new ForbiddenException('Requiere rol ADMIN.')
  }
  return true
  ```
- [ ] **Step 5: Confirmar verde.** Ejecutar pruebas focalizadas, `pnpm --dir backend prisma:generate`, `pnpm --dir backend build` y `git diff --check`. Revisar que una sesión antigua con rol `SUPERVISOR` no permite `/admin`. Commit sugerido: `feat: migrate admin and trainer roles`.

### Task 2: Provisionar formadores solo desde ADMIN

**Files:**
- Create: `backend/apps/identidad/src/admin/dto/create-trainer.dto.ts`
- Modify: `backend/apps/identidad/src/admin/admin.controller.ts`
- Modify: `backend/apps/identidad/src/admin/admin.service.ts`
- Test: `backend/apps/identidad/src/admin/admin.service.spec.ts`, `backend/apps/identidad/src/admin/admin.controller.spec.ts`
- Produces: `POST /api/admin/trainers`, `GET /api/admin/trainers`, `PATCH /api/admin/trainers/:id/estado`

- [ ] **Step 1: Escribir pruebas fallidas.** `POST` con nombre, apellido y email válidos crea cuenta `TRAINER` sin cédula, cifra los tres campos, guarda `emailHash` y `passwordHash`, devuelve contraseña inicial solo en la respuesta. Un correo duplicado produce 409; un DTO con campo `role` no permite cambiar el rol creado. `GET` muestra solo formadores y datos públicos necesarios; `PATCH` solo cambia estado de una cuenta `TRAINER`, y un id de `ADMIN` o `PARTICIPANT` responde 404.
- [ ] **Step 2: Confirmar rojo.** `pnpm --dir backend test -- admin.service.spec.ts admin.controller.spec.ts` debe fallar con los endpoints/métodos nuevos ausentes.
- [ ] **Step 3: Implementar DTO y servicio.** Reutilizar las restricciones de nombre y correo del registro; normalizar email. Añadir `emailPepper` al constructor de `AdminService`. Usar `encrypt`, `hashEmail`, `generatePassword` y bcrypt de 12 rondas. Buscar duplicados por `emailHash` o email antiguo en claro; comprobar colisión única en el `create` y devolver 409. Seleccionar campos explícitos al listar y filtrar `role: 'TRAINER'` al cambiar estado.

  ```ts
  await this.prisma.participant.create({
    data: {
      nombre: encrypt(dto.nombre, this.piiKey),
      apellido: encrypt(dto.apellido, this.piiKey),
      email: encrypt(dto.email, this.piiKey),
      emailHash: hashEmail(dto.email, this.emailPepper),
      passwordHash: await hash(password, 12),
      role: 'TRAINER',
    },
  })
  ```
- [ ] **Step 4: Implementar controlador.** Exigir `JwtAuthGuard` y `AdminGuard` a `admin/trainers` y validar DTO con el `ValidationPipe` global actual. Responder 201 en creación, 200 en lista y estado.
- [ ] **Step 5: Confirmar verde.** Repetir pruebas focalizadas y `pnpm --dir backend build`; commit sugerido: `feat: let admins provision trainers`.

### Task 3: Navegación de tres roles e índice de práctica

**Files:**
- Modify: `frontend/src/lib/api.ts`, `frontend/src/context/AuthContext.tsx`
- Modify: `frontend/src/App.tsx`, `frontend/src/pages/Login.tsx`, `frontend/src/pages/Registro.tsx`, `frontend/src/components/RequireAuth.tsx`, `frontend/src/components/RequireSupervisor.tsx`, `frontend/src/components/AppHeader.tsx`, `frontend/src/components/MenuUsuario.tsx`
- Create: `frontend/src/components/RequireParticipant.tsx`
- Create: `frontend/src/components/RequireTrainer.tsx`, `frontend/src/pages/Practica.tsx`
- Modify: `frontend/src/pages/Admin.tsx`, `frontend/src/pages/Bienvenida.tsx`, `frontend/src/pages/Portada.tsx`
- Test: pruebas existentes de rutas/contexto/login/admin y nuevas de `Practica`/`RequireTrainer`
- Produces: `/practica` y matriz de rutas del spec

- [ ] **Step 1: Escribir pruebas fallidas de roles.** Login envía `ADMIN` a `/admin`, `TRAINER` a `/practica`, `PARTICIPANT` a `/dashboard`. Un formador no recibe onboarding y puede entrar al índice; un participante no puede entrar a `/practica`; el administrador no entra a escenarios. Un visitante que intenta zona privada llega a `/login`. El índice muestra siete módulos y todos los escenarios sin candados ni puntuación; la portada enlaza al destino correspondiente. El panel ADMIN permite crear y desactivar formadores.
- [ ] **Step 2: Confirmar rojo.** Ejecutar pruebas focalizadas con `pnpm --dir frontend test -- src/pages/Login.test.tsx src/components/RequireAuth.test.tsx src/pages/Practica.test.tsx`.
- [ ] **Step 3: Actualizar tipos y rutas.** `Participant.role` pasa a `'ADMIN' | 'TRAINER' | 'PARTICIPANT'`; exponer `isAdmin`, `isTrainer` y `roleLabel` correcto. Renombrar `RequireSupervisor` a `RequireAdmin` y actualizar todas sus importaciones y pruebas; crear `RequireTrainer` para `/practica` y `RequireParticipant` para `/bienvenida`, `/dashboard`, `/recorrido`. `RequireAuth` permite participantes y formadores en las rutas de escenario, aplica onboarding solo a participantes y envía `ADMIN` a `/admin`. `RequireParticipant` redirige `TRAINER` a `/practica` y `ADMIN` a `/admin`.

  ```tsx
  const homeByRole = { ADMIN: '/admin', TRAINER: '/practica', PARTICIPANT: '/dashboard' } as const
  navigate(homeByRole[profile.role])
  ```
- [ ] **Step 4: Crear índice y gestión UI.** `Practica` mapea `SECTIONS` y `getSectionScenarios` a enlaces `getScenarioPath`, sin `fetchProgress`. Añadir al panel administrativo formulario con nombre/apellido/email que llama a `POST /admin/trainers`, lista de formadores y botón de estado; mostrar contraseña inicial una vez, siguiendo el patrón ya presente de restablecer contraseña. Actualizar `Bienvenida` para describir siete módulos y el módulo de IA sin afirmar ocho escenarios para todos.
- [ ] **Step 5: Confirmar verde.** Ejecutar pruebas focalizadas, `pnpm --dir frontend typecheck`, `git diff --check`; commit sugerido: `feat: route admins trainers and participants`.

### Task 4: Escenarios repetibles sin registro oficial

**Files:**
- Modify: `frontend/src/hooks/useScenarioRun.ts`, `frontend/src/components/StoryEscenario.tsx`, `frontend/src/components/ui/PanelVeredicto.tsx`, `frontend/src/components/ui/AccionesFinal.tsx`
- Modify: `frontend/src/components/RequireEscenarioDisponible.tsx`, `frontend/src/pages/Seccion.tsx`, `frontend/src/App.tsx`, `frontend/src/components/RunNotifications.tsx`
- Test: pruebas de hook/guard/acciones/Seccion y una prueba de integración con un escenario real
- Consumes: `isTrainer`, `/practica`, `ParticipantGuard` del servidor
- Produces: práctica libre sin `createRun`, `queueRun` ni `fetchProgress`

- [ ] **Step 1: Escribir pruebas fallidas de práctica.** Un `TRAINER` abre por URL directa un escenario jugado o posterior y recibe el escenario, sin llamada a `fetchProgress`. Tras finalizar, el veredicto aparece, `createRun` y `queueRun` no se llaman y el botón “Volver a probar este escenario” reinicia el componente. `AccionesFinal` no pide progreso ni muestra umbral o “Repetir módulo”. `RunNotifications` no llama a `flushPendingRuns` para `TRAINER`. La misma prueba con `PARTICIPANT` confirma el gating y guardado actuales.
- [ ] **Step 2: Confirmar rojo.** Ejecutar `pnpm --dir frontend test -- src/hooks/useScenarioRun.test.ts src/components/RequireEscenarioDisponible.test.tsx src/components/ui/AccionesFinal.test.tsx` con los casos nuevos.
- [ ] **Step 3: Separar guardado.** En `useScenarioRun`, obtener `isTrainer` del contexto; para formador, `finish` deja el estado local `practice` y retorna sin construir cola ni ejecutar API. Mantener `recordDecision` y el resultado del motor; `restart` limpia refs y estado. Extender el tipo `RunStatus` y actualizar `PanelVeredicto` para mostrar “Práctica: este intento no se guarda” sin aviso de fallo de red.

  ```ts
  if (isTrainer) {
    setStatus('practice')
    return
  }
  ```
- [ ] **Step 4: Separar navegación.** El guard de ruta omite `RequireAvailableScenario` solo para `TRAINER`; para `PARTICIPANT` lo conserva. `Seccion`/`Practica` ofrecen todos los enlaces al formador. `AccionesFinal` debe volver a recibir y usar `onRestart` (la prop existe, pero hoy la función no la desestructura); su botón “Volver a probar este escenario” llama a ese callback. Si un escenario concreto no lo proporciona, remontarlo con clave nueva en el wrapper. No usar `restartModule` ni lógica de ronda en práctica. Activar `RunNotifications` solo para `PARTICIPANT`.
- [ ] **Step 5: Confirmar verde.** Ejecutar pruebas focalizadas, una prueba de integración con un escenario de phishing, `pnpm --dir frontend test`, `pnpm --dir frontend typecheck`; commit sugerido: `feat: add repeatable trainer practice`.

### Task 5: Verificación integral y despliegue coordinado

**Files:**
- Modify: `frontend/nginx.conf` solo si el flujo final exige ajuste adicional de ruta/API; no ampliar la CSP de YouTube fuera del spec.
- Inspect: `backend/prisma/identidad/migrations/`, `backend/prisma/seed.mts`, `frontend/src/`, `backend/apps/`

- [ ] **Step 1: Buscar roles antiguos.** Ejecutar `rg -n 'SUPERVISOR|SupervisorGuard|isSupervisor' frontend/src backend/apps backend/libs backend/prisma/seed.mts --glob '!*.snap'`. Debe quedar cero usos activos; las migraciones históricas pueden conservarlos.
- [ ] **Step 2: Verificar backend.** Ejecutar `pnpm --dir backend test`, `pnpm --dir backend lint:ci`, `pnpm --dir backend build`. En una base de prueba, aplicar `pnpm --dir backend prisma:deploy`, comprobar que una fila `SUPERVISOR` anterior ahora tiene `ADMIN` y que el registro público crea solo `PARTICIPANT`.
- [ ] **Step 3: Verificar frontend.** Ejecutar `pnpm --dir frontend test`, `pnpm --dir frontend lint`, `pnpm --dir frontend typecheck`, `pnpm --dir frontend build` y `git diff --check`.
- [ ] **Step 4: Probar matriz de permisos.** Con cuentas de prueba de cada rol, verificar la tabla del spec, incluidos 403 directos a `/runs`, `/admin` y certificados. Completar dos veces el mismo escenario como `TRAINER` y comprobar que `ScenarioRun` no aumenta y que el progreso de un `PARTICIPANT` de control permanece igual.
- [ ] **Step 5: Preparar despliegue.** Desplegar migración y código juntos; aceptar que access tokens viejos caducan en 15 minutos y refrescar sesión para recibir `ADMIN`. No publicar hasta que la base y ambos servicios usen el mismo enum. Commit sugerido para ajustes finales: `test: verify trainer isolation and role migration`.

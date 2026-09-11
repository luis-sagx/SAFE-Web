# Correos de phishing realistas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mejorar el realismo, la navegación y la claridad pedagógica de los ocho escenarios de phishing.

**Architecture:** Extender el cliente de correo compartido con una configuración de marca declarativa que puedan consumir tanto `ScreenView` como los escenarios JSX. Mantener los grafos existentes y añadir solo los caminos aprobados: enlace legítimo del rol, ruta pública nueva y mejor affordance para sitios guardados.

**Tech Stack:** React 19, TypeScript, React Router, CSS Modules, Vitest y Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-10-correos-phishing-realistas-design.md`

## Global Constraints

- No cambiar los identificadores internos guardados por el backend.
- No usar la calidad visual o el logotipo como prueba de legitimidad.
- Conservar toda señal decisiva en texto accesible.
- Incrementar la versión de cada escenario cuyo estímulo cambie.
- Preservar la ruta antigua de `secuestro-hilo` como alias.

---

### Task 1: Cabecera de marca compartida

**Files:**
- Modify: `frontend/src/components/ui/DesktopChrome.tsx`
- Modify: `frontend/src/components/ui/DeviceScreen.tsx`
- Modify: `frontend/src/components/ui/DeviceScreen.module.css`
- Test: `frontend/src/components/ui/DesktopChrome.test.tsx`

**Interfaces:**
- Produces: `MarcaCorreo`, configuración con `nombre`, `detalle`, `icono` y `variante`.
- Produces: prop opcional `marca?: MarcaCorreo` en `CuerpoCorreo` y en las vistas `mail`.

- [x] Escribir una prueba que renderice un correo con marca y compruebe su región accesible y sus textos.
- [x] Ejecutar la prueba y comprobar que falla porque la prop aún no existe.
- [x] Implementar la cabecera declarativa y sus estilos responsivos.
- [x] Ejecutar la prueba y comprobar que pasa.

### Task 2: Sitios guardados comprensibles

**Files:**
- Modify: `frontend/src/components/ui/Navegador.tsx`
- Modify: `frontend/src/components/ui/DeviceScreen.module.css`
- Test: `frontend/src/components/ui/Navegador.test.tsx`

**Interfaces:**
- Consumes: `MarcadorNavegador[]` existente.
- Produces: navegación etiquetada “Sitios guardados” con ayuda visible y controles con nombre accesible.

- [x] Escribir una prueba que compruebe la etiqueta, la ayuda y el nombre “Abrir …” de cada control.
- [x] Ejecutar la prueba y comprobar el fallo esperado.
- [x] Implementar la nueva barra sin destacar el marcador correcto.
- [x] Ejecutar la prueba y comprobar que pasa.

### Task 3: Contenido y acciones de los ocho correos

**Files:**
- Modify: `frontend/src/secciones/phishing/LoteriaPremiada.tsx`
- Modify: `frontend/src/secciones/phishing/FacturaSri.tsx`
- Modify: `frontend/src/secciones/phishing/ClaveCaducada.tsx`
- Modify: `frontend/src/secciones/phishing/RolDePagos.tsx`
- Modify: `frontend/src/secciones/phishing/QuishingActualice.tsx`
- Modify: `frontend/src/secciones/phishing/SecuestroHilo.tsx`
- Modify: `frontend/src/secciones/phishing/AvisoFiltracion.tsx`
- Modify: `frontend/src/secciones/phishing/SesionBogota.tsx`
- Modify: `frontend/src/data/catalogo.ts`
- Test: `frontend/src/secciones/phishing/CorreosRealistas.test.tsx`
- Test: `frontend/src/secciones/phishing/RolDePagos.test.tsx`
- Test: `frontend/src/secciones/phishing/SecuestroHilo.test.tsx`

**Interfaces:**
- Consumes: `MarcaCorreo` de Task 1.
- Produces: enlace del portal con `goto="n2"`, banners nuevos y correos con marca.

- [x] Escribir pruebas para las imágenes nuevas, ausencia de imágenes genéricas, saludo personalizado, enlace oficial y cuenta sin `(nueva)`.
- [x] Ejecutar las pruebas y comprobar que fallan por las funciones ausentes.
- [x] Actualizar los ocho escenarios y sus versiones con el contenido aprobado.
- [x] Ejecutar las pruebas y comprobar que pasan.

### Task 4: Ruta pública neutral con compatibilidad

**Files:**
- Modify: `frontend/src/data/catalogo.ts`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/pages/Seccion.tsx`
- Modify: `frontend/src/hooks/useSiguienteEscenario.ts`
- Modify: `frontend/src/components/ui/AccionesFinal.tsx`
- Test: `frontend/src/data/catalogo.test.ts`
- Test: `frontend/src/App.test.tsx`

**Interfaces:**
- Produces: `rutaEscenario(escenario): string` y campo opcional `ruta`.
- Preserva: `escenario.id === "phishing/secuestro-hilo"`.

- [x] Escribir pruebas para la ruta pública nueva, el identificador estable y el alias anterior.
- [x] Ejecutar las pruebas y comprobar el fallo esperado.
- [x] Implementar el campo de ruta, el helper y ambas rutas en React Router.
- [x] Usar el helper en todos los enlaces que apuntan a un escenario.
- [x] Ejecutar las pruebas y comprobar que pasan.

### Task 5: Verificación integral

**Files:**
- Verify: `frontend/`

- [x] Ejecutar las pruebas específicas modificadas.
- [x] Ejecutar `pnpm test`.
- [x] Ejecutar `pnpm lint`.
- [x] Ejecutar `pnpm typecheck`.
- [x] Ejecutar `pnpm build`.
- [x] Revisar `git diff --check` y el diff final contra este plan.

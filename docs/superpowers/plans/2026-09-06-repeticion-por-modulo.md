# Repetición por módulo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Derivar rondas completas desde `ScenarioRun`, congelar la nota durante repeticiones y actualizar gating/UI para repetir módulos completos.

**Architecture:** El backend particiona corridas ordenadas por fecha en rondas cerradas y una abierta, exponiendo la ronda oficial y el avance provisional. El frontend usa ese DTO para desbloquear únicamente el siguiente escenario de la ronda, iniciar repeticiones mediante modal y mostrar nota oficial separada del avance en curso.

**Tech Stack:** NestJS/TypeScript, React, React Router, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-06-repeticion-por-modulo-design.md`

## Global Constraints

- 6 módulos y 8 escenarios por módulo; umbral 6 aprobados.
- Sin migración, columna nueva ni endpoint nuevo.
- La nota oficial es la última ronda completa; una repetición incompleta no la modifica.
- No existe repetición de escenario suelto.

### Task 1: Backend de rondas

**Files:** `backend/apps/entrenamiento/src/runs/progreso.ts`, `backend/apps/entrenamiento/src/runs/progreso.spec.ts`

- [ ] Añadir `ronda` y `rondaEnCurso` al DTO.
- [ ] Escribir pruebas para primera pasada, cierre, repetición parcial/completa, duplicados y fechas desordenadas.
- [ ] Implementar partición por `scenarioId` distintos y último outcome por escenario.
- [ ] Ejecutar `pnpm --dir backend test -- progreso.spec.ts`.

### Task 2: API y gating frontend

**Files:** `frontend/src/lib/api.ts`, `frontend/src/lib/bloqueoEscenarios.ts`, `frontend/src/hooks/useSiguienteEscenario.ts`, `frontend/src/components/RequireEscenarioDisponible.tsx`

- [ ] Extender tipos y crear `siguienteEnRonda`.
- [ ] Implementar estados reposo, primera pasada y repetición, con opción `iniciandoRepeticion`.
- [ ] Actualizar guard y hook.
- [ ] Ejecutar pruebas focalizadas de gating y hook.

### Task 3: Flujo y presentación

**Files:** `frontend/src/components/ConfirmarRepeticionModal.tsx`, `frontend/src/components/ui/AccionesFinal.tsx`, `frontend/src/components/ui/PanelVeredicto.tsx`, `frontend/src/components/StoryEscenario.tsx`, `frontend/src/pages/Seccion.tsx`, `frontend/src/components/CierreModulo.tsx`, textos de bienvenida/dashboard.

- [ ] Crear modal accesible y navegación con `iniciarRepeticion`.
- [ ] Reemplazar acción de repetir escenario por repetir módulo.
- [ ] Bloquear tarjetas en reposo y mostrar doble progreso en repetición.
- [ ] Actualizar resumen y copy.
- [ ] Ejecutar suite frontend completa.

### Task 4: Verificación

- [ ] Ejecutar backend y frontend tests/build.
- [ ] Revisar diff contra todos los requisitos del spec.

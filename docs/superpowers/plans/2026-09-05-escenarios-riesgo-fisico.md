# Escenarios de riesgo físico Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unificar los seis escenarios físicos fuera de patrón mediante fotografías sin marco de dispositivo, decisiones comunes y veredictos compartidos.

**Architecture:** `ScreenView` gana el discriminante `escena`; `DeviceScreen` delega en `EscenaFoto` y `EscenarioLayout` ofrece un marco fotográfico. Cinco escenarios se expresan como `Story<ScreenNode>`; `PrivacidadClaves` conserva su manipulación propia y adopta el panel de veredicto compartido.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Vitest y Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-05-escenarios-riesgo-fisico-design.md`

## Global Constraints

- No modificar `SalidaSegura.tsx` ni `DescargaProgramasPiratas.tsx`.
- La foto usa `object-contain`, no se recorta ni tiene altura fija; decisiones y veredictos quedan fuera.
- Ningún escenario nuevo baraja opciones ni implementa su propio veredicto.
- Las zonas usan porcentajes; los dos veredictos literales de `PrivacidadClaves` se conservan.

---

### Task 1: Soporte de escenas fotográficas

**Files:**
- Create: `frontend/src/secciones/fisico/EscenaFoto.tsx`
- Modify: `frontend/src/components/ui/DeviceScreen.tsx`, `frontend/src/components/StoryEscenario.tsx`, `frontend/src/components/EscenarioLayout.tsx`, `frontend/src/secciones/fisico/fisico.module.css`
- Test: `frontend/src/secciones/fisico/TrampaUSB.test.tsx`

**Interfaces:** Produce `ScreenView` `{ kind: 'escena'; src; alt; zonas? }`, `EscenaFoto`, and `dispositivo="escena"`.

- [ ] **Step 1: Write the failing test**

```tsx
expect(screen.getByAltText(/USB abandonado/i)).toBeDefined()
expect(screen.getByRole('button', { name: /Agarrarlo/ })).toBeDefined()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --dir frontend test TrampaUSB.test.tsx`

Expected: FAIL because the old component renders a local image/choices layout.

- [ ] **Step 3: Write minimal implementation**

Add the union member, an early `DeviceScreen` branch rendering `<EscenaFoto>`, a `StoryEscenario` scene branch outside `Navegador`, and `MARCO_ESCENA`. `EscenaFoto` renders a `relative` container, image classes `escenaFoto h-auto w-full lg:h-full lg:w-auto lg:max-w-full`, and absolute percentage zone spans. Add the two CSS rules and scope `.senal-resaltada` under `.escenaMarco`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --dir frontend test TrampaUSB.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add frontend/src/components frontend/src/secciones/fisico/EscenaFoto.tsx frontend/src/secciones/fisico/fisico.module.css frontend/src/secciones/fisico/TrampaUSB.test.tsx && git commit -m "feat: support photographic physical scenes"`

### Task 2: Migrar USB, QR y puerto frío al motor de historia

**Files:**
- Modify: `frontend/src/secciones/fisico/TrampaUSB.tsx`, `CodigoQRCafe.tsx`, `PuertosFriosColdAisle.tsx`
- Test: sus tres archivos `.test.tsx`

**Interfaces:** Cada archivo exporta datos `STORY: Story<ScreenNode>` y `SENALES: Senal[]`, consumidos por `StoryEscenario`.

- [ ] **Step 1: Write failing tests**

Add image-alt opening assertions; interact through `screen.getByRole`; assert `PanelVeredicto` and a new good ending for USB report. Cover QR `bad/good/partial` and the three renamed cold-aisle actions.

- [ ] **Step 2: Run the focused tests**

Run: `pnpm --dir frontend test TrampaUSB.test.tsx CodigoQRCafe.test.tsx PuertosFriosColdAisle.test.tsx`

Expected: FAIL against the local-state implementations.

- [ ] **Step 3: Write minimal graph implementations**

Replace hooks, shuffle functions, local screen choices and feedback with final nodes. USB removes the nonexistent label, makes pickup `bad`, passive leaving `partial`, and adds `Dejarlo donde está y avisar a IT` as `good`. Preserve QR option text. Cold aisle uses exactly `Cerrar la puerta y reportar a infraestructura`, `Cerrar la puerta y seguir adelante`, and `Seguir de largo, alguien se encargará`; move urgency into `contexto.ahora` and outcome lists to endings. Calibrate photo zones.

- [ ] **Step 4: Run the focused tests**

Run: `pnpm --dir frontend test TrampaUSB.test.tsx CodigoQRCafe.test.tsx PuertosFriosColdAisle.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add frontend/src/secciones/fisico/{TrampaUSB,CodigoQRCafe,PuertosFriosColdAisle}.{tsx,test.tsx} && git commit -m "refactor: unify physical photo scenarios"`

### Task 3: Migrar tarjeta clonada y cable comprometido

**Files:**
- Modify: `frontend/src/secciones/fisico/TarjetaClonada.tsx`, `CableComprometido.tsx`
- Test: ambos archivos `.test.tsx`

**Interfaces:** `n_recuerdo` permite que una señal abra la foto de billetera; `n1 → n2` del cable conserva una arista no terminal.

- [ ] **Step 1: Write failing tests**

Replace fake timers with immediate bank-call image coverage. Test that review can show `escaneo-billetera.webp`, that carrying the cable reaches desk rather than ending, and that `Dejarlo donde está y avisar a IT` is a new good ending.

- [ ] **Step 2: Run the focused tests**

Run: `pnpm --dir frontend test TarjetaClonada.test.tsx CableComprometido.test.tsx`

Expected: FAIL due to timeouts, spark gating, SVG art, and local feedback.

- [ ] **Step 3: Write minimal graph implementations**

For cloned card, start with `llamada-banco.webp`, retain `escaneo-billetera.webp` as the `pantalla: 'n_recuerdo'` signal target, and model four endings. For cable, use `cargador-sospechoso.webp` then `imagen-escritorio.webp`; map the specified two bad/two good office endings, add the early IT option, and leave take-to-desk as only a graph edge. Delete `FlashSpark`, `ConsequenceArt`, `SCENE_ART_*`, shuffling, delay effects, and flash state.

- [ ] **Step 4: Run the focused tests**

Run: `pnpm --dir frontend test TarjetaClonada.test.tsx CableComprometido.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add frontend/src/secciones/fisico/{TarjetaClonada,CableComprometido}.{tsx,test.tsx} && git commit -m "refactor: move card and cable to story engine"`

### Task 4: Adaptar privacidad y retirar CSS legado

**Files:**
- Modify: `frontend/src/secciones/fisico/PrivacidadClaves.tsx`, `fisico.module.css`
- Test: `frontend/src/secciones/fisico/PrivacidadClaves.test.tsx` and full module suite

**Interfaces:** `PrivacidadClaves` creates final `StoryNode` values and renders `PanelVeredicto` with signals/rule.

- [ ] **Step 1: Write the failing test**

Assert that either literal privacy verdict also exposes `Ver las señales` after pressing `Terminar`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --dir frontend test PrivacidadClaves.test.tsx`

Expected: FAIL because feedback is component-local.

- [ ] **Step 3: Write minimal implementation**

Move procedural copy to `nota`; use token classes; replace local feedback with `PanelVeredicto`, signals and rule; preserve tabs/lock/timer and literal verdicts. Remove the dossier wrappers, gradient and unused CSS: `.app`, `.mainArea`, `.sceneView`, old choices, feedback, stamps, flash, glitch and animations. Keep `SalidaSegura` SVG rules plus `.escenaFoto`/`.zonaSenal`.

- [ ] **Step 4: Run all verification**

Run: `pnpm --dir frontend test && pnpm --dir frontend typecheck && pnpm --dir frontend lint && pnpm --dir frontend build`

Expected: all commands exit 0.

- [ ] **Step 5: Visually inspect responsive routes**

Inspect all eight scenarios at mobile, 1024–1279px, and wide desktop. Confirm full unframed photos, aligned zones, external choices, exact `AvisoFinEscenario` coverage, and no changes to the two already-correct scenarios.

- [ ] **Step 6: Commit**

Run: `git add frontend/src/secciones/fisico && git commit -m "style: remove legacy physical scenario chrome"`

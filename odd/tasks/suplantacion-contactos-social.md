# Reducir opciones de contactos y red social en suplantación

## Objetivo, problema y autorización

Retirar opciones decorativas señaladas por el usuario en `/suplantacion/cambio-numero` y `/suplantacion/clonaron-tu-perfil`. El usuario autorizó los cambios enumerados. También pidió un ajuste en Banco del Litoral, pero el mensaje no especifica cuáles opciones deben retirarse; esa parte queda pendiente de aclaración.

## Alcance y restricciones

- T1: `frontend/src/secciones/suplantacion/CambioNumero.tsx` y `frontend/src/secciones/suplantacion/ClonaronTuPerfil.tsx`.
- Retirar de Contactos en Cambio de número `Farmacia La Espiga` y `Taller Vélez`.
- Retirar de Red social en Perfil clonado `Notificaciones · 5 solicitudes de amistad nuevas`, `Quién puede ver tus fotos · Configuración de privacidad` y `Tus publicaciones · 128 desde 2014`.
- Conservar opciones con destino narrativo; no cambiar IDs, rutas, textos de decisiones ni contenido narrativo.
- Banco del Litoral en Cambio de número: consultar al usuario cuáles entradas quitar antes de editar esa vista.
- El índice ya contiene cambios del usuario en `JefeUrgente.tsx` y `NumeroNuevoReal.tsx`; conservarlos sin incluirlos en estos commits.

## Configuración y entrega

- TDD: desactivado según la configuración frontend registrada en `odd/tasks/simulated-apps-ui.md`.
- Runner registrado: `pnpm test` (Vitest); no añadir ni ejecutar pruebas automatizadas para este ajuste. Checks de T1: `pnpm typecheck`, `pnpm lint`, `pnpm build` y `git diff --check`.
- Ruta: delegated direct. Evidencia del trigger: cambios coordinados en dos archivos no triviales; CodeGraph consultado antes de lectura puntual.
- Pronóstico: menos de 60 líneas editadas. Estrategia: `ask-on-risk`; no hacer push ni PR.
- RDD: no iniciar ni cambiar el modo; la sesión previa registra `disabled/unmanaged`.

## Tareas

- [x] T1 — Retirar solo las cinco opciones explícitas de Contactos y Red social. `pnpm typecheck` OK; `pnpm lint` exit 0 con advertencias preexistentes de Fast Refresh/hooks; `pnpm build` OK; `git diff --check` OK. No se ejecutaron pruebas automatizadas.
- [ ] T2 — Retirar las opciones concretas que el usuario indique de Banco del Litoral. Aún sin autorización para escogerlas.

## Criterios de aceptación

- Contactos de Cambio de número ya no muestra Farmacia La Espiga ni Taller Vélez.
- Red social de Perfil clonado ya no muestra las tres entradas enumeradas.
- Banco del Litoral solo se modifica tras precisar las entradas; las demás opciones y decisiones siguen iguales.
- Los cambios staged existentes del usuario se conservan fuera de estos commits.

## Evidencia y progreso

- Mapeo: las opciones solicitadas en Contactos y Red social son entradas sin `goto`; el contacto principal de verificación queda intacto.
- CodeGraph no devolvió todas las fuentes pedidas; `rg` ubicó las cinco entradas y la vista de banco. Se preguntó qué opciones del banco deben retirarse.
- Estado inicial: cambios staged de usuario en `JefeUrgente.tsx` y `NumeroNuevoReal.tsx`; no están dentro del alcance.
- Implementación T1: retirados Farmacia La Espiga y Taller Vélez de Contactos; retirados Notificaciones, Quién puede ver tus fotos y Tus publicaciones de Red social. El Banco del Litoral no se tocó.
- Verificación T1: typecheck, lint y build terminaron con código 0; lint reporta advertencias preexistentes de Fast Refresh/hooks. `git diff --check` pasó. No se ejecutaron pruebas automatizadas.
- Commit de T1: `e741a44 fix(suplantacion): simplificar contactos y perfil social`.
- Estado: T1 completada y registrada. T2 sigue pendiente de que el usuario especifique las opciones del banco.
- Próximo paso: esperar respuesta para T2; los cambios staged ajenos siguen fuera del commit.

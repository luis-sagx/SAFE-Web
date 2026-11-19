# Retirar opciones redundantes en suplantación

## Objetivo, problema y autorización

Quitar opciones decorativas redundantes que distraen de las decisiones relevantes en `/suplantacion/clonaron-tu-perfil` y `/suplantacion/jefe-urgente`. El usuario autorizó directamente los cambios concretos.

## Alcance y restricciones

- Alcance: `frontend/src/secciones/suplantacion/ClonaronTuPerfil.tsx` y `frontend/src/secciones/suplantacion/JefeUrgente.tsx`.
- Eliminar de Perfil clonado la opción `Bloquear` / `Dejar de ver esta cuenta`.
- Eliminar de Contactos en Jefe urgente las entradas `Recepción` y `Sistemas · Soporte interno`.
- Eliminar de Tienda en Jefe urgente las entradas `1 tarjeta de $25` y `Recargas de saldo`.
- Conservar todas las opciones con destino narrativo y no modificar IDs, rutas, etiquetas de decisiones, narrativa o estilos no relacionados.
- El estado inicial incluye cambios del usuario ya preparados en `JefeUrgente.tsx` y `NumeroNuevoReal.tsx`; preservarlos exactamente y excluirlos del commit de esta tarea.

## Configuración y entrega

- TDD: desactivado según la configuración frontend registrada en `odd/tasks/simulated-apps-ui.md`.
- Runner registrado: `pnpm test` (Vitest); no añadir ni ejecutar pruebas automatizadas para este ajuste. Checks aplicables: `pnpm typecheck`, `pnpm lint`, `pnpm build` y `git diff --check`.
- Ruta: delegated direct. Evidencia del trigger: escritor delegado por cambios en dos archivos de escenario. CodeGraph no resolvió los símbolos solicitados; se usó lectura puntual tras ese fallo.
- Pronóstico: menos de 60 líneas editadas. Estrategia: `ask-on-risk`; no hacer push ni PR.
- RDD: no iniciar ni cambiar el modo; la sesión previa registra `disabled/unmanaged`.

## Tareas

- [x] T1 — Retirar cinco opciones sin destino narrativo en los dos escenarios. `pnpm typecheck` OK; `pnpm lint` exit 0 con advertencias preexistentes de Fast Refresh/hooks; `pnpm build` OK; `git diff --check` OK. No se ejecutaron pruebas automatizadas. El commit se aislará para excluir los cambios preparados previamente por el usuario.

## Criterios de aceptación

- Perfil clonado ya no muestra `Bloquear` ni `Dejar de ver esta cuenta`.
- Contactos de Jefe urgente ya no muestra Recepción ni Sistemas/Extensión 118.
- Tienda de Jefe urgente ya no muestra la tarjeta de $25 ni Recargas de saldo.
- Las opciones narrativas restantes no cambian.
- Los cambios previamente preparados por el usuario se conservan sin incorporarse a este commit.

## Evidencia y progreso

- Mapeo: las cinco entradas solicitadas son opciones de `ScreenView.opciones` sin `goto`; no avanzan el guion. La opción de verificación con destino se conserva.
- CodeGraph consultado antes de la lectura puntual; no devolvió fuente de los dos escenarios. `rg` confirmó las ubicaciones en los archivos especificados.
- Estado inicial: dos archivos ya estaban preparados en el índice (`JefeUrgente.tsx`, `NumeroNuevoReal.tsx`); se preservarán.
- Implementación: se retiró una opción de `ClonaronTuPerfil.tsx` y cuatro de `JefeUrgente.tsx`; se conservaron las opciones con destinos narrativos.
- Verificación: typecheck, lint y build terminaron con código 0; lint reporta advertencias existentes sobre Fast Refresh/hooks. `git diff --check` pasó. La búsqueda puntual no encontró los textos retirados. No se ejecutaron pruebas automatizadas.
- Commit de trabajo: `85c7a4d fix(suplantacion): retirar opciones redundantes`.
- Estado: T1 completada; typecheck, lint, build y diff check observados. Los cambios previamente preparados por el usuario siguen preparados en `JefeUrgente.tsx` y `NumeroNuevoReal.tsx`, fuera del commit.
- Próximo paso: ninguno; no hacer push ni abrir PR.

# Parche de dependencias transitivas auditadas — tareas ODD

Objetivo: hacer pasar la auditoría de producción de frontend y backend en la PR actual sin alterar el funcionamiento de SAFE-Web.

Problema y motivo: la auditoría del usuario reportó `source-map-js@1.2.1` en ambos proyectos (versión corregida: 1.2.2) y `proxy-addr@2.0.7` en backend (corregida: 2.0.8). Son dependencias transitivas fijadas en los lockfiles; sus dependencias padre permiten las versiones de parche. Referencias: https://github.com/advisories/GHSA-68fv-2mgg-jv7q y https://github.com/advisories/GHSA-jqcg-44mw-7w3h.

Alcance autorizado: corregir esas dos vulnerabilidades de la PR en la misma rama `fix/physical-photo-layout`, con cambios mínimos a configuración de pnpm y lockfiles de frontend/backend. No cambiar dependencias directas, API, UI, schemas ni guiones.

Restricciones: proyectos pnpm independientes; no introducir dependencias directas ni ampliar versiones de Nest, Prisma, Tailwind o Vite. Mantener overrides específicos para versiones vulnerables y ejecutar la misma auditoría de producción que CI, además de las verificaciones funcionales de ambos proyectos.

Configuración de pruebas: TDD habilitado por la habilidad `test-driven-development` de esta sesión; RED es la auditoría de producción fallida aportada por el usuario y, si la red local lo permite, observada aquí; GREEN requiere auditoría limpia y verificaciones funcionales. Runners: frontend `pnpm lint`, `pnpm test:cov`, `pnpm build`, `pnpm typecheck`; backend `pnpm lint:ci`, `pnpm test`, `pnpm build`; ambos `pnpm install --frozen-lockfile` y `pnpm audit --prod --audit-level high`. RDD: `disabled/unmanaged` porque `gentle-ai` no está instalado. Engram: herramientas no disponibles; espejo `odd/patch-transitive-dependencies/tasks` pendiente.

Estimación inicial: menos de 100 líneas autoradas en las configuraciones y lockfiles; estrategia de entrega `ask-on-risk` por defecto. Punto de rama para esta corrección: `29977ff`. Cambio observado de dependencias: 40 líneas (25 altas + 15 bajas), sin modificar dependencias directas.

## Tareas

- [ ] T1 — Actualizar solo las resoluciones transitivas vulnerables en frontend y backend, regenerar lockfiles y verificar auditoría y funcionamiento. Ruta: delegated direct; disparadores: mapeo de cuatro archivos y escritor para dos configuraciones más dos lockfiles no triviales. Cerrar con commit Conventional Commit en esta misma rama, con evidencia de versiones resueltas y checks.

## Criterios de aceptación

- Ningún lockfile resuelve `source-map-js` anterior a 1.2.2 ni `proxy-addr` anterior a 2.0.8 en las rutas afectadas.
- `pnpm install --frozen-lockfile` y la auditoría de producción terminan correctamente en ambos proyectos.
- Lint, pruebas y builds aplicables pasan sin regresiones; fallos u omisiones se registran explícitamente.
- La rama conserva el ajuste fotográfico previo y el árbol queda limpio tras el commit.

## Evidencia y siguiente paso

- Mapeo de solo lectura: frontend bloquea `source-map-js@1.2.1`; backend bloquea `source-map-js@1.2.1` y `proxy-addr@2.0.7`. Los manifiestos padre aceptan parches semver; existen overrides acotados en ambos `pnpm-workspace.yaml`. `pnpm why` no pudo leer el almacén local en el sandbox; se usaron lockfiles y manifiestos instalados.
- RED local: `pnpm audit --prod --audit-level high` falló en frontend por `source-map-js` y en backend por `source-map-js` y `proxy-addr` antes de cambiar los lockfiles.
- GREEN: pnpm 11.9.0 regeneró ambos lockfiles; `pnpm install --frozen-lockfile` pasó en frontend y backend. La auditoría de producción pasó en ambos: frontend sin vulnerabilidades conocidas; backend con cinco moderadas, ninguna alta/crítica. Los lockfiles resuelven `source-map-js@1.2.2` en ambos y `proxy-addr@2.0.8` en backend.
- Checks funcionales: frontend `pnpm typecheck`, `pnpm lint`, `pnpm build` y `pnpm test:cov` pasaron; 122 archivos, 901 pruebas aprobadas y 4 omitidas. Backend `pnpm prisma:generate`, `pnpm lint:ci`, `pnpm build` y `pnpm test:cov` pasaron; 29 suites y 223 pruebas aprobadas. Ambos proyectos generaron artefactos de cobertura. `git diff --check` pasó.
- Primera corrida simultánea de `pnpm test:cov` en ambos proyectos: frontend falló en cinco pruebas por timeout de 5 segundos; todas pasaron al repetir la suite frontend sin la carga paralela. No se modificaron pruebas ni timeouts. Lint de frontend conserva advertencias existentes; jsdom reporta APIs de media/canvas no implementadas. No se ejecutó backend e2e local porque requiere Postgres y su limpieza de datos; CI lo ejecuta en una base aislada.
- Siguiente paso: cerrar T1 con commit en la misma rama y observar los checks de la PR cuando el usuario publique la rama.

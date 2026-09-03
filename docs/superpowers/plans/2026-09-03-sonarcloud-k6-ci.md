# SonarQube Cloud y k6 en CI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enviar cobertura y análisis SAST a SonarQube Cloud y ejecutar carga k6 segura dentro del CI existente.

**Architecture:** Un job independiente reproduce las pruebas de cobertura de los dos proyectos y escanea el repositorio completo como un único proyecto SonarQube Cloud. El job Docker ya existente ejecuta k6 contra su pila efímera; un workflow manual queda reservado a carga extendida con URL autorizada.

**Tech Stack:** GitHub Actions, SonarQube Cloud, Vitest, Jest, Docker Compose y Grafana k6.

**Spec:** `docs/superpowers/specs/2026-09-03-sonarcloud-k6-ci-design.md`

## Global Constraints

- `SONAR_TOKEN` solo se lee desde GitHub Actions Secrets.
- El análisis cubre código propio, nunca `node_modules`, `dist`, Prisma generado ni reportes.
- La carga normal no debe disparar el límite de 120 solicitudes/minuto por IP.
- La carga extendida no puede apuntar a producción desde un evento automático.

---

### Task 1: Cobertura LCOV del frontend

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/vitest.config.js`

**Interfaces:**
- Produces: `pnpm test:cov` y `frontend/coverage/lcov.info`.

- [ ] Añadir el proveedor V8 de cobertura compatible con Vitest y declarar `test:cov`.
- [ ] Configurar los reportes `text` y `lcov`, excluyendo ficheros de pruebas y configuración.
- [ ] Ejecutar `pnpm test:cov` desde `frontend` y comprobar que exista `coverage/lcov.info`.

### Task 2: Configuración SonarQube Cloud

**Files:**
- Create: `sonar-project.properties`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: `SONAR_TOKEN`, `SONAR_ORGANIZATION` y `SONAR_PROJECT_KEY`.
- Consumes: los LCOV de frontend y backend.
- Produces: un check de Quality Gate bloqueante.

- [ ] Definir fuentes, pruebas, exclusiones y rutas LCOV sin codificar tokens.
- [ ] Añadir job `sonar` con checkout completo, instalaciones bloqueadas, cobertura y escáner.
- [ ] Ejecutar el análisis solo si los identificadores Sonar fueron configurados en GitHub Variables.

### Task 3: Carga k6 y carga extendida manual segura

**Files:**
- Create: `tests/carga/nominal.js`
- Create: `.github/workflows/stress.yml`
- Modify: `.github/workflows/ci.yml`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: URL base k6 mediante `BASE_URL`.
- Produces: resumen JSON de k6 y fallo si sus thresholds no se cumplen.

- [ ] Crear el escenario nominal que registra una cuenta única una vez y escribe corridas autenticadas sin superar el rate limit.
- [ ] Añadir ejecución k6 y publicación de su resumen al job Docker.
- [ ] Crear workflow manual que requiere URL autorizada y confirmación antes de ejecutar carga extendida.
- [ ] Ignorar artefactos locales de cobertura y resultados k6.

### Task 4: Verificación

**Files:**
- Verify: `frontend/package.json`, `frontend/vitest.config.js`, `sonar-project.properties`, `.github/workflows/*.yml`, `tests/carga/nominal.js`

- [ ] Ejecutar cobertura, lint y build de frontend.
- [ ] Ejecutar pruebas, cobertura, lint y build de backend.
- [ ] Validar sintaxis de los workflows y de k6.
- [ ] Levantar Compose y ejecutar k6 contra la pila si el entorno local permite Docker.
- [ ] Revisar el diff y comprobar que no se incluyó ningún secreto.

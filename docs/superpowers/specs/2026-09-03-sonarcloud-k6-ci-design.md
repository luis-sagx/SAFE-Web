# Diseño: calidad, SAST y carga en CI

## Objetivo

Incorporar SonarQube Cloud y pruebas de carga reproducibles al pipeline de
GitHub Actions, sin reemplazar los controles actuales de dependencias, Docker
o pruebas end-to-end.

## Alcance

- Un único proyecto SonarQube Cloud (`SAFE-Web`) para el repositorio.
- Análisis de `frontend/src`, `backend/apps` y `backend/libs`.
- Cobertura LCOV de Vitest y Jest enviada al análisis.
- Una prueba k6 breve contra la pila Docker real de CI.
- Un flujo manual de carga extendida, separado del CI normal.

## Decisiones

### SonarQube Cloud

Se usará análisis CI, no análisis automático. El job instalará las
dependencias de ambos proyectos, generará los dos reportes LCOV y ejecutará el
escáner con `SONAR_TOKEN`, que vive exclusivamente como secreto de GitHub.

El análisis esperará el Quality Gate para que el job sea bloqueante. El
proyecto ya está importado en SonarQube Cloud; por ello las claves y la
organización se parametrizan como variables no secretas de GitHub, en lugar de
incluir valores personales en el repositorio.

### Cobertura

`frontend` añadirá `@vitest/coverage-v8` y un script `test:cov` que produzca
`frontend/coverage/lcov.info`. `backend` reutilizará Jest con `test:cov`, que
produce `backend/coverage/lcov.info`.

### Carga

k6 se ejecutará como imagen Docker contra `http://localhost:8080`, después de
que Compose confirme los health checks. El perfil corto simula el recorrido
crítico: health, registro de un participante y escritura autenticada de una
corrida. Usa un ritmo que no excede los límites deliberados por IP del API;
por eso mide disponibilidad y latencia normales, no un ataque de denegación de
servicio.

Una prueba de carga extendida estará disponible por `workflow_dispatch` y
requerirá un entorno controlado. Un ensayo de estrés que eleve la concurrencia
queda fuera de esta fase: un único runner no representa varias IP reales y el
rate limit devolvería 429 correctamente.

## Pipeline

```
PR / push a main
  ├── frontend, backend, backend-e2e y auditorías existentes
  ├── SonarCloud: cobertura + análisis + Quality Gate
  └── Docker: pila real + smoke funcional + k6 nominal + Trivy

Ejecución manual
  └── k6 de carga extendida contra una URL explícitamente autorizada
```

## Fuera de alcance

- No se bajan ni se desactivan los límites de tasa de producción.
- No se ejecutan pruebas de carga ni de estrés contra el servidor de producción desde CI.
- No se añade otro SAST que duplique SonarQube Cloud en esta primera fase.

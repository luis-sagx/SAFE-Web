# Voces de vishing con Cartesia

## Objetivo y problema

Reemplazar las voces lentas y robóticas de los personajes de vishing, hoy generadas con Edge TTS, por MP3 estáticos generados con Cartesia a un ritmo más natural. La pantalla de llamada seguirá reproduciendo archivos locales.

## Alcance autorizado

Diálogos de escenarios de vishing y la llamada puente `TarjetaBloqueada`, que comparte personaje con dos escenas bancarias. Conservar la diferenciación de personajes y la continuidad de voz entre esas llamadas. Mantener sin cambios la narración de contexto, las demás notas de voz y el saludo personalizado.

## Restricciones y decisiones

- Código nuevo en inglés; textos y pruebas en español. Solo pnpm para el frontend.
- No usar claves en el bundle ni registrar secretos. La generación es una operación de desarrollo; los usuarios reproducen MP3 estáticos.
- El usuario autorizó consultar voces (`GET /voices`) y generar MP3 (`POST /tts/bytes`) en `https://api.cartesia.ai` con `CARTESIA_API_KEY` de `.env` en la raíz o `backend/.env`, que indicó que contienen la misma clave. La clave no se registró ni se añadió al repositorio.
- Ruta: delegada directa. Evidencia: el generador, el catálogo de diálogos, el índice de audio y los MP3 implican más de cuatro archivos; la implementación toca varios archivos no triviales.
- TDD: habilitado por `superpowers:test-driven-development` en esta sesión. Runner para el generador: `python3 -m unittest` (biblioteca estándar); verificación de frontend: `pnpm typecheck && pnpm lint && pnpm test && pnpm build` desde `frontend/`.
- RDD: `gentle-ai` no está instalado; estado `disabled/unmanaged`. Engram no está disponible en las herramientas de esta sesión; espejo `odd/cartesia-vishing-voices/tasks` pendiente.
- Estrategia de entrega: `ask-on-risk`; ante la indicación del usuario de continuar tras la pregunta de estrategia, se eligió `feature-branch-chain` para una eventual revisión. Pronóstico inicial: ~220 líneas autorales; MP3 generados excluidos. Acumulado confirmado: 249 líneas autorales hasta `ded4a79` (T1 y sus dos actualizaciones de progreso). T2 añade aproximadamente 193 líneas autorales, total aproximado 442. Sin PR creados; límite de slice en `ded4a79` y T2 preparado como siguiente slice.

## Tareas

- [x] **T1 — Generador Cartesia.** Adaptar la generación de diálogos vishing y `TarjetaBloqueada`, con voces por personaje, ritmo más ágil, nombres de archivo versionados por modelo/voz/ritmo/texto y manejo seguro de fallos. Mantener el flujo Edge TTS de las demás notas de voz. Prueba RED/GREEN del generador con `urlopen` simulado; verificar que el índice apunta a los nuevos MP3. Ruta delegada directa; disparadores de mapeo, preparación y escritor.
- [x] **T2 — Generar y verificar MP3.** Ejecutar el lote Cartesia autorizado para vishing y `TarjetaBloqueada`; comprobar cobertura, rutas, integridad de MP3, duración y conservación de otras notas; persistir los IDs públicos elegidos para regeneración estable; ejecutar checks frontend. Ruta delegada directa por múltiples archivos generados y cambios de código.
- [ ] **T3 — Revisión auditiva.** Escuchar muestras de las voces masculina, femenina y centralita para juzgar naturalidad e inteligibilidad; ajustar y regenerar solo si la escucha revela un problema. Pendiente porque este entorno no admite entrada de audio; se entregarán muestras al usuario.

## Criterios de aceptación

- Todos los diálogos de vishing apuntan a MP3 Cartesia y se reproducen sin llamada de síntesis en tiempo de juego.
- El ritmo de habla es más ágil que en los MP3 anteriores sin perder inteligibilidad.
- Las notas de voz de otros módulos siguen funcionando.
- Los comandos de verificación del proyecto tocado están en verde, o se documenta cada fallo.

## Progreso y evidencia

- Rama: `feat/cartesia-vishing-voices`, creada desde `main` limpio.
- T1: RED observado (0 solicitudes Cartesia en la prueba), luego GREEN (3 solicitudes para llamadas bancarias con la misma voz; una nota externa conservó Edge). Prueba `python3 -m unittest discover -s frontend/scripts -p 'test_*.py' -v`: 1/1. Checks frontend: `pnpm typecheck`, `pnpm lint`, `pnpm test` (899 aprobadas, 4 omitidas), `pnpm build`; `git diff --check`: correctos. La ejecución real y la evaluación auditiva quedan para T2.
- T1 commit: `7285dd8` (`feat(vishing): preparar voces Cartesia más ágiles`). Evaluación RDD: `disabled/unmanaged`, comando `gentle-ai` no disponible; sin revisión nativa.
- T2: autorización inicial para `frontend/.env` resultó inutilizable porque no existe; el usuario aclaró que la clave es la misma en raíz/backend y autorizó usarla. Se consultó el catálogo y se generaron 41 MP3. Voces nativas `es-MX`: Cesar (MALE, `4b5112be-c461-44a2-a66b-0dd7f98db4a0`), Fernanda (FEMALE, `b4b8e2af-6139-466e-a93a-30c20d2e1fc5`) y Sofía (IVR, `4663e61a-a9c2-40e1-94c5-c461ed9d3d31`). Los 14 MP3 de otros módulos quedaron idénticos. El índice tiene 55 rutas existentes y los 55 archivos pasan `ffprobe`. La duración de 41 frases pasó de 379,56 a 325,59 s (16,6 % menos; ~160,1 a ~186,7 palabras/min). IDs por defecto fijados en el generador; sin clave falla antes de tocar audios o índice. Pruebas RED/GREEN de esta corrección observadas. Checks finales: `python3 -m unittest discover -s frontend/scripts -p 'test_*.py' -v` (3/3), `pnpm typecheck`, `pnpm lint` (advertencias existentes), `pnpm test` (899 aprobadas, 4 omitidas), `pnpm build`, `git diff --check`, todos con salida 0. Commit T2: `6c669ef` (`feat(vishing): generar voces Cartesia más ágiles`). Evaluación RDD: `disabled/unmanaged`; sin revisión nativa.
- T3: no hubo escucha real; la calidad subjetiva sigue pendiente. Muestras: `91c0f2b47616.mp3` (MALE), `474da7720ea7.mp3` (FEMALE), `da7b6bfbed6c.mp3` (IVR).
- Espejo Engram pendiente: no se expusieron herramientas `mem_context`, `mem_search`, `mem_get_observation` ni escritura Engram.

## Siguiente paso

Compartir las tres muestras para revisión auditiva de T3. Ajustar y regenerar si el usuario reporta problemas. No crear PR ni publicar sin decisión del usuario.

# Voces de vishing con Cartesia

## Objetivo y problema

Reemplazar las voces lentas y robóticas de los personajes de vishing, hoy generadas con Edge TTS, por MP3 estáticos generados con Cartesia a un ritmo más natural. La pantalla de llamada seguirá reproduciendo archivos locales.

## Alcance autorizado

Diálogos de escenarios de vishing y la llamada puente `TarjetaBloqueada`, que comparte personaje con dos escenas bancarias. Conservar la diferenciación de personajes y la continuidad de voz entre esas llamadas. Mantener sin cambios la narración de contexto, las demás notas de voz y el saludo personalizado.

## Restricciones y decisiones

- Código nuevo en inglés; textos y pruebas en español. Solo pnpm para el frontend.
- No usar claves en el bundle ni registrar secretos. La generación es una operación de desarrollo; los usuarios reproducen MP3 estáticos.
- La generación real contra Cartesia requiere autorización explícita de destino, operación y credencial o sesión conforme a AGENTS.md. Hasta obtenerla, solo trabajo local y verificaciones sin red.
- Ruta: delegada directa. Evidencia: el generador, el catálogo de diálogos, el índice de audio y los MP3 implican más de cuatro archivos; la implementación toca varios archivos no triviales.
- TDD: habilitado por `superpowers:test-driven-development` en esta sesión. Runner para el generador: `python3 -m unittest` (biblioteca estándar); verificación de frontend: `pnpm typecheck && pnpm lint && pnpm test && pnpm build` desde `frontend/`.
- RDD: `gentle-ai` no está instalado; estado `disabled/unmanaged`. Engram no está disponible en las herramientas de esta sesión; espejo `odd/cartesia-vishing-voices/tasks` pendiente.
- Estrategia de entrega: `ask-on-risk`. Pronóstico: ~220 líneas autorales; MP3 generados excluidos. Contar líneas efectivas de commits antes del siguiente commit.

## Tareas

- [x] **T1 — Generador Cartesia.** Adaptar la generación de diálogos vishing y `TarjetaBloqueada`, con voces por personaje, ritmo más ágil, nombres de archivo versionados por modelo/voz/ritmo/texto y manejo seguro de fallos. Mantener el flujo Edge TTS de las demás notas de voz. Prueba RED/GREEN del generador con `urlopen` simulado; verificar que el índice apunta a los nuevos MP3. Ruta delegada directa; disparadores de mapeo, preparación y escritor.
- [ ] **T2 — Generar y escuchar MP3.** Ejecutar el lote Cartesia para vishing solo tras autorización remota explícita; comprobar cobertura de todos los diálogos, revisar duración y calidad por personaje, ejecutar checks frontend y registrar archivos resultantes. Ruta delegada directa por múltiples archivos generados. Bloqueada hasta contar con autorización para destino, operación y credencial/sesión.

## Criterios de aceptación

- Todos los diálogos de vishing apuntan a MP3 Cartesia y se reproducen sin llamada de síntesis en tiempo de juego.
- El ritmo de habla es más ágil que en los MP3 anteriores sin perder inteligibilidad.
- Las notas de voz de otros módulos siguen funcionando.
- Los comandos de verificación del proyecto tocado están en verde, o se documenta cada fallo.

## Progreso y evidencia

- Rama: `feat/cartesia-vishing-voices`, creada desde `main` limpio.
- T1: RED observado (0 solicitudes Cartesia en la prueba), luego GREEN (3 solicitudes para llamadas bancarias con la misma voz; una nota externa conservó Edge). Prueba `python3 -m unittest discover -s frontend/scripts -p 'test_*.py' -v`: 1/1. Checks frontend: `pnpm typecheck`, `pnpm lint`, `pnpm test` (899 aprobadas, 4 omitidas), `pnpm build`; `git diff --check`: correctos. La ejecución real y la evaluación auditiva quedan para T2.
- T1 commit: pendiente de crear y registrar.
- T2 pendiente de autorización remota. MP3 e índice real sin modificar.
- Espejo Engram pendiente: no se expusieron herramientas `mem_context`, `mem_search`, `mem_get_observation` ni escritura Engram.

## Siguiente paso

Confirmar checks y crear el commit de T1. Después solicitar la autorización remota que falte para T2.

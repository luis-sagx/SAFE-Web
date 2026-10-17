# Opciones de smishing y diálogos bancarios

## Objetivo, problema y autorización

El usuario aprobó implementar los cuatro ajustes analizados: decisiones visibles en smishing, una primera experiencia más sencilla, un SMS bancario menos explícito en «Aviso de consumo por teléfono» y una llamada legítima más natural en «Consumo retenido». Pidió conservar una advertencia breve de que el banco no pide claves.

## Alcance y decisiones

- Citación mostrará «¿Cuál es la placa?» antes de enviarla; tocar el campo no enviará una respuesta oculta.
- Bono mostrará acciones claras para abrir el enlace, verificar por cuenta propia o salir, con los destinos existentes y sin inventar diálogo.
- Baja mantendrá la comprobación en Mi Operadora, hará visible el acceso, quitará el reclamo redundante y reducirá navegación/distractores. Cerrar sin comprobar conserva resultado parcial.
- El SMS de autorización y su notificación dirán «Banco del Litoral: su código de autorización es 480913. Válido por 5 minutos. No lo comparta.»; no indicarán la respuesta «cuelgue».
- La llamada legítima describirá el consumo y preguntará si se reconoce. Una frase breve conservará la advertencia sobre claves. Se quitará la invitación extensa a colgar de la apertura; la opción del participante de llamar por su cuenta se conserva. Advertencia posterior sobre el código breve; señales y explicación coherentes, sin garantías absolutas basadas en el discurso del interlocutor.
- Subir versiones de guiones afectados, conservar IDs, contratos, privacidad y respuestas seguras. Sin dependencias nuevas ni cambios de backend.
- La síntesis remota requiere autorización explícita a api.cartesia.ai con CARTESIA_API_KEY del entorno local configurado. Pregunta enviada; no inspeccionar credenciales ni contactar el servicio mientras esté pendiente.

## Ruta, pruebas y entrega

- Rama: `fix/scenario-options-and-bank-dialogue`, base `fdf9107`.
- Ruta delegada directa por tarea: exploración requirió más de cuatro archivos y cada implementación toca varios archivos no triviales. Preparación/mapeo delegado a `smishing_audit`; escritores acotados por tarea, secuenciales para coordinar catálogo compartido.
- TDD ON en esta sesión por la habilidad aplicable `test-driven-development` (`/home/luissagnay/.agents/skills/test-driven-development/SKILL.md`); sin ajuste persistente hallado. Runner: `pnpm test` (`vitest run`) desde `frontend/`. RED/GREEN para regresiones de interacción; no pruebas que solo dupliquen textos editoriales.
- Checks de cada tarea: pruebas funcionales afectadas, typecheck, lint, suite frontend, build y `git diff --check`. Audio: cobertura texto/MP3 e integridad con ffprobe si se autoriza generación; no afirmar escucha subjetiva.
- RDD: `disabled/unmanaged`; `gentle-ai review mode status` no disponible (exit 127). No activar ni ejecutar revisiones nativas.
- Estrategia de entrega `ask-on-risk`, pronóstico inicial ~360 líneas autorales (incluye pruebas/documento; excluye audio e índice generado). Revisar acumulado antes de commits; preguntar estrategia solo si supera ~400. No push, PR ni merge autorizados.

## Tareas y aceptación

- [x] **T1 — Opciones y entrada al módulo smishing.** Ruta delegada, disparadores de preparación/mapeo/escritor. Citación muestra su respuesta; Bono ofrece enlace/verificación/salida; Baja permite consultar suscripciones desde acción explícita o dock, sin menú intermedio, reclamo redundante ni bloqueo distractor. Salir sin comprobar sigue parcial. Regresiones de interacción y versiones 3→4 en los tres guiones. Checks observados; commit `b4c98b2`.
- [ ] **T2 — Guiones bancarios y voces coherentes.** Ruta delegada, disparadores de preparación/escritor. Textos, avisos, señales y versiones 1→2 preparados en ambos escenarios; frase breve «Recuerde que el banco no pide claves por teléfono». Alternativa propia de llamar intacta. Pendientes tres MP3 e índice, comprobación de audio, suite verde y commit de unidad. No marcar completo hasta observar cobertura de todas las frases.

## Progreso y evidencia

- Exploración estática de ocho escenarios, renderizador, catálogo, guiones bancarios y pruebas existentes completada sin cambios de fuente.
- Estado inicial: solo `.codegraph/` y PDF académico sin seguimiento, preexistentes; no incluirlos en commits.
- Suite frontend de base: `pnpm test`, 125 archivos y 932 pruebas aprobadas, 4 omitidas (exit 0). Advertencias jsdom de reproducción multimedia/canvas y navegación observadas.
- T1: RED observado (seis fallos por nuevas opciones ausentes; regresión Citación aislada falla antes del cambio). GREEN dirigido 3 archivos/19 pruebas. Checks frontend: typecheck, lint (advertencias Fast Refresh existentes), suite completa 126 archivos/935 aprobadas/4 omitidas, build y diff-check, todos exit 0. Advertencias jsdom multimedia/canvas/navegación preexistentes. Logs `/tmp/safe-t1-*.log`.
- T1 commit `b4c98b2` (`fix(smishing): mostrar decisiones y simplificar el primer escenario`): 190 líneas autorales. Sin cambios al renderizador ni dependencias. Documento añadido explícitamente en `fd2a9db` (42 líneas). Acumulado confirmado: 232 líneas autorales; cambios T2 preparados: 48, total provisional 280 antes de actualizar documentación final. Sin PR.
- T2 texto revisado por el padre: sin invitación extensa a colgar; aviso posterior de código corto; feedback no presenta advertencias ni coincidencias con la app como prueba de identidad. SMS fraudulento y notificación coherentes. Test funcional de AntifraudeBanco adaptado a región accesible tras fallar selector del texto retirado; no prueba espejo de redacción.
- T2 checks: typecheck, lint (advertencias existentes), build y diff-check exit 0. Suite completa exit 1: 125 archivos aprobados/1 fallido; 934 pruebas aprobadas, 1 fallida y 4 omitidas. Único fallo: `voces.test.ts > cada frase de quien llama tiene su audio generado`, exactamente por las tres frases nuevas. Sin otros fallos. Logs `/tmp/safe-t2-*.log`. No comprobación visual ni escucha subjetiva.
- Preparación audio: inventario completo de 55 frases con hashes calculados y defaults públicos coincide con MP3 existentes (missing=[], mismatch=[]); generación estándar reutilizará los demás archivos. No usar inventario parcial: el generador elimina audios fuera de inventario. SHA256 previo: `/tmp/safe-t2-voice-baseline.json`; artefacto propio de importación `frontend/scripts/__pycache__/voces.cpython-314.pyc` sin añadir. Ninguna credencial leída ni contacto remoto realizado.
- Autorización Cartesia sigue sin respuesta: no se puede generar el audio pendiente. T2 permanece abierto y sus cuatro archivos de fuente/prueba quedan sin commit para no cerrar una unidad con cobertura de voces fallida.
- Espejo Engram guardado y leído completo: observación #28, tema `odd/scenario-options-and-bank-dialogue/tasks`, proyecto `safe-web`. Advertencia de posibles coincidencias con documentos SUS de otra función; no hay conflicto del archivo local con su espejo.

## Siguiente paso

Recibir autorización explícita para api.cartesia.ai, POST /tts/bytes y descarga de MP3, con CARTESIA_API_KEY del entorno local configurado (pregunta pendiente). Después generar con inventario completo y voces públicas predeterminadas, verificar solo tres audios nuevos y preservación del resto, ffprobe, cobertura de voces y checks frontend. Registrar commit T2 y cerrar archivo/espejo. Si el usuario no autoriza, mantener generación pendiente y no declarar implementación completa. No push ni PR.

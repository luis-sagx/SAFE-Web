# Ajuste de fotos en escenarios de riesgo físico — tareas ODD

Objetivo: hacer que las fotos de riesgo físico aprovechen el espacio disponible en pantallas grandes y sigan siendo legibles en pantallas pequeñas, respetando la proporción y las zonas de señal de cada imagen.

Problema y motivo: el marco compartido de escenas fotográficas tiene un límite de 24 rem de alto y 46 rem de ancho desde `sm`, y en escritorio se alinea arriba. Una foto cuadrada como la del USB queda pequeña dentro del marco y deja mucho espacio libre debajo. Las demás fotos son mayormente apaisadas, por lo que forzar un recorte 16:9 no sirve como solución general.

Alcance autorizado: corregir la presentación responsiva de las fotos de los escenarios de riesgo físico, sus pruebas y la documentación incidental. No cambiar imágenes, guiones, IDs, decisiones ni zonas de señal salvo que la verificación demuestre que sea necesario.

Restricciones: conservar la foto completa y sus señales alineadas; mantener la lectura de opciones en móvil; interfaz y comentarios/pruebas en español, identificadores nuevos en inglés; sin dependencias nuevas. La escena de oficina con interacciones propias debe seguir funcionando.

Configuración de pruebas: TDD habilitado por la habilidad `test-driven-development` aplicada en esta sesión; runner `pnpm test` (Vitest) desde `frontend/`, con RED/GREEN/REFACTOR observados. Verificación final del frontend: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, más comprobación visual de tamaños de pantalla cuando esté disponible. RDD: desactivado/no gestionado; `gentle-ai` no está instalado. Engram: herramientas no disponibles; espejo `odd/physical-photo-layout/tasks` pendiente.

Estimación inicial: ~150 líneas autoradas (sumando altas y bajas, sin generados); estrategia de entrega `ask-on-risk` por defecto. Punto de rama: `main` al crear `fix/physical-photo-layout`. Total observado en el commit de trabajo: 89 líneas (82 altas + 7 bajas).

## Tareas

- [x] T1 — Ajustar el marco y la superficie fotográfica según la proporción real y el espacio disponible. Ruta: delegated direct; disparadores: preparación en cuatro archivos (`EscenarioLayout`, `EscenaFoto`, CSS y pruebas) y escritor para al menos dos archivos no triviales. La foto informa su proporción al marco mediante un contexto pequeño; el marco crece según la altura útil y el ancho disponible en escritorio, y ambos bloques se centran verticalmente. No se recortaron fotos ni se modificaron zonas de señal. RED observado: dos fallos esperados (marco sin proporción); GREEN observado: 6/6 pruebas focalizadas. Commit de trabajo `57a57d1` (`fix(fisico): ampliar fotos según espacio disponible`).

## Criterios de aceptación

- En escritorio amplio, la foto y su marco crecen con el espacio útil y no quedan pegados arriba con espacio sobrante excesivo.
- Una foto cuadrada y otra apaisada se muestran completas, sin deformación ni recorte, con señales alineadas.
- En móvil y tableta, la foto y las decisiones siguen legibles sin desbordamiento horizontal.
- Los comandos de verificación del frontend pasan, o sus fallos se registran con la salida pertinente.

## Evidencia y siguiente paso

- Diagnóstico: `EscenarioLayout.tsx` limita `FRAME_SCENE` a 24 rem de alto/46 rem de ancho y usa `lg:self-start`; `EscenaFoto.tsx` obtiene la proporción real al cargar y el CSS usa `object-fit: contain`. El USB es 1024×1024; las otras cinco fotos de `PhotoScene` son apaisadas. El commit `c6f669c` introdujo el marco separado y el ajuste de proporciones.
- Verificación: `pnpm typecheck`, `pnpm lint`, `pnpm test` y `pnpm build` desde `frontend/` terminaron con código 0. La suite completa tuvo 122 archivos aprobados, 901 pruebas aprobadas y 4 omitidas. Lint mostró advertencias preexistentes en archivos ajenos al cambio; Vitest mostró avisos conocidos de APIs de media/canvas y navegación no implementadas por jsdom. `git diff --check` pasó.
- Geometría con Chrome y CSS compilado: en el escritorio efectivo de 2048×879, el marco cuadrado midió 668×668 y la foto 664×664; el marco apaisado 1187×668 y la foto 1180×664. La prueba móvil solicitó 390×844, pero Chrome aplicó 500×757 efectivos; allí el marco cuadrado midió 485×272, la foto 272×272 y no hubo desbordamiento horizontal. No se abrió una sesión autenticada de la aplicación para inspección visual manual.
- Evaluación RDD: `disabled/unmanaged`; no se ejecutó revisión nativa. La copia Engram sigue pendiente porque no hay herramientas de Engram en esta sesión.
- Siguiente paso: entregar el commit para revisión local; sin push ni PR.

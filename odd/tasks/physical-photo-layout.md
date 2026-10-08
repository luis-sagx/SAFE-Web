# Ajuste de fotos en escenarios de riesgo físico — tareas ODD

Objetivo: hacer que las fotos de riesgo físico aprovechen el espacio disponible en pantallas grandes y sigan siendo legibles en pantallas pequeñas, respetando la proporción y las zonas de señal de cada imagen.

Problema y motivo: el marco compartido de escenas fotográficas tiene un límite de 24 rem de alto y 46 rem de ancho desde `sm`, y en escritorio se alinea arriba. Una foto cuadrada como la del USB queda pequeña dentro del marco y deja mucho espacio libre debajo. Las demás fotos son mayormente apaisadas, por lo que forzar un recorte 16:9 no sirve como solución general.

Alcance autorizado: corregir la presentación responsiva de las fotos de los escenarios de riesgo físico, sus pruebas y la documentación incidental. No cambiar imágenes, guiones, IDs, decisiones ni zonas de señal salvo que la verificación demuestre que sea necesario.

Restricciones: conservar la foto completa y sus señales alineadas; mantener la lectura de opciones en móvil; interfaz y comentarios/pruebas en español, identificadores nuevos en inglés; sin dependencias nuevas. La escena de oficina con interacciones propias debe seguir funcionando.

Configuración de pruebas: TDD habilitado por la habilidad `test-driven-development` aplicada en esta sesión; runner `pnpm test` (Vitest) desde `frontend/`, con RED/GREEN/REFACTOR observados. Verificación final del frontend: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, más comprobación visual de tamaños de pantalla cuando esté disponible. RDD: desactivado/no gestionado; `gentle-ai` no está instalado. Engram: herramientas no disponibles; espejo `odd/physical-photo-layout/tasks` pendiente.

Estimación inicial: ~150 líneas autoradas (sumando altas y bajas, sin generados); estrategia de entrega `ask-on-risk` por defecto. Punto de rama: `main` al crear `fix/physical-photo-layout`.

## Tareas

- [ ] T1 — Ajustar el marco y la superficie fotográfica según la proporción real y el espacio disponible, con una regresión que falle antes del cambio. Ruta: delegated direct; disparadores: preparación en cuatro archivos (`EscenarioLayout`, `EscenaFoto`, CSS y pruebas) y escritor para al menos dos archivos no triviales. Verificar RED, GREEN, suite y comprobación visual. Cerrar con un commit Conventional Commit que incluya pruebas y esta evidencia.

## Criterios de aceptación

- En escritorio amplio, la foto y su marco crecen con el espacio útil y no quedan pegados arriba con espacio sobrante excesivo.
- Una foto cuadrada y otra apaisada se muestran completas, sin deformación ni recorte, con señales alineadas.
- En móvil y tableta, la foto y las decisiones siguen legibles sin desbordamiento horizontal.
- Los comandos de verificación del frontend pasan, o sus fallos se registran con la salida pertinente.

## Evidencia y siguiente paso

- Diagnóstico: `EscenarioLayout.tsx` limita `FRAME_SCENE` a 24 rem de alto/46 rem de ancho y usa `lg:self-start`; `EscenaFoto.tsx` obtiene la proporción real al cargar y el CSS usa `object-fit: contain`. El USB es 1024×1024; las otras cinco fotos de `PhotoScene` son apaisadas. El commit `c6f669c` introdujo el marco separado y el ajuste de proporciones.
- Siguiente paso: delegar la implementación acotada de T1 y comprobar sus resultados antes del commit.

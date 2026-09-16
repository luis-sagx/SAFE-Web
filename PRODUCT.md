# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Participantes del estudio:** personas no técnicas de Ecuador, desde adolescentes hasta adultos mayores, que se entrenan para reconocer fraudes digitales y físicos. Llegan por invitación, se registran y recorren módulos con escenarios simulados.
- **Formadores:** conducen sesiones grupales; usan los videos por módulo para explicar señales y decisiones antes o después de practicar.
- **Público general:** cualquier persona que llega por un enlace compartido y quiere entender qué es SAFE-Web.

## Product Purpose

SAFE-Web (MIC) es un conjunto de ambientes interactivos que simulan ciberamenazas reales del contexto ecuatoriano —correos del SRI o del banco, SMS, llamadas, perfiles clonados, compras, riesgos físicos en la oficina y asistentes de IA— para que personas no técnicas practiquen decidir sin arriesgar nada. Registra cada decisión con seudónimo para un estudio con pre-test y post-test. Éxito: el participante reconoce las señales y verifica antes de actuar.

Trabajo de Integración Curricular — Carrera de Software, ESPE.

## Positioning

No enseña con diapositivas: pone a la persona dentro de la situación (una bandeja de correo, un chat, una llamada que la apura) y le hace decidir. Mezcla casos fraudulentos y legítimos, así que no basta con desconfiar de todo.

## Operating Context

- Recorrido del participante: registro → bienvenida → dashboard con siete módulos (Phishing, Smishing, Vishing, Suplantación de identidad, Estafa electrónica, Riesgo físico, Asistentes de IA) → escenarios con gating y aprobación por módulo → certificado verificable.
- El curso tiene algo de gamificación (avance, aprobación por módulo, certificado), sin volverse un juego.
- La portada pública `/` presenta el proyecto y ocho videos (uno general y uno por módulo) alojados en YouTube; no requiere sesión y ver los videos no cambia el avance.
- Roles: ADMIN, TRAINER (planeado), PARTICIPANT.

## Capabilities and Constraints

- SPA React + Vite + Tailwind v4; tema Sistema/Claro/Oscuro elegible por la persona.
- Los escenarios simulados nunca siguen el tema del cromo.
- Los videos se incrustan con `youtube-nocookie.com`, montando el iframe solo al pedir reproducción; la CSP solo permite ese origen de iframe.
- Privacidad: la cédula nunca se almacena; resultados identificados por seudónimo.

## Brand Commitments

- Nombre SafeWeb / SAFE-Web; logo e isotipo en `frontend/src/assets/marca/` (variantes clara y oscura).
- Verde de marca como color de acción.
- Temas claro y oscuro obligatorios en todo el cromo, incluida la portada.
- La persona usuaria aprecia una estética con aire "hacker" (terminal, señales, investigación), pero sin miedo ni amenaza: debe leerse amable para adolescentes y adultos mayores, y funcionar igual de bien en claro.
- La portada puede ser más expresiva que la app, conservando logo, verde y tokens de tema.

## Evidence on Hand

- Catálogo real de módulos y escenarios en `frontend/src/data/catalogo.ts`.
- Videos: aún no existen. Ninguna URL debe inventarse; cada espacio muestra "Video próximamente" hasta cargar el identificador en `frontend/src/data/videosCapacitacion.ts`.
- No hay testimonios, cifras de impacto, instituciones aliadas ni resultados del estudio; no deben fabricarse.

## Product Principles

1. Practicar la decisión, no memorizar reglas.
2. Nunca asustar: el tono es de acompañamiento y verificación, no de amenaza.
3. Legible para quien menos experiencia digital tiene.
4. Honestidad con los datos: lo que no existe se rotula como pendiente.

## Accessibility & Inclusion

Público con adultos mayores: contraste AA en ambos temas, texto de contenido ≥16px, objetivos táctiles de 44px, foco visible, el color nunca como única señal, selector de tema con texto.

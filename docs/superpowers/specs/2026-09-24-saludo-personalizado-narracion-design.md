# Saludo personalizado en la narración del contexto

**Fecha:** 2026-09-24  
**Proyecto:** SAFE Web  
**Estado:** diseño aprobado; pendiente de plan e implementación

El botón "Escuchar el contexto" (issue #285) hoy reproduce un único MP3 por
escenario, generado una sola vez y compartido por todos los participantes, que
empieza directo en "antes de esto". El saludo con nombre que ya aparece en
pantalla ("Hola, {nombre}. Esto es lo que te está pasando:") no está en ese
audio porque el nombre varía por persona y el archivo es estático.

Este diseño agrega un segundo clip, generado en el momento y cacheado por
nombre, que se reproduce antes del clip de contexto ya existente, de modo que
el audio completo suene igual de personalizado que el texto en pantalla.

## Resultado esperado

Al presionar "Escuchar el contexto", la persona oye primero su propio nombre
("Hola, {nombre}. Esto es lo que te está pasando:") y, a continuación sin
pausa perceptible, el contexto del escenario que ya se generaba antes. Los 53
clips de contexto no cambian: siguen siendo los mismos archivos estáticos
generados con `scripts/narracion.py`.

## Decisiones de diseño

| Tema | Decisión |
|---|---|
| Alcance | Solo el saludo. No se regeneran los 53 clips de contexto ni cambia `src/data/narracion.ts`. |
| Dónde vive el nuevo endpoint | `identidad` (no `entrenamiento`): ya maneja el PII cifrado (`nombre`, `apellido`) y ya expone un patrón idéntico en `POST /certificados/pdf` (bytes de un archivo generado, protegido por `JwtAuthGuard` + `ParticipantGuard`). |
| Envío de PII a Cartesia | Aprobado explícitamente por el usuario: el primer nombre del participante sale hacia Cartesia (EE. UU.) para sintetizarse, igual que ya ocurre con el resto del guion narrado. |
| Ubicación de la clave de Cartesia | Se muda de `frontend/.env` a las variables de entorno de `identidad`. Deja de estar en el bundle del cliente. |
| Caché | En memoria del proceso (`Map`), no en disco: `certificados.service.ts` ya establece la norma de no persistir en disco archivos generados a partir de datos personales ("guardarlo dejaría en disco un archivo con datos personales"), y un MP3 con el nombre de alguien cae en esa misma categoría. Clave: el primer nombre tal cual. Se pierde al reiniciar el proceso; mientras corre, evita llamadas repetidas a Cartesia para el mismo nombre. |
| Forma del endpoint | `GET /narracion/saludo`, sin parámetros: el nombre sale del participante autenticado (`@CurrentParticipant()` + lookup en Prisma), nunca de un query param — así nadie puede pedirle a Cartesia que sintetice texto arbitrario a través de este endpoint. |
| Respuesta | Bytes de audio (`Content-Type: audio/mpeg`), igual que `POST /certificados/pdf`. No hay URL pública ni carpeta servida estáticamente para estos archivos. |
| Reproducción en el frontend | Dos elementos `<audio>` encadenados: al terminar el saludo (`onended`), arranca el audio de contexto ya existente. Desde el punto de vista del participante sale como una sola narración. |
| Estado de carga | Mientras se resuelve el `fetch` del saludo (primera vez que se pide ese nombre, con síntesis en vivo), el botón muestra un estado breve de "cargando" en vez de quedar inerte. |
| Manejo de errores | Si el saludo falla (red, backend caído, Cartesia caída), se reproduce igual el clip de contexto solo, sin el nombre, en vez de que el botón quede roto. No es un error bloqueante: el participante igual puede escuchar el contexto. |

## Recorrido del participante

1. Entra al briefing de un escenario y ve el saludo con su nombre, igual que
   hoy.
2. Presiona "Escuchar el contexto". El botón pasa a un estado de carga breve.
3. Oye "Hola, {nombre}. Esto es lo que te está pasando:" con la misma voz que
   el resto de la narración.
4. Sin pausa perceptible, sigue el contexto del escenario (lo que ya
   funcionaba antes de este cambio).
5. Puede pausar en cualquier momento; el botón vuelve a "Escuchar el
   contexto".

## Componentes y flujo de datos

**Backend (`identidad`):**

- `NarracionModule` nuevo (controller + service), junto a `certificados/` y
  `cedula/`.
- `NarracionController`: `GET /narracion/saludo`, `@UseGuards(JwtAuthGuard,
  ParticipantGuard)`.
- `NarracionService`:
  1. Busca al participante por `sub` en Prisma (mismo `select: { nombre: true
     }` que ya usa `certificados.service.ts`), desencripta con
     `decryptOptional(..., piiKey)`.
  2. Extrae el primer nombre con la misma lógica que hoy vive en
     `frontend/src/context/AuthContext.tsx` (`firstName`): recortar y tomar el
     primer token separado por espacios.
  3. Si `nombre` viene vacío (dato faltante), usa un saludo sin nombre: "Hola.
     Esto es lo que te está pasando:" — nunca falla el endpoint por esto.
  4. Revisa la caché en memoria (`Map<string, Buffer>`) por el primer nombre.
  5. Caché ausente: llama a Cartesia (mismo `voice_id`, mismo `model_id` que
     `scripts/narracion.py`), guarda el resultado en el `Map`, lo devuelve.
  6. Caché presente: lo devuelve directo, sin llamar a Cartesia.

**Frontend:**

- `NarracionContexto.tsx` deja de asumir un solo `<audio>` con `src` fijo:
  - Primer `<audio>` (saludo): `src` se resuelve con un `fetch` autenticado a
    `/api/narracion/saludo`, convertido a `blob:` URL.
  - Segundo `<audio>` (contexto): igual que hoy, `NARRATION[textoNarracion(contexto)]`.
  - Al presionar el botón: si el saludo no se ha cargado, hace el `fetch`
    primero (estado "cargando"); si el `fetch` falla, salta directo a
    reproducir el audio de contexto.
  - `onended` del audio de saludo dispara `play()` del audio de contexto.
  - `onended` del audio de contexto (el último en la cadena) vuelve el botón a
    su estado inicial.

## Testing

- Backend: `narracion.service.spec.ts` — caché hit/miss, nombre con espacios
  extra, nombre vacío/nulo, y que nunca se persiste el nombre en texto plano
  fuera del archivo de audio cacheado. `narracion.controller.spec.ts` — guard
  aplicado, `Content-Type` de la respuesta. La llamada real a Cartesia se
  mockea en ambos.
- Frontend: `NarracionContexto.test.tsx` ampliado — encadenado saludo→contexto
  con `fetch` mockeado, estado de carga, y el camino de error (saludo falla,
  contexto se reproduce solo).

## Fuera de alcance

- No se toca el flujo de los 53 clips de contexto ni `scripts/narracion.py`.
- No se agrega un selector de voz ni control de velocidad.
- No se persiste un historial de qué participante escuchó qué; la caché es
  solo por nombre, no por persona.

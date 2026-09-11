# Correos de phishing más realistas — diseño

## Objetivo

Hacer que los ocho escenarios de phishing parezcan correos reales para una
persona no técnica, sin convertir el acabado visual, el logotipo o una imagen
en una señal de que el mensaje es legítimo.

## Diseño aprobado

- Todos los correos reciben una cabecera de marca compacta y accesible. Los
  mensajes legítimos y fraudulentos comparten el mismo nivel de acabado.
- La cabecera del mensaje rotula explícitamente `De:` y `Para:` para que el
  participante identifique sin ambigüedad el origen y el destinatario.
- `loteria-premiada` usa el nuevo banner `escenarios/phishing/premio-loteria.webp` y una
  redacción más breve, directa y urgente.
- `factura-sri` elimina la ilustración genérica; el adjunto sigue siendo la
  pieza visual que debe inspeccionarse.
- `rol-de-pagos` personaliza el saludo y convierte la dirección completa del
  portal legítimo en un enlace funcional que abre el mismo portal simulado que
  el sitio guardado.
- `secuestro-hilo` elimina la imagen genérica, conserva el PDF como adjunto,
  elimina la etiqueta artificial `(nueva)` de la cuenta y se publica en la ruta
  neutral `/seccion/phishing/pago-pension-colegio`. El identificador interno y
  la ruta anterior se conservan para no romper corridas ni enlaces existentes.
- `aviso-filtracion` usa el banner sobrio
  `escenarios/phishing/aviso-seguridad.webp`.
- En `quishing-actualice`, el marcador del banco abre primero el Centro de
  seguridad de la app. El buen final solo se acredita después de comprobar
  que no hay una actualización pendiente.
- Los escenarios restantes reciben una estructura visual acorde con su entidad
  sin sumar imágenes decorativas.
- La barra del navegador pasa de “Marcadores” a “Sitios guardados”, explica su
  función sin señalar la respuesta correcta y presenta cada entidad como un
  control visible con estados de foco y hover.
- Las instrucciones de la aplicación usan “tú/eres”; cada correo conserva la
  voz formal o informal propia de su remitente.
- Los escenarios cuyo estímulo cambia incrementan su versión.

## Accesibilidad y pedagogía

- Los datos decisivos permanecen como texto HTML aunque aparezcan también en
  un banner.
- Los banners son complementarios y llevan texto alternativo vacío para no
  duplicar la lectura.
- Las cabeceras se identifican como presentación de marca, no como sello de
  autenticidad.
- La decisión sigue basándose en dominio, petición, contexto y canal alterno.
- Los sitios guardados se anuncian como navegación y admiten teclado.

## Verificación

- Pruebas de interacción para el enlace legítimo, los sitios guardados y la
  nueva ruta.
- Pruebas de contenido para comprobar que las imágenes genéricas y `(nueva)`
  desaparecen y que las imágenes nuevas se muestran.
- Suite completa, lint, typecheck y build del frontend.

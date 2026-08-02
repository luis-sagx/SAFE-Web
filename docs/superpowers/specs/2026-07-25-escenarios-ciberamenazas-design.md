# Diseño: 35 escenarios interactivos de ciberamenazas

**Fecha:** 2026-07-25
**Proyecto:** MIC · Simulador de entrenamiento anti-fraude
**Estado:** diseño aprobado, pendiente plan de implementación

---

## 1. Objetivo

Construir 35 escenarios interactivos —7 por cada una de las cinco amenazas de mayor
impacto sobre usuarios no técnicos en Ecuador— que simulen situaciones realistas,
inmersivas y descriptivas, de modo que el participante aprenda a reconocer los
patrones del fraude por experiencia propia y no por una lista de consejos.

De los 7 escenarios de cada categoría, **5 son fraude y 2 son legítimos**. El
participante no sabe cuáles son cuáles hasta el debrief. Un simulador compuesto solo
de estafas no entrena criterio: entrena parálisis. Ver §3.1.

Las cinco amenazas:

1. Phishing (correo y web)
2. Smishing (SMS y WhatsApp)
3. Vishing (llamada telefónica)
4. Suplantación de identidad
5. Estafa electrónica (compra, venta y dinero)

## 2. Decisiones de diseño

| Decisión | Elección |
|---|---|
| **Audiencia** | Público general no técnico: adultos, comerciantes, amas de casa, jubilados, estudiantes. Escenarios de vida cotidiana, no de oficina corporativa. |
| **Mecánica** | Variada según amenaza. Cada categoría usa la interfaz que la hace creíble: bandeja de correo, hilo de SMS, llamada con voz, perfil de red social, marketplace. |
| **Marcas** | Ficticias pero reconocibles para el ecuatoriano. Se imita el estilo, nunca el logo real. Evita riesgo legal y evita que la app se lea como sitio de phishing verdadero. |
| **Progresión** | Dificultad creciente 1 → 5 dentro de cada categoría, con el **piso subido**: el nivel 1 ya es "fácil-medio". Sin faltas de ortografía burdas ni enlaces `bit.ly` evidentes. |
| **Casos legítimos** | 2 por categoría, intercalados sin aviso entre los de fraude. En ellos el final malo es la **desconfianza excesiva**. Además, todo escenario incluye elementos legítimos como distractores. |
| **Narrativa** | Casos independientes sobre un universo compartido. Jugables en cualquier orden. |
| **Módulos previos** | Se reubican los que encajan; el resto se jubila o pasa a sección aparte. |

### 2.1 Por qué el piso de dificultad va subido

El fraude que hoy circula en Ecuador ya no tiene los defectos del fraude de hace cinco
años. Los mensajes están bien redactados, los sitios están bien copiados, las voces se
clonan y los datos personales vienen de filtraciones reales. Un escenario cuya única
pista sea una falta de ortografía enseña a detectar una amenaza que ya no existe y, peor,
deja al participante con la falsa confianza de que "si se ve bien, es real".

### 2.2 Universo compartido

| Entidad ficticia | Equivalente real |
|---|---|
| Banco del Litoral | Banca privada |
| PagoYa | App de transferencias/pagos móviles |
| SRI-EC | Servicio de Rentas Internas |
| Seguro Social | IESS |
| Tránsito EC | ANT |
| Megahogar | Almacén de electrodomésticos |
| Envíos Rápido | Courier / paquetería |
| Mercado Vecino | Marketplace de compraventa |
| MoviClaro | Operadora móvil |

Repetir estas marcas entre escenarios entrena reconocimiento de marca sin encadenar la
narrativa: cualquier escenario se juega suelto. La familiaridad de marca es justamente el
músculo que la estafa explota, así que conviene ejercitarlo.

## 3. Anatomía de un escenario

Los 25 se definen con las mismas ocho piezas:

| Pieza | Qué es |
|---|---|
| **Contexto** | Dónde está el usuario y qué esperaba que pasara |
| **Superficie** | La UI simulada |
| **Objetivo** | Lo que el usuario cree que está logrando |
| **Anzuelo** | El mecanismo del fraude |
| **Señales** | 3–5 pistas plantadas dentro de la UI, descubribles |
| **Punto de no retorno** | La acción exacta que sella el daño |
| **Finales** | Cayó / dudó pero cayó / lo evitó verificando |
| **Debrief** | Señales reveladas + regla de oro + qué hacer si ya caíste |

### Reglas de diseño no negociables

1. **El objetivo del usuario nunca es "detectar la estafa".** Es comprar, cobrar,
   salvar a su hijo, no perder el bono. Si el enunciado avisa que hay fraude, no
   entrena nada: en la vida real nadie avisa.
2. **Las señales viven dentro de la UI, no en el texto de instrucciones.** Se
   descubren pasando el mouse, ampliando, bajando, revisando una fecha. El gesto
   físico es parte de lo que se aprende.
3. **Siempre existe un final "lo evitó verificando"** que sea una acción concreta y
   repetible fuera de la app, no una intuición.
4. **Todo escenario cierra con qué hacer si ya caíste.** La vergüenza es lo que
   impide denunciar a tiempo, y las primeras horas son las que salvan el dinero.
5. **Todo escenario contiene elementos legítimos.** La bandeja trae cuatro correos
   reales y uno falso; el hilo del banco tiene SMS verdaderos arriba; el marketplace
   muestra vendedores buenos junto al malo. Sin contexto real no hay discriminación
   posible, solo reconocimiento del único objeto en pantalla.

### 3.1 Casos legítimos: por qué existen

Un set compuesto solo de fraudes enseña una sola regla: desconfía de todo. Esa regla da
la respuesta correcta en el 100% de los escenarios y en una fracción de la vida real,
donde el banco sí llama por un consumo clonado, el colegio sí cambia de cuenta, la
hermana sí cambia de número y la multa sí existe. El participante sale del entrenamiento
peor equipado que antes: paralizado ante lo real y todavía vulnerable ante un fraude
bien hecho, porque nunca practicó **discriminar** — solo practicó negar.

Hay además una lección que **únicamente** puede enseñarse con casos legítimos:
**verificar por tu propio canal funciona igual de bien para lo verdadero que para lo
falso.** Es la única acción que no obliga a adivinar: si es fraude, lo descubres; si es
real, lo confirmas y actúas. En un set de puros fraudes esa lección es invisible, porque
desconfiar siempre acierta por accidente.

Reglas para los 10 casos legítimos:

1. **El final malo es la desconfianza excesiva**, y tiene un costo concreto y narrado:
   la multa se duplica, la tarjeta clonada sigue gastando, la mamá pasa la noche
   varada, se pierde el arriendo.
2. **Siempre son verificables.** Aplicar el procedimiento correcto —salir del canal
   que te contactó y volver por el tuyo— confirma que son reales. Nunca dependen de
   corazonadas.
3. **Cada uno es espejo de un fraude del set.** Misma superficie, mismo pretexto,
   discriminadores distintos. L-I1 espeja a I1; L-E2 espeja a E5. Se aprende comparando.
4. **El menú no los delata.** Los títulos de las tarjetas son neutros y describen la
   situación, nunca el veredicto: "Un mensaje del colegio", no "Correo falso del colegio".
5. **El puntaje penaliza el falso positivo.** Tratar un caso legítimo como fraude y no
   actuar cuenta como error, igual que caer en una estafa.

#### Los cuatro discriminadores que el set enseña

Emergen de comparar cada fraude con su espejo legítimo, y valen más que cualquier lista
de señales sueltas:

| Discriminador | Legítimo | Fraude |
|---|---|---|
| **¿Qué te piden?** | Que actúes por tu cuenta, en tu app, en la ventanilla | Credenciales, códigos, o dinero, en el momento |
| **¿Resiste la verificación?** | Sale confirmado al verificar por tu canal | Se cae, o presionan para que no verifiques |
| **¿Cómo reacciona a tu duda?** | Sin molestarse; te espera | Excusas, prisa, culpa, o desaparece |
| **¿Adónde va el dinero?** | A la entidad, por su canal oficial | A una persona natural, o a una cuenta nueva |

El tercero —la reacción a la duda— es el más fiable de todos y el más fácil de usar para
un usuario no técnico: **quien es legítimo nunca se ofende porque verifiques.** No exige
leer un dominio ni entender un OTP.

---

## 4. Phishing — correo y web

### P1 · Factura electrónica que sí esperabas *(fácil-medio)*

- **Contexto:** el usuario compró un artículo ayer en un local y espera su factura electrónica.
- **Superficie:** bandeja de correo en laptop, con varios mensajes reales del día.
- **Objetivo:** descargar la factura para su registro.
- **Anzuelo:** correo de "SRI-EC — Comprobantes", redacción correcta y formato institucional, con adjunto `Factura_Electronica_0987.pdf.exe` mostrado con ícono de PDF.
- **Señales:** doble extensión oculta tras el ícono; remitente `sri.comprobantes@correo-sri.com`; el SRI no envía las facturas de los comercios, las envía el comercio; el monto no coincide con lo que compró.
- **Punto de no retorno:** abrir el adjunto.
- **Finales:** abre el adjunto → malware / revisa el remitente y el monto pero abre igual → malware / entra al portal del SRI por su cuenta y confirma que no hay tal comprobante.
- **Debrief:** un archivo ejecutable disfrazado de documento sigue siendo el vector más barato. Regla de oro: la factura la emite quien te vendió, y se verifica entrando tú al portal oficial.

### P2 · Quishing — "Actualice sus datos" *(medio)*

- **Contexto:** el Banco del Litoral **sí** pidió actualización de datos ese mes; hay un aviso legítimo dentro de la app.
- **Superficie:** correo con un QR grande y ninguna URL visible; simulador de escaneo que muestra la vista previa del enlace.
- **Objetivo:** cumplir con la actualización antes de que le limiten la cuenta.
- **Anzuelo:** el QR oculta el destino. No hay texto que inspeccionar, no hay enlace sobre el que pasar el mouse.
- **Señales:** el destino real es `litoral-actualiza.web.app`; el pedido llegó por correo y no por la app donde estaba el aviso verdadero; el formulario pide clave de acceso, que una actualización de datos nunca necesita.
- **Punto de no retorno:** completar el formulario del sitio escaneado.
- **Finales:** completa el formulario / lee la URL en la vista previa y se detiene / hace la actualización entrando directamente a la app.
- **Debrief:** **un QR es un enlace que no puedes leer antes de tocarlo.** Regla de oro: escanear, leer la URL en la vista previa, y recién decidir. Vale igual para los QR pegados en locales, surtidores y parquímetros.

### P3 · "Alguien inició sesión desde Bogotá" *(medio-alto)*

- **Contexto:** correo de alerta de seguridad, del tipo que el banco sí envía.
- **Superficie:** correo impecable —sin faltas, logo correcto, formato idéntico— y sitio clonado con formulario de dos pasos.
- **Objetivo:** cerrar el acceso de un intruso.
- **Anzuelo:** el botón que se siente seguro es la trampa: **"No fui yo"**. El dominio es `bancodellitoral.com.ec.seguridad-alertas.com` — el dominio real es lo que está **inmediatamente antes de la primera barra**, y aquí eso es `seguridad-alertas.com`. Tras la clave, la página pide el OTP: el atacante está entrando en vivo mientras el usuario escribe.
- **Señales:** el dominio leído de derecha a izquierda; el botón "seguro" que exige credenciales; el pedido de OTP dentro de una página web en lugar de dentro de la app.
- **Punto de no retorno:** entregar el código OTP.
- **Finales:** entrega clave y OTP → cuenta vaciada / entrega la clave pero se detiene ante el OTP → cambia contraseña a tiempo / entra por la app y verifica que no hubo tal acceso.
- **Debrief:** el OTP también se roba, y se roba en tiempo real. Regla de oro: leer el dominio de derecha a izquierda; ninguna alerta se atiende desde el enlace de la alerta.

### P4 · Cobro dirigido con tus datos reales *(difícil)*

- **Contexto:** el usuario compró en línea y espera un paquete.
- **Superficie:** correo de Envíos Rápido y pasarela de pago clonada.
- **Objetivo:** pagar un arancel menor para que le entreguen su pedido.
- **Anzuelo:** el correo trae su nombre completo, su cédula parcial `0987****` y el producto exacto que compró —datos de una filtración de un comercio— y cobra **$2.40**.
- **Señales:** el monto diminuto, calculado para pasar bajo el umbral de sospecha; el cobro va a una cuenta de persona natural en PagoYa; el courier cobra aranceles al entregar, no por enlace; el correo llegó antes que cualquier aviso de la transportadora.
- **Punto de no retorno:** ingresar los datos de la tarjeta en la pasarela clonada (el objetivo no son los $2.40, son los datos de la tarjeta).
- **Finales:** paga → tarjeta comprometida / duda del monto pero paga "por si acaso" / rastrea el pedido en la web oficial del courier y ve que no hay arancel pendiente.
- **Debrief:** **que conozcan tus datos no prueba que sean ellos.** Es la lección más contraintuitiva del set, porque el reflejo natural es al revés. Regla de oro: los datos personales confirman que hubo una filtración, no que quien escribe sea legítimo.

### P5 · Secuestro de hilo de correo *(máximo)*

- **Contexto:** el usuario tiene un hilo de correo real y en curso con la secretaría de la escuela de su hijo sobre la pensión de julio.
- **Superficie:** el mismo hilo de correo, con todo el historial citado abajo.
- **Objetivo:** pagar la pensión antes del cierre de mes.
- **Anzuelo:** la cuenta de la secretaria fue comprometida. Responden **dentro del hilo verdadero**, desde la dirección verdadera, con un PDF corregido y un número de cuenta nuevo: "cambiamos de banco".
- **Señales:** no hay dominio falso, no hay urgencia artificial, no hay error de redacción. La única anomalía es el hecho en sí: **un cambio de número de cuenta**.
- **Punto de no retorno:** transferir a la cuenta nueva.
- **Finales:** transfiere → dinero perdido / nota el cambio de cuenta pero lo confirma respondiendo el mismo correo (el atacante responde que sí) → transfiere igual / llama al número de la escuela que ya tenía y descubre el fraude.
- **Debrief:** este escenario existe para demostrar que las pistas superficiales se agotan. Regla de oro: **todo cambio de número de cuenta se confirma por llamada al número que ya tenías**, jamás por el canal donde llegó el aviso. Responder el correo para verificar es preguntarle al estafador si es estafador.

### L-P1 · Aviso de vencimiento de tarjeta — **legítimo** *(medio)*

- **Espeja a:** P3, la alerta de seguridad falsa.
- **Contexto:** correo del Banco del Litoral avisando que la tarjeta vence en 30 días y que debe actualizar sus datos para la renovación.
- **Superficie:** bandeja de correo, y la app del banco disponible para contrastar.
- **Objetivo:** que le renueven la tarjeta antes de un viaje.
- **Marcadores de legitimidad:** el dominio es `bancodellitoral.com.ec`, limpio, sin subdominios añadidos; **no pide clave ni código**; no trae formulario, dice "ingrese a su app"; el plazo es de 30 días, no de 24 horas; el mismo aviso aparece dentro de la app.
- **Finales:** lo borra por miedo → la tarjeta se bloquea en pleno viaje / lo ignora pero entra a la app por otra razón y lo descubre a tiempo / abre la app por su cuenta, confirma el aviso y actualiza ahí.
- **Debrief:** este es el aspecto de un correo bancario legítimo. El marcador más fuerte no es lo que trae, es lo que **no** pide: un banco real jamás necesita tu clave, porque ya la tiene guardada de otra forma. Regla de oro: el correo legítimo te manda a tu app; el fraudulento te trae un formulario.

### L-P2 · Aviso real de filtración de datos — **legítimo** *(difícil)*

- **Espeja a:** P4, el cobro dirigido que usa datos filtrados.
- **Contexto:** correo de una tienda en línea donde el usuario sí compra: "un incidente de seguridad expuso tu correo, teléfono e historial de pedidos. Cambia tu contraseña."
- **Superficie:** correo, buscador de noticias, y el sitio de la tienda.
- **Objetivo:** proteger sus cuentas.
- **Marcadores de legitimidad:** no pide contraseña ni datos, pide que **la cambies tú**; explica qué se expuso y qué no; la filtración aparece en noticias al buscarla; el enlace apunta al dominio real, y el cambio se puede hacer entrando por cuenta propia sin tocar el enlace.
- **Finales:** lo descarta como phishing y no hace nada → meses después llega el cobro dirigido de P4 con esos mismos datos, y ya no tiene defensa / cambia la clave solo en esa tienda / cambia la clave ahí y en todo sitio donde repitió esa contraseña.
- **Debrief:** el escenario que conecta las dos mitades del set. La filtración real de hoy es la munición del fraude dirigido de mañana. Reglas de oro: cambiar la clave entrando tú al sitio, nunca por el enlace; y no repetir contraseñas, porque una filtración en una tienda abre todas las puertas que compartan esa clave.

---

## 5. Smishing — SMS y WhatsApp

### S1 · "Bono Ciudadano 2026 — verifique si califica" *(fácil-medio)*

- **Contexto:** hubo noticias reales sobre bonos del Estado; la economía familiar está ajustada.
- **Superficie:** WhatsApp. El mensaje llega **reenviado por la tía del usuario**, dentro del chat familiar.
- **Objetivo:** averiguar si califica para el bono.
- **Anzuelo:** formulario que pide cédula, nombres completos y **número de cuenta "para el depósito"**.
- **Señales:** dominio `bono-ciudadano2026.up.railway.app` en vez de `.gob.ec`; lo reenvió un familiar, no el Estado, y nadie sabe de dónde salió el original; el Estado no pide tu número de cuenta por un formulario web abierto.
- **Punto de no retorno:** enviar el formulario.
- **Finales:** envía los datos → suplantación posterior / pregunta en el chat familiar de dónde salió y nadie sabe → se detiene / busca el bono en el sitio `.gob.ec` y confirma que no existe.
- **Debrief:** **reenviado por alguien de confianza no significa confiable.** La cadena familiar es el mejor distribuidor de fraude que existe, porque hereda la confianza sin heredar la verificación. Regla de oro: los trámites del Estado se consultan en `.gob.ec`, escrito por uno mismo.

### S2 · Citación de tránsito con plazo *(medio)*

- **Contexto:** el usuario sí tiene carro y sí ha tenido multas antes.
- **Superficie:** SMS y web copiada de Tránsito EC con formulario de tarjeta.
- **Objetivo:** pagar antes del viernes para que el valor no se duplique.
- **Anzuelo:** "Tiene una citación pendiente. Cancele antes del viernes o el valor se duplica."
- **Señales:** el mensaje no menciona su placa: **le pide que él la escriba**, porque no la saben; la presión de plazo; el cobro de una entidad pública por un enlace enviado, y no por el portal ni por la ventanilla.
- **Punto de no retorno:** ingresar los datos de la tarjeta.
- **Finales:** paga → tarjeta comprometida / nota que le piden la placa y sospecha / consulta sus multas entrando él mismo al portal oficial.
- **Debrief:** cuando una institución de verdad te escribe, ya tiene tus datos; cuando te los pide, está pescando. Regla de oro: verifica en el canal oficial que **tú** buscas, nunca en el que te mandan.

### S3 · Paquete retenido por $1.85 *(medio-alto)*

- **Contexto:** el usuario sí está esperando un pedido esa semana.
- **Superficie:** SMS y web calcada de Envíos Rápido, incluyendo rastreo falso que muestra el paquete "en aduana".
- **Objetivo:** liberar su paquete.
- **Anzuelo:** monto trivial, tono sereno, sin urgencia agresiva. Tras el pago: "para liberar el envío, confírmenos el código que le acaba de llegar."
- **Señales:** el monto pequeño **es** la estrategia, no un descuido; el pedido de un código de verificación después de un pago ya realizado; el dominio `enviosrapido-ec.shop`.
- **Punto de no retorno:** entregar el código recibido por SMS.
- **Finales:** paga y entrega el código → tarjeta vaciada / paga pero se niega a dar el código → pérdida limitada a $1.85 y tarjeta a salvo / rastrea el envío en la web oficial y ve que no hay retención.
- **Debrief:** los $1.85 no son el objetivo; son el precio de entrada para pedirte el código. Regla de oro: **el código no se comparte con nadie, por ningún motivo, ni siquiera con quien ya te cobró.**

### S4 · El SMS falso dentro del hilo real del banco *(difícil)*

- **Contexto:** el usuario recibe habitualmente los SMS de su banco en un hilo identificado como "LITORAL".
- **Superficie:** ese mismo hilo, con los mensajes verdaderos arriba; y una llamada de refuerzo con música de espera y protocolo de atención.
- **Objetivo:** reversar un débito de $780 que no reconoce.
- **Anzuelo:** suplantación del remitente alfanumérico: el mensaje falso **aparece dentro de la conversación verdadera**, y trae un número "de emergencias antifraude" al que llamar.
- **Señales:** aparecer en el hilo verdadero no prueba nada, porque el identificador de remitente es falsificable; el número de soporte venía **dentro del mensaje**; en la llamada le piden un código de verificación.
- **Punto de no retorno:** entregar el código durante la llamada.
- **Finales:** llama al número del SMS y entrega el código → cuenta vaciada / llama pero se niega al código / abre su app y ve que no existe tal débito, y si dudara llamaría al número del reverso de su tarjeta.
- **Debrief:** este es el escenario que rompe la creencia de que el canal valida el mensaje. Regla de oro: **nunca uses el número de contacto que viene en el mensaje.** Corta el canal y vuelve por el tuyo: la app, o el reverso de la tarjeta.

### S5 · Portación fraudulenta de la línea (SIM swap) *(máximo)*

- **Contexto:** día normal.
- **Superficie:** SMS de la operadora, luego la barra de estado del celular cambiando a "Sin servicio", y correos de restablecimiento de contraseña llegando en vivo. El escenario transcurre en una ventana de ~20 minutos y el orden de las acciones importa.
- **Objetivo:** primero, responder a un aviso de la operadora; después, contener el daño.
- **Anzuelo:** "MoviClaro: solicitud de cambio de SIM en trámite. Si no fue usted, responda NO." Responder NO confirma que la línea está activa y que el titular responde, lo que alimenta el trámite de portación.
- **Señales:** una operadora no gestiona la cancelación de un trámite por respuesta a un SMS; la pérdida súbita de señal coincidiendo con actividad en el correo; los avisos de restablecimiento que él no pidió.
- **Punto de no retorno:** dejar pasar los minutos sin bloquear la banca ni contactar a la operadora.
- **Finales:** ignora la falta de señal como falla de antena → cuentas comprometidas / llama a la operadora pero deja la banca sin bloquear / desde otro teléfono llama a la operadora y bloquea la banca en el mismo movimiento.
- **Debrief:** **quedarse sin señal de golpe es una alerta roja, no una falla de la antena.** Reglas de oro: nunca responder a solicitudes de trámite por SMS; ante pérdida súbita de línea, llamar a la operadora desde otro teléfono y bloquear la banca de inmediato; y mantener el segundo factor en una app de autenticación, no en SMS.

### L-S1 · Alerta real de consumo — **legítimo** *(medio)*

- **Espeja a:** S4, el SMS falso dentro del hilo del banco.
- **Contexto:** SMS del banco: "Consumo de $412 en Megahogar, 14:22. Si no lo reconoce, ingrese a su app o llame al número de su tarjeta." El usuario no hizo ese consumo: **su tarjeta fue clonada de verdad.**
- **Superficie:** hilo de SMS del banco y app bancaria.
- **Objetivo:** entender qué pasó con su dinero.
- **Marcadores de legitimidad:** **no trae enlace**; no pide datos ni códigos; no da un número nuevo, remite al de la tarjeta; el consumo aparece efectivamente en la app.
- **Finales:** lo ignora asumiendo que es smishing → los consumos siguen durante días / llama al 1700 que busca en Google (cae en V5) / abre su app, ve el consumo, y bloquea la tarjeta desde ahí.
- **Debrief:** el aviso puede ser real **y** el procedimiento sigue siendo el mismo: no uses el número del mensaje, entra por tu app. Por eso este procedimiento es tan bueno — no te obliga a acertar si el mensaje era verdadero. Regla de oro: un SMS bancario legítimo informa; nunca pide.

### L-S2 · Una multa que sí existe — **legítimo** *(difícil)*

- **Espeja a:** S2, la citación falsa con plazo.
- **Contexto:** SMS de Tránsito EC: citación registrada, con **su placa completa**, artículo infringido, fecha y lugar. El usuario efectivamente pasó por ahí ese día.
- **Superficie:** SMS y portal oficial de Tránsito EC.
- **Objetivo:** resolver la multa sin recargo.
- **Marcadores de legitimidad:** el mensaje **ya trae su placa**, no se la pide; no hay enlace de pago, remite al portal y a las ventanillas; el plazo es el legal, no un "antes del viernes"; la citación aparece al consultar por cuenta propia.
- **Finales:** la ignora creyendo que es smishing → el valor se duplica y se le traba la matrícula / consulta pero paga por un enlace que busca apurado / consulta en el portal oficial, confirma, y paga por canal oficial.
- **Debrief:** el discriminador central es **quién tiene los datos**. Cuando la institución es real, ya sabe tu placa; cuando es fraude, te la pide. Regla de oro: consulta siempre en el portal oficial escrito por ti — sirve tanto para descartar el fraude como para confirmar la deuda real.

---

## 6. Vishing — llamada telefónica

### V1 · "Departamento antifraude del Banco del Litoral" *(fácil-medio)*

- **Contexto:** llamada entrante en horario de oficina.
- **Superficie:** pantalla de llamada con voz sintetizada, subtítulos, cronómetro y opciones de respuesta.
- **Objetivo:** bloquear un consumo de $412 en Ambato que no reconoce.
- **Anzuelo:** el agente es calmado y profesional, da su nombre, un número de caso y **los últimos 4 dígitos de la tarjeta**. Para bloquear pide el código que llegará por SMS.
- **Señales:** los 4 últimos dígitos están impresos en cualquier recibo, no prueban identidad; el banco jamás pide el código; "no cuelgue o se pierde el bloqueo".
- **Punto de no retorno:** dictar el código.
- **Finales:** dicta el código → cuenta vaciada / se niega al código pero sigue en la llamada dando otros datos / cuelga y llama al número del reverso de su tarjeta.
- **Debrief:** el guion profesional es parte del ataque, no una prueba de legitimidad. Regla de oro: cuelga y llama tú al número del reverso de la tarjeta.

### V2 · Falso soporte técnico *(medio)*

- **Contexto:** el internet de la casa ha estado lento estos días.
- **Superficie:** llamada más pantalla de laptop donde el usuario ve lo que va instalando.
- **Objetivo:** que le arreglen la conexión.
- **Anzuelo:** "su router fue comprometido, estamos llamando a todos los clientes del sector". Piden instalar un "programa de diagnóstico" —AnyDesk— y después: "abra su banca en línea para verificar que no le hayan sacado nada".
- **Señales:** la llamada no fue solicitada; la instalación de un programa de control remoto; el pedido de abrir el banco "para comprobar" —la comprobación es el robo.
- **Punto de no retorno:** entregar el código de acceso remoto.
- **Finales:** instala y entrega el código → transferencia hecha delante de sus ojos / instala pero no abre el banco / cuelga y llama al número de su operadora que consta en la factura.
- **Debrief:** nadie legítimo necesita ver tu pantalla para diagnosticar tu router. Regla de oro: ningún soporte real pide instalar control remoto en una llamada que tú no iniciaste, y ninguno pide que abras tu banca.

### V3 · Suplantación de autoridad *(medio-alto)*

- **Contexto:** llamada con ruido de oficina de fondo y transferencias entre "departamentos".
- **Superficie:** llamada larga, con escalamiento a un supuesto fiscal.
- **Objetivo:** evitar un problema legal grave.
- **Anzuelo:** "su cédula aparece vinculada a una cuenta con dinero de procedencia ilícita". Le ofrecen una salida: poner sus fondos en una **cuenta de resguardo del Estado** mientras se aclara. Y una condición: *es una investigación reservada, no comente esto con nadie, ni con su familia.*
- **Señales:** miedo combinado con aislamiento; ninguna autoridad pide dinero; ninguna autoridad prohíbe consultar con tu familia o tu abogado; no existen las "cuentas de resguardo".
- **Punto de no retorno:** transferir a la cuenta de resguardo.
- **Finales:** transfiere → ahorros perdidos / duda pero cumple el silencio y transfiere igual / corta, le cuenta a alguien y verifica en la Fiscalía.
- **Debrief:** **el aislamiento es la firma del fraude.** Todo el edificio del engaño se cae si la víctima le cuenta a una sola persona, y el estafador lo sabe. Regla de oro: cuando te prohíben contarlo, es estafa.

### V4 · Voz clonada con IA *(difícil)*

- **Contexto:** el hijo está de viaje —dato que el usuario publicó en sus propias redes.
- **Superficie:** llamada de número desconocido, con un fragmento de audio corto y ruidoso, y luego un tercero.
- **Objetivo:** salvar a su hijo.
- **Anzuelo:** se oye la voz del hijo, entrecortada, llorando: "mami, tuve un accidente". Entra un tercero exigiendo un depósito inmediato por PagoYa y no deja colgar.
- **Señales:** el audio es breve y de mala calidad **a propósito**, para tapar los defectos de la clonación; no permiten verificar ni colgar; el pago va a la cuenta de una persona natural; el detalle del viaje salió de una publicación pública.
- **Punto de no retorno:** hacer la transferencia.
- **Finales:** transfiere → dinero perdido / mantiene la llamada pero pide hablar más con "el hijo" y el audio se corta / cuelga y llama al hijo desde otro teléfono, o pregunta la palabra de seguridad familiar.
- **Debrief:** la clonación de voz ya no requiere más que unos segundos de audio público. Reglas de oro: acordar de antemano una **palabra de seguridad familiar**; colgar y llamar directamente; y revisar qué publica la familia sobre viajes y rutinas.

### V5 · La llamada que hiciste tú *(máximo)*

- **Contexto:** una transferencia por PagoYa quedó "en proceso". Es un problema real y el usuario está preocupado.
- **Superficie:** buscador con resultados, el primero un anuncio pagado; luego la llamada, con IVR, música de espera, nombre de asesor y número de ticket.
- **Objetivo:** destrabar su transferencia.
- **Anzuelo:** el número de soporte falso está posicionado como anuncio en el buscador. **El usuario llama.** Al haber iniciado él la llamada, baja toda la guardia: el sesgo de "yo llamé, entonces son ellos".
- **Señales:** el número salió de un buscador y no de la app; el resultado estaba marcado como anuncio; el "asesor" pide credenciales que ninguna consulta de estado necesita.
- **Punto de no retorno:** entregar clave o código durante una llamada que él mismo hizo.
- **Finales:** entrega el código → cuenta vaciada / sospecha tarde pero ya dio la clave / busca el número dentro de la app oficial y llama por ahí.
- **Debrief:** **la dirección de la llamada no prueba nada.** Este escenario cierra la categoría porque destruye la última defensa intuitiva que le queda al usuario ("yo marqué el número"). Regla de oro: el número de soporte se saca de dentro de la app oficial o del reverso de la tarjeta; nunca de un buscador.

### L-V1 · El banco que sí llama — **legítimo** *(medio)*

- **Espeja a:** V1, el falso departamento antifraude.
- **Contexto:** llamada del Banco del Litoral por un consumo atípico de $412. Es real y el consumo es fraudulento.
- **Superficie:** pantalla de llamada, y la app del banco disponible durante la llamada.
- **Objetivo:** frenar el consumo.
- **Marcadores de legitimidad:** solo pide que confirme **sí o no**, no pide clave ni código ni número de tarjeta; le dice que puede colgar y llamar al número del reverso si prefiere; no mete prisa; el consumo se ve en la app mientras hablan.
- **Finales:** cuelga convencido de que era estafa **y no hace nada más** → la tarjeta clonada sigue gastando toda la tarde / se queda en la llamada y entrega datos que ni siquiera le pidieron / cuelga, abre su app, ve el consumo y llama al número del reverso: el caso sigue vivo y la tarjeta se bloquea.
- **Debrief:** colgar está bien y siempre está bien. Pero **colgar no es el final del procedimiento**: si algo podía ser cierto, hay que volver por el canal propio. La mitad del trabajo no protege. Regla de oro: cuelga, y después verifica — no cuelgues y olvides.

### L-V2 · Mamá llamando desde otro teléfono — **legítimo** *(difícil)*

- **Espeja a:** V4, la voz clonada con IA.
- **Contexto:** llamada de un número desconocido. Es su mamá: se quedó sin batería y sin gasolina en la vía, de noche, y llama desde el celular del dueño de una tienda.
- **Superficie:** llamada, con opciones de verificación disponibles.
- **Objetivo:** ayudar a su mamá.
- **Marcadores de legitimidad:** acepta responder cualquier pregunta y **da la palabra de seguridad familiar** sin problema; acepta que le cuelgue y le devuelva la llamada a ese mismo número; el pago va a una gasolinera identificable con dirección, no a una cuenta personal; no hay prisa artificial, hay una urgencia real que resiste dos minutos de verificación.
- **Finales:** cuelga asumiendo estafa y bloquea el número → su mamá pasa la noche varada en la carretera / la ayuda sin verificar nada, acertando por suerte / le pregunta la palabra de seguridad, le devuelve la llamada a ese número, y resuelve.
- **Debrief:** la palabra de seguridad familiar sirve **en los dos sentidos**: descarta al impostor y confirma a los tuyos. Regla de oro: verificar toma dos minutos y quien es real te los concede sin ofenderse. Un secuestrador virtual no deja colgar; tu mamá sí.

---

## 7. Suplantación de identidad

### I1 · "Cambié de número" *(fácil-medio)*

- **Contexto:** mensaje de WhatsApp de un número desconocido con la foto de perfil real de su hermana, tomada de redes.
- **Superficie:** chat de WhatsApp.
- **Objetivo:** ayudar a su hermana con una transferencia urgente.
- **Anzuelo:** "cambié de número, guárdalo. Estoy en el banco y no me pasa la clave, ¿me haces una transferencia y te la devuelvo?"
- **Señales:** solo texto —esquiva la nota de voz y la videollamada con excusas—; urgencia; la cuenta destino está a nombre de un tercero; no menciona nada que solo la hermana sabría.
- **Punto de no retorno:** hacer la transferencia.
- **Finales:** transfiere → dinero perdido / pide una nota de voz, recibe una excusa y transfiere igual / llama al número viejo y su hermana contesta.
- **Debrief:** la foto de perfil es pública y no prueba nada. Regla de oro: verifica llamando **al número viejo**, no al nuevo; y pide una prueba que solo esa persona pueda dar.

### I2 · Cuenta clonada en redes *(medio)*

- **Contexto:** le escribe una amiga por mensaje directo pidiendo prestado $200 hasta el viernes.
- **Superficie:** red social simulada, con perfil navegable.
- **Objetivo:** ayudar a una amiga en apuros.
- **Anzuelo:** perfil idéntico —mismas fotos, mismo nombre, misma portada— creado a partir del original.
- **Señales descubribles navegando el perfil:** cuenta creada hace 3 días; 40 amigos en vez de 800; sin publicaciones anteriores a esta semana; la amiga real sigue activa en su cuenta de siempre; varios contactos en común recibieron el mismo mensaje.
- **Punto de no retorno:** transferir.
- **Finales:** transfiere / revisa el perfil, sospecha, pero cede ante la insistencia / la llama por el canal de siempre y confirma que es una cuenta clonada.
- **Debrief:** clonar un perfil cuesta diez minutos y no requiere hackear nada. Regla de oro: revisa fecha de creación e historial, y verifica siempre por el canal de siempre.

### I3 · El código de 6 dígitos *(medio-alto)*

- **Contexto:** le escribe un amigo **real**, desde su cuenta real, en el chat de siempre, con todo el historial verdadero. Esa cuenta ya fue robada.
- **Superficie:** chat de WhatsApp.
- **Objetivo:** hacerle un favor a un amigo.
- **Anzuelo:** "disculpa, te mandé un código de verificación por error, ¿me lo reenvías?"
- **Señales:** el código que llegó es de **su propia** cuenta, no de la del amigo; nadie necesita jamás un código ajeno; el mensaje llega justo después de que él recibiera el SMS.
- **Punto de no retorno:** reenviar el código.
- **Finales:** reenvía → pierde su WhatsApp y con su nombre y su foto empiezan a estafar a toda su lista / duda, pregunta por qué, y el atacante insiste / no lo reenvía y le avisa al amigo por otro canal que su cuenta está robada.
- **Debrief:** este escenario enseña algo que ningún otro enseña: **ser víctima te convierte en el arma para la siguiente víctima.** Reglas de oro: nadie necesita tu código, nunca; activa la verificación en dos pasos con PIN; y si te roban la cuenta, avisa a tus contactos por otro canal de inmediato.

### I4 · Un crédito a su nombre *(difícil)*

- **Contexto:** llamada de cobranza por un préstamo de $1.800 que nunca pidió.
- **Superficie:** dos tiempos. Presente: notificación del buró y llamada de cobranza. Retrospectiva jugable: hace cuatro meses, postulando a un trabajo por WhatsApp, envió **foto de cédula por ambos lados y una selfie sosteniéndola** como "requisito de la vacante". El empleo nunca existió.
- **Objetivo:** en la retrospectiva, conseguir el trabajo. En el presente, contener el daño.
- **Anzuelo:** la recolección de documentos de identidad disfrazada de proceso de contratación.
- **Señales (retrospectiva):** se piden documentos completos antes de cualquier entrevista; no hay empresa verificable detrás; el "reclutador" opera solo por WhatsApp; cédula + selfie es una llave completa de identidad.
- **Punto de no retorno:** enviar la selfie con la cédula.
- **Finales:** en el presente, la calidad de la reacción define el desenlace: denunciar en Fiscalía, notificar a las entidades financieras, revisar el buró de crédito y dejar constancia; o no hacer nada y acumular deudas ajenas.
- **Debrief:** único escenario del set centrado en la reacción y no en la prevención, porque la suplantación documental casi siempre se descubre tarde. Regla de oro: ningún proceso serio pide cédula y selfie antes de contratarte; y ante suplantación, denuncia formal cuanto antes —es lo que permite desconocer las deudas.

### I5 · Deepfake en videollamada *(máximo)*

- **Contexto:** hay un acuerdo comercial en curso, con un socio conocido y un pago programado.
- **Superficie:** videollamada corta, imagen ligeramente pixelada, audio limpio.
- **Objetivo:** cerrar el pago acordado.
- **Anzuelo:** el socio en video pide adelantar el pago a **una cuenta distinta a la acordada** y mantenerlo entre ellos.
- **Señales:** la cara se deforma cuando gira la cabeza; no responde a peticiones en vivo ("hazme una seña con la mano", "tócate la oreja"); el cambio de cuenta a última hora; el pedido de confidencialidad.
- **Punto de no retorno:** transferir a la cuenta nueva.
- **Finales:** transfiere → dinero perdido / pide la seña en vivo, la imagen falla, pero acepta la excusa de "mala conexión" / corta y llama al número de siempre para confirmar.
- **Debrief:** **ver y oír ya no es prueba de identidad.** Reglas de oro: pedir una interacción en vivo que el modelo no pueda seguir; y confirmar todo cambio de cuenta por un canal distinto al de la solicitud.

### L-I1 · Su hermana sí cambió de número — **legítimo** *(medio)*

- **Espeja a:** I1, el "cambié de número" fraudulento. Espejo exacto: misma superficie, mismo pretexto, mismo pedido.
- **Contexto:** WhatsApp de un número nuevo con la foto de su hermana: cambió de operadora y necesita que le preste $150 hasta el viernes.
- **Superficie:** chat de WhatsApp, con nota de voz y videollamada disponibles.
- **Objetivo:** ayudar a su hermana.
- **Marcadores de legitimidad:** manda la nota de voz apenas se la piden, **sin excusas**; acepta la videollamada; responde el dato que solo ella sabría; la cuenta de destino está **a su propio nombre**; y cuando él le dice que va a verificar, ella responde "haces bien".
- **Finales:** la bloquea sin verificar → su hermana se queda sin la ayuda y él pasa un mes creyendo que casi lo estafan / transfiere sin verificar, acertando por suerte / pide nota de voz y verifica el nombre de la cuenta antes de transferir.
- **Debrief:** el escenario más importante del set, porque aísla el discriminador conductual. Ante la misma petición, el estafador de I1 pone excusas para no mandar audio; ella lo manda en diez segundos. Regla de oro: **quien es real no se molesta porque verifiques.** Es la única señal que no exige saber nada técnico.

### L-I2 · Un trámite que sí pide tu cédula — **legítimo** *(difícil)*

- **Espeja a:** I4, la falsa vacante que recolecta documentos.
- **Contexto:** el usuario ya firmó contrato de arriendo y la administradora del edificio le pide copia de cédula para el registro de residentes.
- **Superficie:** correo institucional de la administradora y el contrato ya firmado.
- **Objetivo:** completar el trámite y recibir las llaves.
- **Marcadores de legitimidad:** el pedido viene **después** del contrato, no antes; la empresa existe y es verificable; el pedido llega por el correo institucional que ya venía usando; piden solo la cédula, **no una selfie sosteniéndola**; hay un propósito declarado y acotado.
- **Finales:** se niega a todo y pierde el arriendo / manda la cédula limpia por WhatsApp a un número cualquiera / entrega la copia **con marca de agua** — "solo para registro de residentes, Edificio X, julio 2026"— por el canal oficial.
- **Debrief:** en la vida real sí toca entregar documentos, y negarse siempre no es una estrategia viable. Reglas de oro: la marca de agua con propósito y fecha inutiliza la copia para cualquier otro trámite; nunca envíes selfie con cédula, que es la llave completa; y desconfía del orden invertido — documentos **antes** de que exista una relación es la firma del fraude.

---

## 8. Estafa electrónica — compra, venta y dinero

### E1 · El producto que nunca llega *(fácil-medio)*

- **Contexto:** el usuario necesita una lavadora y encuentra una en Mercado Vecino un 40% bajo el precio de mercado.
- **Superficie:** marketplace con perfil de vendedor navegable y chat.
- **Objetivo:** comprar la lavadora antes de que se la lleve otro.
- **Anzuelo:** vendedor rápido y amable que exige el pago completo por adelantado.
- **Señales:** precio irreal; la cuenta de destino está **a nombre de otra persona**; se niega a la entrega presencial con excusas; "tengo tres interesados"; perfil creado hace poco y sin calificaciones.
- **Punto de no retorno:** transferir el pago completo.
- **Finales:** transfiere → el vendedor desaparece / transfiere la mitad "de anticipo" → pierde la mitad / propone entrega presencial y el vendedor se cae del trato, confirmando la sospecha.
- **Debrief:** proponer una entrega presencial es la prueba más barata que existe. Reglas de oro: entrega en persona, en lugar público o frente a una UPC; pago contra entrega; cuenta a nombre distinto al del vendedor es bandera roja.

### E2 · Saldo contable vs. saldo disponible *(medio)* — *módulo existente, migrado*

- **Contexto:** el usuario vende un artículo y acordó entrega presencial.
- **Superficie:** app bancaria del vendedor y chat con el comprador.
- **Objetivo:** cerrar la venta y entregar.
- **Anzuelo:** el comprador muestra el comprobante de la transferencia y presiona para llevarse el producto ya. En la app del vendedor el dinero aparece en **saldo contable**, no en disponible.
- **Señales:** la diferencia entre saldo contable y saldo disponible; la prisa del comprador; el comprobante como única evidencia.
- **Punto de no retorno:** entregar el producto antes de que acredite.
- **Finales:** entrega → la transferencia se reversa o nunca acredita / espera y el comprador se molesta y se va / espera a que acredite en disponible y la venta se concreta o se cae sin pérdida.
- **Debrief:** regla de oro: **solo cuenta el saldo disponible.** Una transferencia puede reversarse, quedar en trámite o no existir.

### E3 · El vuelto *(medio-alto)*

- **Contexto:** negocio pequeño, hora de mucho movimiento.
- **Superficie:** app bancaria propia, y el celular del cliente mostrando una captura.
- **Objetivo:** cobrar $50 y despachar al cliente.
- **Anzuelo:** el cliente "se equivoca" y transfiere $350, muestra la captura y pide con pena que le devuelvan los $300 por PagoYa.
- **Señales:** **la captura no es dinero** —hay que mirar la propia app, no la pantalla ajena—; el error a favor tuyo es el anzuelo; el apuro por el vuelto.
- **Punto de no retorno:** devolver los $300 antes de confirmar el ingreso en la propia app y ver que sea definitivo.
- **Finales:** devuelve los $300 → el depósito original se reversa y queda debiendo / verifica en su app, ve el ingreso pero pendiente, y devuelve igual / verifica y espera a que el ingreso sea definitivo antes de devolver nada.
- **Debrief:** la generosidad forzada es una técnica, no un accidente. Reglas de oro: nunca devolver dinero contra una captura; verificar en la app propia; y si el ingreso es real pero reciente, esperar antes de devolver.

### E4 · Tareas remuneradas *(difícil)*

- **Contexto:** el usuario está buscando trabajo y recibe el contacto de una "reclutadora" por WhatsApp.
- **Superficie:** chat de WhatsApp, panel de tareas y grupo de Telegram con capturas de retiros.
- **Objetivo:** generar un ingreso extra.
- **Anzuelo:** las primeras tareas —dar like a videos— **le pagan de verdad**: $8, retirados sin problema. Luego llega el "lote premium": recargar $60 para desbloquearlo y ganar $95.
- **Señales:** te pagan primero para comprar tu confianza; tienes que poner dinero para trabajar; el grupo está lleno de testimonios de cómplices; los retiros se bloquean hasta "completar el lote"; siempre falta un lote más.
- **Punto de no retorno:** la primera recarga.
- **Finales:** recarga y sigue recargando para "recuperar" → pérdida creciente / recarga una vez y se detiene → pierde $60 / no recarga y se retira con los $8 ganados.
- **Debrief:** el pago inicial real es la inversión del estafador, no un error. Regla de oro: **un trabajo nunca te pide dinero.** Si tienes que pagar para trabajar, no es trabajo.

### E5 · La inversión que crece en pantalla *(máximo)*

- **Contexto:** semanas de conversación con un "asesor" de Litoral Invest. Amable, paciente, nunca presiona. Pregunta por la familia.
- **Superficie:** plataforma de inversión con dashboard que sube en tiempo real, testimonios y chat con el asesor a lo largo de varias sesiones.
- **Objetivo:** hacer crecer sus ahorros.
- **Anzuelo:** empieza con $200, el dashboard sube, **retira $80 sin ningún problema**. La confianza queda construida por su propia experiencia. Entonces reinvierte y coloca el bono de jubilación. Al querer retirar, aparece un "impuesto de liberación del 12%" que debe pagar por adelantado.
- **Señales:** rentabilidad garantizada; el retiro pequeño inicial como cebo; el cobro **para poder cobrar**; la relación personal cultivada antes del dinero; y la prueba definitiva: **la entidad no aparece en el registro de la Superintendencia de Bancos**.
- **Punto de no retorno:** pagar el "impuesto de liberación".
- **Finales:** paga el impuesto → pérdida total y aparece un segundo cobro / se detiene ahí y pierde lo invertido / verifica en la Superintendencia antes del primer depósito y no invierte nada.
- **Debrief:** el escenario más largo del set, porque el fraude de inversión no se comete en un minuto sino en semanas, y su arma es la relación. Reglas de oro: verificar la autorización de la entidad en la Superintendencia de Bancos **antes** de poner un dólar; "rendimiento garantizado" es siempre mentira; y ninguna plataforma legítima cobra por dejarte retirar tu dinero.

### L-E1 · Un vendedor honesto — **legítimo** *(medio)*

- **Espeja a:** E1, el producto que nunca llega.
- **Contexto:** el usuario busca una lavadora. Encuentra dos anuncios: uno 40% bajo el precio (el estafador de E1) y otro a precio de mercado.
- **Superficie:** marketplace con ambos vendedores navegables y chateables en paralelo. **El estafador es notoriamente más amable y más rápido en responder.**
- **Objetivo:** comprar una lavadora buena.
- **Marcadores de legitimidad del segundo:** acepta entrega presencial sin dudar; tiene calificaciones de dos años; la cuenta está a su propio nombre; el precio es de mercado; responde lento y seco, porque está trabajando.
- **Finales:** compra al barato y pierde el dinero / no compra a ninguno por desconfianza y sigue lavando a mano / compra al honesto, con entrega presencial y pago contra entrega.
- **Debrief:** el escenario ataca el sesgo más caro del comercio en línea: **confundir amabilidad con honradez.** El estafador tiene todo el tiempo del mundo para ser encantador; el vendedor real está ocupado. Regla de oro: el discriminador no es el trato, son los hechos verificables — calificaciones, nombre de la cuenta, y disposición a la entrega presencial.

### L-E2 · Una cooperativa registrada — **legítimo** *(difícil)*

- **Espeja a:** E5, la falsa plataforma de inversión.
- **Contexto:** le ofrecen una póliza a plazo fijo en una cooperativa de ahorro y crédito, con 6.5% anual.
- **Superficie:** oficina física, documentación, y el registro en línea de la Superintendencia.
- **Objetivo:** que sus ahorros no pierdan valor guardados en casa.
- **Marcadores de legitimidad:** la entidad **aparece en el registro de la Superintendencia**; el rendimiento es modesto y está por escrito; no hay garantías de ganancia, hay condiciones y penalidades por retiro anticipado explicadas; nadie lo apura; hay oficina física y contrato.
- **Finales:** desconfía de todo y guarda el efectivo en casa → lo pierde por inflación o por un robo / verifica solo la web, que se ve bien, y no consulta el registro (aprendizaje incompleto, acierta por suerte) / consulta el registro de la Superintendencia, confirma, lee las penalidades y firma.
- **Debrief:** cierra el set demostrando que el registro de la Superintendencia sirve en las dos direcciones: descarta a Litoral Invest de E5 y confirma a esta cooperativa. Reglas de oro: rendimiento modesto y por escrito es señal de seriedad, "garantizado y alto" es señal de fraude; y la verificación no es desconfianza, es el paso previo a decidir con tranquilidad.

---

## 9. Módulos existentes

| Módulo actual | Destino |
|---|---|
| `demo1.html` — Saldo contable | → **E2**, con la anatomía de 8 piezas aplicada |
| `chat-cambio-numero.html` — Cambio de número | → **I1**, subiendo el nivel de sofisticación del mensaje |
| `llamada-antiestafas.html` — Premio falso | Queda **bajo el piso** de dificultad. Se conserva como tutorial opcional para enseñar la mecánica de llamada, o se retira. |
| `foto.html` — Foto del escritorio | Fuera de las 5 categorías (exposición física). Sección aparte o jubilado. |
| `baiting.html` — Trampa USB | Fuera de las 5 categorías (baiting). Sección aparte o jubilado. |

## 10. Cobertura pedagógica

Cada escenario del nivel máximo existe para derribar una creencia defensiva que los
niveles anteriores dejan en pie:

| Escenario | Creencia que derriba |
|---|---|
| P5 · Secuestro de hilo | "Si viene del remitente correcto, es él." |
| S5 · SIM swap | "Perder señal es problema de la antena." |
| V5 · La llamada que hiciste tú | "Si yo marqué el número, son ellos." |
| I5 · Deepfake | "Si lo veo y lo oigo, es él." |
| E5 · Inversión | "Ya retiré una vez, entonces funciona." |

Los 10 casos legítimos forman pares con su fraude espejo. Cada par enseña más que sus
dos mitades por separado, porque aísla el discriminador al dejar todo lo demás igual:

| Par | Superficie compartida | Discriminador que aísla |
|---|---|---|
| P3 ↔ L-P1 | Correo del banco | Pedir credenciales vs. mandarte a tu app |
| P4 ↔ L-P2 | Datos personales tuyos en manos ajenas | Cobrarte vs. avisarte |
| S4 ↔ L-S1 | Aviso de consumo por SMS | Traer un número vs. remitirte al tuyo |
| S2 ↔ L-S2 | Citación de tránsito | Pedirte la placa vs. ya tenerla |
| V1 ↔ L-V1 | Antifraude del banco al teléfono | Pedir el código vs. pedir un sí o un no |
| V4 ↔ L-V2 | Familiar en apuros desde número desconocido | No dejarte colgar vs. esperar tu verificación |
| I1 ↔ L-I1 | "Cambié de número" | Excusas ante la duda vs. "haces bien" |
| I4 ↔ L-I2 | Solicitud de documentos | Documentos antes de la relación vs. después |
| E1 ↔ L-E1 | Dos vendedores en el marketplace | Amabilidad vs. hechos verificables |
| E5 ↔ L-E2 | Producto financiero | Ausente del registro vs. registrado |

Y cuatro reglas atraviesan todo el set, repetidas deliberadamente en escenarios
distintos para que se fijen:

1. **Corta el canal y vuelve por el tuyo.** El número, el enlace y la dirección
   siempre se sacan de la app oficial o del reverso de la tarjeta.
2. **El código nunca se comparte**, con nadie, por ningún motivo.
3. **Todo cambio de número de cuenta se confirma fuera de banda.**
4. **Cuando te exigen silencio o prisa, es estafa.**

Y una quinta que solo los casos legítimos pueden enseñar:

5. **Verificar no es desconfiar.** Es el mismo paso para lo verdadero y lo falso, y es
   lo que te libera de tener que adivinar cuál es cuál.

## 11. Fuentes del contexto ecuatoriano

- Suplantación de identidad: 1.211 noticias de delito entre enero y abril de 2025 frente a 2.871 en el mismo período de 2026 (Fiscalía General del Estado, vía Primicias).
- Más de 300 denuncias diarias por estafas y robos informáticos a cuentas bancarias y tarjetas (Primicias).
- Campañas activas de falsos bonos estatales — "Bono Ciudadano 2026", bono del Día de la Madre — con dominios fuera de `.gob.ec` (Ministerio de Desarrollo Humano, Primicias, Expreso).
- Alertas oficiales de SRI, ANT e IESS por mensajes y correos falsos a su nombre (Teleamazonas, Boletín Contable).
- Smishing con premios a nombre de bancos, tipo "iPhone 17 Air gratis solo por hoy" (Metro Ecuador, Lupa).
- Crecimiento de quishing con códigos QR adulterados en locales y espacios públicos.
- Vishing con clonación de voz por IA y deepfakes; alerta del Ministerio de Telecomunicaciones (julio de 2025).
- Secuestro virtual y extorsión usando Marketplace como punto de contacto.

## 12. Siguiente paso

Plan de implementación: definir el motor común de escenarios y las cinco superficies de
UI (bandeja, hilo de mensajería, llamada, perfil social, marketplace), el formato de
datos de un escenario, y el orden de construcción de los 35.

Orden sugerido: construir cada par espejo junto (P3 con L-P1, I1 con L-I1, …). Comparten
superficie y buena parte de los datos, y validarlos juntos es la única forma de
comprobar que el discriminador de verdad discrimina — que el caso legítimo no se delata
solo y que el fraudulento no se descarta por un detalle accidental de la UI.

/**
 * Generado por scripts/voces.py, no editar a mano.
 *
 * De cada frase que dice quien llama en los escenarios de vishing al MP3 con
 * esa frase. Los audios se generan una sola vez y se sirven como archivos
 * estáticos, en vez de sintetizarlos en el navegador: la voz del sistema
 * cambia de un equipo a otro (y en muchos ni existe en español), y dos
 * participantes que oyen voces distintas no hicieron el mismo ejercicio.
 *
 * La clave es la frase entera y no un identificador corto a propósito: si el
 * guion cambia, el audio deja de encontrarse en vez de seguir sonando con el
 * texto viejo. El test de voces.test.ts avisa cuando eso pasa.
 */
export const VOICES: Record<string, string> = {
  "Anotado. Y para registrarle el beneficio necesito dos datos más: los cuatro últimos dígitos de su tarjeta y la agencia donde abrió la cuenta.": "/voz/c583819c2e8d.mp3",
  "Banco del Litoral, departamento de seguridad, buenas noches. Le confirmo: hablo con el titular de la tarjeta terminada en 4417, ¿verdad?": "/voz/6542a44f3d7f.mp3",
  "Buenas noches, le habla Andrés Villamar del departamento de seguridad del Banco del Litoral. ¿Hablo con el titular de la tarjeta terminada en 4417?": "/voz/91c0f2b47616.mp3",
  "Buenas noches, le llamo del monitoreo antifraude del Banco del Litoral. No le voy a pedir claves, códigos ni datos suyos en toda la llamada.": "/voz/785874029e35.mp3",
  "Buenas tardes, le habla Katherine del área de calidad del Banco del Litoral. Estamos haciendo una encuesta de dos minutos sobre la atención en su agencia, ¿me regala un momentito?": "/voz/adf54828351c.mp3",
  "Buenas tardes, le habla el sargento Aguirre, de tránsito. Su hija está bien, pero el vehículo con el que chocó es de una persona que no quiere denunciar si se le cubre el daño ahora mismo.": "/voz/f821e1c82965.mp3",
  "Buenas tardes, le llamo del soporte técnico de AndinaNet, su proveedor de internet. ¿Ha notado que la conexión le va más lenta estos días?": "/voz/cf257ba2ef09.mp3",
  "Buenos días, le llamo del Servicio de Rentas Internas, departamento de devoluciones. ¿Hablo con el contribuyente titular de la declaración del año pasado?": "/voz/474da7720ea7.mp3",
  "Buenos días. No, yo no le he escrito nada, y menos desde otro número. No compre nada. Reenvíe ese chat a Sistemas, por favor: esta semana le ha llegado a media empresa.": "/voz/5cebfcb514a5.mp3",
  "Cuando la abra le va a pedir un permiso; acéptelo y desde aquí le hago la limpieza en dos minutos. No cuelgue, que si corta pierdo la sesión.": "/voz/6beb712b12df.mp3",
  "El sistema eligió su número al azar, no se preocupe. Solo tiene que cubrir el impuesto de entrega: cuarenta dólares, y hoy mismo le llevamos la cocina a su casa.": "/voz/84a78c7562d3.mp3",
  "Entendido, lo marco como consumo no reconocido. Lo anulamos ahora mismo desde aquí, antes de que se liquide.": "/voz/02464d21b81f.mp3",
  "Es automática, sale del cruce de sus gastos deducibles. No tiene que reclamar nada, solo confirmarme la cédula y la cuenta donde le depositamos.": "/voz/2b238140fbdd.mp3",
  "Es el impuesto de entrega, y todos los ganadores lo pagan. Deposite a la cuenta de mi compañera María: veintidós, cero cero setenta y cuatro, once ochenta y ocho.": "/voz/5f1cc4efe44c.mp3",
  "Es lo que le iba a decir. Nuestros sistemas detectaron que su router está enviando tráfico infectado hacia el exterior. Podemos limpiarlo ahora mismo sin que tenga que salir de casa.": "/voz/107dc6e2b0a1.mp3",
  "Es solo para validar que hablo con el titular de la cuenta, es el protocolo. Si prefiere lo dejamos, aunque el beneficio de la comisión se registra hoy y mañana ya no le puedo ayudar.": "/voz/2fb5df8a59ad.mp3",
  "Es una pregunta muy sensata. Puede comprobar que este número aparece en la página del banco. Vamos a anular el cargo ahora mismo desde aquí.": "/voz/76559f83b616.mp3",
  "Eso sí, la promoción vence en una hora. Si no deposita ahora mismo pierde la cocina y se la entregamos a la siguiente persona de la lista.": "/voz/a37c78d4ea4b.mp3",
  "Gracias. Por participar le exoneramos la comisión de manejo de este mes. Antes de empezar valido que hablo con el titular: ¿me confirma su fecha de nacimiento y el nombre completo de su mamá?": "/voz/f282045b0a9c.mp3",
  "Le llamo por el bloqueo de esta noche. Intentaron un consumo de mil doscientos dólares en una tienda de electrónica y lo detuvimos a tiempo.": "/voz/7b530e469ed4.mp3",
  "Le llamo porque detectamos un consumo de ochocientos noventa dólares en una tienda de electrónica de Guayaquil, hecho hace ocho minutos. ¿Ese consumo lo reconoce usted?": "/voz/fe9e8ea47da1.mp3",
  "Le paso el proceso: abra la tienda de aplicaciones de su teléfono e instale AsistenciaMóvil, que es la herramienta oficial de soporte.": "/voz/47502c84d4df.mp3",
  "Le tengo una buena noticia: le corresponde una devolución de ciento ochenta y cuatro dólares con sesenta. Para acreditarla necesito confirmar su número de cédula.": "/voz/6c981ab2c87c.mp3",
  "Le timbré y no me contestó nadie. ¿Le dejo con el conserje o baja usted? Son tres cincuenta contra entrega. Si quiere pagar con tarjeta, dícteme el número por teléfono y se lo cobro ahora mismo.": "/voz/2ab6e39dfb1f.mp3",
  "Le va a llegar un mensaje con un código de constancia. Ese código no me lo dé a mí ni a nadie que le llame, ni siquiera diciendo que es del banco: es solo su comprobante.": "/voz/bfe41c859d42.mp3",
  "Lo registro como depósito no reconocido. No devuelva nada usted, por favor: si el origen resulta fraudulento nosotros reversamos el valor completo, y lo que usted envíe por fuera lo pierde. Le queda el caso abierto y le avisamos.": "/voz/37ef5fceec1d.mp3",
  "Lo vemos desde la central, porque su router pasa por nuestra red. Nosotros no entramos a nada suyo, solo miramos el tráfico.": "/voz/ff8a0b05f913.mp3",
  "Mijo, no te asustes, es tu tía Rocío. Nada grave, solo que perdí el celular en el bus el sábado y recién pude sacar otro chip. Cuando puedas me guardas este número, y salúdame a tu mamá.": "/voz/a05b40475cc2.mp3",
  "No lo haga. Si llama, la línea de ella se bloquea y esto pasa a fiscalía. Quédese conmigo y lo resolvemos en cinco minutos.": "/voz/56f454601525.mp3",
  "No puedo pasársela ahora, la están atendiendo los paramédicos. No corte la llamada y no llame a nadie más, porque si esto entra al sistema ya no lo podemos arreglar entre nosotros.": "/voz/a9b7ebda51a5.mp3",
  "No, el premio es gratis. Lo que se cobra es el impuesto de entrega, que lo pone la transportadora, no nosotros.": "/voz/1a7f184fd309.mp3",
  "No, el sistema no libera el despacho sin el pago del impuesto. Es una norma de la promoción, yo no la puedo saltar.": "/voz/e97159214ced.mp3",
  "Papi, tuve un problema: choqué el carro que me prestó un amigo y necesito depositar trescientos cincuenta dólares ahorita mismo para no meterme en un lío legal. No puedo hablar, estoy usando el celular de alguien.": "/voz/a913331bade4.mp3",
  "Para autorizar la anulación le acabo de enviar un código de seis dígitos por mensaje. Léamelo, por favor.": "/voz/74112c7d2030.mp3",
  "Para levantar el bloqueo le acabo de enviar un código de seis dígitos. Dictémelo y le dejo la tarjeta activa en un minuto.": "/voz/ce7dd2680348.mp3",
  "Para liberar el depósito su banco le va a enviar un código de seis dígitos. Léamelo en cuanto le llegue y en veinticuatro horas tiene el dinero.": "/voz/63516a211e1c.mp3",
  "Perfecto, entonces es lo que veíamos: el equipo está saturado por ese tráfico. No se preocupe, lo dejamos limpio en un momento.": "/voz/e9685ab90b19.mp3",
  "Perfecto, entonces lo rechazamos y bloqueo la tarjeta ahora mismo. La nueva le llega a su agencia en tres días hábiles.": "/voz/df0d2102b0a4.mp3",
  "Perfecto, gracias. Primera pregunta: del uno al cinco, ¿cómo calificaría el tiempo de espera en ventanilla?": "/voz/be2fffbcb93e.mp3",
  "Perfecto. La acreditación va a la cuenta Banco del Litoral · 2100-0000-99, ¿es correcta? Ya la tengo aquí en el sistema.": "/voz/410af788513b.mp3",
  "Son cuatrocientos dólares y hay que hacerlo ya. Anote: 5580-3311-27 · Deuna · Luis A. Paredes. No cuelgue mientras transfiere, yo le voy confirmando.": "/voz/f06468e9251d.mp3",
  "Su llamada está siendo procesada. Por favor, permanezca en línea; en breve será atendido por el siguiente operador disponible.": "/voz/da7b6bfbed6c.mp3",
  "Tenemos retenido un consumo de ochocientos noventa dólares en una tienda de Guayaquil con su tarjeta terminada en 4417. Solo necesito que me diga si fue usted.": "/voz/659ab712bb76.mp3",
  "Todos nuestros operadores están ocupados. No cuelgue, su llamada es importante para nosotros. Su tiempo de espera estimado es de dos minutos.": "/voz/672eac31fe83.mp3",
  "Y no cuelgue: si corta la llamada el cargo se ejecuta y ya no lo podemos detener.": "/voz/d046a9e34a7e.mp3",
  "Y no me corte, por favor: si corta, la tarjeta queda anulada y hay que emitir una nueva.": "/voz/4b6113a83db0.mp3",
  "Y si prefiere no seguir por aquí, cuelgue y llámenos al número del reverso de su tarjeta: la gestión queda igual de abierta y le atiende cualquier compañero.": "/voz/e437854f63a4.mp3",
  "¡Aló, buenas! Le habla Jonathan, de EnvíaExpress. Estoy abajo en la puerta con su paquete, la guía cuatro cuatro siete uno EC.": "/voz/3a40cd86dccb.mp3",
  "¡Aló, mijo! Sí, soy yo. Qué bueno que me llamas, así te queda grabado el número. No, no necesito nada, solo avisarte. Salúdame a tu mamá y nos vemos el domingo.": "/voz/5e87c64a5cb8.mp3",
  "¡Bro! Qué bueno que llamas. Me robaron el WhatsApp anoche, están escribiéndole a todo el mundo pidiendo plata en mi nombre. Mi mamá está bien, yo estoy en la casa. No mandes nada.": "/voz/21cbdf40e5cb.mp3",
  "¡Muy buenas tardes! Le llamo de Almacenes La Ganga. ¡Felicidades! Su número resultó ganador de una cocina de inducción en nuestro sorteo del mes.": "/voz/41721bd43a3c.mp3",
  "¡Papi! Papi ayúdame por favor, me chocaron y se llevaron el carro, tengo miedo…": "/voz/15f08133d84e.mp3",
  "¿Aló, pa? Estoy en clase, ¿qué pasó? No, yo estoy bien, no choqué nada. El carro está en el parqueadero de la universidad.": "/voz/0343486aeedd.mp3",
  "¿Aló, papi? No, yo estoy en la casa, acabo de cenar. Mi celular está bien y no cambié de número. ¿Quién te escribió?": "/voz/23d667886add.mp3",
  "¿Aló? Prima, no, yo no te he escrito nada. Me quedé sin WhatsApp desde anoche, creo que me robaron la cuenta. No le pases ningún código a nadie.": "/voz/b579aa97bb74.mp3",
}

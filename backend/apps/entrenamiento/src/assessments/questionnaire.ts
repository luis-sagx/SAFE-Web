export const ASSESSMENT_VERSION = 1;
export const CONSENT_VERSION = '2026-10-14';
export const AGE_RANGES = [
  'Menos de 18 años',
  '18 - 29 años',
  '30 - 44 años',
  '45 - 65 años',
  '65 años o más',
];
export const GENDERS = ['Femenino', 'Masculino', 'Prefiero no decirlo'];
const items: [string, string, string, string][] = [
  [
    'Recibes un correo que dice ser del área de soporte de tu trabajo. Indica que tu cuenta será bloqueada hoy si no escribes tu contraseña en un enlace. ¿Qué harías?',
    'Abrir el enlace y escribir la contraseña.',
    'Consultar al área de soporte por el medio que usas habitualmente.',
    'Responder a ese correo para preguntar si es verdadero.',
  ],
  [
    'Una compañera te avisa en persona que compartirá contigo un documento de trabajo. Más tarde, entras por tu cuenta a la plataforma que usan habitualmente y ves allí el documento. ¿Qué harías?',
    'Ignorar el documento porque llegó después de un aviso.',
    'Pedirle que te envíe el documento a tu correo personal.',
    'Abrirlo desde la plataforma habitual para realizar tu trabajo.',
  ],
  [
    'Recibes un correo de un proveedor conocido. Dice que cambió su cuenta bancaria y pide que paguen la próxima factura a la nueva cuenta. ¿Qué harías primero?',
    'Confirmar el cambio llamando al número del proveedor que ya tiene registrada la institución.',
    'Pagar a la nueva cuenta porque el correo tiene el nombre del proveedor.',
    'Responder al mismo correo para preguntar si el cambio es real.',
  ],
  [
    'Llega un mensaje a tu celular: "Detectamos un problema con su cuenta bancaria. Entre a este enlace para evitar el bloqueo". ¿Qué harías?',
    'Abrir el enlace para revisar el problema.',
    'Reenviar el mensaje a un compañero para saber si también lo recibió.',
    'Revisar tu cuenta desde la aplicación del banco o llamar a su número habitual.',
  ],
  [
    'Solicitaste un cambio de horario en el trabajo. Recibes un mensaje que confirma el cambio y, al entrar por tu cuenta al calendario institucional, ves el nuevo horario. ¿Qué harías?',
    'Tomar en cuenta el nuevo horario confirmado en el calendario.',
    'Mantener el horario anterior porque el aviso llegó por mensaje.',
    'Avisar a todos que probablemente es una estafa.',
  ],
  [
    'Esperas una entrega de materiales para la oficina. Llega un mensaje que pide tu número de cédula y un pago pequeño en un enlace para poder entregar el paquete. ¿Qué harías primero?',
    'Ingresar los datos porque sí esperas una entrega.',
    'Revisar el estado del envío mediante el contacto o sistema habitual de la empresa de entregas.',
    'Responder al mensaje para pedir una foto del paquete.',
  ],
  [
    'Alguien llama diciendo que trabaja en el banco. Afirma que detectó un fraude y te pide el código que acaba de llegar a tu celular para detenerlo. ¿Qué harías?',
    'No darle el código y comunicarte con el banco mediante un número que ya conoces.',
    'Darle el código para evitar que saquen dinero.',
    'Pedirle su nombre y, si lo dice, darle el código.',
  ],
  [
    'Tienes un problema con la impresora. Tú llamas a la extensión de soporte que figura en el directorio de tu institución. Te indican que reinicies la impresora desde su panel. ¿Qué harías?',
    'Cortar la llamada porque cualquier indicación telefónica es peligrosa.',
    'Dar tu contraseña para que soporte reinicie todo por ti.',
    'Seguir la indicación de reiniciar la impresora.',
  ],
  [
    'Recibes una llamada con una voz muy parecida a la de tu jefe. Te pide transferir dinero de la institución de inmediato a una cuenta nueva. ¿Qué harías primero?',
    'Hacer la transferencia porque reconoces la voz.',
    'Confirmar la solicitud por el procedimiento habitual de la institución.',
    'Pedir que repita la instrucción en un mensaje de voz.',
  ],
  [
    'Un compañero escribe desde un número que no conoces. Dice que perdió su teléfono y necesita que le envíes un informe reservado. ¿Qué harías?',
    'Enviarlo porque conoce el nombre del informe.',
    'Pedirle una foto de su credencial por ese mismo chat.',
    'Contactarlo por un medio que ya usabas y comprobar si puede recibir ese informe.',
  ],
  [
    'Ves una publicación con el nombre y el logotipo de una entidad pública. Ofrece un beneficio y pide ingresar tus datos personales mediante un enlace. ¿Qué harías?',
    'Buscar la información entrando por tu cuenta al sitio oficial de la entidad.',
    'Abrir el enlace porque tiene el logotipo correcto.',
    'Enviar tus datos por mensaje privado para confirmar si aplicas.',
  ],
  [
    'Una persona escribe por WhatsApp y se presenta como integrante del área de talento humano. Pide una lista con nombres, correos y números de cédula del personal para una "actualización urgente". ¿Qué harías?',
    'Enviar la lista para evitar retrasos.',
    'Enviar solo una parte de la lista como prueba.',
    'Consultar la solicitud directamente con talento humano por el canal institucional.',
  ],
  [
    'Una tienda que no conoces ofrece computadoras para la oficina a un precio mucho menor que otras tiendas. Exige una transferencia inmediata a una cuenta personal para reservarlas. ¿Qué harías?',
    'Transferir para aprovechar el precio.',
    'Verificar la tienda y seguir el proceso habitual de compras antes de pagar.',
    'Pedir una foto de la cédula del vendedor y luego transferir.',
  ],
  [
    'Tu oficina vende un equipo usado. El comprador muestra una captura que dice "transferencia realizada", pero el dinero todavía no aparece en la cuenta. ¿Qué harías?',
    'Entregar el equipo porque la captura muestra el pago.',
    'Pedir otra captura más clara y entregar el equipo.',
    'Esperar a comprobar que el dinero esté disponible en la cuenta.',
  ],
  [
    'Solicitaste materiales de oficina a un proveedor aprobado. La factura aparece en el portal al que entras habitualmente y los datos coinciden con la compra autorizada. ¿Qué harías?',
    'Continuar con el procedimiento normal de recepción y pago.',
    'Rechazar la factura porque podría ser una estafa.',
    'Pagarla a cualquier cuenta que llegue después por correo.',
  ],
  [
    'Encuentras una memoria USB abandonada junto a los computadores de la oficina. ¿Qué harías?',
    'Conectarla para averiguar a quién pertenece.',
    'No conectarla y avisar al personal responsable.',
    'Entregarla a un compañero para que revise los archivos.',
  ],
  [
    'Una persona a la que no conoces quiere entrar detrás de ti a una oficina donde solo puede ingresar personal autorizado. Dice que olvidó su identificación. ¿Qué harías?',
    'Dejarla entrar para no hacerla esperar.',
    'Preguntarle su nombre y dejarla entrar si lo dice.',
    'Indicarle que debe identificarse con recepción o con el responsable del área.',
  ],
  [
    'Recepción te avisó que llegaría una persona a revisar la impresora. Cuando llega, recepción confirma que es la visita programada. El procedimiento indica que debe estar acompañada mientras trabaja. ¿Qué harías?',
    'Rechazar la visita porque podría ser una estafa.',
    'Permitir la revisión siguiendo el procedimiento de acompañamiento.',
    'Dejarla sola y darle tu contraseña para que termine más rápido.',
  ],
  [
    'Quieres pedir a un asistente de inteligencia artificial que resuma una hoja de cálculo del trabajo. La hoja contiene nombres, correos y números de cédula de otras personas. ¿Qué harías?',
    'Copiar toda la hoja porque solo quieres un resumen.',
    'Copiarla después de pedir al asistente que no guarde los datos.',
    'Quitar los datos personales antes de usar la herramienta, o no subir la hoja.',
  ],
  [
    'Un asistente de inteligencia artificial te da un enlace y asegura que es la página oficial para realizar un trámite de la institución. ¿Qué harías?',
    'Abrir el enlace porque el asistente lo aseguró.',
    'Buscar el trámite por tu cuenta en la página oficial de la entidad.',
    'Preguntarle de nuevo al mismo asistente si está seguro.',
  ],
  [
    'Tu institución permite usar un asistente de inteligencia artificial para mejorar textos públicos. Quieres corregir la redacción de una invitación que no contiene datos personales ni información reservada. ¿Qué harías?',
    'Usar la herramienta permitida y revisar el texto antes de enviarlo.',
    'Evitar cualquier uso de la herramienta, aunque esté permitido.',
    'Añadir datos reservados para que la invitación quede más completa.',
  ],
];
export const QUESTIONNAIRE = {
  version: ASSESSMENT_VERSION,
  ageRanges: AGE_RANGES,
  genders: GENDERS,
  questions: items.map(([prompt, ...options], index) => ({
    id: index + 1,
    prompt,
    options: [
      ...options,
      index === 1 ? 'No estoy seguro/a' : 'No estoy seguro/a.',
    ],
  })),
};
const answerKey = [
  1, 2, 0, 2, 0, 1, 0, 2, 1, 2, 0, 2, 1, 2, 0, 1, 2, 1, 2, 1, 0,
];
export function scoreAssessment(answers: number[]): number {
  return answers.reduce(
    (score, answer, index) => score + Number(answer === answerKey[index]),
    0,
  );
}

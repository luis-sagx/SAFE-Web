import StoryEscenario, { type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { Story } from '../../hooks/useStoryEngine'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'

const SMS: ScreenView = {
  kind: 'sms',
  sender: 'MIES-BONO',
  sub: 'Remitente sin verificar · SMS',
  msgs: [
    {
      text: 'MIES INFORMA: usted fue PRESELECCIONADO para el bono de $180. Registre su cuenta bancaria antes de las 18h00 de hoy o el cupo pasa a otro beneficiario: bit.ly/bono-ec-2026',
      time: '09:41',
    },
  ],
}

const PAGINA: ScreenView = {
  kind: 'web',
  url: 'http://bono-social-ec.online/registro',
  secure: false,
  brand: 'Registro de beneficiarios',
  title: 'Acreditación del bono de $180',
  subtitle: 'Verifica tu identidad y la cuenta donde recibirás la transferencia.',
  fields: [
    { label: 'Cédula', placeholder: '0000000000' },
    { label: 'Usuario de banca en línea', placeholder: 'tu usuario' },
    { label: 'Clave de banca en línea', placeholder: '••••••••' },
    { label: 'Código que te llegó por SMS', placeholder: '000000' },
  ],
  button: 'Acreditar mi bono',
}

const STORY: Story<ScreenNode> = {
  n1: {
    kind: 'scene',
    view: SMS,
    choices: [
      { label: 'Abrir el enlace antes de que se venza el plazo.', goto: 'n2' },
      {
        label: 'Verificar en la página oficial del MIES si existe ese registro.',
        goto: 'e_verifica',
      },
      { label: 'Reenviar el mensaje a mi familia para que también apliquen.', goto: 'n1b' },
    ],
  },
  n1b: {
    kind: 'scene',
    view: SMS,
    choices: [
      { label: 'Abrir el enlace y registrar mi cuenta.', goto: 'n2' },
      {
        label: 'Pensarlo mejor: nunca postulé a ningún bono. Buscar en la web oficial.',
        goto: 'e_verifica',
      },
    ],
  },
  n2: {
    kind: 'scene',
    view: PAGINA,
    choices: [
      { label: 'Llenar el formulario: piden datos que ya conozco.', goto: 'e_datos' },
      {
        label: 'Un trámite del Estado no pide la clave de mi banco: cerrar.',
        goto: 'e_cierra',
      },
    ],
  },
  e_datos: {
    kind: 'bad',
    view: PAGINA,
    verdict: 'Caíste en la trampa',
    outcome:
      'Entregaste tu usuario, tu clave y el código de verificación. Con los tres entraron a tu banca en línea desde otro dispositivo y vaciaron tu cuenta de ahorros.',
  },
  e_cierra: {
    kind: 'good',
    view: PAGINA,
    verdict: 'No caíste · el formulario te delató',
    outcome:
      'Ninguna institución pública necesita tu clave de banca en línea para depositarte. Cerraste la página y reportaste el mensaje.',
  },
  e_verifica: {
    kind: 'good',
    view: SMS,
    verdict: 'No caíste · buscaste la fuente oficial',
    outcome:
      'En la web del MIES no existía ningún registro exprés ni preselección por SMS. El mensaje circulaba masivamente ese día.',
  },
}

const SENALES: Senal[] = [
  { id: 's1', texto: 'Te da un <b>premio que nunca pediste</b> y un plazo de horas para reclamarlo.' },
  { id: 's2', texto: 'Usa un <b>enlace acortado</b> que oculta el destino real.' },
  { id: 's3', texto: 'La página está en <b>bono-social-ec.online</b>, sin conexión segura ni dominio .gob.ec.' },
  { id: 's4', texto: 'Pide tu <b>clave de banca en línea</b> para "recibir" un depósito.' },
  { id: 's5', texto: 'Pide el <b>código que llega por SMS</b>: con eso completan el acceso a tu cuenta.' },
]
const RULE =
  'Regla de oro: para <b>recibir</b> dinero nadie necesita tu clave ni tu código de verificación; solo tu número de cuenta. Cualquier bono o subsidio se confirma en el sitio oficial <b>.gob.ec</b>, escrito por ti.'

const RESUMEN = 'Un SMS anuncia que fuiste preseleccionado para un bono de $180.'

const CONTEXTO: Contexto = {
  antes: 'Nunca postulaste a ningún bono, pero el dinero haría falta este mes.',
  ahora: (
    <>
      <strong>Una mañana cualquiera</strong> te llega un mensaje de texto que anuncia un{' '}
      <strong>bono de $180</strong> a tu nombre.
    </>
  ),
  detalle: 'Has escuchado que a varios conocidos les llegó algo parecido.',
}

function BonoEstado() {
  return (
    <StoryEscenario
      escenarioId="smishing/bono-estado"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      story={STORY}
      senales={SENALES}
      rule={RULE}
      restartLabel="↻ Repetir el escenario"
    />
  )
}

export default BonoEstado

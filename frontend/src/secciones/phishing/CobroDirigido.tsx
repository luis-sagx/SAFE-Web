import StoryEscenario, { type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import { ACCIONES_BARRA, finalesDeBarra } from './barraDeCorreo'
import type { Story } from '../../hooks/useStoryEngine'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'

const CORREO: ScreenView = {
  kind: 'mail',
  from: 'Envíos Rápido',
  address: 'aranceles@enviosrapido-ec.shop',
  senalDireccion: 'remitente',
  label: 'Externo',
  senalEtiqueta: 'externo',
  subject: 'Pendiente: arancel de aduana de tu pedido',
  date: 'hoy 10:33',
  body: `
    <p>Hola María Fernanda:</p>
    <p>
      Tu pedido de <b>audífonos inalámbricos</b> (cédula 0987****) llegó a aduana y tiene un
      arancel pendiente de <b>$2.40</b> para poder entregarlo.
    </p>
    <p><a class="cta" href="#">Pagar arancel de $2.40</a></p>
    <p class="fine">
      Envíos Rápido · Atención al cliente
    </p>
  `,
}

const PAGO: ScreenView = {
  kind: 'web',
  url: 'enviosrapido-ec.shop/arancel',
  secure: false,
  brand: 'Envíos Rápido',
  title: 'Pago de arancel',
  subtitle: 'Monto a pagar: $2.40',
  fields: [
    { label: 'Número de tarjeta', placeholder: '•••• •••• •••• ••••' },
    { label: 'Fecha y CVV', placeholder: 'MM/AA · •••' },
  ],
  button: 'Pagar $2.40',
}

const STORY: Story<ScreenNode> = {
  // Responder, reenviar, eliminar y marcar como spam.
  ...finalesDeBarra('fraude', CORREO),
  n1: {
    kind: 'scene',
    view: CORREO,
    choices: [
      { label: 'Pagar de una vez: es apenas $2.40.', goto: 'e_paga' },
      { label: 'Dudar del monto, pero pagar igual "por si acaso".', goto: 'e_paga_duda' },
      {
        label: 'Rastrear el pedido en la web oficial del courier antes de pagar nada.',
        goto: 'e_rastrea',
      },
    ],
  },
  e_paga: {
    kind: 'bad',
    view: PAGO,
    verdict: 'Caíste en la trampa',
    outcome:
      'Los $2.40 nunca fueron el objetivo: eran el precio de entrada para que escribieras los datos completos de tu tarjeta. Días después aparecieron cargos que no reconocés.',
  },
  e_paga_duda: {
    kind: 'bad',
    view: PAGO,
    verdict: 'Caíste en la trampa',
    outcome:
      'Dudaste del monto pero pagaste de todos modos. El resultado es el mismo: tu tarjeta quedó comprometida por un cobro de $2.40.',
  },
  e_rastrea: {
    kind: 'good',
    view: CORREO,
    verdict: 'No caíste · verificaste en la web oficial',
    outcome:
      'En el sitio oficial del courier tu pedido no tenía ningún arancel pendiente. El correo usaba datos reales de una filtración para parecer creíble.',
  },
}

const SENALES: Senal[] = [
  { id: 's1', texto: 'El correo trae tu <b>nombre completo y parte de tu cédula</b>, datos de una filtración, no prueba de que sean ellos.' },
  { id: 's2', targetId: 'monto', pantalla: 'n1', texto: 'El monto es <b>diminuto a propósito</b>, calculado para no despertar sospecha.' },
  { id: 's3', texto: 'Los couriers cobran aranceles <b>al entregar</b>, nunca por un enlace de correo.' },
  { id: 's4', targetId: 'remitente', pantalla: 'n1', texto: 'El correo llega desde <b>enviosrapido-ec.shop</b>. Ese nombre se parece al del courier, pero no es el que aparece en su sitio oficial: es otra dirección, comprada por otra persona para este correo.' },
]
const RULE =
  'Regla de oro: que alguien conozca tus datos no prueba que sea quien dice ser. Los datos personales confirman que hubo una filtración en algún lado, no que el mensaje sea legítimo.'

const RESUMEN = 'Un correo con tu nombre y cédula pide $2.40 para liberar un paquete de aduana.'

const CONTEXTO: Contexto = {
  antes: 'Compraste unos audífonos inalámbricos hace unos días y sí estás esperando el envío.',
  ahora: (
    <>
      <strong>Con el paquete todavía en camino</strong>, llega un correo del courier sobre ese
      envío.
    </>
  ),
  detalle: (
    <>
      Trae tu <strong>nombre completo</strong> y parte de tu <strong>número de cédula</strong>,
      datos que vos nunca les diste a un courier.
    </>
  ),
}

function CobroDirigido() {
  return (
    <StoryEscenario
      escenarioId="phishing/cobro-dirigido"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      story={STORY}
      accionesCorreo={ACCIONES_BARRA}
      senales={SENALES}
      rule={RULE}
      restartLabel="↻ Repetir el escenario"
    />
  )
}

export default CobroDirigido

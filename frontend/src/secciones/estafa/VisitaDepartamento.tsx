import { Building2, Camera, MessageCircle, Wallet } from 'lucide-react'
import StoryEscenario, { type AppTelefono, type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'
import { CUENTA_FICTICIA, IDENTIDAD_FICTICIA } from '../../lib/identidadFicticia'

/**
 * El espejo legítimo de "Departamento en arriendo".
 *
 * Espeja a "Departamento en arriendo" con la misma escena y el orden puesto
 * del derecho: te dan la dirección exacta, te abren la puerta, firmas el
 * contrato delante y el depósito se paga al firmar, con recibo y a una cuenta
 * que está al nombre de la inmobiliaria.
 *
 * Mide lo que el otro no puede medir: si alguien aprendió la regla o solo
 * aprendió a tener miedo. Quien no vuelve a arrendar nada por internet pagó la
 * lección más cara de lo que valía, y aquí el acierto es firmar.
 */

const AGENTE = 'Mariela Cifuentes · Inmobiliaria Caicedo'
const NUMERO_AGENTE = '+593 2 246 8890'
const CUENTA_INMOBILIARIA = '8830-4412-07 · Inmobiliaria Caicedo Cía. Ltda.'
const DIRECCION = 'Av. Coruña N26-118 y San Ignacio, edificio Pradera, dpto. 4B'
const DEPOSITO = '$640'

const RESPONDE = {
  text: `Buenas tardes. Sí, el departamento sigue disponible: $320 mensuales más alícuota. Está en ${DIRECCION}. ¿Le queda bien que lo vea mañana a las 10 o prefiere el sábado? El conserje también le puede abrir si a usted le sirve otra hora.`,
  time: '17:20',
  senal: 'direccion',
}

const CHAT: ScreenView = {
  kind: 'sms',
  sender: AGENTE,
  sub: `${NUMERO_AGENTE} · número fijo de la inmobiliaria`,
  senalRemitente: 'remitente',
  msgs: [RESPONDE],
  respuestas: [
    {
      texto: 'Mañana a las 10 me queda bien. Ahí estaré.',
      goto: 'n2',
      label: 'Quedó en ir a ver el departamento',
    },
    {
      texto: 'No hace falta verlo. ¿A qué cuenta le deposito la garantía?',
      goto: 'e_adelanta',
      label: 'Ofreció pagar la garantía sin ver el departamento',
    },
  ],
  volverGoto: 'e_deja',
  volverLabel: 'Salió del chat sin contestar',
}

/// La visita. Lo que en el escenario espejo era imposible aquí ocurre sin
/// ningún drama: la puerta se abre y el departamento es el de las fotos.
const VISITA: ScreenView = {
  kind: 'web',
  app: 'Portal Inmobiliario',
  url: 'portalinmobiliario.ec',
  secure: true,
  brand: 'Visita realizada',
  title: 'Departamento 4B, edificio Pradera',
  subtitle: 'Lo viste esta mañana, por dentro.',
  datos: [
    { etiqueta: 'La dirección', valor: 'Existe y es la del anuncio', senal: 'direccion' },
    {
      etiqueta: 'Quién te abrió',
      valor: 'La agente, con las llaves y su credencial de la inmobiliaria',
      senal: 'en-persona',
    },
    { etiqueta: 'El departamento', valor: 'Es el de las fotos, con los mismos muebles' },
    { etiqueta: 'El conserje', valor: 'Confirmó que la inmobiliaria lleva el edificio hace años' },
  ],
  opciones: [
    {
      texto: 'Comprobar la inmobiliaria en el registro',
      detalle: 'Ver si la compañía existe',
      goto: 'n4',
      label: 'Consultó el registro de compañías',
    },
    { texto: 'Ver otras opciones', detalle: '23 departamentos en el sector' },
    { texto: 'Guardar el anuncio', detalle: 'Para verlo después' },
  ],
  cerrarGoto: 'n3',
  cerrarLabel: 'Volvió al chat después de la visita',
  fields: [],
  button: '',
}

const REGISTRO: ScreenView = {
  kind: 'web',
  app: 'Navegador',
  url: 'supercias.gob.ec',
  secure: true,
  brand: 'Consulta de compañías',
  title: 'Inmobiliaria Caicedo Cía. Ltda.',
  subtitle: 'Resultado de la búsqueda.',
  datos: [
    { etiqueta: 'Estado', valor: 'Activa desde 2011', senal: 'registro' },
    { etiqueta: 'Actividad', valor: 'Actividades inmobiliarias con bienes propios o arrendados' },
    { etiqueta: 'Domicilio', valor: 'Quito · el mismo de la oficina donde te atendieron' },
    {
      etiqueta: 'Representante legal',
      valor: 'Consta y coincide con el del contrato',
      senal: 'registro',
    },
  ],
  cerrarGoto: 'n2',
  cerrarLabel: 'Volvió después de comprobar el registro',
  fields: [],
  button: '',
}

const CIERRA: ScreenView = {
  ...CHAT,
  msgs: [
    RESPONDE,
    { text: 'Ya lo vi, me gustó. ¿Cómo seguimos?', time: '11:40', mine: true },
    {
      text: `Perfecto. Pase mañana por la oficina con su cédula, firmamos el contrato y ahí mismo hace el depósito de garantía de ${DEPOSITO} (dos meses), a la cuenta de la inmobiliaria. Le entregamos su copia del contrato, el recibo y las llaves el mismo día.`,
      time: '11:45',
      senal: 'orden',
    },
  ],
  respuestas: [
    {
      texto: 'Listo, mañana voy a firmar y hago el depósito.',
      goto: 'n5',
      label: 'Aceptó firmar en la oficina y pagar al firmar',
    },
    {
      texto: 'Mejor le deposito ahorita para asegurarlo.',
      goto: 'e_adelanta',
      label: 'Quiso adelantar el pago antes de firmar',
    },
  ],
}

const CONTRATO: ScreenView = {
  kind: 'web',
  app: 'Portal Inmobiliario',
  url: 'portalinmobiliario.ec',
  secure: true,
  brand: 'Contrato de arrendamiento',
  title: 'Antes de firmar',
  subtitle: 'Lo que dice el contrato que tienes delante.',
  datos: [
    { etiqueta: 'Arrendador', valor: 'Inmobiliaria Caicedo Cía. Ltda.', senal: 'coincide' },
    { etiqueta: 'Inmueble', valor: DIRECCION, senal: 'coincide' },
    { etiqueta: 'Canon mensual', valor: '$320,00 más alícuota' },
    { etiqueta: 'Garantía', valor: `${DEPOSITO} · devolvible al terminar, contra inventario` },
    { etiqueta: 'Cuenta para el depósito', valor: CUENTA_INMOBILIARIA, senal: 'misma-cuenta' },
  ],
  aviso:
    'La cuenta del contrato está a nombre de la misma compañía que arrienda, y el depósito se entrega contra recibo.',
  opciones: [
    {
      texto: 'Firmar y hacer el depósito',
      detalle: 'Con recibo y copia del contrato',
      goto: 'e_firma',
      label: 'Firmó el contrato y pagó la garantía',
    },
    {
      texto: 'Pedir un día más para pensarlo',
      detalle: 'Sin firmar todavía',
      goto: 'e_piensa',
      label: 'Pidió un día más antes de firmar',
    },
  ],
  cerrarGoto: 'n3',
  cerrarLabel: 'Volvió al chat sin firmar',
  fields: [],
  button: '',
}

const TRANSFERENCIA: ScreenView = {
  kind: 'web',
  app: IDENTIDAD_FICTICIA.banco,
  url: 'bancolitoral.ec',
  secure: true,
  brand: 'Transferir a terceros',
  title: 'Confirma la transferencia',
  subtitle: `Desde ${CUENTA_FICTICIA}`,
  datos: [
    { etiqueta: 'Cuenta de destino', valor: CUENTA_INMOBILIARIA, senal: 'misma-cuenta' },
    { etiqueta: 'Concepto', valor: 'Garantía de arriendo · dpto. 4B' },
    { etiqueta: 'Valor', valor: '$640,00' },
  ],
  aviso: 'Las transferencias enviadas no se pueden reversar.',
  button: 'Transferir $640,00',
  botonGoto: 'e_firma',
  botonLabel: 'Pagó la garantía a la cuenta de la inmobiliaria',
  cerrarGoto: 'n5',
  cerrarLabel: 'Volvió atrás sin transferir',
  fields: [],
}

const APPS: AppTelefono[] = [
  { Icono: MessageCircle, texto: 'Mensajes', color: '#2f9e44', hilo: 'sms' },
  {
    Icono: Building2,
    texto: 'Portal Inmobiliario',
    color: '#c2255c',
    goto: 'n2',
    label: 'Abrió la ficha del departamento que visitó',
  },
  {
    Icono: Wallet,
    texto: IDENTIDAD_FICTICIA.banco,
    color: '#155e75',
    goto: 'n6',
    label: 'Abrió la app del banco',
  },
  {
    Icono: Camera,
    texto: 'Cámara',
    color: '#495057',
    vacia: 'La cámara está lista. No hay nada que fotografiar en este momento.',
  },
]

export const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: CHAT },
  n2: { kind: 'scene', view: VISITA },
  n3: { kind: 'scene', view: CIERRA },
  n4: { kind: 'scene', view: REGISTRO },
  n5: { kind: 'scene', view: CONTRATO },
  n6: { kind: 'scene', view: TRANSFERENCIA },
  e_firma: {
    kind: 'good',
    view: CONTRATO,
    verdict: 'Acertaste · viste, firmaste y después pagaste',
    outcome:
      'Firmaste el contrato con el departamento ya visto, la compañía comprobada en el registro y el depósito a la cuenta de la misma inmobiliaria que arrienda, contra recibo. Te mudaste el fin de semana. Esto es lo que se ve cuando un arriendo es de verdad: el mismo trato del otro escenario, pero en el orden correcto.',
  },
  e_piensa: {
    kind: 'partial',
    view: CONTRATO,
    verdict: 'Estaba todo bien y lo dejaste enfriar',
    outcome:
      'Pediste un día más y el departamento seguía disponible, así que no perdiste nada. Pero tampoco tenías qué pensar: lo habías visto, la compañía constaba en el registro y el contrato coincidía con todo. Tomarse un día es sano cuando algo no cuadra; aquí lo único que faltaba era decidir.',
    score: 70,
  },
  e_adelanta: {
    kind: 'bad',
    view: CHAT,
    verdict: 'Esta vez salió bien, pero hiciste justo lo peligroso',
    outcome:
      'Pagaste antes de ver y antes de firmar. Salió bien porque la inmobiliaria era real, no porque tú hicieras algo bien: adelantar el depósito a alguien que todavía no te ha enseñado nada es exactamente el gesto con el que se pierden los $700 del otro escenario. El orden no es un trámite, es la protección.',
    score: 20,
  },
  e_deja: {
    kind: 'bad',
    view: CHAT,
    verdict: 'Dejaste caer un arriendo que estaba bien',
    outcome:
      'No contestaste y el departamento se arrendó a otra persona. Nada de lo que te escribieron era una señal de alarma: te dieron la dirección exacta, te ofrecieron tres horarios y dijeron que el conserje también podía abrirte. Desconfiar de todo también cuesta, y en un mercado de arriendos cuesta caro.',
    score: 20,
  },
}

const SENALES: Senal[] = [
  {
    id: 's1',
    targetId: 'direccion',
    pantalla: 'n1',
    texto:
      'Te dan la <b>dirección exacta</b> desde el primer mensaje y te ofrecen varios horarios para verlo. Quien no tiene nada que enseñar nunca llega hasta aquí.',
  },
  {
    id: 's2',
    targetId: 'orden',
    pantalla: 'n3',
    texto:
      'El orden es el correcto: <b>ver, firmar y pagar al firmar</b>, con recibo y copia del contrato. El escenario espejo lo pide al revés, y esa inversión es toda la estafa.',
  },
  {
    id: 's3',
    targetId: 'misma-cuenta',
    pantalla: 'n5',
    texto:
      'La cuenta del depósito está a nombre de <b>la misma compañía que arrienda</b>, la que firma el contrato. No hay hermanas, cuñados ni cuentas personales de por medio.',
  },
  {
    id: 's4',
    targetId: 'registro',
    pantalla: 'n4',
    texto:
      'La inmobiliaria <b>consta en el registro desde 2011</b>, con su actividad y su representante legal, y coincide con quien firma. Comprobarlo es gratis y sirve igual para confirmar que para descartar.',
  },
  {
    id: 's5',
    targetId: 'en-persona',
    pantalla: 'n2',
    texto:
      'Te <b>abrieron la puerta</b> con llaves y credencial, y el conserje confirmó quién lleva el edificio. Tres personas distintas cuentan lo mismo.',
  },
]

const RULE =
  'Regla de oro: la misma regla vale para los dos. En un arriendo el orden es <b>ver, firmar y después pagar</b>, a la cuenta de quien firma el contrato. Si el orden se cumple, arrendar es seguro y hay que hacerlo; si alguien te lo invierte, ahí está la trampa. La prudencia es el orden, no la desconfianza.'

const RESUMEN =
  'Una agente inmobiliaria te da la dirección y tres horarios para ver un departamento.'

const CONTEXTO: Contexto = {
  antes: (
    <>
      Llevas <strong>un mes buscando departamento</strong> y escribiste a varios anuncios del sector
      que te interesa.
    </>
  ),
  ahora: (
    <>
      <strong>Esta tarde</strong> te contesta una agente de una inmobiliaria con la dirección
      completa y tres horarios para que vayas a verlo.
    </>
  ),
  detalle: 'Tienes los $640 de la garantía en tu cuenta y la app del banco en el teléfono.',
}

function VisitaDepartamento() {
  return (
    <StoryEscenario
      escenarioId="estafa/visita-departamento"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      story={STORY}
      senales={SENALES}
      rule={RULE}
      restartLabel="↻ Repetir el escenario"
      accionesEnPantalla
      apps={APPS}
      identidad={['cedula']}
      instruccion={
        <p className="text-lg leading-relaxed text-body">
          Actúa sobre el teléfono como lo harías con el tuyo: contéstale a la agente y usa{' '}
          <strong>cualquier app de abajo</strong>. No todo lo que llega es una trampa.
        </p>
      }
      pista={
        <p>
          Puedes coordinar la visita, ir a verlo, comprobar la inmobiliaria en el registro, leer el
          contrato antes de firmar o adelantar el pago. Fíjate en el orden de las cosas.
        </p>
      }
    />
  )
}

export default VisitaDepartamento

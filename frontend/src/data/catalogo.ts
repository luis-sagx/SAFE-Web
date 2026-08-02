import {
  Mail,
  MessageSquareText,
  Phone,
  ShoppingBag,
  StickyNote,
  UserRoundX,
  type LucideIcon,
} from 'lucide-react'
import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

export type Naturaleza = 'fraude' | 'legitimo'

export interface Seccion {
  id: string
  titulo: string
  /** Qué es la amenaza, en lenguaje de alguien que no es técnico. Basada en
   *  los anzuelos reales del diseño pedagógico (ver docs/superpowers/specs). */
  descripcion: string
  /** Dónde ocurre; va en la insignia de la tarjeta. */
  canal: string
  Icono: LucideIcon
}

interface EscenarioBase {
  seccionId: string
  escenarioId: string
  /** Describe la situación, nunca el veredicto: el menú no puede delatar
   *  cuáles casos son fraude y cuáles legítimos. */
  titulo: string
  descripcion: string
  /** Sube en +1 al editar el guion, para no mezclar corridas de versiones
   *  distintas en el análisis. */
  version: number
  naturaleza: Naturaleza
  dificultad: 1 | 2 | 3 | 4 | 5
  espeja: string | null
  Component: LazyExoticComponent<ComponentType>
}

export interface Escenario extends EscenarioBase {
  id: string
}

export const SECCIONES: Seccion[] = [
  {
    id: 'phishing',
    titulo: 'Phishing',
    descripcion:
      'Correos que copian a tu banco o al SRI: facturas falsas, códigos QR y alertas que buscan tu clave.',
    canal: 'Correo y web',
    Icono: Mail,
  },
  {
    id: 'smishing',
    titulo: 'Smishing',
    descripcion:
      'Bonos, multas de tránsito y paquetes retenidos que llegan junto a los SMS reales de tu banco.',
    canal: 'SMS y WhatsApp',
    Icono: MessageSquareText,
  },
  {
    id: 'vishing',
    titulo: 'Vishing',
    descripcion:
      'Llamadas de un falso antifraude o soporte técnico que piden un código mientras te apuran.',
    canal: 'Llamada telefónica',
    Icono: Phone,
  },
  {
    id: 'suplantacion',
    titulo: 'Suplantación de identidad',
    descripcion:
      'Un contacto que "cambió de número", un perfil clonado o una voz idéntica pidiendo dinero.',
    canal: 'Mensajería y redes',
    Icono: UserRoundX,
  },
  {
    id: 'estafa',
    titulo: 'Estafa electrónica',
    descripcion:
      'Compras que nunca llegan, un vuelto pedido antes de tiempo o inversiones con ganancia garantizada.',
    canal: 'Compra, venta y dinero',
    Icono: ShoppingBag,
  },
  {
    id: 'fisico',
    titulo: 'Riesgo físico',
    descripcion:
      'Una nota con la clave pegada al monitor o una memoria USB que alguien dejó ahí a propósito.',
    canal: 'Oficina y entorno',
    Icono: StickyNote,
  },
]

const BASE: EscenarioBase[] = [
  {
    seccionId: 'phishing',
    escenarioId: 'factura-sri',
    titulo: 'Factura por validar',
    descripcion:
      'Un correo institucional anuncia un comprobante pendiente y da un plazo de 24 horas.',
    version: 1,
    naturaleza: 'fraude',
    dificultad: 2,
    espeja: 'phishing/rol-de-pagos',
    Component: lazy(() => import('../secciones/phishing/FacturaSri')),
  },
  {
    seccionId: 'phishing',
    escenarioId: 'clave-caducada',
    titulo: 'Contraseña por caducar',
    descripcion: 'Soporte técnico avisa que tu clave vence hoy y ofrece un enlace para renovarla.',
    version: 1,
    naturaleza: 'fraude',
    dificultad: 3,
    espeja: 'phishing/rol-de-pagos',
    Component: lazy(() => import('../secciones/phishing/ClaveCaducada')),
  },
  {
    seccionId: 'phishing',
    escenarioId: 'rol-de-pagos',
    titulo: 'Rol de pagos disponible',
    descripcion: 'Talento Humano notifica que el rol del mes ya está publicado en el portal.',
    version: 1,
    naturaleza: 'legitimo',
    dificultad: 3,
    espeja: 'phishing/clave-caducada',
    Component: lazy(() => import('../secciones/phishing/RolDePagos')),
  },
  {
    seccionId: 'smishing',
    escenarioId: 'paquete-retenido',
    titulo: 'Paquete retenido',
    descripcion: 'Un mensaje pide un pago pequeño para liberar un envío que sí estás esperando.',
    version: 1,
    naturaleza: 'fraude',
    dificultad: 1,
    espeja: 'smishing/alerta-consumo',
    Component: lazy(() => import('../secciones/smishing/PaqueteRetenido')),
  },
  {
    seccionId: 'smishing',
    escenarioId: 'bono-estado',
    titulo: 'Bono preseleccionado',
    descripcion: 'Un SMS anuncia una ayuda económica y pide registrar la cuenta antes de un plazo.',
    version: 1,
    naturaleza: 'fraude',
    dificultad: 2,
    espeja: 'smishing/alerta-consumo',
    Component: lazy(() => import('../secciones/smishing/BonoEstado')),
  },
  {
    seccionId: 'smishing',
    escenarioId: 'alerta-consumo',
    titulo: 'Alerta de consumo',
    descripcion: 'Una notificación de tu banco informa un consumo hecho con tu tarjeta.',
    version: 1,
    naturaleza: 'legitimo',
    dificultad: 2,
    espeja: 'smishing/bono-estado',
    Component: lazy(() => import('../secciones/smishing/AlertaConsumo')),
  },
  {
    seccionId: 'estafa',
    escenarioId: 'saldo-contable',
    titulo: 'Saldo contable',
    descripcion:
      'Venta en línea, comprobante enviado y presión para entregar antes de confirmar fondos.',
    version: 1,
    naturaleza: 'fraude',
    dificultad: 2,
    espeja: null,
    Component: lazy(() => import('../secciones/estafa/SaldoContable')),
  },
  {
    seccionId: 'suplantacion',
    escenarioId: 'cambio-numero',
    titulo: 'Cambio de número',
    descripcion:
      'Un contacto conocido escribe desde otro número y trata de acelerar una transferencia.',
    version: 1,
    naturaleza: 'fraude',
    dificultad: 1,
    espeja: null,
    Component: lazy(() => import('../secciones/suplantacion/CambioNumero')),
  },
  {
    seccionId: 'vishing',
    escenarioId: 'llamada-antiestafas',
    titulo: 'Llamada antiestafas',
    descripcion:
      'Una llamada urgente busca que tomes decisiones bajo presión y sin verificación suficiente.',
    version: 1,
    naturaleza: 'fraude',
    dificultad: 1,
    espeja: null,
    Component: lazy(() => import('../secciones/vishing/LlamadaAntiestafas')),
  },
  {
    seccionId: 'fisico',
    escenarioId: 'foto',
    titulo: 'Foto para el boletín',
    descripcion:
      'Una escena cotidiana expone información sensible visible en el puesto de trabajo.',
    version: 1,
    naturaleza: 'fraude',
    dificultad: 2,
    espeja: null,
    Component: lazy(() => import('../secciones/fisico/Foto')),
  },
  {
    seccionId: 'fisico',
    escenarioId: 'baiting',
    titulo: 'Trampa USB',
    descripcion:
      'Debes identificar señales de riesgo físico y digital antes de conectar un dispositivo desconocido.',
    version: 1,
    naturaleza: 'fraude',
    dificultad: 2,
    espeja: null,
    Component: lazy(() => import('../secciones/fisico/Baiting')),
  },
]

// El id "<seccion>/<escenario>" es la clave que se guarda en la base: no puede
// cambiar una vez que un escenario tenga corridas registradas.
export const ESCENARIOS: Escenario[] = BASE.map((escenario) => ({
  ...escenario,
  id: `${escenario.seccionId}/${escenario.escenarioId}`,
}))

export function getSeccion(seccionId: string | undefined): Seccion | undefined {
  return SECCIONES.find((seccion) => seccion.id === seccionId)
}

export function escenariosDeSeccion(seccionId: string): Escenario[] {
  return ESCENARIOS.filter((escenario) => escenario.seccionId === seccionId)
}

export function getEscenario(id: string): Escenario | undefined {
  return ESCENARIOS.find((escenario) => escenario.id === id)
}

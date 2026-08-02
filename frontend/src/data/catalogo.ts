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

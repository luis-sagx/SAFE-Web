import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

export type Naturaleza = 'fraude' | 'legitimo'
export type EstadoSeccion = 'disponible' | 'proximamente'

export interface Seccion {
  id: string
  titulo: string
  tag: string
  estado: EstadoSeccion
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
    titulo: 'Phishing bancario',
    tag: 'Banca / Ingeniería social',
    estado: 'disponible',
  },
  {
    id: 'smishing',
    titulo: 'Smishing',
    tag: 'Mensajería / Suplantación',
    estado: 'disponible',
  },
  {
    id: 'vishing',
    titulo: 'Vishing',
    tag: 'Vishing / Presión',
    estado: 'disponible',
  },
  {
    id: 'fisico',
    titulo: 'Riesgo físico',
    tag: 'Exposición física / Oficina',
    estado: 'disponible',
  },
  {
    id: 'quishing',
    titulo: 'Quishing',
    tag: 'Códigos QR maliciosos',
    estado: 'proximamente',
  },
  {
    id: 'deepfake',
    titulo: 'Deepfake',
    tag: 'Audio / video sintético',
    estado: 'proximamente',
  },
]

const BASE: EscenarioBase[] = [
  {
    seccionId: 'phishing',
    escenarioId: 'saldo-contable',
    titulo: 'Saldo contable',
    descripcion:
      'Venta en línea, comprobante enviado y presión para entregar antes de confirmar fondos.',
    version: 1,
    naturaleza: 'fraude',
    dificultad: 2,
    espeja: null,
    Component: lazy(() => import('../secciones/phishing/SaldoContable')),
  },
  {
    seccionId: 'smishing',
    escenarioId: 'cambio-numero',
    titulo: 'Cambio de número',
    descripcion:
      'Un contacto conocido escribe desde otro número y trata de acelerar una transferencia.',
    version: 1,
    naturaleza: 'fraude',
    dificultad: 1,
    espeja: null,
    Component: lazy(() => import('../secciones/smishing/CambioNumero')),
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

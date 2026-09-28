import {
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  Coffee,
  Flower2,
  Image as ImageIcon,
  Mountain,
  Search,
  UserRound,
} from 'lucide-react'
import styles from './DeviceScreen.module.css'
import { APP_ACCENTS } from './appAccents'

// Las tres apps de relleno que sobrevivieron a la poda del dock (issue #187):
// cada una tiene su propio layout, con la pinta de la app real que dice ser,
// en vez del ícono-y-párrafo genérico de antes. El contenido es siempre el
// mismo,no hay nada que decidir aquí, es puro paisaje, así que vive fijo en
// este archivo y no en cada escenario.
export const TIPOS_RELLENO = ['banco', 'navegador', 'galeria'] as const
export type RellenoTipo = (typeof TIPOS_RELLENO)[number]

export function esRellenoTipo(valor: string): valor is RellenoTipo {
  return (TIPOS_RELLENO as readonly string[]).includes(valor)
}

const MOVIMIENTOS = [
  { id: 'compra', texto: 'Compra · Supermercado', fecha: 'Ayer', monto: '-$18.32', entra: false },
  { id: 'transferencia', texto: 'Transferencia recibida', fecha: 'Ayer', monto: '+$50.00', entra: true },
  { id: 'servicios', texto: 'Pago de servicios', fecha: 'Lun', monto: '-$24.10', entra: false },
]

const SITIOS_FRECUENTES = ['Correo', 'Noticias', 'Clima', 'Mapas']

const FOTOS = [
  { nombre: 'Parque', Icono: Mountain },
  { nombre: 'Café', Icono: Coffee },
  { nombre: 'Familia', Icono: UserRound },
  { nombre: 'Flores', Icono: Flower2 },
  { nombre: 'Ciudad', Icono: Building2 },
  { nombre: 'Montañas', Icono: ImageIcon },
] as const

interface AppRellenoProps {
  tipo: RellenoTipo
  // Color del dock: solo el banco lo reutiliza, en la tarjeta de saldo, para
  // que se sienta la misma app y no una plantilla genérica repetida tal cual
  // en cualquier escenario que la use.
  color?: string
}

function AppBanco({ color }: { color?: string }) {
  return (
    <div className={styles.appBanco}>
      <div className={styles.appBancoCuenta}>
        <span className={styles.appBancoCuentaIcono} aria-hidden>
          <Building2 className={styles.appBancoCuentaGlifo} strokeWidth={1.8} />
        </span>
        <span className={styles.appBancoCuentaTexto}>
          <span className={styles.appBancoCuentaNombre}>Cuenta de ahorros</span>
          <span className={styles.appBancoCuentaNumero}>•••• 2841</span>
        </span>
        <span className={styles.appBancoCuentaEstado}>Activa</span>
      </div>
      <div
        className={styles.appBancoSaldo}
        style={{ backgroundColor: color ?? APP_ACCENTS.bank }}
      >
        <span className={styles.appBancoSaldoEtiqueta}>Saldo disponible</span>
        <span className={styles.appBancoSaldoValor}>$312,45</span>
        <span className={styles.appBancoSaldoDetalle}>Actualizado hoy</span>
      </div>
      <div className={styles.appBancoSeccionFila}>
        <p className={styles.appBancoSeccion}>Movimientos recientes</p>
        <span className={styles.appBancoVerTodos}>Ver todos</span>
      </div>
      <ul className={styles.appBancoLista}>
        {MOVIMIENTOS.map((mov) => (
          <li key={mov.id} className={styles.appBancoItem}>
            <span
              className={`${styles.appBancoItemIcono} ${mov.entra ? styles.appBancoEntra : ''}`}
              aria-hidden
            >
              {mov.entra ? (
                <ArrowDownLeft className={styles.appBancoItemGlifo} strokeWidth={2} />
              ) : (
                <ArrowUpRight className={styles.appBancoItemGlifo} strokeWidth={2} />
              )}
            </span>
            <span className={styles.appBancoItemTexto}>
              <span className={styles.appBancoItemDescripcion}>{mov.texto}</span>
              <span className={styles.appBancoItemFecha}>{mov.fecha}</span>
            </span>
            <span className={`${styles.appBancoItemMonto} ${mov.entra ? styles.appBancoEntra : ''}`}>
              {mov.monto}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function AppNavegador() {
  return (
    <div className={styles.appNavegador}>
      <div className={styles.appNavegadorBarra}>
        <Search aria-hidden className={styles.appNavegadorIcono} strokeWidth={2} />
        <span className={styles.appNavegadorPlaceholder}>Buscar o escribir una dirección web</span>
      </div>
      <p className={styles.appNavegadorSeccion}>Sitios frecuentes</p>
      <div className={styles.appNavegadorGrid}>
        {SITIOS_FRECUENTES.map((sitio) => (
          <div key={sitio} className={styles.appNavegadorSitio}>
            <span className={styles.appNavegadorSitioIcono} aria-hidden />
            <span className={styles.appNavegadorSitioTexto}>{sitio}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AppGaleria() {
  return (
    <div className={styles.appGaleria}>
      <div className={styles.appGaleriaEncabezado}>
        <div>
          <p className={styles.appGaleriaTitulo}>Recuerdos</p>
          <p className={styles.appGaleriaTexto}>248 elementos</p>
        </div>
        <span className={styles.appGaleriaAccion}>Seleccionar</span>
      </div>
      <div className={styles.appGaleriaFiltro} aria-hidden>
        <span className={styles.appGaleriaFiltroActivo}>Recientes</span>
        <span>Álbumes</span>
      </div>
      <div className={styles.appGaleriaGrid}>
        {FOTOS.map(({ nombre, Icono }, index) => (
          <span
            key={nombre}
            className={`${styles.appGaleriaFoto} ${styles[`appGaleriaFoto${index + 1}`]}`}
            aria-hidden
          >
            <Icono className={styles.appGaleriaGlifo} strokeWidth={1.5} />
            <span className={styles.appGaleriaFotoNombre}>{nombre}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function AppRelleno({ tipo, color }: AppRellenoProps) {
  if (tipo === 'banco') return <AppBanco color={color} />
  if (tipo === 'navegador') return <AppNavegador />
  return <AppGaleria />
}

export default AppRelleno

import { Coffee, Landmark, Mountain, UserRound } from 'lucide-react'
import type { CSSProperties } from 'react'
import styles from './DeviceScreen.module.css'
import { APP_ACCENTS } from './appAccents'
import InicioNavegador, { type SitioFrecuente } from './InicioNavegador'

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
]

// Mismos sitios que los escenarios donde el navegador sí decide, para que no
// cambie de una app a otra. Ninguno responde: es relleno.
const SITIOS_FRECUENTES: SitioFrecuente[] = [
  { texto: 'elcomercio.com', detalle: 'Noticias del Ecuador' },
  { texto: 'bancolitoral.ec', detalle: 'Banca en línea' },
  { texto: 'inclusion.gob.ec', detalle: 'Ministerio de Inclusión Económica y Social' },
]

const FOTOS = [
  { nombre: 'Parque', Icono: Mountain },
  { nombre: 'Café', Icono: Coffee },
  { nombre: 'Familia', Icono: UserRound },
] as const

interface AppRellenoProps {
  tipo: RellenoTipo
  // Color del dock: solo el banco lo reutiliza, en la tarjeta de saldo, para
  // que se sienta la misma app y no una plantilla genérica repetida tal cual
  // en cualquier escenario que la use.
  color?: string
}

function AppBanco({ color }: { color?: string }) {
  const accent = { '--app-accent': color ?? APP_ACCENTS.bank } as CSSProperties
  return (
    <div className={styles.appBanco} style={accent}>
      <div className={styles.appBancoMarca}>
        <Landmark aria-hidden className={styles.appBancoMarcaGlifo} strokeWidth={2} />
        Banco del Litoral
      </div>
      <div className={styles.appBancoSaldo}>
        <span className={styles.appBancoSaldoEtiqueta}>Cuenta de ahorros •••• 2841</span>
        <span className={styles.appBancoSaldoValor}>$312,45</span>
        <span className={styles.appBancoSaldoDetalle}>Saldo disponible</span>
      </div>
      <p className={styles.appBancoSeccion}>Últimos movimientos</p>
      <ul className={styles.appBancoLista}>
        {MOVIMIENTOS.map((mov) => (
          <li key={mov.id} className={styles.appBancoItem}>
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
  return <InicioNavegador sitios={SITIOS_FRECUENTES} />
}

function AppGaleria() {
  return (
    <div className={styles.appGaleria}>
      <h2 className={styles.appGaleriaTitulo}>Recuerdos</h2>
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

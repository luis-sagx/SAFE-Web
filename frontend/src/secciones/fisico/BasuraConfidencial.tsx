import { Link } from 'react-router'
import dossierTheme from '../../styles/dossier-theme.module.css'

function BasuraConfidencial() {
  return (
    <div className={`${dossierTheme.dossierTheme}`} style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Basura sin destruir</h1>
      <p>Este escenario está en desarrollo.</p>
      <Link to="/seccion/fisico">← Volver a la sección</Link>
    </div>
  )
}

export default BasuraConfidencial

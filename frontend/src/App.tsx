import { Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Seccion from './pages/Seccion.jsx'
import SaldoContable from './secciones/phishing/SaldoContable.jsx'
import CambioNumero from './secciones/smishing/CambioNumero.jsx'
import LlamadaAntiestafas from './secciones/vishing/LlamadaAntiestafas.jsx'
import Foto from './secciones/fisico/Foto.jsx'
import Baiting from './secciones/fisico/Baiting.jsx'
import Quishing from './secciones/quishing/Quishing.jsx'
import Deepfake from './secciones/deepfake/Deepfake.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />

      <Route path="/seccion/quishing" element={<Quishing />} />
      <Route path="/seccion/deepfake" element={<Deepfake />} />
      <Route path="/seccion/:seccionId" element={<Seccion />} />

      <Route path="/seccion/phishing/saldo-contable" element={<SaldoContable />} />
      <Route path="/seccion/smishing/cambio-numero" element={<CambioNumero />} />
      <Route path="/seccion/vishing/llamada-antiestafas" element={<LlamadaAntiestafas />} />
      <Route path="/seccion/fisico/foto" element={<Foto />} />
      <Route path="/seccion/fisico/baiting" element={<Baiting />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App

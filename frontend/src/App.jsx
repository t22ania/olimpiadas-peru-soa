import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import RegistroInstitucion from './pages/RegistroInstitucion.jsx'
import InscripcionEquipos from './pages/InscripcionEquipos.jsx'
import SorteoCalendario from './pages/SorteoCalendario.jsx'
import RegistroResultados from './pages/RegistroResultados.jsx'
import TablaPosiciones from './pages/TablaPosiciones.jsx'
import Incidencias from './pages/Incidencias.jsx'
import Reportes from './pages/Reportes.jsx'
import Diccionario from './pages/Diccionario.jsx'

// Vistas permitidas por rol (id de ruta)
export const PERMISOS = {
  admin: ['instituciones', 'equipos', 'sorteo', 'resultados', 'posiciones', 'incidencias', 'reportes', 'diccionario'],
  coordinador: ['sorteo', 'resultados', 'incidencias', 'posiciones', 'diccionario'],
  arbitro: ['resultados', 'incidencias', 'diccionario'],
  institucion: ['instituciones', 'equipos', 'posiciones', 'diccionario']
}

export const VISTAS = [
  { id: 'instituciones', ruta: '/instituciones', titulo: 'Registro de institución', icono: '🏫' },
  { id: 'equipos', ruta: '/equipos', titulo: 'Inscripción de equipos', icono: '📝' },
  { id: 'sorteo', ruta: '/sorteo', titulo: 'Sorteo y calendario', icono: '🎲' },
  { id: 'resultados', ruta: '/resultados', titulo: 'Registro de resultados', icono: '⚽' },
  { id: 'posiciones', ruta: '/posiciones', titulo: 'Tabla y estadísticas', icono: '🏆' },
  { id: 'incidencias', ruta: '/incidencias', titulo: 'Incidencias', icono: '🚨' },
  { id: 'reportes', ruta: '/reportes', titulo: 'Reportes', icono: '📊' },
  { id: 'diccionario', ruta: '/diccionario', titulo: 'Acerca del sistema', icono: '📖' }
]

function Privada ({ vistaId, children }) {
  const { usuario } = useAuth()
  if (!usuario) return <Navigate to="/login" replace />
  const permitido = PERMISOS[usuario.rol] || []
  if (vistaId && !permitido.includes(vistaId)) {
    return <Navigate to={`/${permitido[0] || 'posiciones'}`} replace />
  }
  return <Layout>{children}</Layout>
}

export default function App () {
  const { usuario } = useAuth()
  const inicio = usuario ? `/${(PERMISOS[usuario.rol] || ['posiciones'])[0]}` : '/login'

  return (
    <Routes>
      <Route path="/login" element={usuario ? <Navigate to={inicio} replace /> : <Login />} />
      <Route path="/instituciones" element={<Privada vistaId="instituciones"><RegistroInstitucion /></Privada>} />
      <Route path="/equipos" element={<Privada vistaId="equipos"><InscripcionEquipos /></Privada>} />
      <Route path="/sorteo" element={<Privada vistaId="sorteo"><SorteoCalendario /></Privada>} />
      <Route path="/resultados" element={<Privada vistaId="resultados"><RegistroResultados /></Privada>} />
      <Route path="/posiciones" element={<Privada vistaId="posiciones"><TablaPosiciones /></Privada>} />
      <Route path="/incidencias" element={<Privada vistaId="incidencias"><Incidencias /></Privada>} />
      <Route path="/reportes" element={<Privada vistaId="reportes"><Reportes /></Privada>} />
      <Route path="/diccionario" element={<Privada vistaId="diccionario"><Diccionario /></Privada>} />
      <Route path="*" element={<Navigate to={inicio} replace />} />
    </Routes>
  )
}

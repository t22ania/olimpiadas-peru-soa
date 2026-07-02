import { useNavigate } from 'react-router-dom'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import Sidebar from './Sidebar.jsx'

export default function Layout ({ children }) {
  const { usuario, logout, origen } = useAuth()
  const navigate = useNavigate()

  const salir = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="contenido">
        <header className="topbar">
          <div className="topbar-titulo">
            Panel de gestión deportiva
            <span className={'origen-badge ' + (origen === 'servicio' ? 'on' : 'off')}>
              {origen === 'servicio' ? '🟢 conectado al servicio' : '🟡 modo demo'}
            </span>
          </div>
          <div className="topbar-usuario">
            <div className="avatar">{usuario.nombre.charAt(0)}</div>
            <div className="usuario-info">
              <strong>{usuario.nombre}</strong>
              <span className="rol-badge">{ROLES[usuario.rol]}</span>
            </div>
            <button className="btn-salir" onClick={salir}>Salir</button>
          </div>
        </header>
        <main className="main">{children}</main>
      </div>
    </div>
  )
}

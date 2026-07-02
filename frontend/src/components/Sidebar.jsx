import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { PERMISOS, VISTAS } from '../App.jsx'

export default function Sidebar () {
  const { usuario } = useAuth()
  const permitido = PERMISOS[usuario.rol] || []
  const vistas = VISTAS.filter(v => permitido.includes(v.id))

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">🏅 Olimpiadas PERÚ</div>
      <nav>
        {vistas.map(v => (
          <NavLink
            key={v.id}
            to={v.ruta}
            className={({ isActive }) => 'nav-item' + (isActive ? ' activo' : '')}
          >
            <span className="nav-icono">{v.icono}</span>
            <span>{v.titulo}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

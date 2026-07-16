import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { PERMISOS } from '../App.jsx'

export default function Login () {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const enviar = async (e) => {
    e.preventDefault()
    setError('')
    setCargando(true)
    const res = await login(email, password)
    setCargando(false)
    if (!res.ok) { setError(res.error); return }
    const inicio = (PERMISOS[res.usuario.rol] || ['posiciones'])[0]
    navigate(`/${inicio}`, { replace: true })
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-emoji">🏅</div>
          <h1>Olimpiadas PERÚ</h1>
          <p>Sistema de gestión de olimpiadas deportivas</p>
        </div>

        <form onSubmit={enviar} className="login-form">
          <label>Correo electrónico</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="correo@demo.com"
            autoFocus
          />

          <label>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••"
          />

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="btn-primario btn-full" disabled={cargando}>
            {cargando ? 'Ingresando…' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="login-nota">Acceso restringido. Solicita tus credenciales al administrador del sistema.</p>
      </div>
    </div>
  )
}

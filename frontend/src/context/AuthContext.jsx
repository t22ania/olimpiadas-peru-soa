import { createContext, useContext, useState } from 'react'
import { usuarios } from '../data/seed.js'
import { loginRemoto } from '../api.js'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export const ROLES = {
  admin: 'Administrador',
  coordinador: 'Coordinador',
  arbitro: 'Árbitro',
  institucion: 'Institución'
}

export function AuthProvider ({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [origen, setOrigen] = useState(null) // 'servicio' | 'demo'

  // Validación local (modo demo / respaldo)
  const loginLocal = (email, password) => {
    const u = usuarios.find(
      x => x.email.toLowerCase() === email.trim().toLowerCase() && x.password === password
    )
    if (!u) return { ok: false, error: 'Correo o contraseña incorrectos.' }
    setUsuario(u)
    setOrigen('demo')
    return { ok: true, usuario: u }
  }

  // Intenta el microservicio de login (4001); si no responde, usa el modo demo.
  const login = async (email, password) => {
    try {
      const { ok, data } = await loginRemoto(email, password)
      if (!ok) return { ok: false, error: data.error || 'Credenciales incorrectas.' }
      setUsuario(data.usuario)
      setOrigen('servicio')
      try { sessionStorage.setItem('token', data.token) } catch { /* noop */ }
      return { ok: true, usuario: data.usuario }
    } catch {
      // servicio no disponible -> respaldo en memoria
      return loginLocal(email, password)
    }
  }

  const logout = () => {
    setUsuario(null)
    setOrigen(null)
    try { sessionStorage.removeItem('token') } catch { /* noop */ }
  }

  return (
    <AuthContext.Provider value={{ usuario, origen, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

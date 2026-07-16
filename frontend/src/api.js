// Cliente HTTP para los microservicios SOA.
export const API_URL = 'http://localhost:4000'      // sistema-web-completo
export const LOGIN_URL = 'http://localhost:4001'    // servicio-login
export const REGISTRO_URL = 'http://localhost:4002' // servicio-registro

async function request (url, { method = 'GET', body, timeout = 8000 } = {}) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeout)
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const err = new Error(data.error || `HTTP ${res.status}`)
      err.status = res.status
      err.data = data
      throw err
    }
    return data
  } finally {
    clearTimeout(t)
  }
}

// ---- Autenticación (servicio-login :4001) ----
export const loginRemoto = (email, password) =>
  request(`${LOGIN_URL}/login`, { method: 'POST', body: { email, password }, timeout: 2500 })
    .then(data => ({ ok: true, data }))
    .catch(e => (e.status ? { ok: false, data: e.data || {} } : Promise.reject(e)))

// ---- Registro (servicio-registro :4002) ----
export const registrarInstitucionRemoto = (payload) =>
  request(`${REGISTRO_URL}/instituciones`, { method: 'POST', body: payload, timeout: 4000 })

// ---- Gestión de cuentas y roles (servicio-registro :4002) ----
export const getUsuariosRemoto = () =>
  request(`${REGISTRO_URL}/usuarios`, { timeout: 4000 })
export const crearUsuarioRemoto = (payload) =>
  request(`${REGISTRO_URL}/usuarios`, { method: 'POST', body: payload, timeout: 4000 })
export const cambiarRolRemoto = (id, rol) =>
  request(`${REGISTRO_URL}/usuarios/${id}/rol`, { method: 'PATCH', body: { rol }, timeout: 4000 })
export const actualizarUsuarioRemoto = (id, payload) =>
  request(`${REGISTRO_URL}/usuarios/${id}`, { method: 'PATCH', body: payload, timeout: 4000 })
export const eliminarUsuarioRemoto = (id) =>
  request(`${REGISTRO_URL}/usuarios/${id}`, { method: 'DELETE', timeout: 4000 })

// ---- Sistema web completo (:4000) ----
export const getDeportes = () => request(`${API_URL}/api/deportes`)
export const getInstituciones = () => request(`${API_URL}/api/instituciones`)
export const getEventos = () => request(`${API_URL}/api/eventos`)
export const getPaisesPorGrado = () => request(`${API_URL}/api/instituciones/paises-por-grado`)

export const getEquipos = (deporteId) =>
  request(`${API_URL}/api/equipos${deporteId ? `?deporteId=${deporteId}` : ''}`)
export const crearEquipo = (payload) =>
  request(`${API_URL}/api/equipos`, { method: 'POST', body: payload })
export const agregarParticipante = (equipoId, payload) =>
  request(`${API_URL}/api/equipos/${equipoId}/participantes`, { method: 'POST', body: payload })
export const habilitarEquipo = (equipoId) =>
  request(`${API_URL}/api/equipos/${equipoId}/habilitar`, { method: 'POST' })
export const getParticipantes = (equipoId) =>
  request(`${API_URL}/api/equipos/${equipoId}/participantes`)

export const getPartidos = (deporteId) =>
  request(`${API_URL}/api/partidos${deporteId ? `?deporteId=${deporteId}` : ''}`)
export const ejecutarSorteoRemoto = (payload) =>
  request(`${API_URL}/api/partidos/sorteo`, { method: 'POST', body: payload })

export const registrarResultadoRemoto = (partidoId, payload) =>
  request(`${API_URL}/api/resultados/partido/${partidoId}`, { method: 'POST', body: payload })
export const getPosiciones = (deporteId) =>
  request(`${API_URL}/api/resultados/posiciones/${deporteId}`)
export const getRanking = (deporteId) =>
  request(`${API_URL}/api/resultados/ranking/${deporteId}`)

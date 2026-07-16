import { useEffect, useState } from 'react'
import { useData } from '../context/DataContext.jsx'
import { useAuth, ROLES } from '../context/AuthContext.jsx'

// [valor, etiqueta] de cada rol de acceso, p. ej. ['admin', 'Administrador']
const ROL_OPCIONES = Object.entries(ROLES)
const FORM_VACIO = { nombre: '', email: '', password: '', rol: 'institucion' }

export default function Usuarios () {
  const { usuarios, cargarUsuarios, crearUsuario, cambiarRol, actualizarUsuario, eliminarUsuario, modoDemo } = useData()
  const { usuario: actual } = useAuth()
  const [form, setForm] = useState(FORM_VACIO)
  const [editando, setEditando] = useState(null) // id de la cuenta en edición, o null (creación)
  const [aviso, setAviso] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => { cargarUsuarios() }, [cargarUsuarios])

  const cambiar = (campo, valor) => setForm(prev => ({ ...prev, [campo]: valor }))
  const esOk = (t) => t.startsWith('✅') || t.startsWith('🗑️')

  const cancelar = () => { setEditando(null); setForm(FORM_VACIO); setAviso('') }

  const editar = (u) => {
    setEditando(u.id)
    setForm({ nombre: u.nombre, email: u.email, password: '', rol: u.rol })
    setAviso('')
  }

  const enviar = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim() || !form.email.trim()) return
    if (!editando && !form.password) return
    setGuardando(true); setAviso('')
    try {
      if (editando) {
        await actualizarUsuario(editando, { nombre: form.nombre, email: form.email, password: form.password })
        setAviso(`✅ Cuenta de "${form.nombre}" actualizada${form.password ? ' (contraseña cambiada)' : ''}.`)
      } else {
        const creado = await crearUsuario(form)
        setAviso(`✅ Cuenta "${creado.nombre}" creada como ${ROLES[creado.rol]}.`)
      }
      setEditando(null)
      setForm(FORM_VACIO)
    } catch (err) {
      setAviso(`⚠️ ${err.message || 'No se pudo guardar la cuenta.'}`)
    } finally {
      setGuardando(false)
    }
  }

  const onCambiarRol = async (u, rol) => {
    setAviso('')
    try {
      await cambiarRol(u.id, rol)
      setAviso(`✅ ${u.nombre} ahora es ${ROLES[rol]}.`)
    } catch (err) {
      setAviso(`⚠️ ${err.message || 'No se pudo cambiar el rol.'}`)
    }
  }

  const onEliminar = async (u) => {
    if (!window.confirm(`¿Eliminar la cuenta de ${u.nombre} (${u.email})?`)) return
    setAviso('')
    try {
      await eliminarUsuario(u.id)
      if (editando === u.id) cancelar()
      setAviso(`🗑️ Cuenta "${u.nombre}" eliminada.`)
    } catch (err) {
      setAviso(`⚠️ ${err.message || 'No se pudo eliminar la cuenta.'}`)
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <h2>👥 Usuarios y accesos</h2>
        <p>
          Crea cuentas, cambia correos y contraseñas, asigna roles y controla quién entra al sistema.
          {modoDemo && ' (Modo demostración: los cambios se mantienen solo durante la sesión.)'}
        </p>
      </div>

      <div className="grid-2">
        <section className="card">
          <h3>{editando ? 'Editar cuenta' : 'Nueva cuenta'}</h3>
          <form onSubmit={enviar} className="form">
            <label>Nombre completo</label>
            <input value={form.nombre} onChange={e => cambiar('nombre', e.target.value)} placeholder="Ej: Juana Torres" required />

            <label>Correo electrónico</label>
            <input type="email" value={form.email} onChange={e => cambiar('email', e.target.value)} placeholder="correo@olimpiadas.pe" required />

            <label>{editando ? 'Nueva contraseña (opcional)' : 'Contraseña'}</label>
            <input
              type="password"
              value={form.password}
              onChange={e => cambiar('password', e.target.value)}
              placeholder={editando ? 'Dejar en blanco para no cambiarla' : 'Mínimo 6 caracteres'}
              minLength={editando && !form.password ? undefined : 6}
              required={!editando}
            />

            {!editando && (
              <>
                <label>Rol de acceso</label>
                <select value={form.rol} onChange={e => cambiar('rol', e.target.value)}>
                  {ROL_OPCIONES.map(([val, txt]) => <option key={val} value={val}>{txt}</option>)}
                </select>
              </>
            )}

            {aviso && <div className={esOk(aviso) ? 'aviso-ok' : 'aviso-warn'}>{aviso}</div>}

            <div className="form-acciones">
              <button type="submit" className="btn-primario" disabled={guardando}>
                {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear cuenta'}
              </button>
              {editando && (
                <button type="button" className="btn-secundario" onClick={cancelar} disabled={guardando}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="card">
          <h3>Cuentas registradas ({usuarios.length})</h3>
          <table className="tabla">
            <thead>
              <tr><th>Nombre</th><th>Correo</th><th>Rol de acceso</th><th></th></tr>
            </thead>
            <tbody>
              {usuarios.length === 0 && (
                <tr><td colSpan={4} className="vacio">No hay cuentas registradas.</td></tr>
              )}
              {usuarios.map(u => {
                const esYo = actual?.email?.toLowerCase() === u.email.toLowerCase()
                return (
                  <tr key={u.id}>
                    <td>{u.nombre} {esYo && <span className="pill">tú</span>}</td>
                    <td>{u.email}</td>
                    <td>
                      <select value={u.rol} onChange={e => onCambiarRol(u, e.target.value)} disabled={esYo}>
                        {ROL_OPCIONES.map(([val, txt]) => <option key={val} value={val}>{txt}</option>)}
                      </select>
                    </td>
                    <td className="acciones-fila">
                      <button className="btn-secundario btn-mini" onClick={() => editar(u)} title="Editar correo o contraseña">
                        Editar
                      </button>
                      <button
                        className="btn-quitar"
                        onClick={() => onEliminar(u)}
                        disabled={esYo}
                        title={esYo ? 'No puedes eliminar tu propia cuenta' : 'Eliminar cuenta'}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  )
}

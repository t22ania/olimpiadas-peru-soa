import { useState } from 'react'
import { useData } from '../context/DataContext.jsx'

export default function RegistroInstitucion () {
  const { instituciones, agregarInstitucion, GRADOS, PAIS_POR_GRADO } = useData()
  const [form, setForm] = useState({ nombre: '', contacto: '', grado: GRADOS[0] })
  const [aviso, setAviso] = useState('')
  const [guardando, setGuardando] = useState(false)

  const paisAsignado = PAIS_POR_GRADO[form.grado]

  const cambiar = (campo, valor) => setForm(prev => ({ ...prev, [campo]: valor }))

  const enviar = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim() || !form.contacto.trim()) return
    setGuardando(true)
    try {
      // Persiste vía microservicio de registro (:4002) y refresca desde la BD (:4000)
      const nueva = await agregarInstitucion(form)
      setAviso(`✅ "${nueva.nombre}" registrada como ${nueva.pais} (${nueva.grado}) en la base de datos.`)
      setForm({ nombre: '', contacto: '', grado: GRADOS[0] })
    } catch {
      setAviso('⚠️ No se pudo registrar. Verifica que los servicios y PostgreSQL estén corriendo.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <h2>🏫 Registro de institución</h2>
        <p>El país representado se asigna automáticamente según el grado.</p>
      </div>

      <div className="grid-2">
        <section className="card">
          <h3>Nueva institución</h3>
          <form onSubmit={enviar} className="form">
            <label>Nombre de la institución</label>
            <input value={form.nombre} onChange={e => cambiar('nombre', e.target.value)} placeholder="Ej: I.E. José Olaya" required />

            <label>Persona de contacto</label>
            <input value={form.contacto} onChange={e => cambiar('contacto', e.target.value)} placeholder="Ej: Juana Torres" required />

            <label>Grado / categoría</label>
            <select value={form.grado} onChange={e => cambiar('grado', e.target.value)}>
              {GRADOS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>

            <div className="pais-preview">
              País representado: <strong>{paisAsignado}</strong>
            </div>

            {aviso && <div className={aviso.startsWith('✅') ? 'aviso-ok' : 'aviso-warn'}>{aviso}</div>}

            <button type="submit" className="btn-primario" disabled={guardando}>
              {guardando ? 'Guardando…' : 'Registrar institución'}
            </button>
          </form>
        </section>

        <section className="card">
          <h3>Instituciones registradas ({instituciones.length})</h3>
          <table className="tabla">
            <thead>
              <tr><th>Institución</th><th>Contacto</th><th>Grado</th><th>País</th></tr>
            </thead>
            <tbody>
              {instituciones.map(i => (
                <tr key={i.id}>
                  <td>{i.nombre}</td>
                  <td>{i.contacto}</td>
                  <td>{i.grado}</td>
                  <td><span className="pill">{i.pais}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  )
}

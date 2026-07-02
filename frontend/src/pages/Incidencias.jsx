import { useState } from 'react'
import { useData } from '../context/DataContext.jsx'
import { SLA_INCIDENCIA } from '../data/seed.js'

const TIPOS = ['Técnica', 'Deportiva', 'Administrativa', 'Disciplinaria']

const claseEstado = (e) =>
  e === 'Resuelta' ? 'estado estado-resuelta'
    : e === 'En proceso' ? 'estado estado-proceso'
      : 'estado estado-reportada'

export default function Incidencias () {
  const { incidencias, agregarIncidencia, avanzarEstadoIncidencia, partidos } = useData()
  const [form, setForm] = useState({ tipo: 'Técnica', descripcion: '', partido: '' })
  const [aviso, setAviso] = useState('')

  const opcionesPartido = partidos.map(p => `${p.localNombre} vs ${p.visitaNombre}`)

  const cambiar = (campo, valor) => setForm(prev => ({ ...prev, [campo]: valor }))

  const enviar = (e) => {
    e.preventDefault()
    if (!form.descripcion.trim()) return
    agregarIncidencia(form)
    setAviso(`✅ Incidencia ${form.tipo} reportada (SLA ${SLA_INCIDENCIA[form.tipo]}).`)
    setForm({ tipo: 'Técnica', descripcion: '', partido: '' })
  }

  return (
    <div className="page">
      <div className="page-head">
        <h2>🚨 Gestión de incidencias</h2>
        <p>Reporta incidencias y haz seguimiento a su estado según el tiempo límite (SLA).</p>
      </div>

      <div className="grid-2">
        <section className="card">
          <h3>Reportar incidencia</h3>
          <form onSubmit={enviar} className="form">
            <label>Tipo de incidencia</label>
            <select value={form.tipo} onChange={e => cambiar('tipo', e.target.value)}>
              {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <div className="pais-preview">
              Tiempo límite (SLA): <strong>{SLA_INCIDENCIA[form.tipo]}</strong>
            </div>

            <label>Partido relacionado</label>
            <select value={form.partido} onChange={e => cambiar('partido', e.target.value)}>
              <option value="">General (sin partido)</option>
              {opcionesPartido.map((o, i) => <option key={i} value={o}>{o}</option>)}
            </select>

            <label>Descripción</label>
            <textarea value={form.descripcion} onChange={e => cambiar('descripcion', e.target.value)}
              placeholder="Describe la incidencia…" rows={3} required />

            {aviso && <div className="aviso-ok">{aviso}</div>}

            <button type="submit" className="btn-primario">Reportar incidencia</button>
          </form>

          <p className="hint">
            <strong>SLA por tipo:</strong> Técnica &lt;2h · Deportiva &lt;24h · Administrativa &lt;48h · Disciplinaria &lt;72h
          </p>
        </section>

        <section className="card">
          <h3>Incidencias registradas ({incidencias.length})</h3>
          <table className="tabla">
            <thead>
              <tr><th>Tipo</th><th>Descripción</th><th>Partido</th><th>SLA</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody>
              {incidencias.length === 0 && <tr><td colSpan="6" className="vacio">Sin incidencias.</td></tr>}
              {incidencias.map(i => (
                <tr key={i.id}>
                  <td>{i.tipo}</td>
                  <td>{i.descripcion}</td>
                  <td>{i.partido}</td>
                  <td><span className="pill">{SLA_INCIDENCIA[i.tipo]}</span></td>
                  <td><span className={claseEstado(i.estado)}>{i.estado}</span></td>
                  <td>
                    <button className="btn-secundario" disabled={i.estado === 'Resuelta'}
                      onClick={() => avanzarEstadoIncidencia(i.id)}>
                      {i.estado === 'Resuelta' ? 'Cerrada' : 'Avanzar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  )
}

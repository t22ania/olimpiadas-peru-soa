import { useEffect, useMemo, useState } from 'react'
import { useData } from '../context/DataContext.jsx'

export default function InscripcionEquipos () {
  const { DEPORTES, instituciones, equipos, inscribirEquipo, cargando } = useData()
  const [deporteId, setDeporteId] = useState('')
  const [nombreEquipo, setNombreEquipo] = useState('')
  const [institucionId, setInstitucionId] = useState('')
  const [lista, setLista] = useState([])
  const [nuevoJugador, setNuevoJugador] = useState('')
  const [aviso, setAviso] = useState('')
  const [guardando, setGuardando] = useState(false)

  // Inicializa selects cuando llegan los datos de la API
  useEffect(() => { if (!deporteId && DEPORTES.length) setDeporteId(DEPORTES[0].id) }, [DEPORTES, deporteId])
  useEffect(() => { if (!institucionId && instituciones.length) setInstitucionId(instituciones[0].id) }, [instituciones, institucionId])

  const deporte = DEPORTES.find(d => d.id === deporteId)
  const cumpleMin = deporte ? lista.length >= deporte.min : false
  const cumpleMax = deporte ? lista.length <= deporte.max : true

  const equiposDeporte = useMemo(
    () => equipos.filter(e => e.deporte_id === deporteId),
    [equipos, deporteId]
  )

  if (cargando || !deporte) return <div className="page"><p className="vacio">Cargando datos…</p></div>

  const agregarJugador = (e) => {
    e.preventDefault()
    const nombre = nuevoJugador.trim()
    if (!nombre) return
    if (lista.length >= deporte.max) {
      setAviso(`⚠️ Máximo ${deporte.max} participantes para ${deporte.nombre}.`)
      return
    }
    setLista(prev => [...prev, { id: `${Date.now()}`, nombre, dorsal: prev.length + 1 }])
    setNuevoJugador('')
    setAviso('')
  }

  const quitar = (id) => setLista(prev => prev.filter(j => j.id !== id).map((j, i) => ({ ...j, dorsal: i + 1 })))

  const inscribir = async () => {
    if (!nombreEquipo.trim() || !cumpleMin) return
    setGuardando(true)
    try {
      const res = await inscribirEquipo({ deporte_id: deporteId, nombre: nombreEquipo, institucion_id: institucionId, participantes: lista })
      if (res.habilitado) {
        setAviso(`✅ Equipo "${nombreEquipo}" inscrito y HABILITADO en ${deporte.nombre} (${lista.length} participantes).`)
      } else {
        setAviso(`⚠️ Equipo creado pero no habilitado: ${res.mensaje || 'no cumple el mínimo.'}`)
      }
      setNombreEquipo('')
      setLista([])
    } catch {
      setAviso('⚠️ Error al inscribir. ¿Servicios y BD activos?')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <h2>📝 Inscripción de equipos</h2>
        <p>Mínimo por deporte — Fútbol 11, Básquet 5, Vóley 6, Ping Pong 1 a 2. (Se guarda en la base de datos)</p>
      </div>

      <div className="grid-2">
        <section className="card">
          <h3>Nuevo equipo</h3>
          <div className="form">
            <label>Disciplina</label>
            <select value={deporteId} onChange={e => { setDeporteId(Number(e.target.value)); setLista([]); setAviso('') }}>
              {DEPORTES.map(d => <option key={d.id} value={d.id}>{d.nombre} ({d.genero}) · mín {d.min}</option>)}
            </select>

            <label>Nombre del equipo</label>
            <input value={nombreEquipo} onChange={e => setNombreEquipo(e.target.value)} placeholder="Ej: Los Halcones" />

            <label>Institución</label>
            <select value={institucionId} onChange={e => setInstitucionId(Number(e.target.value))}>
              {instituciones.map(i => <option key={i.id} value={i.id}>{i.nombre} — {i.pais}</option>)}
            </select>
          </div>

          <form onSubmit={agregarJugador} className="inline-form">
            <input value={nuevoJugador} onChange={e => setNuevoJugador(e.target.value)} placeholder="Nombre del participante" />
            <button type="submit" className="btn-secundario">+ Agregar</button>
          </form>

          <div className={'contador ' + (cumpleMin ? 'ok' : 'pendiente')}>
            Participantes: <strong>{lista.length}</strong> / mínimo {deporte.min}
            {!cumpleMin && <span> · faltan {deporte.min - lista.length}</span>}
            {cumpleMin && cumpleMax && <span> · ✔ cumple el mínimo</span>}
          </div>

          <table className="tabla">
            <thead><tr><th>#</th><th>Participante</th><th></th></tr></thead>
            <tbody>
              {lista.length === 0 && <tr><td colSpan="3" className="vacio">Aún no hay participantes.</td></tr>}
              {lista.map(j => (
                <tr key={j.id}>
                  <td>{j.dorsal}</td>
                  <td>{j.nombre}</td>
                  <td><button className="btn-quitar" onClick={() => quitar(j.id)}>Quitar</button></td>
                </tr>
              ))}
            </tbody>
          </table>

          {aviso && <div className={aviso.startsWith('✅') ? 'aviso-ok' : 'aviso-warn'}>{aviso}</div>}

          <button className="btn-primario" disabled={!cumpleMin || !nombreEquipo.trim() || guardando} onClick={inscribir}>
            {guardando ? 'Inscribiendo…' : 'Inscribir equipo'}
          </button>
        </section>

        <section className="card">
          <h3>Equipos en {deporte.nombre} ({equiposDeporte.length})</h3>
          <table className="tabla">
            <thead><tr><th>Equipo</th><th>Institución</th><th>Participantes</th><th>Estado</th></tr></thead>
            <tbody>
              {equiposDeporte.length === 0 && <tr><td colSpan="4" className="vacio">Sin equipos en esta disciplina.</td></tr>}
              {equiposDeporte.map(e => (
                <tr key={e.id}>
                  <td>{e.nombre}</td>
                  <td>{e.institucion_nombre || '—'}</td>
                  <td><span className="pill">{e.participantes}</span></td>
                  <td><span className={'estado estado-' + (e.estado === 'habilitado' ? 'publicado' : 'pendiente')}>{e.estado}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  )
}

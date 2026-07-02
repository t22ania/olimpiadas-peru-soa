import { useEffect, useMemo, useState } from 'react'
import { useData } from '../context/DataContext.jsx'

export default function RegistroResultados () {
  const { DEPORTES, partidos, registrarResultado, getParticipantes, cargando } = useData()
  const [seleccionId, setSeleccionId] = useState(null)
  const [marcador, setMarcador] = useState({ local: '', visitante: '' })
  const [goleadorLocal, setGoleadorLocal] = useState('')
  const [goleadorVisitante, setGoleadorVisitante] = useState('')
  const [participantes, setParticipantes] = useState({ local: [], visita: [] })
  const [validado, setValidado] = useState(false)
  const [publicando, setPublicando] = useState(false)

  const deporteNombre = (id) => DEPORTES.find(d => d.id === id)?.nombre || id
  const partido = useMemo(() => partidos.find(p => p.id === seleccionId), [partidos, seleccionId])

  // Carga participantes reales de ambos equipos al seleccionar un partido
  useEffect(() => {
    if (!partido) return
    let activo = true
    Promise.all([
      partido.localId ? getParticipantes(partido.localId) : Promise.resolve([]),
      partido.visitaId ? getParticipantes(partido.visitaId) : Promise.resolve([])
    ]).then(([local, visita]) => { if (activo) setParticipantes({ local, visita }) })
    return () => { activo = false }
  }, [partido, getParticipantes])

  const seleccionar = (p) => {
    setSeleccionId(p.id)
    setMarcador({ local: p.golesLocal ?? '', visitante: p.golesVisitante ?? '' })
    setGoleadorLocal('')
    setGoleadorVisitante('')
    setValidado(false)
  }

  const datosValidos = marcador.local !== '' && marcador.visitante !== '' &&
    Number(marcador.local) >= 0 && Number(marcador.visitante) >= 0

  const validar = () => { if (datosValidos) setValidado(true) }

  const publicar = async () => {
    const estadisticas = []
    if (goleadorLocal && Number(marcador.local) > 0) {
      estadisticas.push({ participante_id: Number(goleadorLocal), goles: Number(marcador.local) })
    }
    if (goleadorVisitante && Number(marcador.visitante) > 0) {
      estadisticas.push({ participante_id: Number(goleadorVisitante), goles: Number(marcador.visitante) })
    }
    setPublicando(true)
    try {
      await registrarResultado(partido.id, {
        marcador_local: Number(marcador.local),
        marcador_visita: Number(marcador.visitante),
        publicado: true,
        estadisticas
      })
      setSeleccionId(null)
      setValidado(false)
    } finally {
      setPublicando(false)
    }
  }

  if (cargando) return <div className="page"><p className="vacio">Cargando datos…</p></div>

  return (
    <div className="page">
      <div className="page-head">
        <h2>⚽ Registro de resultados</h2>
        <p>Elige un partido, ingresa el marcador, valida y publica. Al publicar se guarda en la BD y se recalcula la tabla.</p>
      </div>

      <div className="grid-2">
        <section className="card">
          <h3>Partidos</h3>
          <table className="tabla">
            <thead><tr><th>Disciplina</th><th>Encuentro</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {partidos.length === 0 && <tr><td colSpan="4" className="vacio">No hay partidos.</td></tr>}
              {partidos.map(p => (
                <tr key={p.id} className={p.id === seleccionId ? 'fila-activa' : ''}>
                  <td>{deporteNombre(p.deporte_id)}</td>
                  <td>{p.localNombre} vs {p.visitaNombre}
                    {p.publicado && <span className="marcador-mini"> ({p.golesLocal}-{p.golesVisitante})</span>}
                  </td>
                  <td><span className={'estado estado-' + p.estado}>{p.estado}</span></td>
                  <td><button className="btn-secundario" onClick={() => seleccionar(p)}>Registrar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card">
          <h3>Acta del partido</h3>
          {!partido && <p className="vacio">Selecciona un partido de la lista.</p>}
          {partido && (
            <div className="acta">
              <div className="acta-equipos">
                <strong>{partido.localNombre}</strong> vs <strong>{partido.visitaNombre}</strong>
                <div className="acta-meta">{deporteNombre(partido.deporte_id)} · 📅 {partido.fecha} · 📍 {partido.sede}</div>
              </div>

              <div className="marcador-form">
                <div>
                  <label>{partido.localNombre}</label>
                  <input type="number" min="0" value={marcador.local}
                    onChange={e => { setMarcador(m => ({ ...m, local: e.target.value })); setValidado(false) }} />
                  <select className="goleador" value={goleadorLocal} onChange={e => setGoleadorLocal(e.target.value)}>
                    <option value="">Goleador / anotador (opcional)</option>
                    {participantes.local.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </div>
                <div className="marcador-sep">—</div>
                <div>
                  <label>{partido.visitaNombre}</label>
                  <input type="number" min="0" value={marcador.visitante}
                    onChange={e => { setMarcador(m => ({ ...m, visitante: e.target.value })); setValidado(false) }} />
                  <select className="goleador" value={goleadorVisitante} onChange={e => setGoleadorVisitante(e.target.value)}>
                    <option value="">Goleador / anotador (opcional)</option>
                    {participantes.visita.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </div>
              </div>

              <div className="pasos">
                <button className="btn-secundario" onClick={validar} disabled={!datosValidos || validado}>
                  {validado ? '✔ Validado' : '1. Validar'}
                </button>
                <button className="btn-primario" onClick={publicar} disabled={!validado || publicando}>
                  {publicando ? 'Publicando…' : '2. Publicar'}
                </button>
              </div>
              {validado && <div className="aviso-ok">Datos validados. Listo para publicar.</div>}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

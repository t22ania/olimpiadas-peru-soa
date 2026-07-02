import { useEffect, useState } from 'react'
import { useData } from '../context/DataContext.jsx'

export default function TablaPosiciones () {
  const { DEPORTES, partidos, getPosiciones, getRanking, cargando } = useData()
  const [deporteId, setDeporteId] = useState('')
  const [tabla, setTabla] = useState([])
  const [ranking, setRanking] = useState([])

  useEffect(() => { if (!deporteId && DEPORTES.length) setDeporteId(DEPORTES[0].id) }, [DEPORTES, deporteId])

  // Recalcula desde la API al cambiar de deporte o cuando cambian los partidos publicados
  useEffect(() => {
    if (!deporteId) return
    let activo = true
    Promise.all([getPosiciones(deporteId), getRanking(deporteId)])
      .then(([pos, rank]) => { if (activo) { setTabla(pos); setRanking(rank) } })
      .catch(() => { if (activo) { setTabla([]); setRanking([]) } })
    return () => { activo = false }
  }, [deporteId, partidos, getPosiciones, getRanking])

  const deporte = DEPORTES.find(d => d.id === deporteId)
  const esBasquet = deporte?.clave === 'basquet'

  const publicados = partidos.filter(p => p.publicado).length
  const totalPartidos = partidos.length
  const totalGoles = partidos
    .filter(p => p.publicado)
    .reduce((acc, p) => acc + (p.golesLocal || 0) + (p.golesVisitante || 0), 0)

  if (cargando || !deporte) return <div className="page"><p className="vacio">Cargando datos…</p></div>

  return (
    <div className="page">
      <div className="page-head">
        <h2>🏆 Tabla de posiciones y estadísticas</h2>
        <p>Se calcula en la base de datos a partir de los resultados publicados.</p>
      </div>

      <div className="cards-totales">
        <div className="total-card"><span>Partidos publicados</span><strong>{publicados}/{totalPartidos}</strong></div>
        <div className="total-card"><span>Total de anotaciones</span><strong>{totalGoles}</strong></div>
        <div className="total-card"><span>Disciplinas</span><strong>{DEPORTES.length}</strong></div>
        <div className="total-card"><span>Equipos clasificando</span><strong>{tabla.length}</strong></div>
      </div>

      <section className="card">
        <div className="tabs">
          {DEPORTES.map(d => (
            <button key={d.id}
              className={'tab' + (d.id === deporteId ? ' activo' : '')}
              onClick={() => setDeporteId(d.id)}>
              {d.nombre}
            </button>
          ))}
        </div>

        <div className="grid-2">
          <div>
            <h3>Clasificación · {deporte.nombre}</h3>
            <table className="tabla tabla-posiciones">
              <thead>
                <tr><th>#</th><th>Equipo</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF</th><th>GC</th><th>Pts</th></tr>
              </thead>
              <tbody>
                {tabla.length === 0 && <tr><td colSpan="9" className="vacio">Sin datos.</td></tr>}
                {tabla.map((f, i) => (
                  <tr key={f.equipoId} className={i === 0 ? 'lider' : ''}>
                    <td>{i + 1}</td>
                    <td>{f.nombre}</td>
                    <td>{f.pj}</td><td>{f.g}</td><td>{f.e}</td><td>{f.p}</td>
                    <td>{f.gf}</td><td>{f.gc}</td>
                    <td><strong>{f.pts}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h3>Ranking de {esBasquet ? 'encestadores' : 'goleadores'}</h3>
            <table className="tabla">
              <thead><tr><th>#</th><th>Jugador</th><th>{esBasquet ? 'Puntos' : 'Goles'}</th></tr></thead>
              <tbody>
                {ranking.length === 0 && <tr><td colSpan="3" className="vacio">Sin datos publicados.</td></tr>}
                {ranking.map((r, i) => (
                  <tr key={r.jugador}>
                    <td>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
                    <td>{r.jugador}</td>
                    <td><span className="pill">{esBasquet ? (r.puntos || r.goles) : r.goles}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}

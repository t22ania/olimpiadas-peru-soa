import { useEffect, useState } from 'react'
import { useData } from '../context/DataContext.jsx'

export default function Reportes () {
  const { instituciones, equipos, partidos, DEPORTES, getRanking } = useData()
  const [ranking, setRanking] = useState([])

  const partidosJugados = partidos.filter(p => p.publicado).length

  // Combina el ranking de anotadores de todas las disciplinas
  useEffect(() => {
    let activo = true
    Promise.all(DEPORTES.map(d =>
      getRanking(d.id).then(r => r.map(x => ({ ...x, deporte: d.nombre }))).catch(() => [])
    )).then(listas => {
      if (!activo) return
      const todo = listas.flat()
        .sort((a, b) => (b.puntos || b.goles || 0) - (a.puntos || a.goles || 0))
        .slice(0, 10)
      setRanking(todo)
    })
    return () => { activo = false }
  }, [DEPORTES, partidos, getRanking])

  return (
    <div className="page">
      <div className="page-head">
        <h2>📊 Reportes (Administrador)</h2>
        <p>Resumen general del evento y ranking de anotadores.</p>
      </div>

      <div className="cards-totales">
        <div className="total-card"><span>Instituciones</span><strong>{instituciones.length}</strong></div>
        <div className="total-card"><span>Equipos</span><strong>{equipos.length}</strong></div>
        <div className="total-card"><span>Partidos jugados</span><strong>{partidosJugados}</strong></div>
      </div>

      <section className="card">
        <h3>Ranking de goleadores / encestadores</h3>
        <table className="tabla">
          <thead><tr><th>#</th><th>Jugador</th><th>Disciplina</th><th>Anotaciones</th></tr></thead>
          <tbody>
            {ranking.length === 0 && <tr><td colSpan="4" className="vacio">Sin datos publicados.</td></tr>}
            {ranking.map((r, i) => (
              <tr key={i}>
                <td>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
                <td>{r.jugador}</td>
                <td>{r.deporte}</td>
                <td><span className="pill">{r.puntos || r.goles || 0}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

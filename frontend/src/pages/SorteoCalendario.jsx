import { useEffect, useState } from 'react'
import { useData } from '../context/DataContext.jsx'

export default function SorteoCalendario () {
  const { DEPORTES, equipos, partidos, ejecutarSorteo, cargando } = useData()
  const [deporteId, setDeporteId] = useState('')
  const [series, setSeries] = useState(null)
  const [semilla, setSemilla] = useState(null)
  const [ejecutando, setEjecutando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { if (!deporteId && DEPORTES.length) setDeporteId(DEPORTES[0].id) }, [DEPORTES, deporteId])

  const deporte = DEPORTES.find(d => d.id === deporteId)
  const equiposDeporte = equipos.filter(e => e.deporte_id === deporteId)
  const calendario = partidos.filter(p => p.deporte_id === deporteId)

  if (cargando || !deporte) return <div className="page"><p className="vacio">Cargando datos…</p></div>

  const ejecutar = async () => {
    if (equiposDeporte.length < 2) return
    setEjecutando(true); setError('')
    try {
      const res = await ejecutarSorteo(deporteId)
      setSeries(res.series)
      setSemilla(res.semilla)
    } catch {
      setError('No se pudo ejecutar el sorteo. ¿Servicios y BD activos?')
    } finally {
      setEjecutando(false)
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <h2>🎲 Sorteo y calendario</h2>
        <p>Reparte los equipos en series de forma aleatoria <strong>reproducible</strong> (guarda semilla + log en la BD) y genera el calendario.</p>
      </div>

      <section className="card">
        <div className="barra-acciones">
          <div className="form-inline">
            <label>Disciplina</label>
            <select value={deporteId} onChange={e => { setDeporteId(Number(e.target.value)); setSeries(null); setSemilla(null) }}>
              {DEPORTES.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
            </select>
          </div>
          <span className="hint">{equiposDeporte.length} equipos disponibles</span>
          <button className="btn-primario" onClick={ejecutar} disabled={equiposDeporte.length < 2 || ejecutando}>
            {ejecutando ? 'Sorteando…' : '🎲 Ejecutar sorteo'}
          </button>
        </div>
        {semilla && <div className="aviso-ok">Sorteo reproducible · semilla guardada: <code>{semilla}</code></div>}
        {error && <div className="aviso-warn">{error}</div>}
      </section>

      {series && (
        <div className="grid-2">
          {series.map((s) => (
            <section className="card" key={s.serie}>
              <h3>Serie {s.serie}</h3>
              {s.equipos.length === 0
                ? <p className="vacio">Sin equipos.</p>
                : <ul className="lista-series">{s.equipos.map(n => <li key={n}>{n}</li>)}</ul>}
            </section>
          ))}
        </div>
      )}

      <section className="card">
        <h3>Calendario de {deporte.nombre} ({calendario.length} partidos)</h3>
        <div className="cards-calendario">
          {calendario.length === 0 && <p className="vacio">Ejecuta el sorteo para generar el calendario.</p>}
          {calendario.map(p => (
            <div className="match-card" key={p.id}>
              <div className="match-serie">{p.serie || 'Serie'}</div>
              <div className="match-equipos">
                <span>{p.localNombre}</span>
                <span className="vs">vs</span>
                <span>{p.visitaNombre}</span>
              </div>
              <div className="match-meta">
                <span>📅 {p.fecha}</span>
                <span>🕒 {p.hora}</span>
                <span>📍 {p.sede}</span>
              </div>
              <span className={'estado estado-' + p.estado}>{p.estado}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

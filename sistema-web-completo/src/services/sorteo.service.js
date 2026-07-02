import db from '../db.js'

/** PRNG determinista (mulberry32) a partir de una semilla numérica. */
function mulberry32 (semilla) {
  let a = semilla >>> 0
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function semillaANumero (str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  return h
}

/** Mezcla reproducible (Fisher-Yates con PRNG sembrado). */
function mezclarConSemilla (arr, semillaStr) {
  const rng = mulberry32(semillaANumero(semillaStr))
  const a = [...arr]
  const log = []
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    log.push({ intercambio: [i, j], r: Number(rng().toFixed(4)) })
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return { resultado: a, log }
}

/**
 * Ejecuta un sorteo reproducible y auditable para un evento+deporte.
 * Reparte los equipos habilitados en N series, genera partidos round-robin
 * y persiste la semilla y el log del sorteo.
 */
export async function ejecutarSorteo ({ eventoId, deporteId, semilla, numSeries = 2 }) {
  const equipos = await db('equipo')
    .where({ deporte_id: deporteId, estado: 'habilitado' })
    .select('id', 'nombre')

  if (equipos.length < 2) {
    throw new Error('Se requieren al menos 2 equipos habilitados para sortear.')
  }

  const seed = semilla || `seed-${eventoId}-${deporteId}-${equipos.length}`
  const { resultado: mezclados, log: logMezcla } = mezclarConSemilla(equipos, seed)

  // Reparto en series
  const series = Array.from({ length: numSeries }, () => [])
  mezclados.forEach((eq, i) => series[i % numSeries].push(eq))

  await db.transaction(async (trx) => {
    // Limpia series/partidos previos de ese evento+deporte
    const seriesPrevias = await trx('serie').where({ evento_id: eventoId, deporte_id: deporteId }).select('id')
    const idsPrevios = seriesPrevias.map(s => s.id)
    if (idsPrevios.length) {
      await trx('partido').whereIn('serie_id', idsPrevios).del()
      await trx('serie').whereIn('id', idsPrevios).del()
    }

    const venues = ['Estadio Nacional', 'Coliseo Mayor', 'Polideportivo', 'Campo 2']
    let dia = 10
    let venueIdx = 0

    for (let s = 0; s < series.length; s++) {
      if (series[s].length === 0) continue
      const [serie] = await trx('serie')
        .insert({ nombre: `Serie ${String.fromCharCode(65 + s)}`, evento_id: eventoId, deporte_id: deporteId })
        .returning('*')

      const lista = series[s]
      for (let i = 0; i < lista.length; i++) {
        for (let j = i + 1; j < lista.length; j++) {
          await trx('partido').insert({
            fecha_hora: `2026-06-${String(dia).padStart(2, '0')}T${10 + (venueIdx % 6)}:00:00`,
            venue: venues[venueIdx % venues.length],
            serie_id: serie.id,
            equipo_local_id: lista[i].id,
            equipo_visita_id: lista[j].id,
            estado: 'pendiente'
          })
          dia++; venueIdx++
        }
      }
    }

    await trx('sorteo').insert({
      evento_id: eventoId,
      deporte_id: deporteId,
      semilla: seed,
      log: JSON.stringify({
        equiposEntrada: equipos.map(e => e.nombre),
        ordenSorteado: mezclados.map(e => e.nombre),
        series: series.map((lst, i) => ({ serie: String.fromCharCode(65 + i), equipos: lst.map(e => e.nombre) })),
        pasos: logMezcla
      })
    })
  })

  return {
    semilla: seed,
    series: series.map((lst, i) => ({ serie: String.fromCharCode(65 + i), equipos: lst.map(e => e.nombre) })),
    reproducible: true
  }
}

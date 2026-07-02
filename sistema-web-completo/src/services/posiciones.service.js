import db from '../db.js'
import { REGLAS_DEPORTE } from '../config/reglas.js'

/**
 * Recalcula la tabla de posiciones de un deporte a partir de los
 * resultados PUBLICADOS. Fútbol: victoria 3, empate 1, derrota 0.
 */
export async function calcularPosiciones (deporteId) {
  const deporte = await db('deporte').where({ id: deporteId }).first()
  if (!deporte) return []
  const reglas = REGLAS_DEPORTE[deporte.clave] || { puntos: { victoria: 3, empate: 1, derrota: 0 } }
  const { victoria, empate, derrota } = reglas.puntos

  const equipos = await db('equipo').where({ deporte_id: deporteId }).select('id', 'nombre')
  const tabla = {}
  equipos.forEach(e => {
    tabla[e.id] = { equipoId: e.id, nombre: e.nombre, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, pts: 0 }
  })

  const partidos = await db('partido')
    .join('resultado', 'partido.id', 'resultado.partido_id')
    .join('serie', 'partido.serie_id', 'serie.id')
    .where('serie.deporte_id', deporteId)
    .andWhere('resultado.publicado', true)
    .select(
      'partido.equipo_local_id as local',
      'partido.equipo_visita_id as visita',
      'resultado.marcador_local as ml',
      'resultado.marcador_visita as mv'
    )

  for (const p of partidos) {
    const l = tabla[p.local]; const v = tabla[p.visita]
    if (!l || !v) continue
    l.pj++; v.pj++
    l.gf += p.ml; l.gc += p.mv
    v.gf += p.mv; v.gc += p.ml
    if (p.ml > p.mv) { l.g++; l.pts += victoria; v.p++; v.pts += derrota }
    else if (p.ml < p.mv) { v.g++; v.pts += victoria; l.p++; l.pts += derrota }
    else { l.e++; v.e++; l.pts += empate; v.pts += empate }
  }

  return Object.values(tabla).sort((a, b) => b.pts - a.pts || (b.gf - b.gc) - (a.gf - a.gc) || b.gf - a.gf)
}

/** Ranking de goleadores/anotadores de un deporte (estadísticas de partidos publicados). */
export async function calcularRanking (deporteId) {
  const filas = await db('estadistica')
    .join('partido', 'estadistica.partido_id', 'partido.id')
    .join('serie', 'partido.serie_id', 'serie.id')
    .join('resultado', 'resultado.partido_id', 'partido.id')
    .join('participante', 'estadistica.participante_id', 'participante.id')
    .where('serie.deporte_id', deporteId)
    .andWhere('resultado.publicado', true)
    .groupBy('participante.id', 'participante.nombre')
    .select('participante.nombre as jugador')
    .sum({ goles: 'estadistica.goles' })
    .sum({ puntos: 'estadistica.puntos' })

  return filas
    .map(f => ({ jugador: f.jugador, goles: Number(f.goles) || 0, puntos: Number(f.puntos) || 0 }))
    .sort((a, b) => (b.goles + b.puntos) - (a.goles + a.puntos))
}

import { Router } from 'express'
import db from '../db.js'
import { calcularPosiciones, calcularRanking } from '../services/posiciones.service.js'

const router = Router()

/**
 * Registrar/actualizar resultado de un partido.
 * Body: { marcador_local, marcador_visita, publicado?, estadisticas?: [{participante_id, goles, puntos, tarjetas}] }
 * Si publicado=true, el partido pasa a "publicado" y la tabla se recalcula al consultarla.
 */
router.post('/partido/:partidoId', async (req, res) => {
  const partidoId = Number(req.params.partidoId)
  const { marcador_local, marcador_visita, publicado = false, estadisticas = [] } = req.body
  if (marcador_local == null || marcador_visita == null) {
    return res.status(400).json({ error: 'marcador_local y marcador_visita son obligatorios' })
  }
  const partido = await db('partido').where({ id: partidoId }).first()
  if (!partido) return res.status(404).json({ error: 'Partido no encontrado' })

  await db.transaction(async (trx) => {
    const existente = await trx('resultado').where({ partido_id: partidoId }).first()
    if (existente) {
      await trx('resultado').where({ partido_id: partidoId })
        .update({ marcador_local, marcador_visita, publicado })
    } else {
      await trx('resultado').insert({ partido_id: partidoId, marcador_local, marcador_visita, publicado })
    }
    // estadísticas opcionales
    for (const e of estadisticas) {
      if (!e.participante_id) continue
      await trx('estadistica').insert({
        participante_id: e.participante_id,
        partido_id: partidoId,
        goles: e.goles || 0, puntos: e.puntos || 0, tarjetas: e.tarjetas || 0,
        otros: JSON.stringify(e.otros || {})
      })
    }
    await trx('partido').where({ id: partidoId })
      .update({ estado: publicado ? 'publicado' : 'jugado' })
  })

  res.json({ ok: true, partidoId, publicado })
})

// Publicar un resultado ya registrado (paso "validar -> publicar")
router.patch('/partido/:partidoId/publicar', async (req, res) => {
  const partidoId = Number(req.params.partidoId)
  const r = await db('resultado').where({ partido_id: partidoId }).first()
  if (!r) return res.status(404).json({ error: 'No hay resultado registrado para este partido' })
  await db('resultado').where({ partido_id: partidoId }).update({ publicado: true })
  await db('partido').where({ id: partidoId }).update({ estado: 'publicado' })
  res.json({ ok: true, partidoId, publicado: true })
})

// Tabla de posiciones de un deporte (recalculada al vuelo)
router.get('/posiciones/:deporteId', async (req, res) => {
  res.json(await calcularPosiciones(Number(req.params.deporteId)))
})

// Ranking de goleadores/anotadores de un deporte
router.get('/ranking/:deporteId', async (req, res) => {
  res.json(await calcularRanking(Number(req.params.deporteId)))
})

export default router

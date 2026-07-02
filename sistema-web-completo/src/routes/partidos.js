import { Router } from 'express'
import db from '../db.js'
import { ejecutarSorteo } from '../services/sorteo.service.js'

const router = Router()

// Listar partidos (con nombres de equipos y serie). Opcional ?deporteId=
router.get('/', async (req, res) => {
  const q = db('partido')
    .leftJoin('serie', 'partido.serie_id', 'serie.id')
    .leftJoin('equipo as local', 'partido.equipo_local_id', 'local.id')
    .leftJoin('equipo as visita', 'partido.equipo_visita_id', 'visita.id')
    .leftJoin('resultado', 'resultado.partido_id', 'partido.id')
    .select(
      'partido.*',
      'serie.nombre as serie_nombre', 'serie.deporte_id',
      'local.nombre as local_nombre', 'visita.nombre as visita_nombre',
      'resultado.marcador_local', 'resultado.marcador_visita', 'resultado.publicado'
    )
    .orderBy('partido.fecha_hora')
  if (req.query.deporteId) q.where('serie.deporte_id', req.query.deporteId)
  res.json(await q)
})

// Listar series de un evento+deporte
router.get('/series', async (req, res) => {
  const q = db('serie').orderBy('id')
  if (req.query.eventoId) q.where('evento_id', req.query.eventoId)
  if (req.query.deporteId) q.where('deporte_id', req.query.deporteId)
  res.json(await q)
})

// Ejecutar sorteo reproducible (semilla opcional). Genera series + calendario.
router.post('/sorteo', async (req, res) => {
  const { eventoId, deporteId, semilla, numSeries } = req.body
  if (!eventoId || !deporteId) return res.status(400).json({ error: 'eventoId y deporteId son obligatorios' })
  try {
    const resultado = await ejecutarSorteo({ eventoId, deporteId, semilla, numSeries })
    res.status(201).json(resultado)
  } catch (e) {
    res.status(422).json({ error: e.message })
  }
})

// Historial de sorteos (auditoría: semilla + log)
router.get('/sorteos', async (req, res) => {
  const q = db('sorteo').orderBy('fecha', 'desc')
  if (req.query.eventoId) q.where('evento_id', req.query.eventoId)
  res.json(await q)
})

export default router

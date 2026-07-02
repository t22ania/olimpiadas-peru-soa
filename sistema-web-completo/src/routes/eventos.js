import { Router } from 'express'
import db from '../db.js'
import { ESTADOS_EVENTO } from '../config/reglas.js'

const router = Router()

router.get('/', async (req, res) => {
  const data = await db('evento').orderBy('id')
  res.json(data)
})

router.post('/', async (req, res) => {
  const { codigo_unico, nombre, fecha_inicio, fecha_fin, institucion_id } = req.body
  if (!codigo_unico || !nombre) return res.status(400).json({ error: 'codigo_unico y nombre son obligatorios' })
  const [ev] = await db('evento')
    .insert({ codigo_unico, nombre, fecha_inicio, fecha_fin, institucion_id, estado: 'pendiente' })
    .returning('*')
  res.status(201).json(ev)
})

// Cambiar estado del evento (valida contra los estados permitidos)
router.patch('/:id/estado', async (req, res) => {
  const { estado } = req.body
  if (!ESTADOS_EVENTO.includes(estado)) {
    return res.status(400).json({ error: `Estado inválido. Permitidos: ${ESTADOS_EVENTO.join(', ')}` })
  }
  const [ev] = await db('evento').where({ id: req.params.id }).update({ estado }).returning('*')
  if (!ev) return res.status(404).json({ error: 'Evento no encontrado' })
  res.json(ev)
})

router.get('/estados/permitidos', (req, res) => res.json(ESTADOS_EVENTO))

export default router

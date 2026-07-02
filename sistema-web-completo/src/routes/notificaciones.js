import { Router } from 'express'
import db from '../db.js'

const router = Router()

// Listar notificaciones (opcional ?usuarioId=)
router.get('/', async (req, res) => {
  const q = db('notificacion').orderBy('fecha', 'desc')
  if (req.query.usuarioId) q.where('usuario_id', req.query.usuarioId)
  res.json(await q)
})

router.post('/', async (req, res) => {
  const { usuario_id, tipo, mensaje } = req.body
  if (!usuario_id || !mensaje) return res.status(400).json({ error: 'usuario_id y mensaje son obligatorios' })
  const [n] = await db('notificacion').insert({ usuario_id, tipo, mensaje, leida: false }).returning('*')
  res.status(201).json(n)
})

router.patch('/:id/leer', async (req, res) => {
  const [n] = await db('notificacion').where({ id: req.params.id }).update({ leida: true }).returning('*')
  if (!n) return res.status(404).json({ error: 'Notificación no encontrada' })
  res.json(n)
})

export default router

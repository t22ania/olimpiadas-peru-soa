import { Router } from 'express'
import db from '../db.js'

const router = Router()

// Listar deportes con sus reglas (config_reglas JSONB)
router.get('/', async (req, res) => {
  const data = await db('deporte').orderBy('id')
  res.json(data)
})

router.get('/:id', async (req, res) => {
  const d = await db('deporte').where({ id: req.params.id }).first()
  if (!d) return res.status(404).json({ error: 'Deporte no encontrado' })
  res.json(d)
})

export default router

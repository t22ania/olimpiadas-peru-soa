import { Router } from 'express'
import db from '../db.js'
import { PAIS_POR_GRADO } from '../config/reglas.js'

const router = Router()

// Listar instituciones
router.get('/', async (req, res) => {
  const data = await db('institucion').orderBy('id')
  res.json(data)
})

// Crear institución (asigna país automáticamente según grado)
router.post('/', async (req, res) => {
  const { nombre, contacto, grado } = req.body
  if (!nombre || !grado) return res.status(400).json({ error: 'nombre y grado son obligatorios' })
  const pais_representado = PAIS_POR_GRADO[grado] || null
  const [inst] = await db('institucion')
    .insert({ nombre, contacto, grado, pais_representado, estado: 'activo' })
    .returning('*')
  res.status(201).json(inst)
})

// Mapa de país por grado (referencia)
router.get('/paises-por-grado', (req, res) => res.json(PAIS_POR_GRADO))

export default router

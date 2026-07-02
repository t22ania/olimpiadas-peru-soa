import { Router } from 'express'
import db from '../db.js'
import { validarPlantilla } from '../config/reglas.js'

const router = Router()

// Listar equipos (opcional ?deporteId=)
router.get('/', async (req, res) => {
  const q = db('equipo')
    .join('deporte', 'equipo.deporte_id', 'deporte.id')
    .leftJoin('institucion', 'equipo.institucion_id', 'institucion.id')
    .select('equipo.*', 'deporte.clave as deporte_clave', 'deporte.nombre as deporte_nombre', 'institucion.nombre as institucion_nombre')
    .orderBy('equipo.id')
  if (req.query.deporteId) q.where('equipo.deporte_id', req.query.deporteId)
  const equipos = await q
  // adjunta conteo de participantes
  for (const e of equipos) {
    const [{ count }] = await db('participante').where({ equipo_id: e.id }).count()
    e.participantes = Number(count)
  }
  res.json(equipos)
})

// Crear equipo
router.post('/', async (req, res) => {
  const { nombre, institucion_id, deporte_id } = req.body
  if (!nombre || !deporte_id) return res.status(400).json({ error: 'nombre y deporte_id son obligatorios' })
  const [eq] = await db('equipo')
    .insert({ nombre, institucion_id, deporte_id, estado: 'borrador' })
    .returning('*')
  res.status(201).json(eq)
})

// Agregar participante a un equipo
router.post('/:id/participantes', async (req, res) => {
  const { nombre, documento, posicion } = req.body
  if (!nombre) return res.status(400).json({ error: 'nombre es obligatorio' })
  const [p] = await db('participante')
    .insert({ nombre, documento, posicion, equipo_id: req.params.id })
    .returning('*')
  res.status(201).json(p)
})

router.get('/:id/participantes', async (req, res) => {
  const data = await db('participante').where({ equipo_id: req.params.id }).orderBy('id')
  res.json(data)
})

// Validar plantilla y habilitar el equipo (regla: mínimo por deporte)
router.post('/:id/habilitar', async (req, res) => {
  const equipo = await db('equipo').where({ id: req.params.id }).first()
  if (!equipo) return res.status(404).json({ error: 'Equipo no encontrado' })
  const deporte = await db('deporte').where({ id: equipo.deporte_id }).first()
  const [{ count }] = await db('participante').where({ equipo_id: equipo.id }).count()

  const validacion = validarPlantilla(deporte.clave, Number(count))
  if (!validacion.ok) {
    return res.status(422).json({ habilitado: false, ...validacion })
  }
  const [actualizado] = await db('equipo').where({ id: equipo.id }).update({ estado: 'habilitado' }).returning('*')
  res.json({ habilitado: true, equipo: actualizado, ...validacion })
})

export default router

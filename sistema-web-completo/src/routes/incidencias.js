import { Router } from 'express'
import db from '../db.js'
import { SLA_INCIDENCIA, ESTADOS_INCIDENCIA, calcularVencimientoSLA } from '../config/reglas.js'

const router = Router()

router.get('/', async (req, res) => {
  const data = await db('incidencia').orderBy('fecha', 'desc')
  // marca si está vencida según SLA
  const ahora = new Date()
  res.json(data.map(i => ({
    ...i,
    vencida: i.vence_en ? new Date(i.vence_en) < ahora && i.estado !== 'resuelta' && i.estado !== 'cerrada' : false
  })))
})

// Crear incidencia (asigna SLA automático según tipo)
router.post('/', async (req, res) => {
  const { evento_id, usuario_id, tipo, descripcion, responsable_id } = req.body
  if (!tipo || !SLA_INCIDENCIA[tipo]) {
    return res.status(400).json({ error: `tipo inválido. Permitidos: ${Object.keys(SLA_INCIDENCIA).join(', ')}` })
  }
  const sla = calcularVencimientoSLA(tipo)
  const [inc] = await db('incidencia').insert({
    evento_id, usuario_id, tipo, descripcion, responsable_id,
    estado: 'abierta',
    historial: JSON.stringify([{ estado: 'abierta', nota: 'Incidencia creada' }]),
    sla_horas: sla.horasSLA,
    vence_en: sla.venceEn
  }).returning('*')
  res.status(201).json({ ...inc, sla })
})

// Cambiar estado de incidencia (agrega entrada al historial JSONB)
router.patch('/:id/estado', async (req, res) => {
  const { estado, nota } = req.body
  if (!ESTADOS_INCIDENCIA.includes(estado)) {
    return res.status(400).json({ error: `Estado inválido. Permitidos: ${ESTADOS_INCIDENCIA.join(', ')}` })
  }
  const inc = await db('incidencia').where({ id: req.params.id }).first()
  if (!inc) return res.status(404).json({ error: 'Incidencia no encontrada' })
  const historial = Array.isArray(inc.historial) ? inc.historial : []
  historial.push({ estado, nota: nota || null })
  const [actualizada] = await db('incidencia').where({ id: req.params.id })
    .update({ estado, historial: JSON.stringify(historial) }).returning('*')
  res.json(actualizada)
})

router.get('/sla/tabla', (req, res) => res.json(SLA_INCIDENCIA))

export default router

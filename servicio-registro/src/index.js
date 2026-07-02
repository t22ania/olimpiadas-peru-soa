import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import pool from './db.js'

const app = express()
app.use(cors())
app.use(express.json())

// País representado según el grado (regla de negocio)
const PAIS_POR_GRADO = {
  '1.er año': 'Brasil',
  '2.do año': 'Argentina',
  '3.er año': 'Alemania',
  '4.to año': 'España',
  '5.to año': 'Francia'
}

const ROLES = ['admin', 'coordinador', 'arbitro', 'institucion']

app.get('/health', (req, res) => res.json({ ok: true, servicio: 'servicio-registro' }))
app.get('/paises-por-grado', (req, res) => res.json(PAIS_POR_GRADO))

/**
 * POST /usuarios  { nombre, email, password, rol }
 * Registra un usuario con contraseña hasheada (bcrypt).
 */
app.post('/usuarios', async (req, res) => {
  const { nombre, email, password, rol = 'institucion' } = req.body
  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'nombre, email y password son obligatorios' })
  }
  if (!ROLES.includes(rol)) {
    return res.status(400).json({ error: `rol inválido. Permitidos: ${ROLES.join(', ')}` })
  }
  try {
    const existe = await pool.query('SELECT 1 FROM usuario WHERE LOWER(email) = LOWER($1)', [email.trim()])
    if (existe.rowCount) return res.status(409).json({ error: 'El correo ya está registrado.' })

    const password_hash = bcrypt.hashSync(password, 10)
    const { rows } = await pool.query(
      'INSERT INTO usuario (nombre, email, password_hash, rol) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, rol',
      [nombre, email.trim(), password_hash, rol]
    )
    res.status(201).json(rows[0])
  } catch (e) {
    res.status(500).json({ error: 'Error de servidor', detalle: e.message })
  }
})

/**
 * POST /instituciones  { nombre, contacto, grado }
 * Registra una institución y asigna el país automáticamente según el grado.
 */
app.post('/instituciones', async (req, res) => {
  const { nombre, contacto, grado } = req.body
  if (!nombre || !grado) return res.status(400).json({ error: 'nombre y grado son obligatorios' })
  const pais = PAIS_POR_GRADO[grado] || null
  try {
    const { rows } = await pool.query(
      'INSERT INTO institucion (nombre, contacto, grado, pais_representado, estado) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [nombre, contacto, grado, pais, 'activo']
    )
    res.status(201).json(rows[0])
  } catch (e) {
    res.status(500).json({ error: 'Error de servidor', detalle: e.message })
  }
})

const PORT = process.env.PORT || 4002
app.listen(PORT, () => console.log(`📝 Servicio de Registro en http://localhost:${PORT}`))

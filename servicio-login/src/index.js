import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from './db.js'

const app = express()
app.use(cors())
app.use(express.json())

const JWT_SECRET = process.env.JWT_SECRET || 'olimpiadas_super_secreto_demo'
const JWT_EXPIRA = process.env.JWT_EXPIRA || '8h'

app.get('/health', (req, res) => res.json({ ok: true, servicio: 'servicio-login' }))

/**
 * POST /login  { email, password }
 * Valida credenciales contra la tabla usuario (password_hash con bcrypt)
 * y devuelve un token JWT con el rol.
 */
app.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'email y password son obligatorios' })

  try {
    const { rows } = await pool.query(
      'SELECT id, nombre, email, password_hash, rol FROM usuario WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    )
    const usuario = rows[0]
    if (!usuario || !bcrypt.compareSync(password, usuario.password_hash)) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos.' })
    }
    const token = jwt.sign(
      { sub: usuario.id, email: usuario.email, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRA }
    )
    res.json({
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol }
    })
  } catch (e) {
    res.status(500).json({ error: 'Error de servidor', detalle: e.message })
  }
})

/** POST /verificar  { token }  -> valida y decodifica un JWT. */
app.post('/verificar', (req, res) => {
  const { token } = req.body
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    res.json({ valido: true, payload })
  } catch {
    res.status(401).json({ valido: false, error: 'Token inválido o expirado' })
  }
})

const PORT = process.env.PORT || 4001
app.listen(PORT, () => console.log(`🔐 Servicio de Login en http://localhost:${PORT}`))

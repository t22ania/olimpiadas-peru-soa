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

/** GET /usuarios  -> lista de cuentas (nunca devuelve el hash de la contraseña). */
app.get('/usuarios', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, nombre, email, rol FROM usuario ORDER BY id')
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: 'Error de servidor', detalle: e.message })
  }
})

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
 * PATCH /usuarios/:id/rol  { rol }
 * Cambia el rol de acceso de una cuenta. No permite dejar el sistema sin ningún
 * administrador (si se degrada al último admin se rechaza con 409).
 */
app.patch('/usuarios/:id/rol', async (req, res) => {
  const { rol } = req.body
  if (!ROLES.includes(rol)) {
    return res.status(400).json({ error: `rol inválido. Permitidos: ${ROLES.join(', ')}` })
  }
  try {
    const actual = await pool.query('SELECT rol FROM usuario WHERE id = $1', [req.params.id])
    if (!actual.rowCount) return res.status(404).json({ error: 'Usuario no encontrado.' })

    // Protege el acceso: no se puede quitar el rol al único administrador.
    if (actual.rows[0].rol === 'admin' && rol !== 'admin') {
      const admins = await pool.query("SELECT COUNT(*)::int AS n FROM usuario WHERE rol = 'admin'")
      if (admins.rows[0].n <= 1) {
        return res.status(409).json({ error: 'No puedes quitar el rol al único administrador.' })
      }
    }

    const { rows } = await pool.query(
      'UPDATE usuario SET rol = $1 WHERE id = $2 RETURNING id, nombre, email, rol',
      [rol, req.params.id]
    )
    res.json(rows[0])
  } catch (e) {
    res.status(500).json({ error: 'Error de servidor', detalle: e.message })
  }
})

/**
 * PATCH /usuarios/:id  { nombre?, email?, password? }
 * Actualiza los datos de acceso de una cuenta. Solo cambia los campos enviados;
 * si se envía password se vuelve a hashear con bcrypt. El correo debe seguir
 * siendo único entre todas las cuentas.
 */
app.patch('/usuarios/:id', async (req, res) => {
  const { nombre, email, password } = req.body
  try {
    const actual = await pool.query('SELECT 1 FROM usuario WHERE id = $1', [req.params.id])
    if (!actual.rowCount) return res.status(404).json({ error: 'Usuario no encontrado.' })

    const campos = []
    const valores = []
    let i = 1
    if (nombre !== undefined && nombre.trim()) { campos.push(`nombre = $${i++}`); valores.push(nombre.trim()) }
    if (email !== undefined && email.trim()) {
      const dup = await pool.query('SELECT 1 FROM usuario WHERE LOWER(email) = LOWER($1) AND id <> $2', [email.trim(), req.params.id])
      if (dup.rowCount) return res.status(409).json({ error: 'El correo ya está registrado por otra cuenta.' })
      campos.push(`email = $${i++}`); valores.push(email.trim())
    }
    if (password) { campos.push(`password_hash = $${i++}`); valores.push(bcrypt.hashSync(password, 10)) }
    if (!campos.length) return res.status(400).json({ error: 'No se envió ningún dato para actualizar.' })

    valores.push(req.params.id)
    const { rows } = await pool.query(
      `UPDATE usuario SET ${campos.join(', ')} WHERE id = $${i} RETURNING id, nombre, email, rol`,
      valores
    )
    res.json(rows[0])
  } catch (e) {
    res.status(500).json({ error: 'Error de servidor', detalle: e.message })
  }
})

/**
 * DELETE /usuarios/:id
 * Elimina una cuenta. Protege al único administrador y avisa si el usuario tiene
 * registros asociados (incidencias/notificaciones) que impiden borrarlo.
 */
app.delete('/usuarios/:id', async (req, res) => {
  try {
    const actual = await pool.query('SELECT rol FROM usuario WHERE id = $1', [req.params.id])
    if (!actual.rowCount) return res.status(404).json({ error: 'Usuario no encontrado.' })

    if (actual.rows[0].rol === 'admin') {
      const admins = await pool.query("SELECT COUNT(*)::int AS n FROM usuario WHERE rol = 'admin'")
      if (admins.rows[0].n <= 1) {
        return res.status(409).json({ error: 'No puedes eliminar al único administrador.' })
      }
    }

    await pool.query('DELETE FROM usuario WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch (e) {
    if (e.code === '23503') {
      return res.status(409).json({ error: 'No se puede eliminar: el usuario tiene registros asociados (incidencias o notificaciones).' })
    }
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

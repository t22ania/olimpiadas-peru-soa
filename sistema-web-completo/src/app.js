import express from 'express'
import cors from 'cors'
import instituciones from './routes/instituciones.js'
import deportes from './routes/deportes.js'
import eventos from './routes/eventos.js'
import equipos from './routes/equipos.js'
import partidos from './routes/partidos.js'
import resultados from './routes/resultados.js'
import incidencias from './routes/incidencias.js'
import notificaciones from './routes/notificaciones.js'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => res.json({ ok: true, servicio: 'sistema-web-completo' }))

app.use('/api/instituciones', instituciones)
app.use('/api/deportes', deportes)
app.use('/api/eventos', eventos)
app.use('/api/equipos', equipos)
app.use('/api/partidos', partidos)
app.use('/api/resultados', resultados)
app.use('/api/incidencias', incidencias)
app.use('/api/notificaciones', notificaciones)

// Índice de endpoints
app.get('/', (req, res) => {
  res.json({
    servicio: 'Olimpiadas PERÚ — Sistema Web Completo',
    endpoints: [
      'GET  /health',
      'GET  /api/instituciones | POST /api/instituciones',
      'GET  /api/deportes',
      'GET  /api/eventos | POST /api/eventos | PATCH /api/eventos/:id/estado',
      'GET  /api/equipos | POST /api/equipos | POST /api/equipos/:id/participantes | POST /api/equipos/:id/habilitar',
      'GET  /api/partidos | POST /api/partidos/sorteo | GET /api/partidos/sorteos',
      'POST /api/resultados/partido/:id | GET /api/resultados/posiciones/:deporteId | GET /api/resultados/ranking/:deporteId',
      'GET  /api/incidencias | POST /api/incidencias | PATCH /api/incidencias/:id/estado',
      'GET  /api/notificaciones | POST /api/notificaciones'
    ]
  })
})

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Error interno', detalle: err.message })
})

export default app

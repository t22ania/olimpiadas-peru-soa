import 'dotenv/config'
import pg from 'pg'

// Pool de conexiones a PostgreSQL (compartido con el sistema completo)
const pool = new pg.Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || 'olimpiadas',
  password: process.env.PGPASSWORD || 'olimpiadas123',
  database: process.env.PGDATABASE || 'olimpiadas'
})

export default pool

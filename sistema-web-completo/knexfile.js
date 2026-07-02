import 'dotenv/config'

/** Configuración de Knex (migraciones + seeds + conexión) */
const config = {
  client: 'pg',
  connection: {
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT) || 5432,
    user: process.env.PGUSER || 'olimpiadas',
    password: process.env.PGPASSWORD || 'olimpiadas123',
    database: process.env.PGDATABASE || 'olimpiadas'
  },
  pool: { min: 2, max: 10 },
  migrations: { directory: './migrations' },
  seeds: { directory: './seeds' }
}

export default config

import knexLib from 'knex'
import config from '../knexfile.js'

// Instancia única de Knex compartida por toda la API
const db = knexLib(config)

export default db

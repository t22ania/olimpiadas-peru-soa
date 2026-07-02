/**
 * Migración inicial: crea todo el modelo de datos de Olimpiadas PERÚ.
 */
export async function up (knex) {
  await knex.schema.createTable('institucion', (t) => {
    t.increments('id').primary()
    t.string('nombre').notNullable()
    t.string('pais_representado')
    t.string('grado')
    t.string('contacto')
    t.string('estado').notNullable().defaultTo('activo')
  })

  await knex.schema.createTable('usuario', (t) => {
    t.increments('id').primary()
    t.string('nombre').notNullable()
    t.string('email').notNullable().unique()
    t.string('password_hash').notNullable()
    t.string('rol').notNullable().defaultTo('institucion')
  })

  await knex.schema.createTable('deporte', (t) => {
    t.increments('id').primary()
    t.string('clave').notNullable().unique() // futbol, basquet, voley, pingpong
    t.string('nombre').notNullable()
    t.string('categoria')
    t.jsonb('config_reglas').notNullable().defaultTo('{}')
  })

  await knex.schema.createTable('evento', (t) => {
    t.increments('id').primary()
    t.string('codigo_unico').notNullable().unique()
    t.string('nombre').notNullable()
    t.date('fecha_inicio')
    t.date('fecha_fin')
    t.string('estado').notNullable().defaultTo('pendiente')
    t.integer('institucion_id').references('id').inTable('institucion').onDelete('SET NULL')
  })

  await knex.schema.createTable('equipo', (t) => {
    t.increments('id').primary()
    t.string('nombre').notNullable()
    t.integer('institucion_id').references('id').inTable('institucion').onDelete('CASCADE')
    t.integer('deporte_id').references('id').inTable('deporte').onDelete('CASCADE')
    t.string('estado').notNullable().defaultTo('borrador') // borrador | habilitado | rechazado
  })

  await knex.schema.createTable('participante', (t) => {
    t.increments('id').primary()
    t.string('nombre').notNullable()
    t.string('documento')
    t.string('posicion')
    t.integer('equipo_id').references('id').inTable('equipo').onDelete('CASCADE')
  })

  await knex.schema.createTable('serie', (t) => {
    t.increments('id').primary()
    t.string('nombre').notNullable()
    t.integer('evento_id').references('id').inTable('evento').onDelete('CASCADE')
    t.integer('deporte_id').references('id').inTable('deporte').onDelete('CASCADE')
  })

  await knex.schema.createTable('partido', (t) => {
    t.increments('id').primary()
    t.timestamp('fecha_hora')
    t.string('venue')
    t.integer('serie_id').references('id').inTable('serie').onDelete('CASCADE')
    t.integer('equipo_local_id').references('id').inTable('equipo').onDelete('SET NULL')
    t.integer('equipo_visita_id').references('id').inTable('equipo').onDelete('SET NULL')
    t.string('estado').notNullable().defaultTo('pendiente') // pendiente | jugado | publicado
  })

  await knex.schema.createTable('resultado', (t) => {
    t.increments('id').primary()
    t.integer('partido_id').references('id').inTable('partido').onDelete('CASCADE')
    t.integer('marcador_local').notNullable().defaultTo(0)
    t.integer('marcador_visita').notNullable().defaultTo(0)
    t.boolean('publicado').notNullable().defaultTo(false)
  })

  await knex.schema.createTable('estadistica', (t) => {
    t.increments('id').primary()
    t.integer('participante_id').references('id').inTable('participante').onDelete('CASCADE')
    t.integer('partido_id').references('id').inTable('partido').onDelete('CASCADE')
    t.integer('goles').notNullable().defaultTo(0)
    t.integer('puntos').notNullable().defaultTo(0)
    t.integer('tarjetas').notNullable().defaultTo(0)
    t.jsonb('otros').notNullable().defaultTo('{}')
  })

  // Sorteo: requerido por la regla de negocio (semilla + log auditable)
  await knex.schema.createTable('sorteo', (t) => {
    t.increments('id').primary()
    t.integer('evento_id').references('id').inTable('evento').onDelete('CASCADE')
    t.integer('deporte_id').references('id').inTable('deporte').onDelete('CASCADE')
    t.string('semilla').notNullable()
    t.jsonb('log').notNullable().defaultTo('[]')
    t.timestamp('fecha').defaultTo(knex.fn.now())
  })

  await knex.schema.createTable('incidencia', (t) => {
    t.increments('id').primary()
    t.integer('evento_id').references('id').inTable('evento').onDelete('CASCADE')
    t.integer('usuario_id').references('id').inTable('usuario').onDelete('SET NULL')
    t.string('tipo').notNullable() // Tecnica | Deportiva | Administrativa | Disciplinaria
    t.text('descripcion')
    t.string('estado').notNullable().defaultTo('abierta')
    t.integer('responsable_id').references('id').inTable('usuario').onDelete('SET NULL')
    t.jsonb('historial').notNullable().defaultTo('[]')
    t.timestamp('fecha').defaultTo(knex.fn.now())
    t.integer('sla_horas')
    t.timestamp('vence_en')
  })

  await knex.schema.createTable('notificacion', (t) => {
    t.increments('id').primary()
    t.integer('usuario_id').references('id').inTable('usuario').onDelete('CASCADE')
    t.string('tipo')
    t.text('mensaje')
    t.boolean('leida').notNullable().defaultTo(false)
    t.timestamp('fecha').defaultTo(knex.fn.now())
  })
}

export async function down (knex) {
  const tablas = [
    'notificacion', 'incidencia', 'sorteo', 'estadistica', 'resultado',
    'partido', 'serie', 'participante', 'equipo', 'evento',
    'deporte', 'usuario', 'institucion'
  ]
  for (const tabla of tablas) {
    await knex.schema.dropTableIfExists(tabla)
  }
}

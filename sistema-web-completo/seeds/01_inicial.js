import bcrypt from 'bcryptjs'
import { REGLAS_DEPORTE, PAIS_POR_GRADO, calcularVencimientoSLA } from '../src/config/reglas.js'

/** Datos semilla: deportes+reglas, instituciones (país por grado), usuario admin y datos demo. */
export async function seed (knex) {
  // Limpieza en orden inverso de dependencias
  for (const t of ['notificacion', 'incidencia', 'sorteo', 'estadistica', 'resultado',
    'partido', 'serie', 'participante', 'equipo', 'evento', 'deporte', 'usuario', 'institucion']) {
    await knex(t).del()
  }

  // ----- Deportes (con sus reglas en JSONB) -----
  const deportesData = [
    { clave: 'futbol', nombre: 'Fútbol', categoria: 'Varones' },
    { clave: 'basquet', nombre: 'Básquet', categoria: 'Varones' },
    { clave: 'voley', nombre: 'Vóley', categoria: 'Damas' },
    { clave: 'pingpong', nombre: 'Ping Pong', categoria: 'Mixto' }
  ].map(d => ({ ...d, config_reglas: JSON.stringify(REGLAS_DEPORTE[d.clave]) }))
  const deportes = await knex('deporte').insert(deportesData).returning('*')
  const dep = Object.fromEntries(deportes.map(d => [d.clave, d.id]))

  // ----- Instituciones (país representado según grado) -----
  const instData = [
    { nombre: 'I.E. San Martín', grado: '1.er año', contacto: 'María Gómez' },
    { nombre: 'Colegio Los Andes', grado: '2.do año', contacto: 'Pedro Salas' },
    { nombre: 'I.E. Túpac Amaru', grado: '3.er año', contacto: 'Lucía Ríos' },
    { nombre: 'Colegio Bicentenario', grado: '4.to año', contacto: 'Rosa Núñez' },
    { nombre: 'Colegio Libertador', grado: '5.to año', contacto: 'José Pérez' }
  ].map(i => ({ ...i, pais_representado: PAIS_POR_GRADO[i.grado], estado: 'activo' }))
  const instituciones = await knex('institucion').insert(instData).returning('*')
  const inst = Object.fromEntries(instituciones.map(i => [i.grado, i.id]))

  // ----- Usuarios (uno por rol; admin de prueba) -----
  const hash = bcrypt.hashSync('123456', 10)
  const usuarios = await knex('usuario').insert([
    { nombre: 'Ana Admin', email: 'admin@demo.com', password_hash: hash, rol: 'admin' },
    { nombre: 'Carlos Coordinador', email: 'coordinador@demo.com', password_hash: hash, rol: 'coordinador' },
    { nombre: 'Raúl Árbitro', email: 'arbitro@demo.com', password_hash: hash, rol: 'arbitro' },
    { nombre: 'Inés Institución', email: 'institucion@demo.com', password_hash: hash, rol: 'institucion' }
  ]).returning('*')
  const admin = usuarios.find(u => u.rol === 'admin')
  const coord = usuarios.find(u => u.rol === 'coordinador')

  // ----- Evento -----
  const [evento] = await knex('evento').insert({
    codigo_unico: 'OLP-2026-001',
    nombre: 'Olimpiadas Escolares PERÚ 2026',
    fecha_inicio: '2026-06-01',
    fecha_fin: '2026-06-30',
    estado: 'en proceso',
    institucion_id: inst['1.er año']
  }).returning('*')

  // ----- Series (Fútbol) -----
  const [serieA] = await knex('serie').insert({ nombre: 'Serie A', evento_id: evento.id, deporte_id: dep.futbol }).returning('*')

  // ----- Equipos de Fútbol (habilitados, 11 titulares) -----
  const equiposFutbol = [
    { nombre: 'San Martín FC', grado: '1.er año' },
    { nombre: 'Andes FC', grado: '2.do año' },
    { nombre: 'Túpac FC', grado: '3.er año' },
    { nombre: 'Libertador FC', grado: '5.to año' }
  ]
  const equipos = {}
  for (const e of equiposFutbol) {
    const [eq] = await knex('equipo').insert({
      nombre: e.nombre, institucion_id: inst[e.grado], deporte_id: dep.futbol, estado: 'habilitado'
    }).returning('*')
    equipos[e.nombre] = eq.id
    // 11 participantes
    const parts = Array.from({ length: 11 }, (_, i) => ({
      nombre: `Jugador ${i + 1} - ${e.nombre}`,
      documento: `DNI${eq.id}${String(i + 1).padStart(2, '0')}`,
      posicion: i === 0 ? 'Arquero' : i < 5 ? 'Defensa' : i < 9 ? 'Mediocampo' : 'Delantero',
      equipo_id: eq.id
    }))
    await knex('participante').insert(parts)
  }

  // ----- Partidos + resultados publicados (para llenar la tabla) -----
  const mkPartido = async (local, visita, fecha, venue, marcadorL, marcadorV, publicado) => {
    const [p] = await knex('partido').insert({
      fecha_hora: fecha, venue, serie_id: serieA.id,
      equipo_local_id: equipos[local], equipo_visita_id: equipos[visita],
      estado: publicado ? 'publicado' : 'pendiente'
    }).returning('*')
    if (marcadorL !== null) {
      await knex('resultado').insert({ partido_id: p.id, marcador_local: marcadorL, marcador_visita: marcadorV, publicado })
      // estadística de un goleador del local
      const [part] = await knex('participante').where({ equipo_id: equipos[local], posicion: 'Delantero' }).limit(1)
      if (part && marcadorL > 0) {
        await knex('estadistica').insert({ participante_id: part.id, partido_id: p.id, goles: marcadorL, puntos: 0, tarjetas: 0, otros: '{}' })
      }
    }
    return p
  }

  await mkPartido('San Martín FC', 'Libertador FC', '2026-06-02T09:00:00', 'Estadio Nacional', 3, 1, true)
  await mkPartido('Túpac FC', 'Andes FC', '2026-06-02T11:00:00', 'Estadio Nacional', 2, 2, true)
  await mkPartido('San Martín FC', 'Túpac FC', '2026-06-05T09:00:00', 'Campo 2', null, null, false)
  await mkPartido('Andes FC', 'Libertador FC', '2026-06-05T11:00:00', 'Campo 2', null, null, false)

  // ----- Sorteo de ejemplo (semilla + log auditable) -----
  await knex('sorteo').insert({
    evento_id: evento.id,
    deporte_id: dep.futbol,
    semilla: 'demo-seed-0001',
    log: JSON.stringify([
      { paso: 1, accion: 'mezcla', equipos: ['San Martín FC', 'Andes FC', 'Túpac FC', 'Libertador FC'] },
      { paso: 2, accion: 'asignacion_serie', serie: 'A' }
    ])
  })

  // ----- Incidencia con SLA -----
  const sla = calcularVencimientoSLA('Tecnica')
  await knex('incidencia').insert({
    evento_id: evento.id,
    usuario_id: coord.id,
    tipo: 'Tecnica',
    descripcion: 'Falla en el marcador electrónico del Estadio Nacional.',
    estado: 'abierta',
    responsable_id: admin.id,
    historial: JSON.stringify([{ estado: 'abierta', por: coord.email, nota: 'Reporte inicial' }]),
    sla_horas: sla.horasSLA,
    vence_en: sla.venceEn
  })

  // ----- Notificación -----
  await knex('notificacion').insert({
    usuario_id: admin.id,
    tipo: 'incidencia',
    mensaje: 'Nueva incidencia técnica asignada (SLA 2h).',
    leida: false
  })
}

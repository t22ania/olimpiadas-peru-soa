/**
 * Pruebas de integración de la API.
 * Requieren PostgreSQL levantado y la base cargada con `npm run db:reset`.
 *
 * Nota sobre el orden: el sorteo elimina y regenera las series y los partidos
 * del deporte sorteado (las claves foráneas propagan el borrado a resultado y
 * estadistica). Por eso las pruebas de posiciones se declaran ANTES que las de
 * sorteo: de lo contrario operarían sobre una base ya sin resultados publicados.
 */
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../src/app.js'
import db from '../src/db.js'
import { ejecutarSorteo } from '../src/services/sorteo.service.js'
import { calcularPosiciones } from '../src/services/posiciones.service.js'

let futbol
let basquet
let evento
let institucion
let equipoPruebaId

beforeAll(async () => {
  futbol = await db('deporte').where({ clave: 'futbol' }).first()
  basquet = await db('deporte').where({ clave: 'basquet' }).first()
  evento = await db('evento').first()
  institucion = await db('institucion').orderBy('id').first()
})

afterAll(async () => {
  // Elimina el equipo creado por las pruebas y cierra el pool de Knex,
  // de lo contrario Jest queda a la espera de conexiones abiertas.
  if (equipoPruebaId) await db('equipo').where({ id: equipoPruebaId }).del()
  await db.destroy()
})

describe('Disponibilidad del servicio', () => {
  test('GET /health responde ok:true', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })
})

describe('GET /api/deportes', () => {
  test('Devuelve al menos las 4 disciplinas del evento', async () => {
    const res = await request(app).get('/api/deportes')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThanOrEqual(4)
  })
})

describe('POST /api/equipos — validación de entrada', () => {
  test('Sin deporte_id devuelve 400', async () => {
    const res = await request(app).post('/api/equipos').send({ nombre: 'Equipo sin deporte' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBeDefined()
  })
})

describe('POST /api/equipos/:id/habilitar — regla de plantilla mínima', () => {
  test('Un equipo de fútbol sin participantes devuelve 422 con habilitado:false', async () => {
    const creado = await request(app).post('/api/equipos').send({
      nombre: 'Equipo de prueba automatizada',
      institucion_id: institucion.id,
      deporte_id: futbol.id
    })
    expect(creado.status).toBe(201)
    equipoPruebaId = creado.body.id

    const res = await request(app).post(`/api/equipos/${equipoPruebaId}/habilitar`)
    expect(res.status).toBe(422)
    expect(res.body.habilitado).toBe(false)
    expect(res.body.mensaje).toContain('mínimo 11')
  })

  test('Un equipo inexistente devuelve 404', async () => {
    const res = await request(app).post('/api/equipos/999999/habilitar')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Equipo no encontrado')
  })
})

describe('Incidencias', () => {
  test('POST /api/incidencias con tipo "Otro" devuelve 400', async () => {
    const res = await request(app).post('/api/incidencias').send({
      evento_id: evento.id,
      tipo: 'Otro',
      descripcion: 'Tipo no contemplado por el catálogo de SLA.'
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('tipo inválido')
  })

  test('GET /api/incidencias/sla/tabla devuelve Tecnica con SLA de 2 horas', async () => {
    const res = await request(app).get('/api/incidencias/sla/tabla')
    expect(res.status).toBe(200)
    expect(res.body.Tecnica).toBe(2)
  })
})

describe('calcularPosiciones — tabla a partir de resultados publicados', () => {
  test('Devuelve la tabla ordenada por puntos de mayor a menor', async () => {
    const tabla = await calcularPosiciones(futbol.id)
    expect(tabla.length).toBeGreaterThan(0)
    for (let i = 1; i < tabla.length; i++) {
      expect(tabla[i - 1].pts).toBeGreaterThanOrEqual(tabla[i].pts)
    }
  })

  test('Devuelve un arreglo vacío para un deporte inexistente', async () => {
    const tabla = await calcularPosiciones(999999)
    expect(tabla).toEqual([])
  })
})

describe('ejecutarSorteo — reproducibilidad y auditabilidad', () => {
  test('Con menos de 2 equipos habilitados lanza un error', async () => {
    await expect(
      ejecutarSorteo({ eventoId: evento.id, deporteId: basquet.id })
    ).rejects.toThrow('Se requieren al menos 2 equipos habilitados para sortear.')
  })

  test('Dos ejecuciones con la misma semilla producen el mismo resultado y la semilla queda persistida', async () => {
    const semilla = 'prueba-reproducible-0001'

    const primera = await ejecutarSorteo({ eventoId: evento.id, deporteId: futbol.id, semilla })
    const segunda = await ejecutarSorteo({ eventoId: evento.id, deporteId: futbol.id, semilla })

    expect(primera.semilla).toBe(semilla)
    expect(segunda.semilla).toBe(semilla)
    expect(segunda.series).toEqual(primera.series)

    const persistidos = await db('sorteo').where({ semilla })
    expect(persistidos.length).toBeGreaterThanOrEqual(1)
    expect(persistidos[0].semilla).toBe(semilla)
    expect(persistidos[0].log).toBeDefined()
  })
})

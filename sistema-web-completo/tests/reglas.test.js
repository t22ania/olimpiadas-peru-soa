/**
 * Pruebas unitarias puras sobre las reglas de negocio.
 * No requieren base de datos ni servicios levantados.
 */
import { describe, test, expect } from '@jest/globals'
import {
  validarPlantilla,
  calcularVencimientoSLA,
  SLA_INCIDENCIA,
  REGLAS_DEPORTE,
  PAIS_POR_GRADO
} from '../src/config/reglas.js'

describe('validarPlantilla — mínimo y máximo de participantes por deporte', () => {
  test('Fútbol con 11 participantes es una plantilla válida', () => {
    const r = validarPlantilla('futbol', 11)
    expect(r.ok).toBe(true)
    expect(r.min).toBe(11)
    expect(r.total).toBe(11)
  })

  test('Fútbol con 10 participantes falla e indica el mínimo 11', () => {
    const r = validarPlantilla('futbol', 10)
    expect(r.ok).toBe(false)
    expect(r.mensaje).toContain('mínimo 11')
  })

  test('Fútbol con 17 participantes falla e indica el máximo 16', () => {
    const r = validarPlantilla('futbol', 17)
    expect(r.ok).toBe(false)
    expect(r.mensaje).toContain('máximo 16')
  })

  test('Básquet con 5 participantes es una plantilla válida', () => {
    const r = validarPlantilla('basquet', 5)
    expect(r.ok).toBe(true)
    expect(r.min).toBe(5)
  })

  test('Vóley con 6 participantes es válido y con 5 falla', () => {
    expect(validarPlantilla('voley', 6).ok).toBe(true)
    const r = validarPlantilla('voley', 5)
    expect(r.ok).toBe(false)
    expect(r.mensaje).toContain('mínimo 6')
  })

  test('Ping Pong con 2 participantes es válido y con 3 falla', () => {
    expect(validarPlantilla('pingpong', 2).ok).toBe(true)
    const r = validarPlantilla('pingpong', 3)
    expect(r.ok).toBe(false)
    expect(r.mensaje).toContain('máximo 2')
  })

  test('Un deporte inexistente ("tenis") se rechaza como desconocido', () => {
    const r = validarPlantilla('tenis', 11)
    expect(r.ok).toBe(false)
    expect(r.mensaje).toContain('desconocido')
  })
})

describe('calcularVencimientoSLA — tiempo límite de atención por tipo', () => {
  test('Una incidencia Tecnica vence a las 2 horas', () => {
    const base = new Date('2026-06-01T10:00:00.000Z')
    const r = calcularVencimientoSLA('Tecnica', base)
    expect(r.horasSLA).toBe(2)
    expect(new Date(r.venceEn).getTime() - base.getTime()).toBe(2 * 60 * 60 * 1000)
  })

  test('Una incidencia Disciplinaria vence a las 72 horas', () => {
    const base = new Date('2026-06-01T10:00:00.000Z')
    const r = calcularVencimientoSLA('Disciplinaria', base)
    expect(r.horasSLA).toBe(72)
    expect(new Date(r.venceEn).getTime() - base.getTime()).toBe(72 * 60 * 60 * 1000)
  })

  test('Un tipo no registrado usa 48 horas por defecto', () => {
    const r = calcularVencimientoSLA('TipoInexistente', new Date('2026-06-01T10:00:00.000Z'))
    expect(r.horasSLA).toBe(48)
  })

  test('SLA_INCIDENCIA define exactamente los 4 tipos previstos', () => {
    expect(Object.keys(SLA_INCIDENCIA)).toHaveLength(4)
    expect(SLA_INCIDENCIA).toEqual({
      Tecnica: 2,
      Deportiva: 24,
      Administrativa: 48,
      Disciplinaria: 72
    })
  })
})

describe('REGLAS_DEPORTE — sistema de puntuación', () => {
  test('Fútbol otorga 3 puntos por victoria, 1 por empate y 0 por derrota', () => {
    expect(REGLAS_DEPORTE.futbol.puntos).toEqual({ victoria: 3, empate: 1, derrota: 0 })
  })
})

describe('PAIS_POR_GRADO — país representado según el grado', () => {
  test('El 1.er año representa a Brasil', () => {
    expect(PAIS_POR_GRADO['1.er año']).toBe('Brasil')
  })

  test('El 5.to año representa a Francia', () => {
    expect(PAIS_POR_GRADO['5.to año']).toBe('Francia')
  })
})

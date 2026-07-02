// ===== Reglas de negocio centralizadas =====

// País representado según el grado/categoría de la institución
export const PAIS_POR_GRADO = {
  '1.er año': 'Brasil',
  '2.do año': 'Argentina',
  '3.er año': 'Alemania',
  '4.to año': 'España',
  '5.to año': 'Francia'
}

// Reglas por deporte (se guardan también en Deporte.config_reglas JSONB)
// min/max titulares + suplentes según el enunciado.
export const REGLAS_DEPORTE = {
  futbol: { titulares: 11, suplentes: 5, min: 11, max: 16, puntos: { victoria: 3, empate: 1, derrota: 0 } },
  basquet: { titulares: 5, suplentes: 7, min: 5, max: 12, puntos: { victoria: 2, empate: 0, derrota: 1 } },
  voley: { titulares: 6, suplentes: 6, min: 6, max: 12, puntos: { victoria: 1, empate: 0, derrota: 0 } },
  pingpong: { modalidad: 'individual o dobles', min: 1, max: 2, puntos: { victoria: 1, empate: 0, derrota: 0 } }
}

// SLA de incidencias por tipo (en horas)
export const SLA_INCIDENCIA = {
  Tecnica: 2,
  Deportiva: 24,
  Administrativa: 48,
  Disciplinaria: 72
}

// Estados válidos de un evento
export const ESTADOS_EVENTO = ['pendiente', 'aprobado', 'rechazado', 'en proceso', 'atendido', 'cancelado']

// Estados de equipo / incidencia
export const ESTADOS_EQUIPO = ['borrador', 'habilitado', 'rechazado']
export const ESTADOS_INCIDENCIA = ['abierta', 'en_proceso', 'resuelta', 'cerrada']

/**
 * Valida si un equipo cumple el mínimo de participantes para su deporte.
 * Devuelve { ok, min, max, total, mensaje }.
 */
export function validarPlantilla (deporteKey, totalParticipantes) {
  const regla = REGLAS_DEPORTE[deporteKey]
  if (!regla) return { ok: false, mensaje: `Deporte desconocido: ${deporteKey}` }
  const { min, max } = regla
  if (totalParticipantes < min) {
    return { ok: false, min, max, total: totalParticipantes, mensaje: `Faltan participantes: mínimo ${min}.` }
  }
  if (totalParticipantes > max) {
    return { ok: false, min, max, total: totalParticipantes, mensaje: `Demasiados participantes: máximo ${max}.` }
  }
  return { ok: true, min, max, total: totalParticipantes, mensaje: 'Plantilla válida.' }
}

/** Calcula la fecha límite (SLA) de una incidencia a partir de su tipo y fecha de creación. */
export function calcularVencimientoSLA (tipo, fechaCreacion = new Date()) {
  const horas = SLA_INCIDENCIA[tipo] ?? 48
  const limite = new Date(fechaCreacion)
  limite.setHours(limite.getHours() + horas)
  return { horasSLA: horas, venceEn: limite.toISOString() }
}

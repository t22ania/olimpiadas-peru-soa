// Respaldo de datos para el modo demostración (sin API ni base de datos).
// Transforma el contenido de seed.js al mismo formato que devuelve la API :4000,
// de modo que las vistas funcionen sin cambios cuando los servicios no responden.
import {
  DEPORTES as DEPORTES_SEED,
  instituciones as institucionesSeed,
  equipos as equiposSeed,
  partidos as partidosSeed,
  PAIS_POR_GRADO
} from './seed.js'

// La API usa ids numéricos y una 'clave' de texto; seed.js usa la clave como id.
const ID_POR_CLAVE = { futbol: 1, basquet: 2, voley: 3, pingpong: 4 }

export const demoDeportes = () => DEPORTES_SEED.map(d => ({
  id: ID_POR_CLAVE[d.id],
  clave: d.id,
  nombre: d.nombre,
  genero: d.genero,
  min: d.min,
  max: d.max
}))

export const demoInstituciones = () => institucionesSeed.map(i => ({ ...i }))

// Cada participante recibe un id numérico estable derivado de su equipo.
const participantesDe = (eq) => eq.participantes.map((p, i) => ({
  id: eq.id * 100 + i + 1,
  nombre: p.nombre,
  posicion: null,
  dorsal: p.dorsal
}))

export const demoEquipos = () => equiposSeed.map(e => ({
  id: e.id,
  deporte_id: ID_POR_CLAVE[e.deporte],
  nombre: e.nombre,
  estado: 'habilitado',
  institucion_id: e.institucionId,
  institucion_nombre: institucionesSeed.find(i => i.id === e.institucionId)?.nombre || '—',
  participantes: e.participantes.length
}))

export const demoPartidos = () => partidosSeed.map(p => ({
  id: p.id,
  deporte_id: ID_POR_CLAVE[p.deporte],
  serie: `Serie ${p.serie}`,
  localId: p.localId,
  localNombre: equiposSeed.find(e => e.id === p.localId)?.nombre || '—',
  visitaId: p.visitanteId,
  visitaNombre: equiposSeed.find(e => e.id === p.visitanteId)?.nombre || '—',
  fecha: p.fecha,
  hora: p.hora,
  sede: p.sede,
  estado: p.estado,
  golesLocal: p.golesLocal,
  golesVisitante: p.golesVisitante,
  publicado: p.estado === 'publicado',
  goleadores: p.goleadores || []
}))

// Participantes por equipo (incluye los equipos creados durante la sesión).
export const demoParticipantes = (equipoId, extras = []) => {
  const propio = extras.find(e => e.id === equipoId)
  if (propio) return propio.participantes
  const eq = equiposSeed.find(e => e.id === equipoId)
  return eq ? participantesDe(eq) : []
}

// Tabla de posiciones calculada con la regla de fútbol: 3 por victoria, 1 por empate, 0 por derrota.
export const demoPosiciones = (deporteId, partidos, equipos) => {
  const filas = new Map()
  const fila = (id, nombre) => {
    if (!filas.has(id)) filas.set(id, { equipoId: id, nombre, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, pts: 0 })
    return filas.get(id)
  }

  equipos.filter(e => e.deporte_id === deporteId).forEach(e => fila(e.id, e.nombre))

  partidos
    .filter(p => p.deporte_id === deporteId && p.publicado)
    .forEach(p => {
      const local = fila(p.localId, p.localNombre)
      const visita = fila(p.visitaId, p.visitaNombre)
      const gl = p.golesLocal || 0
      const gv = p.golesVisitante || 0

      local.pj++; visita.pj++
      local.gf += gl; local.gc += gv
      visita.gf += gv; visita.gc += gl

      if (gl > gv) { local.g++; local.pts += 3; visita.p++ } else if (gl < gv) { visita.g++; visita.pts += 3; local.p++ } else { local.e++; visita.e++; local.pts++; visita.pts++ }
    })

  return [...filas.values()].sort((a, b) => b.pts - a.pts || (b.gf - b.gc) - (a.gf - a.gc) || b.gf - a.gf)
}

// Ranking de anotadores acumulado desde los partidos publicados.
export const demoRanking = (deporteId, partidos) => {
  const totales = new Map()
  partidos
    .filter(p => p.deporte_id === deporteId && p.publicado)
    .forEach(p => (p.goleadores || []).forEach(g => {
      totales.set(g.jugador, (totales.get(g.jugador) || 0) + g.goles)
    }))

  return [...totales.entries()]
    .map(([jugador, goles]) => ({ jugador, goles, puntos: goles }))
    .sort((a, b) => b.goles - a.goles)
}

// Generador pseudoaleatorio con semilla: el mismo valor produce siempre el mismo sorteo.
const mulberry32 = (semilla) => {
  let a = semilla
  return () => {
    a |= 0; a = (a + 0x6D625F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const numeroDeTexto = (texto) => {
  let h = 0
  for (const c of texto) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0
  return h >>> 0
}

// Sorteo reproducible: reparte los equipos en dos series y arma el calendario.
export const demoSorteo = (deporteId, equipos, semilla) => {
  const disponibles = equipos.filter(e => e.deporte_id === deporteId)
  const azar = mulberry32(numeroDeTexto(semilla))

  const mezclados = [...disponibles]
  for (let i = mezclados.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1))
    ;[mezclados[i], mezclados[j]] = [mezclados[j], mezclados[i]]
  }

  const mitad = Math.ceil(mezclados.length / 2)
  const grupos = [
    { serie: 'A', equipos: mezclados.slice(0, mitad) },
    { serie: 'B', equipos: mezclados.slice(mitad) }
  ].filter(g => g.equipos.length > 0)

  const sedes = ['Estadio Nacional', 'Coliseo Mayor', 'Polideportivo', 'Campo 2']
  const partidos = []
  let n = 0

  grupos.forEach(g => {
    for (let i = 0; i < g.equipos.length; i++) {
      for (let j = i + 1; j < g.equipos.length; j++) {
        const local = g.equipos[i]
        const visita = g.equipos[j]
        partidos.push({
          id: Date.now() + n,
          deporte_id: deporteId,
          serie: `Serie ${g.serie}`,
          localId: local.id,
          localNombre: local.nombre,
          visitaId: visita.id,
          visitaNombre: visita.nombre,
          fecha: `2026-06-${String(10 + Math.floor(n / 2)).padStart(2, '0')}`,
          hora: n % 2 === 0 ? '09:00' : '11:00',
          sede: sedes[n % sedes.length],
          estado: 'pendiente',
          publicado: false,
          goleadores: []
        })
        n++
      }
    }
  })

  return {
    semilla,
    series: grupos.map(g => ({ serie: g.serie, equipos: g.equipos.map(e => e.nombre) })),
    partidos
  }
}

export { PAIS_POR_GRADO }

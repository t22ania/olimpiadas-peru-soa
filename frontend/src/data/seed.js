// ===== Datos de ejemplo precargados (en memoria) =====

// Mapa de grado -> país representado
export const PAIS_POR_GRADO = {
  '1.er año': 'Brasil',
  '2.do año': 'Argentina',
  '3.er año': 'Alemania',
  '4.to año': 'España',
  '5.to año': 'Francia'
}

export const GRADOS = Object.keys(PAIS_POR_GRADO)

// ===== Incidencias (tiempo límite por tipo y datos de ejemplo) =====
export const SLA_INCIDENCIA = {
  'Técnica': '< 2 horas',
  'Deportiva': '< 24 horas',
  'Administrativa': '< 48 horas',
  'Disciplinaria': '< 72 horas'
}

export const ESTADOS_INCIDENCIA = ['Reportada', 'En proceso', 'Resuelta']

export const incidencias = [
  { id: 1, tipo: 'Técnica', descripcion: 'Falla en el marcador electrónico del Estadio Nacional.', partido: 'San Martín FC vs Libertador FC', estado: 'En proceso', fecha: '2026-06-02' },
  { id: 2, tipo: 'Deportiva', descripcion: 'Reclamo por alineación indebida de un jugador.', partido: 'Túpac FC vs Andes FC', estado: 'Reportada', fecha: '2026-06-02' },
  { id: 3, tipo: 'Administrativa', descripcion: 'Documentación de un participante incompleta.', partido: 'General (sin partido)', estado: 'Resuelta', fecha: '2026-06-01' }
]

// Deportes con su mínimo de participantes por equipo
export const DEPORTES = [
  { id: 'futbol', nombre: 'Fútbol', genero: 'Varones', min: 11, max: 18 },
  { id: 'basquet', nombre: 'Básquet', genero: 'Varones', min: 5, max: 12 },
  { id: 'voley', nombre: 'Vóley', genero: 'Damas', min: 6, max: 12 },
  { id: 'pingpong', nombre: 'Ping Pong', genero: 'Mixto', min: 1, max: 2 }
]

export const usuarios = [
  { id: 1, nombre: 'Ana Admin', email: 'admin@demo.com', password: '123456', rol: 'admin' },
  { id: 2, nombre: 'Carlos Coordinador', email: 'coordinador@demo.com', password: '123456', rol: 'coordinador' },
  { id: 3, nombre: 'Raúl Árbitro', email: 'arbitro@demo.com', password: '123456', rol: 'arbitro' },
  { id: 4, nombre: 'Inés Institución', email: 'institucion@demo.com', password: '123456', rol: 'institucion' }
]

export const instituciones = [
  { id: 1, nombre: 'I.E. San Martín', contacto: 'María Gómez', grado: '1.er año', pais: 'Brasil' },
  { id: 2, nombre: 'Colegio Libertador', contacto: 'José Pérez', grado: '5.to año', pais: 'Francia' },
  { id: 3, nombre: 'I.E. Túpac Amaru', contacto: 'Lucía Ríos', grado: '3.er año', pais: 'Alemania' },
  { id: 4, nombre: 'Colegio Los Andes', contacto: 'Pedro Salas', grado: '2.do año', pais: 'Argentina' }
]

// Equipos por deporte
export const equipos = [
  // Fútbol
  { id: 1, deporte: 'futbol', nombre: 'San Martín FC', institucionId: 1, participantes: gen('SM', 11) },
  { id: 2, deporte: 'futbol', nombre: 'Libertador FC', institucionId: 2, participantes: gen('LB', 11) },
  { id: 3, deporte: 'futbol', nombre: 'Túpac FC', institucionId: 3, participantes: gen('TU', 11) },
  { id: 4, deporte: 'futbol', nombre: 'Andes FC', institucionId: 4, participantes: gen('AN', 11) },
  // Básquet
  { id: 5, deporte: 'basquet', nombre: 'San Martín BC', institucionId: 1, participantes: gen('SMB', 5) },
  { id: 6, deporte: 'basquet', nombre: 'Libertador BC', institucionId: 2, participantes: gen('LBB', 5) },
  { id: 7, deporte: 'basquet', nombre: 'Andes BC', institucionId: 4, participantes: gen('ANB', 5) },
  // Vóley
  { id: 8, deporte: 'voley', nombre: 'San Martín VC', institucionId: 1, participantes: gen('SMV', 6) },
  { id: 9, deporte: 'voley', nombre: 'Túpac VC', institucionId: 3, participantes: gen('TUV', 6) },
  // Ping Pong
  { id: 10, deporte: 'pingpong', nombre: 'Libertador PP', institucionId: 2, participantes: gen('PP1', 2) },
  { id: 11, deporte: 'pingpong', nombre: 'Andes PP', institucionId: 4, participantes: gen('PP2', 2) }
]

function gen (prefijo, n) {
  const nombres = ['Luis', 'Marco', 'Diego', 'Juan', 'Pablo', 'Iván', 'Hugo', 'Beto',
    'Saúl', 'Erik', 'Noé', 'Ariel', 'Tito', 'César', 'Omar', 'Leo', 'Bruno', 'Dante']
  return Array.from({ length: n }, (_, i) => ({
    id: `${prefijo}-${i + 1}`,
    nombre: `${nombres[i % nombres.length]} ${prefijo}`,
    dorsal: i + 1
  }))
}

// Partidos de ejemplo (algunos ya publicados para llenar la tabla)
export const partidos = [
  { id: 1, deporte: 'futbol', serie: 'A', localId: 1, visitanteId: 2, fecha: '2026-06-02', hora: '09:00', sede: 'Estadio Nacional', estado: 'publicado', golesLocal: 3, golesVisitante: 1, goleadores: [{ equipoId: 1, jugador: 'Luis SM', goles: 2 }, { equipoId: 1, jugador: 'Marco SM', goles: 1 }, { equipoId: 2, jugador: 'Luis LB', goles: 1 }] },
  { id: 2, deporte: 'futbol', serie: 'A', localId: 3, visitanteId: 4, fecha: '2026-06-02', hora: '11:00', sede: 'Estadio Nacional', estado: 'publicado', golesLocal: 2, golesVisitante: 2, goleadores: [{ equipoId: 3, jugador: 'Luis TU', goles: 2 }, { equipoId: 4, jugador: 'Marco AN', goles: 2 }] },
  { id: 3, deporte: 'futbol', serie: 'A', localId: 1, visitanteId: 3, fecha: '2026-06-05', hora: '09:00', sede: 'Campo 2', estado: 'pendiente' },
  { id: 4, deporte: 'futbol', serie: 'A', localId: 2, visitanteId: 4, fecha: '2026-06-05', hora: '11:00', sede: 'Campo 2', estado: 'pendiente' },
  { id: 5, deporte: 'basquet', serie: 'A', localId: 5, visitanteId: 6, fecha: '2026-06-03', hora: '10:00', sede: 'Coliseo Mayor', estado: 'publicado', golesLocal: 58, golesVisitante: 47, goleadores: [{ equipoId: 5, jugador: 'Luis SMB', goles: 22 }, { equipoId: 6, jugador: 'Diego LBB', goles: 19 }] },
  { id: 6, deporte: 'basquet', serie: 'A', localId: 7, visitanteId: 5, fecha: '2026-06-06', hora: '10:00', sede: 'Coliseo Mayor', estado: 'pendiente' },
  { id: 7, deporte: 'voley', serie: 'A', localId: 8, visitanteId: 9, fecha: '2026-06-04', hora: '16:00', sede: 'Polideportivo', estado: 'publicado', golesLocal: 3, golesVisitante: 1, goleadores: [{ equipoId: 8, jugador: 'Luis SMV', goles: 18 }, { equipoId: 9, jugador: 'Marco TUV', goles: 14 }] },
  { id: 8, deporte: 'pingpong', serie: 'A', localId: 10, visitanteId: 11, fecha: '2026-06-04', hora: '18:00', sede: 'Sala TM', estado: 'pendiente' }
]

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { GRADOS, PAIS_POR_GRADO, incidencias as incidenciasSeed, ESTADOS_INCIDENCIA } from '../data/seed.js'
import * as api from '../api.js'

const DataContext = createContext(null)
export const useData = () => useContext(DataContext)

// Mapea un deporte de la API al shape que usan las vistas
const mapDeporte = (d) => ({
  id: d.id,                 // id numérico de la BD
  clave: d.clave,
  nombre: d.nombre,
  genero: d.categoria,
  min: d.config_reglas?.min ?? 1,
  max: d.config_reglas?.max ?? 99
})

const mapInstitucion = (i) => ({
  id: i.id, nombre: i.nombre, contacto: i.contacto, grado: i.grado, pais: i.pais_representado
})

const mapEquipo = (e) => ({
  id: e.id, deporte_id: e.deporte_id, nombre: e.nombre, estado: e.estado,
  institucion_id: e.institucion_id, institucion_nombre: e.institucion_nombre,
  participantes: Number(e.participantes) || 0
})

const mapPartido = (p) => ({
  id: p.id, deporte_id: p.deporte_id, serie: p.serie_nombre,
  localId: p.equipo_local_id, localNombre: p.local_nombre,
  visitaId: p.equipo_visita_id, visitaNombre: p.visita_nombre,
  fecha: p.fecha_hora ? String(p.fecha_hora).slice(0, 10) : '',
  hora: p.fecha_hora ? String(p.fecha_hora).slice(11, 16) : '',
  sede: p.venue,
  estado: p.publicado ? 'publicado' : p.estado,
  golesLocal: p.marcador_local, golesVisitante: p.marcador_visita,
  publicado: p.publicado
})

export function DataProvider ({ children }) {
  const [deportes, setDeportes] = useState([])
  const [instituciones, setInstituciones] = useState([])
  const [equipos, setEquipos] = useState([])
  const [partidos, setPartidos] = useState([])
  const [eventoId, setEventoId] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  // Incidencias: se mantienen solo en memoria (sin backend)
  const [incidencias, setIncidencias] = useState(incidenciasSeed)

  const recargarEquipos = useCallback(async () => {
    setEquipos((await api.getEquipos()).map(mapEquipo))
  }, [])

  const recargarPartidos = useCallback(async () => {
    setPartidos((await api.getPartidos()).map(mapPartido))
  }, [])

  const recargarInstituciones = useCallback(async () => {
    setInstituciones((await api.getInstituciones()).map(mapInstitucion))
  }, [])

  const cargarTodo = useCallback(async () => {
    setCargando(true); setError(null)
    try {
      const [dep, inst, eq, par, eventos] = await Promise.all([
        api.getDeportes(), api.getInstituciones(), api.getEquipos(), api.getPartidos(), api.getEventos()
      ])
      setDeportes(dep.map(mapDeporte))
      setInstituciones(inst.map(mapInstitucion))
      setEquipos(eq.map(mapEquipo))
      setPartidos(par.map(mapPartido))
      setEventoId(eventos[0]?.id ?? null)
    } catch (e) {
      setError('No se pudo conectar con la API (:4000). ¿Están corriendo los servicios y PostgreSQL?')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargarTodo() }, [cargarTodo])

  // ----- Acciones (escriben en la BD vía API) -----

  // Institución: usa el microservicio de registro (:4002) y refresca desde (:4000)
  const agregarInstitucion = async ({ nombre, contacto, grado }) => {
    const inst = await api.registrarInstitucionRemoto({ nombre, contacto, grado })
    await recargarInstituciones()
    return { nombre: inst.nombre, pais: inst.pais_representado, grado: inst.grado }
  }

  // Equipo completo: crea equipo, agrega participantes y valida/habilita
  const inscribirEquipo = async ({ deporte_id, nombre, institucion_id, participantes }) => {
    const eq = await api.crearEquipo({ nombre, institucion_id: institucion_id || null, deporte_id })
    for (const p of participantes) {
      await api.agregarParticipante(eq.id, { nombre: p.nombre, posicion: p.posicion || null })
    }
    let habilitacion
    try {
      habilitacion = await api.habilitarEquipo(eq.id)
    } catch (e) {
      habilitacion = e.data || { habilitado: false, mensaje: e.message }
    }
    await recargarEquipos()
    return { equipo: eq, ...habilitacion }
  }

  const ejecutarSorteo = async (deporte_id) => {
    const res = await api.ejecutarSorteoRemoto({ eventoId, deporteId: deporte_id })
    await recargarPartidos()
    return res
  }

  const registrarResultado = async (partidoId, payload) => {
    await api.registrarResultadoRemoto(partidoId, payload)
    await recargarPartidos()
  }

  // ----- Incidencias (en memoria) -----
  const agregarIncidencia = ({ tipo, descripcion, partido }) => {
    setIncidencias(prev => [
      {
        id: Date.now(),
        tipo,
        descripcion,
        partido: partido || 'General (sin partido)',
        estado: 'Reportada',
        fecha: new Date().toISOString().slice(0, 10)
      },
      ...prev
    ])
  }

  const avanzarEstadoIncidencia = (id) => {
    setIncidencias(prev => prev.map(i => {
      if (i.id !== id) return i
      const idx = ESTADOS_INCIDENCIA.indexOf(i.estado)
      return { ...i, estado: ESTADOS_INCIDENCIA[Math.min(idx + 1, ESTADOS_INCIDENCIA.length - 1)] }
    }))
  }

  const value = {
    deportes, instituciones, equipos, partidos, eventoId, cargando, error,
    GRADOS, PAIS_POR_GRADO,
    DEPORTES: deportes, // alias para compatibilidad con las vistas
    recargar: cargarTodo,
    incidencias, agregarIncidencia, avanzarEstadoIncidencia,
    agregarInstitucion, inscribirEquipo, ejecutarSorteo, registrarResultado,
    getParticipantes: api.getParticipantes,
    getPosiciones: api.getPosiciones,
    getRanking: api.getRanking
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

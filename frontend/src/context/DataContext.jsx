import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { GRADOS, PAIS_POR_GRADO, incidencias as incidenciasSeed, ESTADOS_INCIDENCIA } from '../data/seed.js'
import {
  demoDeportes, demoInstituciones, demoEquipos, demoPartidos,
  demoParticipantes, demoPosiciones, demoRanking, demoSorteo
} from '../data/demo.js'
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
  // Modo demostración: se activa cuando la API (:4000) no responde
  const [modoDemo, setModoDemo] = useState(false)
  // Participantes de los equipos creados durante la sesión en modo demostración
  const participantesDemo = useRef({})
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
      setModoDemo(false)
    } catch (e) {
      // Sin servicios activos la aplicación no se detiene: continúa con los datos
      // de demostración cargados en memoria (mismo formato que devuelve la API).
      setDeportes(demoDeportes())
      setInstituciones(demoInstituciones())
      setEquipos(demoEquipos())
      setPartidos(demoPartidos())
      setEventoId('demo')
      setModoDemo(true)
      setError(null)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargarTodo() }, [cargarTodo])

  // ----- Acciones (escriben en la BD vía API) -----

  // Institución: usa el microservicio de registro (:4002) y refresca desde (:4000)
  const agregarInstitucion = async ({ nombre, contacto, grado }) => {
    if (modoDemo) {
      const nueva = { id: Date.now(), nombre, contacto, grado, pais: PAIS_POR_GRADO[grado] }
      setInstituciones(prev => [...prev, nueva])
      return { nombre: nueva.nombre, pais: nueva.pais, grado: nueva.grado }
    }
    const inst = await api.registrarInstitucionRemoto({ nombre, contacto, grado })
    await recargarInstituciones()
    return { nombre: inst.nombre, pais: inst.pais_representado, grado: inst.grado }
  }

  // Equipo completo: crea equipo, agrega participantes y valida/habilita
  const inscribirEquipo = async ({ deporte_id, nombre, institucion_id, participantes }) => {
    if (modoDemo) {
      const dep = deportes.find(d => d.id === deporte_id)
      const minimo = dep?.min ?? 1
      const habilitado = participantes.length >= minimo
      const id = Date.now()
      participantesDemo.current[id] = participantes.map((p, i) => ({
        id: id + i + 1, nombre: p.nombre, posicion: null
      }))
      const nuevo = {
        id,
        deporte_id,
        nombre,
        estado: habilitado ? 'habilitado' : 'pendiente',
        institucion_id,
        institucion_nombre: instituciones.find(i => i.id === institucion_id)?.nombre || '—',
        participantes: participantes.length
      }
      setEquipos(prev => [...prev, nuevo])
      return {
        equipo: nuevo,
        habilitado,
        mensaje: habilitado ? '' : `Se requieren al menos ${minimo} participantes.`
      }
    }
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
    if (modoDemo) {
      const semilla = `demo-${Date.now().toString(36)}`
      const res = demoSorteo(deporte_id, equipos, semilla)
      setPartidos(prev => [...prev.filter(p => p.deporte_id !== deporte_id), ...res.partidos])
      return { semilla: res.semilla, series: res.series }
    }
    const res = await api.ejecutarSorteoRemoto({ eventoId, deporteId: deporte_id })
    await recargarPartidos()
    return res
  }

  // Busca el nombre de un anotador entre los participantes de ambos equipos (modo demostración)
  const nombreAnotador = (participanteId, partido) => {
    const lista = [partido.localId, partido.visitaId].flatMap(eqId =>
      participantesDemo.current[eqId] || demoParticipantes(eqId)
    )
    return lista.find(p => p.id === participanteId)?.nombre || 'Anotador'
  }

  const registrarResultado = async (partidoId, payload) => {
    if (modoDemo) {
      setPartidos(prev => prev.map(p => p.id !== partidoId
        ? p
        : {
            ...p,
            golesLocal: payload.marcador_local,
            golesVisitante: payload.marcador_visita,
            publicado: !!payload.publicado,
            estado: payload.publicado ? 'publicado' : p.estado,
            goleadores: (payload.estadisticas || []).map(s => ({
              jugador: nombreAnotador(s.participante_id, p), goles: s.goles
            }))
          }
      ))
      return
    }
    await api.registrarResultadoRemoto(partidoId, payload)
    await recargarPartidos()
  }

  // ----- Consultas que las vistas hacen bajo demanda -----
  const getParticipantes = useCallback((equipoId) => (
    modoDemo
      ? Promise.resolve(participantesDemo.current[equipoId] || demoParticipantes(equipoId))
      : api.getParticipantes(equipoId)
  ), [modoDemo])

  const getPosiciones = useCallback((deporteId) => (
    modoDemo
      ? Promise.resolve(demoPosiciones(deporteId, partidos, equipos))
      : api.getPosiciones(deporteId)
  ), [modoDemo, partidos, equipos])

  const getRanking = useCallback((deporteId) => (
    modoDemo
      ? Promise.resolve(demoRanking(deporteId, partidos))
      : api.getRanking(deporteId)
  ), [modoDemo, partidos])

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
    deportes, instituciones, equipos, partidos, eventoId, cargando, error, modoDemo,
    GRADOS, PAIS_POR_GRADO,
    DEPORTES: deportes, // alias para compatibilidad con las vistas
    recargar: cargarTodo,
    incidencias, agregarIncidencia, avanzarEstadoIncidencia,
    agregarInstitucion, inscribirEquipo, ejecutarSorteo, registrarResultado,
    getParticipantes, getPosiciones, getRanking
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

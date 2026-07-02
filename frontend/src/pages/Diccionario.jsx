// Documentación de solo lectura: entidades principales y sus campos.
const ENTIDADES = [
  {
    nombre: 'Institución',
    campos: [
      ['id', 'Entero', 'Identificador único de la institución'],
      ['nombre', 'Texto', 'Nombre de la institución'],
      ['pais_representado', 'Texto', 'País asignado automáticamente según el grado'],
      ['grado', 'Texto', 'Grado o categoría (1.er año … 5.to año)'],
      ['contacto', 'Texto', 'Persona de contacto'],
      ['estado', 'Texto', 'Estado de la institución (activo / inactivo)']
    ]
  },
  {
    nombre: 'Usuario',
    campos: [
      ['id', 'Entero', 'Identificador único del usuario'],
      ['nombre', 'Texto', 'Nombre completo'],
      ['email', 'Texto', 'Correo usado para iniciar sesión'],
      ['password_hash', 'Texto', 'Contraseña cifrada (bcrypt)'],
      ['rol', 'Texto', 'Rol: admin, coordinador, arbitro o institucion']
    ]
  },
  {
    nombre: 'Equipo',
    campos: [
      ['id', 'Entero', 'Identificador único del equipo'],
      ['nombre', 'Texto', 'Nombre del equipo'],
      ['institucion_id', 'Entero', 'Institución a la que pertenece'],
      ['deporte_id', 'Entero', 'Disciplina del equipo'],
      ['estado', 'Texto', 'Estado (pendiente / habilitado / rechazado)']
    ]
  },
  {
    nombre: 'Participante',
    campos: [
      ['id', 'Entero', 'Identificador único del participante'],
      ['nombre', 'Texto', 'Nombre del jugador'],
      ['documento', 'Texto', 'Documento de identidad'],
      ['posicion', 'Texto', 'Posición o rol dentro del equipo'],
      ['equipo_id', 'Entero', 'Equipo al que pertenece']
    ]
  },
  {
    nombre: 'Partido',
    campos: [
      ['id', 'Entero', 'Identificador único del partido'],
      ['fecha_hora', 'Fecha/Hora', 'Fecha y hora programada'],
      ['venue', 'Texto', 'Sede o cancha'],
      ['serie_id', 'Entero', 'Serie o grupo del sorteo'],
      ['equipo_local_id', 'Entero', 'Equipo local'],
      ['equipo_visita_id', 'Entero', 'Equipo visitante'],
      ['estado', 'Texto', 'Estado (pendiente / publicado)']
    ]
  },
  {
    nombre: 'Resultado',
    campos: [
      ['id', 'Entero', 'Identificador único del resultado'],
      ['partido_id', 'Entero', 'Partido al que corresponde'],
      ['marcador_local', 'Entero', 'Anotaciones del equipo local'],
      ['marcador_visita', 'Entero', 'Anotaciones del equipo visitante'],
      ['publicado', 'Booleano', 'Indica si el resultado ya fue publicado']
    ]
  },
  {
    nombre: 'Incidencia',
    campos: [
      ['id', 'Entero', 'Identificador único de la incidencia'],
      ['tipo', 'Texto', 'Técnica, Deportiva, Administrativa o Disciplinaria'],
      ['descripcion', 'Texto', 'Detalle de la incidencia'],
      ['partido', 'Texto', 'Partido relacionado (o General)'],
      ['estado', 'Texto', 'Reportada, En proceso o Resuelta'],
      ['fecha', 'Fecha', 'Fecha del reporte']
    ]
  }
]

export default function Diccionario () {
  return (
    <div className="page">
      <div className="page-head">
        <h2>📖 Acerca del sistema · Diccionario de datos</h2>
        <p>Documentación de las entidades principales del sistema y sus campos (solo lectura).</p>
      </div>

      {ENTIDADES.map(ent => (
        <section key={ent.nombre} className="card">
          <h3>{ent.nombre}</h3>
          <table className="tabla">
            <thead>
              <tr><th>Campo</th><th>Tipo</th><th>Descripción</th></tr>
            </thead>
            <tbody>
              {ent.campos.map(([campo, tipo, desc]) => (
                <tr key={campo}>
                  <td><code>{campo}</code></td>
                  <td><span className="pill">{tipo}</span></td>
                  <td>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  )
}

# Informe de pruebas — Plataforma SOA "Olimpiadas PERÚ"

Documento de evidencias de la ejecución real de pruebas sobre el proyecto.
Todas las salidas se reproducen literalmente, tal como las imprimió la consola.

- Fecha de ejecución: 16 de julio de 2026
- Equipo de pruebas: Windows 11 Pro 10.0.26200
- Directorio del proyecto: `C:\Users\Usuario\OneDrive\Documentos\UTP\SOA\USCA-APF2`

---

## 0. Entorno de ejecución

| Componente | Versión |
|---|---|
| Node.js | v24.16.0 |
| npm | 11.13.0 |
| PostgreSQL | PostgreSQL 16.14, compiled by Visual C++ build 1944, 64-bit |
| jest | 30.4.2 |
| supertest | 7.2.2 |
| cross-env | 10.1.0 |

### Observación sobre la base de datos

El proyecto documenta el uso de PostgreSQL en Docker (`docker compose up -d`). En el
equipo donde se ejecutaron estas pruebas **Docker Desktop no se encuentra instalado**;
la verificación fue la siguiente:

```
--- Docker Desktop instalado? ---
C:\Program Files\Docker\Docker\Docker Desktop.exe -> False
C:\Program Files\Docker\Docker\resources\bin\docker.exe -> False
C:\Users\Usuario\AppData\Local\Docker\Docker Desktop.exe -> False
--- Puerto 5432 (PostgreSQL) ---
True
--- servicios postgres locales ---

Name           Status
----           ------
postgresql-16 Running
```

En su lugar existe una instancia **nativa de PostgreSQL 16 ejecutándose como servicio
de Windows** en el puerto 5432, y los archivos `.env` del proyecto ya están configurados
para ella (`PGUSER=postgres`). Las pruebas se ejecutaron contra esa instancia. La
conexión y el esquema se verificaron así:

```
CONEXION OK
PostgreSQL 16.14, compiled by Visual C++ build 1944, 64-bit
TABLAS: deporte, equipo, estadistica, evento, incidencia, institucion, knex_migrations, knex_migrations_lock, notificacion, participante, partido, resultado, serie, sorteo, usuario
```

El resultado de las pruebas es equivalente, dado que la versión del motor (16) y el
esquema son los mismos que produce el contenedor definido en `docker-compose.yml`.

---

## 1. Configuración de pruebas aplicada

Se instalaron `jest`, `supertest` y `cross-env` como dependencias de desarrollo en
`sistema-web-completo`:

```
added 316 packages, and audited 423 packages in 19s

68 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

Script agregado a `package.json`:

```json
"test": "cross-env NODE_OPTIONS=--experimental-vm-modules jest --coverage"
```

La bandera `--experimental-vm-modules` es necesaria porque todos los `package.json` del
proyecto declaran `"type": "module"`; sin ella Jest no puede cargar los módulos ES de
forma nativa. `cross-env` se emplea para que la asignación de la variable de entorno
funcione igualmente en Windows.

---

## 2. Salida completa de `npm test`

Ejecutado sobre una base recién cargada con `npm run db:reset`.

```
> olimpiadas-sistema-web-completo@1.0.0 test
> cross-env NODE_OPTIONS=--experimental-vm-modules jest --coverage

(node:20708) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
PASS tests/api.test.js
  Disponibilidad del servicio
    √ GET /health responde ok:true (17 ms)
  GET /api/deportes
    √ Devuelve al menos las 4 disciplinas del evento (6 ms)
  POST /api/equipos — validación de entrada
    √ Sin deporte_id devuelve 400 (14 ms)
  POST /api/equipos/:id/habilitar — regla de plantilla mínima
    √ Un equipo de fútbol sin participantes devuelve 422 con habilitado:false (31 ms)
    √ Un equipo inexistente devuelve 404 (4 ms)
  Incidencias
    √ POST /api/incidencias con tipo "Otro" devuelve 400 (3 ms)
    √ GET /api/incidencias/sla/tabla devuelve Tecnica con SLA de 2 horas (5 ms)
  calcularPosiciones — tabla a partir de resultados publicados
    √ Devuelve la tabla ordenada por puntos de mayor a menor (26 ms)
    √ Devuelve un arreglo vacío para un deporte inexistente (2 ms)
  ejecutarSorteo — reproducibilidad y auditabilidad
    √ Con menos de 2 equipos habilitados lanza un error (8 ms)
    √ Dos ejecuciones con la misma semilla producen el mismo resultado y la semilla queda persistida (29 ms)

PASS tests/reglas.test.js
  validarPlantilla — mínimo y máximo de participantes por deporte
    √ Fútbol con 11 participantes es una plantilla válida (1 ms)
    √ Fútbol con 10 participantes falla e indica el mínimo 11
    √ Fútbol con 17 participantes falla e indica el máximo 16 (1 ms)
    √ Básquet con 5 participantes es una plantilla válida
    √ Vóley con 6 participantes es válido y con 5 falla
    √ Ping Pong con 2 participantes es válido y con 3 falla (1 ms)
    √ Un deporte inexistente ("tenis") se rechaza como desconocido
  calcularVencimientoSLA — tiempo límite de atención por tipo
    √ Una incidencia Tecnica vence a las 2 horas
    √ Una incidencia Disciplinaria vence a las 72 horas
    √ Un tipo no registrado usa 48 horas por defecto
    √ SLA_INCIDENCIA define exactamente los 4 tipos previstos (1 ms)
  REGLAS_DEPORTE — sistema de puntuación
    √ Fútbol otorga 3 puntos por victoria, 1 por empate y 0 por derrota
  PAIS_POR_GRADO — país representado según el grado
    √ El 1.er año representa a Brasil (1 ms)
    √ El 5.to año representa a Francia

------------------------|---------|----------|---------|---------|-------------------------
File                    | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
------------------------|---------|----------|---------|---------|-------------------------
All files               |    65.6 |     87.5 |    87.5 |    65.6 |
 config                 |     100 |      100 |     100 |     100 |
  reglas.js             |     100 |      100 |     100 |     100 |
 routes                 |   47.04 |    77.77 |     100 |   47.04 |
  deportes.js           |   77.77 |      100 |     100 |   77.77 | 13-16
  equipos.js            |   57.81 |       80 |     100 |   57.81 | 9-22,36-42,45-47,60-62
  eventos.js            |   47.05 |      100 |     100 |   47.05 | 8-10,13-19,23-30
  incidencias.js        |   41.17 |    66.66 |     100 |   41.17 | 8-15,23-32,36-47
  instituciones.js      |   59.25 |      100 |     100 |   59.25 | 9-11,15-22
  notificaciones.js     |      50 |      100 |     100 |      50 | 8-11,14-18,21-24
  partidos.js           |   36.53 |      100 |     100 |   36.53 | 9-23,27-31,35-43,47-50
  resultados.js         |   34.84 |      100 |     100 |   34.84 | 13-44,48-54,58-59,63-64
 services               |   90.58 |    86.48 |   83.33 |   90.58 |
  posiciones.service.js |    74.6 |       75 |      50 |    74.6 | 48-63
  sorteo.service.js     |     100 |       92 |     100 |     100 | 47,68
------------------------|---------|----------|---------|---------|-------------------------
Test Suites: 2 passed, 2 total
Tests:       25 passed, 25 total
Snapshots:   0 total
Time:        2.213 s
Ran all test suites.
```

**Resultado: 25 pruebas ejecutadas, 25 exitosas, 0 fallidas. Código de salida 0.**

### 2.1 Tabla de cobertura (Jest, `coverageProvider: v8`)

| File | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s |
|---|---|---|---|---|---|
| All files | 65.6 | 87.5 | 87.5 | 65.6 | |
| config | 100 | 100 | 100 | 100 | |
| &nbsp;&nbsp;reglas.js | 100 | 100 | 100 | 100 | |
| routes | 47.04 | 77.77 | 100 | 47.04 | |
| &nbsp;&nbsp;deportes.js | 77.77 | 100 | 100 | 77.77 | 13-16 |
| &nbsp;&nbsp;equipos.js | 57.81 | 80 | 100 | 57.81 | 9-22,36-42,45-47,60-62 |
| &nbsp;&nbsp;eventos.js | 47.05 | 100 | 100 | 47.05 | 8-10,13-19,23-30 |
| &nbsp;&nbsp;incidencias.js | 41.17 | 66.66 | 100 | 41.17 | 8-15,23-32,36-47 |
| &nbsp;&nbsp;instituciones.js | 59.25 | 100 | 100 | 59.25 | 9-11,15-22 |
| &nbsp;&nbsp;notificaciones.js | 50 | 100 | 100 | 50 | 8-11,14-18,21-24 |
| &nbsp;&nbsp;partidos.js | 36.53 | 100 | 100 | 36.53 | 9-23,27-31,35-43,47-50 |
| &nbsp;&nbsp;resultados.js | 34.84 | 100 | 100 | 34.84 | 13-44,48-54,58-59,63-64 |
| services | 90.58 | 86.48 | 83.33 | 90.58 | |
| &nbsp;&nbsp;posiciones.service.js | 74.6 | 75 | 50 | 74.6 | 48-63 |
| &nbsp;&nbsp;sorteo.service.js | 100 | 92 | 100 | 100 | 47,68 |

Lectura de los resultados: el módulo de reglas de negocio (`reglas.js`) alcanza **100 %
en las cuatro métricas**, y el servicio de sorteo —donde reside la regla de
reproducibilidad— alcanza **100 % de sentencias y líneas**. La cobertura menor en
`routes` se explica porque las pruebas ejercitan los caminos de validación y error de
`equipos` e `incidencias`, pero no los endpoints de listado de `partidos`, `resultados`,
`eventos` y `notificaciones`, que quedan fuera del alcance definido para esta entrega.

---

## 3. Análisis de seguridad de dependencias (`npm audit`)

### 3.1 sistema-web-completo

```
found 0 vulnerabilities
```

Código de salida: 0.

### 3.2 servicio-login

```
found 0 vulnerabilities
```

Código de salida: 0.

### 3.3 servicio-registro

```
found 0 vulnerabilities
```

Código de salida: 0.

### 3.4 frontend

```
# npm audit report

esbuild  <=0.24.2
Severity: moderate
esbuild enables any website to send any requests to the development server and read the response - https://github.com/advisories/GHSA-67mh-4wv8-2f99
fix available via `npm audit fix --force`
Will install vite@8.1.4, which is a breaking change
node_modules/esbuild
  vite  <=6.4.2
  Depends on vulnerable versions of esbuild
  node_modules/vite

react-router  6.7.0 - 6.30.3
Severity: moderate
React Router's same-origin redirect with path starting // causes open redirect via protocol-relative URL reinterpretation - https://github.com/advisories/GHSA-2j2x-hqr9-3h42
fix available via `npm audit fix`
node_modules/react-router
  react-router-dom  6.6.3-pre.0 - 6.30.3
  Depends on vulnerable versions of react-router
  node_modules/react-router-dom


4 vulnerabilities (3 moderate, 1 high)

To address issues that do not require attention, run:
  npm audit fix

To address all issues (including breaking changes), run:
  npm audit fix --force
```

Código de salida: 1.

**Detalle ampliado.** La salida de texto anterior informa "1 high" en el resumen pero no
identifica cuál es, porque agrupa el paquete bajo `esbuild`. Se consultó la salida
`npm audit --json` para determinarlo:

```
METADATA vulnerabilities: {"info":0,"low":0,"moderate":3,"high":1,"critical":0,"total":4}
esbuild | severity: moderate | via: esbuild enables any website to send any requests to the development server and read the response
react-router | severity: moderate | via: React Router's same-origin redirect with path starting // causes open redirect via protocol-relative URL reinterpretation
react-router-dom | severity: moderate | via: react-router
vite | severity: high | via: Vite Vulnerable to Path Traversal in Optimized Deps `.map` Handling ; launch-editor: NTLMv2 hash disclosure via UNC path handling on Windows ; vite: `server.fs.deny` bypass on Windows alternate paths ; esbuild
```

La vulnerabilidad de severidad **alta** corresponde a **`vite`** (Path Traversal en el
manejo de `.map` de dependencias optimizadas).

**Valoración.** Las cuatro vulnerabilidades del frontend residen en dependencias de
**desarrollo** (`vite` y `esbuild` solo intervienen en el servidor de desarrollo y en la
compilación; no forman parte del sitio publicado). La de `react-router` sí afecta al
código distribuido y se corrige con `npm audit fix` sin cambios incompatibles. Los tres
servicios de backend, que son los componentes expuestos en red, no presentan
vulnerabilidades.

---

## 4. Pruebas de seguridad de la API

Ejecutadas con PostgreSQL, la API (4000), el servicio-login (4001) y el
servicio-registro (4002) en ejecución.

### 4.1 POST /verificar con cuerpo vacío

```
PETICION: POST http://localhost:4001/verificar  body: {}
HTTP: 401
RESPUESTA: {"valido":false,"error":"Token inválido o expirado"}
```

Resultado: **esperado (401)**. El servicio no acepta una petición sin token.

### 4.2 POST /verificar con token de firma alterada

Se obtuvo un token legítimo mediante login y se modificó el último carácter de su firma.

```
PETICION: POST http://localhost:4001/verificar  body: {token: <JWT con último carácter de la firma cambiado>}
HTTP: 401
RESPUESTA: {"valido":false,"error":"Token inválido o expirado"}
```

Resultado: **esperado (401)**. La verificación de firma HMAC rechaza el token manipulado.

### 4.3 POST /login con inyección SQL en el campo email

```
PETICION: POST http://localhost:4001/login  body: {email: "admin@demo.com' OR 1=1 --", password: "loquesea"}
HTTP: 401
RESPUESTA: {"error":"Correo o contraseña incorrectos."}
```

Resultado: **esperado (401)**. La consulta del servicio de login está parametrizada:

```js
const { rows } = await pool.query(
  'SELECT id, nombre, email, password_hash, rol FROM usuario WHERE LOWER(email) = LOWER($1)',
  [email.trim()]
)
```

El uso del marcador `$1` hace que la cadena maliciosa se trate como un valor literal a
comparar y no como sintaxis SQL ejecutable, por lo que la inyección no prospera.

### 4.4 POST /login correcto — comprobación de no exposición de `password_hash`

```
PETICION: POST http://localhost:4001/login  body: {email: "admin@demo.com", password: "123456"}
HTTP: 200
RESPUESTA: {"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZGVtby5jb20iLCJyb2wiOiJhZG1pbiIsImlhdCI6MTc4NDE4MTc1OCwiZXhwIjoxNzg0MjEwNTU4fQ.yZ_VSAhasO7n_MBfvlk6dSlFzRiq8UNJ4f73j_k2zt8","usuario":{"id":1,"nombre":"Ana Admin","email":"admin@demo.com","rol":"admin"}}
```

Resultado: **esperado**. El objeto `usuario` de la respuesta contiene únicamente `id`,
`nombre`, `email` y `rol`. **El campo `password_hash` no está presente**, pese a que sí
se recupera de la base de datos para la comparación con bcrypt; el servicio construye
explícitamente el objeto de salida sin él.

### 4.5 Verificación del almacenamiento de contraseñas en la base de datos

```
SELECT email, rol, password_hash FROM usuario ORDER BY id

admin@demo.com | admin | $2a$10$Bjy439T6CjcmN7MNGeEq.OHu5IkWQzS4JRYPZmMzmUweSQeNH.xlm
coordinador@demo.com | coordinador | $2a$10$Bjy439T6CjcmN7MNGeEq.OHu5IkWQzS4JRYPZmMzmUweSQeNH.xlm
arbitro@demo.com | arbitro | $2a$10$Bjy439T6CjcmN7MNGeEq.OHu5IkWQzS4JRYPZmMzmUweSQeNH.xlm
institucion@demo.com | institucion | $2a$10$Bjy439T6CjcmN7MNGeEq.OHu5IkWQzS4JRYPZmMzmUweSQeNH.xlm
```

Resultado: **esperado**. Ninguna contraseña se almacena en texto plano. Todas presentan
el formato bcrypt `$2a$10$...`, donde `2a` identifica el algoritmo y `10` el factor de
coste (2¹⁰ = 1024 iteraciones de derivación).

**Observación adicional no solicitada.** Los cuatro usuarios presentan un hash
**idéntico**. Esto ocurre porque el archivo de semilla invoca `bcrypt.hashSync('123456', 10)`
una sola vez y reutiliza el resultado para los cuatro registros, en lugar de generar un
hash por usuario. El efecto es que la sal se comparte y, en consecuencia, la igualdad de
los hashes revela que las cuatro cuentas usan la misma contraseña. En datos de
demostración el impacto es nulo, pero en un entorno real se debería invocar el hash una
vez por usuario para que cada uno reciba una sal distinta.

### 4.6 POST /usuarios con rol "superadmin" (intento de escalada de privilegios)

```
PETICION: POST http://localhost:4002/usuarios  body: {nombre, email, password, rol: "superadmin"}
HTTP: 400
RESPUESTA: {"error":"rol inválido. Permitidos: admin, coordinador, arbitro, institucion"}
```

Resultado: **esperado (400)**. El servicio de registro valida el rol contra una lista
blanca y rechaza cualquier valor no contemplado.

### 4.7 Revisión de archivos `.env` versionados

```
--- Comando: git ls-files | grep -i env ---
servicio-login/.env.example
servicio-registro/.env.example
sistema-web-completo/.env.example

--- .env presentes en disco ---
./servicio-login/.env
./servicio-registro/.env
./sistema-web-completo/.env

--- contenido de .gitignore ---
node_modules/
dist/
.env
*.log
.DS_Store
.claude/
```

Resultado: **esperado**. Los tres archivos `.env` reales existen en el disco pero **no
están versionados**; el control de versiones solo contiene los `.env.example`. La regla
`.env` de `.gitignore` los excluye correctamente.

### 4.8 Resumen de las comprobaciones de seguridad

| # | Comprobación | Esperado | Obtenido | Estado |
|---|---|---|---|---|
| 1 | `/verificar` sin token | 401 | 401 | Correcto |
| 2 | `/verificar` con firma alterada | 401 | 401 | Correcto |
| 3 | `/login` con inyección SQL | 401 | 401 | Correcto |
| 4 | `/login` no expone `password_hash` | ausente | ausente | Correcto |
| 5 | Contraseñas con hash bcrypt | `$2a$10$` | `$2a$10$` | Correcto |
| 6 | `/usuarios` con rol inválido | 400 | 400 | Correcto |
| 7 | `.env` real sin versionar | no versionado | no versionado | Correcto |

---

## 5. Revisión de autorización de la API (diagnóstico)

### 5.1 Revisión del código

Se buscó cualquier middleware de autenticación o autorización en el código fuente de
`sistema-web-completo`:

```
--- jsonwebtoken / jwt / verify / Authorization / Bearer / rol en src/ ---
(SIN COINCIDENCIAS)

--- jsonwebtoken en dependencias? ---
deps: bcryptjs, cors, dotenv, express, knex, pg
```

El archivo `src/app.js` registra únicamente `cors()` y `express.json()` antes de montar
las rutas; no existe ningún middleware de verificación de token ni de rol. El paquete
`jsonwebtoken` **no figura siquiera entre las dependencias** de la API, por lo que esta
no tiene forma de validar los tokens que emite el `servicio-login`.

### 5.2 Comprobación empírica

**Caso 1 — Creación de un equipo sin ninguna cabecera de autorización:**

```
POST http://localhost:4000/api/equipos
body: {"nombre":"Equipo creado SIN token","institucion_id":1,"deporte_id":1}

HTTP: 201
RESPUESTA: {"id":6,"nombre":"Equipo creado SIN token","institucion_id":1,"deporte_id":1,"estado":"borrador"}
```

**Caso 2 — Creación de un equipo con un token deliberadamente inválido:**

```
POST http://localhost:4000/api/equipos
Authorization: Bearer token-completamente-invalido-12345
body: {"nombre":"Equipo creado con token basura","institucion_id":1,"deporte_id":1}

HTTP: 201
RESPUESTA: {"id":7,"nombre":"Equipo creado con token basura","institucion_id":1,"deporte_id":1,"estado":"borrador"}
```

**Caso 3 — Cambio de estado de un evento sin token (operación reservada al administrador):**

```
PATCH http://localhost:4000/api/eventos/1/estado
body: {"estado":"cancelado"}

HTTP: 200
RESPUESTA: {"id":1,"codigo_unico":"OLP-2026-001","nombre":"Olimpiadas Escolares PERÚ 2026","fecha_inicio":"2026-06-01T05:00:00.000Z","fecha_fin":"2026-06-30T05:00:00.000Z","estado":"cancelado","institucion_id":1}
```

**Verificación de que la escritura se materializó en la base de datos:**

```
[
 {
  "id": 6,
  "nombre": "Equipo creado SIN token",
  "estado": "borrador"
 },
 {
  "id": 7,
  "nombre": "Equipo creado con token basura",
  "estado": "borrador"
 }
]
```

### 5.3 Diagnóstico

**La API no valida el token JWT ni el rol en ninguna de sus rutas.** Las operaciones de
escritura se ejecutan íntegramente sin autenticación:

1. Una petición **sin cabecera `Authorization`** creó un equipo y devolvió 201. El
   registro quedó efectivamente persistido en la base de datos.
2. Una petición con un **token manifiestamente inválido** obtuvo idéntico resultado, lo
   que demuestra que la cabecera **ni siquiera se lee**: no hay diferencia de
   comportamiento entre no enviar token y enviar uno falso.
3. El caso más severo: `PATCH /api/eventos/1/estado` **canceló el evento completo** de
   forma anónima y devolvió 200. Se trata de una operación destructiva reservada al rol
   de administrador, ejecutada sin credencial alguna.

**Conclusión.** El control de acceso por rol de la plataforma es **exclusivamente de
interfaz**: reside en el mapa `PERMISOS` del archivo `frontend/src/App.jsx`, que
determina qué opciones ve cada usuario en el menú y a qué vistas puede navegar. Esa
protección es cosmética desde el punto de vista de la seguridad, ya que cualquier
cliente HTTP —`curl`, Postman o el propio navegador— puede omitir el frontend y llamar
a la API directamente, con lo que la restricción desaparece por completo. El
`servicio-login` emite tokens JWT correctamente firmados y los valida en `/verificar`,
pero **ningún componente consume esa validación** para autorizar operaciones.

**Corrección recomendada (no implementada, según lo indicado).** Incorporar a
`sistema-web-completo` un middleware que: (a) lea la cabecera `Authorization: Bearer`,
(b) verifique la firma del token con el mismo `JWT_SECRET` que usa el `servicio-login`,
(c) rechace con 401 las peticiones sin token válido, y (d) compare el `rol` contenido en
el token con los roles autorizados para cada ruta, devolviendo 403 cuando no coincida.
El mapa de permisos del frontend debe replicarse en el servidor, ya que el cliente nunca
puede considerarse una fuente confiable de autorización.

**Riesgo asociado adicional.** El `JWT_SECRET` tiene un valor por defecto embebido en el
código (`'olimpiadas_super_secreto_demo'` en `servicio-login/src/index.js`, línea 12).
Si el servicio se desplegara sin definir la variable de entorno, cualquiera que conozca
el repositorio podría firmar tokens válidos con el rol que quisiera.

---

## 6. Pruebas de rendimiento (Apache JMeter)

> El análisis detallado de esta campaña —diseño experimental, punto de saturación,
> identificación del cuello de botella y conclusiones— se desarrolla en el documento
> complementario **`INFORME-JMETER.md`**. Esta sección resume el plan y los resultados.

Se generó el archivo `olimpiadas-carga.jmx` en la raíz del proyecto. Su estructura fue
validada mediante análisis del XML:

```
XML valido: SI
Version del plan : 1.2
Hilos            : 100
Ramp-up (s)      : 1
Loop count       : 1
Host destino     : localhost:4000
Peticiones HTTP  :
   - GET /api/deportes
   - GET /api/instituciones
   - GET /api/equipos
   - GET /api/partidos
   - GET /api/resultados/posiciones/1
Listener         : Aggregate Report
```

Contenido del plan:

| Elemento | Configuración |
|---|---|
| Thread Group | 100 hilos, ramp-up 1 s, loop count 1 |
| HTTP Request Defaults | `http://localhost:4000` |
| HTTP Request 1 | GET `/api/deportes` |
| HTTP Request 2 | GET `/api/instituciones` |
| HTTP Request 3 | GET `/api/equipos` |
| HTTP Request 4 | GET `/api/partidos` |
| HTTP Request 5 | GET `/api/resultados/posiciones/1` |
| Listener | Aggregate Report |

Con 100 hilos, ramp-up de 1 segundo y 5 peticiones por hilo, el plan genera **500
peticiones** concentradas en aproximadamente un segundo.

### Instrucciones de uso

**Cómo abrirlo:** iniciar Apache JMeter y abrir el plan en un solo paso con
`java -jar bin/ApacheJMeter.jar -t olimpiadas-carga.jmx`; con la API corriendo en el
puerto 4000, pulsar el botón verde de inicio y consultar los resultados en el elemento
`Aggregate Report`.

> **Nota de ejecución.** El lanzador habitual `bin/jmeter.bat` no llegó a arrancar en el
> equipo de pruebas: terminaba de inmediato sin abrir la interfaz y sin escribir siquiera
> su archivo `jmeter.log`, pese a que `bin/jmeter.bat --version` sí respondía y Java 22
> estaba correctamente instalado. Invocando el JAR directamente
> (`java -jar bin/ApacheJMeter.jar`) la interfaz abre con normalidad. Se documenta por si
> el mismo síntoma se reproduce en otro equipo.

**Cómo cambiar el número de hilos:** hacer clic en el elemento `Usuarios concurrentes`
del árbol izquierdo y sustituir el valor del campo `Number of Threads (users)` por `300`
o por `500`, guardando con `Ctrl+S` antes de volver a ejecutar; entre una corrida y la
siguiente debe pulsarse el botón de limpiar (escoba) para que el `Aggregate Report` no
acumule las muestras de la ejecución anterior.

### 6.1 Resultados medidos

Se ejecutaron tres corridas con 100, 300 y 500 hilos, manteniendo en todas ellas el
ramp-up de 1 segundo y el loop count de 1 definidos en la especificación, de modo que la
única variable modificada entre corridas fuese el número de hilos. Los datos siguientes
se transcriben literalmente del `Aggregate Report` de JMeter. Los tiempos están en
milisegundos.

**Corrida 1 — 100 hilos (500 muestras)**

| Etiqueta | # Muestras | Media | Mediana | 90% Line | 95% Line | 99% Line | Mín | Máx | % Error | Rendimiento | Kb/sec | Sent KB/sec |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| GET /api/deportes | 100 | 3 | 2 | 12 | 13 | 16 | 1 | 17 | 0.00% | 100.4/sec | 96.58 | 12.55 |
| GET /api/instituciones | 100 | 2 | 1 | 8 | 9 | 12 | 0 | 12 | 0.00% | 102.1/sec | 93.27 | 13.27 |
| GET /api/equipos | 100 | 6 | 2 | 24 | 34 | 46 | 1 | 48 | 0.00% | 102.0/sec | 106.62 | 12.66 |
| GET /api/partidos | 100 | 2 | 1 | 7 | 9 | 11 | 0 | 13 | 0.00% | 102.6/sec | 89.24 | 12.82 |
| GET /api/resultados/posiciones/1 | 100 | 4 | 2 | 13 | 22 | 24 | 1 | 27 | 0.00% | 103.0/sec | 61.35 | 14.38 |
| **Total** | **500** | **3** | **2** | **11** | **15** | **34** | **0** | **48** | **0.00%** | **498.0/sec** | **436.83** | **64.10** |

**Corrida 2 — 300 hilos (1500 muestras)**

| Etiqueta | # Muestras | Media | Mediana | 90% Line | 95% Line | 99% Line | Mín | Máx | % Error | Rendimiento | Kb/sec | Sent KB/sec |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| GET /api/deportes | 300 | 82 | 90 | 124 | 129 | 135 | 3 | 139 | 0.00% | 287.1/sec | 276.15 | 35.89 |
| GET /api/instituciones | 300 | 82 | 99 | 119 | 124 | 130 | 2 | 132 | 0.00% | 263.6/sec | 240.71 | 34.24 |
| GET /api/equipos | 300 | 373 | 378 | 529 | 532 | 535 | 26 | 537 | 0.00% | 207.8/sec | 217.09 | 25.77 |
| GET /api/partidos | 300 | 72 | 66 | 114 | 118 | 130 | 16 | 133 | 0.00% | 205.3/sec | 178.67 | 25.67 |
| GET /api/resultados/posiciones/1 | 300 | 181 | 178 | 301 | 325 | 346 | 63 | 352 | 0.00% | 197.6/sec | 117.73 | 27.60 |
| **Total** | **1500** | **158** | **112** | **378** | **468** | **532** | **2** | **537** | **0.00%** | **956.6/sec** | **839.11** | **123.13** |

**Corrida 3 — 500 hilos (2500 muestras)**

| Etiqueta | # Muestras | Media | Mediana | 90% Line | 95% Line | 99% Line | Mín | Máx | % Error | Rendimiento | Kb/sec | Sent KB/sec |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| GET /api/deportes | 500 | 119 | 126 | 181 | 184 | 186 | 2 | 187 | 0.00% | 395.9/sec | 380.81 | 49.49 |
| GET /api/instituciones | 500 | 124 | 133 | 178 | 181 | 182 | 2 | 184 | 0.00% | 358.9/sec | 327.74 | 46.62 |
| GET /api/equipos | 500 | 596 | 635 | 753 | 759 | 763 | 51 | 766 | 0.00% | 256.8/sec | 268.34 | 31.85 |
| GET /api/partidos | 500 | 117 | 116 | 154 | 176 | 181 | 26 | 184 | 0.00% | 250.3/sec | 217.75 | 31.28 |
| GET /api/resultados/posiciones/1 | 500 | 300 | 310 | 395 | 457 | 503 | 92 | 519 | 0.00% | 237.8/sec | 141.63 | 33.20 |
| **Total** | **2500** | **251** | **173** | **635** | **726** | **759** | **2** | **766** | **0.00%** | **1136.9/sec** | **997.21** | **146.33** |

### 6.2 Análisis de los resultados

**Fiabilidad.** El porcentaje de error fue de **0.00 % en las tres corridas**. La API
atendió las 4 500 peticiones de la campaña completa sin rechazar ninguna, sin agotar el
pool de conexiones de Knex (configurado en `max: 10`) y sin devolver un solo error 5xx.
Desde el punto de vista de la disponibilidad bajo carga, el comportamiento es correcto.

**Evolución del tiempo de respuesta.** El tiempo medio total crece de forma marcada al
aumentar la concurrencia:

| Hilos | Media total | Mediana total | 90% Line | 99% Line | Máx | Rendimiento total |
|---|---|---|---|---|---|---|
| 100 | 3 ms | 2 ms | 11 ms | 34 ms | 48 ms | 498.0/sec |
| 300 | 158 ms | 112 ms | 378 ms | 532 ms | 537 ms | 956.6/sec |
| 500 | 251 ms | 173 ms | 635 ms | 759 ms | 766 ms | 1136.9/sec |

**Saturación.** El dato más relevante no es el aumento de latencia sino que el
rendimiento **crece de forma sublineal**: triplicar los hilos de 100 a 300 solo multiplica
el rendimiento por 1.92 (498 → 956.6 pet./s), y pasar de 300 a 500 hilos (1.67 veces más
carga) apenas lo multiplica por 1.19 (956.6 → 1136.9 pet./s). Esto indica que el sistema
alcanza su punto de saturación entre las corridas de 300 y 500 hilos: a partir de ahí, la
carga adicional no se traduce en más trabajo útil, sino únicamente en mayor tiempo de
espera para cada usuario.

**Identificación del cuello de botella.** El endpoint `GET /api/equipos` es
sistemáticamente el más lento en los tres escenarios, y el que peor se degrada:

| Endpoint | Media 100 | Media 300 | Media 500 | Degradación 100→500 |
|---|---|---|---|---|
| GET /api/partidos | 2 ms | 72 ms | 117 ms | ×59 |
| GET /api/instituciones | 2 ms | 82 ms | 124 ms | ×62 |
| GET /api/deportes | 3 ms | 82 ms | 119 ms | ×40 |
| GET /api/resultados/posiciones/1 | 4 ms | 181 ms | 300 ms | ×75 |
| **GET /api/equipos** | **6 ms** | **373 ms** | **596 ms** | **×99** |

Con 500 hilos, `/api/equipos` responde en promedio **5 veces más lento** que
`/api/partidos` (596 ms frente a 117 ms) y es el único endpoint cuyo percentil 99 supera
los 750 ms.

**Causa del cuello de botella.** La revisión del código explica el resultado. El endpoint
`GET /api/equipos` (`src/routes/equipos.js`, líneas 17-20) incurre en un patrón de
consulta **N+1**:

```js
const equipos = await q
// adjunta conteo de participantes
for (const e of equipos) {
  const [{ count }] = await db('participante').where({ equipo_id: e.id }).count()
  e.participantes = Number(count)
}
```

Tras recuperar la lista de equipos con una consulta, el bucle lanza **una consulta
adicional por cada equipo** para contar sus participantes, de forma secuencial. Con los 4
equipos de la semilla, cada petición ejecuta 5 consultas en lugar de 1; bajo 500 hilos
concurrentes eso supone unas 2 500 consultas solo para este endpoint, todas compitiendo
por las 10 conexiones del pool. El resto de endpoints resuelven con una única consulta y,
en consecuencia, se degradan mucho menos.

La corrección consistiría en sustituir el bucle por un único `LEFT JOIN` con `GROUP BY`
que devuelva el conteo agregado en la misma consulta. No se implementó, en coherencia con
el criterio aplicado en el resto de este informe de diagnosticar sin modificar el código
de producción.

### 6.3 Limitaciones de la medición

Estos resultados deben interpretarse con tres reservas:

1. **El generador de carga comparte máquina con el sistema bajo prueba.** JMeter, la API
   Node.js y PostgreSQL se ejecutaron en el mismo equipo, compitiendo por los mismos
   núcleos. Parte de la latencia observada en las corridas de 300 y 500 hilos es
   atribuible al entorno de medición y no exclusivamente al servidor.
2. **El ramp-up de 1 segundo concentra el arranque.** Con 500 hilos creándose en un
   segundo, el arranque es deliberadamente abrupto. Se mantuvo así por indicación de la
   especificación y para que las tres corridas fuesen comparables entre sí variando un
   único parámetro.
3. **Los volúmenes de datos son los de la semilla** (5 instituciones, 4 equipos, 4
   partidos). Con un volumen realista de datos, el efecto del patrón N+1 en
   `/api/equipos` sería considerablemente mayor, ya que el número de consultas crece de
   forma proporcional al número de equipos registrados.

Por todo ello, los valores deben leerse como una **comparación relativa entre escenarios
de concurrencia**, no como una medición absoluta de la capacidad de la API en producción.

---

## 7. Incidencias encontradas durante la ejecución de las pruebas

### 7.1 Pruebas que fallaron

**Ninguna prueba llegó a fallar.** Las 25 pruebas pasaron en su primera ejecución
efectiva. **No se modificó ningún archivo de código de producción** para lograrlo: los
únicos archivos creados o alterados fueron los de configuración de pruebas
(`jest.config.js`, `package.json`) y los propios archivos de prueba.

No obstante, sí se presentaron tres problemas de herramienta y de diseño de pruebas que
se documentan a continuación por su relevancia metodológica.

### 7.2 Problema 1 — Jest no detectaba `tests/reglas.test.js`

**Síntoma.** La primera ejecución de `npm test` informó `Test Suites: 1 passed, 1 total`
y `Tests: 11 passed, 11 total`, cuando debían ser 2 suites y 25 pruebas. El archivo
`tests/reglas.test.js` existía en disco y `jest --listTests` no lo incluía:

```
=== listTests ===
C:\Users\...\sistema-web-completo\tests\api.test.js
=== archivos en tests/ ===
-rw-r--r-- 1 Usuario 197121 5300 Jul 16 00:58 api.test.js
-rw-r--r-- 1 Usuario 197121 3600 Jul 16 00:57 reglas.test.js
```

**Diagnóstico.** Ejecutado de forma directa, el archivo funcionaba sin problema
(`npx jest tests/reglas.test.js` → 14 pruebas superadas), lo que descartaba un error de
sintaxis o de importación. La causa era la **caché del mapa de archivos de Jest**, que se
había construido en el instante entre la creación de ambos archivos y no registró el
segundo.

**Corrección.** `npx jest --clearCache`. Tras ello `--listTests` devolvió los dos
archivos y `npm test` pasó a informar `Test Suites: 2 passed, 2 total`.

### 7.3 Problema 2 — La salida no mostraba el detalle por prueba

**Síntoma.** Pese a declarar `verbose: true` en `jest.config.js`, la salida de `npm test`
no imprimía las líneas `PASS` ni los ✓ de cada prueba: solo el resumen final. Se verificó
que no era un problema de captura de flujos, separando stdout y stderr:

```
=== SOLO STDOUT (stderr descartado) ===
=== SOLO STDERR (stdout descartado) ===
Test Suites: 2 passed, 2 total
Tests:       25 passed, 25 total
```

**Diagnóstico.** Jest 30.4 omite el detalle por prueba cuando la propiedad `reporters` se
deja implícita. Al invocarlo con `--reporters=default` de forma explícita, el detalle
aparecía correctamente.

**Corrección.** Se declaró `reporters: ['default']` en `jest.config.js`.

### 7.4 Problema 3 — Dependencia de orden entre las pruebas de integración

**Síntoma.** La cobertura de `posiciones.service.js` oscilaba entre ejecuciones sin que
el código cambiase: 74.6 % en una corrida y 60.31 % en la siguiente.

**Diagnóstico.** La causa no era aleatoria sino un **efecto de estado entre pruebas**. El
servicio de sorteo elimina y regenera las series y los partidos del deporte sorteado, y
las claves foráneas `resultado.partido_id` y `estadistica.partido_id` están definidas con
`ON DELETE CASCADE`. En consecuencia, ejecutar el sorteo **destruye los resultados
publicados** que cargó la semilla. Si `calcularPosiciones` se evaluaba después del
sorteo, operaba sobre una base sin resultados y no recorría el bucle de acumulación de
puntos (líneas 33-41), reduciendo la cobertura y debilitando la prueba hasta volverla
vacua.

**Corrección.** Las pruebas de `calcularPosiciones` se declararon **antes** que las de
`ejecutarSorteo` dentro de `tests/api.test.js`, dado que Jest ejecuta las pruebas de un
mismo archivo en orden de declaración. La razón queda documentada en el encabezado del
archivo de prueba. Adicionalmente se ejecuta `npm run db:reset` antes de cada corrida
oficial.

**Nota metodológica.** Esta dependencia de orden es una fragilidad conocida del conjunto
de pruebas de integración. La solución robusta sería que cada prueba preparase y
limpiase sus propios datos, o ejecutar las suites en serie con `--runInBand` sobre una
base recreada. Se documenta explícitamente para no presentar como sólido algo que
depende del orden de declaración.

### 7.5 Defectos reales encontrados en el código

No se detectaron defectos funcionales: el código de producción se comportó conforme a lo
esperado en las 25 pruebas. Sí se identificaron **tres debilidades de seguridad y un
defecto de rendimiento**, que se reportan sin corregir según lo indicado:

| # | Hallazgo | Tipo | Severidad | Ubicación |
|---|---|---|---|---|
| 1 | La API no valida token ni rol en ninguna ruta; las escrituras se ejecutan sin autenticación | Seguridad | Alta | `sistema-web-completo/src/app.js` y todas las rutas |
| 2 | Patrón de consulta N+1: una consulta por equipo para contar participantes | Rendimiento | Media | `sistema-web-completo/src/routes/equipos.js`, líneas 17-20 |
| 3 | `JWT_SECRET` con valor por defecto embebido en el código | Seguridad | Media | `servicio-login/src/index.js`, línea 12 |
| 4 | El archivo de semilla reutiliza un único hash bcrypt para los cuatro usuarios | Seguridad | Baja | `sistema-web-completo/seeds/01_inicial.js`, línea 34 |

El hallazgo 2 se detectó a raíz de las pruebas de carga y está desarrollado en la
sección 6.2: `GET /api/equipos` resultó ser el endpoint más lento en las tres corridas y
el que peor se degradó (de 6 ms con 100 hilos a 596 ms con 500).

---

## 8. Estado final del entorno

Tras completar las pruebas se ejecutó `npm run db:reset` para revertir las
modificaciones introducidas (el sorteo altera los partidos; la prueba de autorización
dejó dos equipos creados y el evento en estado "cancelado"):

```
Batch 1 rolled back: 1 migrations
Batch 1 run: 1 migrations
Ran 1 seed files

=== VERIFICACION post-limpieza ===
Estado del evento      : en proceso (debe ser "en proceso")
Equipos en la base     : 4 (debe ser 4)
Equipos de prueba 4.x  : 0 (debe ser 0)
Semillas en sorteo     : demo-seed-0001 (debe ser solo demo-seed-0001)
```

La base de datos quedó en su estado inicial.

---

## 9. Archivos creados o modificados en esta etapa

| Archivo | Intervención |
|---|---|
| `sistema-web-completo/jest.config.js` | Creado — configuración de Jest para módulos ES |
| `sistema-web-completo/tests/reglas.test.js` | Creado — 14 pruebas unitarias sin base de datos |
| `sistema-web-completo/tests/api.test.js` | Creado — 11 pruebas de integración con Supertest |
| `sistema-web-completo/package.json` | Modificado — script `test` y dependencias de desarrollo |
| `olimpiadas-carga.jmx` | Creado — plan de carga para Apache JMeter |
| `INFORME-PRUEBAS.md` | Creado — este documento |
| `INFORME-JMETER.md` | Creado — informe detallado de las pruebas de rendimiento |

No se modificó ningún archivo de código de producción.

---

## 10. Evidencias gráficas

Las siguientes capturas de pantalla acompañan a este informe como evidencia de la
ejecución real de las pruebas:

| Archivo | Contenido |
|---|---|
| `consola-checks.png` | Salida de `npm test`: suites `reglas.test.js` y `api.test.js` con el detalle de cada prueba superada |
| `consola-tabla de cobertura.png` | Cierre de `npm test`: tabla de cobertura y resumen (25 pruebas, 2 suites, 0 fallos) |
| `cobertura-general.png` | Reporte HTML de cobertura: vista general (65.6 % Stmts, 87.5 % Branch, 87.5 % Funcs, 65.6 % Lines) |
| `cobertura-reglas1.png` / `cobertura-reglas2.png` | Reporte HTML de `config/reglas.js` al 100 % en las cuatro métricas, con el código cubierto marcado en verde |
| `test-consola1…3.png` | Ventanas de los tres servicios en ejecución (puertos 4000, 4001 y 4002) |
| `jmeter-100-consulta.png` / `jmeter-300-consulta.png` / `jmeter-500-consulta.png` | Configuración del Grupo de Hilos en cada corrida (100, 300 y 500 hilos; ramp-up 1; loop 1) |
| `jmeter-100-report.png` / `jmeter-300-report.png` / `jmeter-500-report.png` | `Aggregate Report` de cada corrida, con 0.00 % de error |

Los valores transcritos en las tablas de la sección 6.1 proceden literalmente de estas
tres últimas capturas.

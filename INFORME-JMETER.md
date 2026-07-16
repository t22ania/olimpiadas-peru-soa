# Informe de pruebas de rendimiento — Plataforma SOA "Olimpiadas PERÚ"

Evaluación del comportamiento de la API bajo carga concurrente mediante Apache JMeter.
Todos los valores numéricos proceden literalmente del `Aggregate Report` de las corridas
ejecutadas; no se han redondeado ni ajustado.

- Fecha de ejecución: 16 de julio de 2026
- Componente evaluado: `sistema-web-completo` (API principal, puerto 4000)
- Documento relacionado: `INFORME-PRUEBAS.md` (pruebas unitarias, de integración y de seguridad)

---

## 1. Objetivo

Determinar cómo responde la API de la plataforma ante un número creciente de usuarios
concurrentes, identificar el punto de saturación del sistema y localizar el endpoint que
limita el rendimiento del conjunto.

La pregunta que este informe busca responder no es «¿cuántos usuarios soporta?», sino
«¿dónde está el límite y qué lo causa?».

---

## 2. Entorno de pruebas

| Componente | Versión / configuración |
|---|---|
| Apache JMeter | 5.6.3 |
| Java | 22.0.1 (Oracle, build 22.0.1+8-16) |
| Node.js | v24.16.0 |
| PostgreSQL | 16.14 (instancia nativa, servicio de Windows) |
| Sistema operativo | Windows 11 Pro 10.0.26200 |
| Pool de conexiones (Knex) | `min: 2`, `max: 10` |

**Advertencia metodológica.** El generador de carga (JMeter), la API (Node.js) y el motor
de base de datos (PostgreSQL) se ejecutaron **en la misma máquina**, compitiendo por los
mismos núcleos. Esta circunstancia se detalla en la sección 7 y condiciona la lectura de
los resultados.

**Nota de instalación.** El lanzador `bin/jmeter.bat` no llegó a arrancar en el equipo de
pruebas: terminaba de inmediato sin abrir la interfaz y sin escribir su archivo
`jmeter.log`, pese a que `bin/jmeter.bat --version` sí respondía. La interfaz abre con
normalidad invocando el JAR directamente:

```
java -jar bin/ApacheJMeter.jar -t olimpiadas-carga.jmx
```

---

## 3. Plan de pruebas

El plan se encuentra en `olimpiadas-carga.jmx`, en la raíz del proyecto.

| Elemento | Configuración |
|---|---|
| Thread Group | Ramp-up 1 s, loop count 1, acción ante error: continuar |
| HTTP Request Defaults | `http://localhost:4000` |
| HTTP Request 1 | GET `/api/deportes` |
| HTTP Request 2 | GET `/api/instituciones` |
| HTTP Request 3 | GET `/api/equipos` |
| HTTP Request 4 | GET `/api/partidos` |
| HTTP Request 5 | GET `/api/resultados/posiciones/1` |
| Listener | Aggregate Report |

Se seleccionaron cinco endpoints de **consulta** (GET), correspondientes a las lecturas
que el frontend realiza al cargar sus pantallas principales. No se incluyeron operaciones
de escritura para que las corridas fuesen repetibles sin alterar el estado de la base de
datos entre ejecuciones.

Cada hilo ejecuta las cinco peticiones una vez, de modo que el número total de muestras
es `hilos × 5`.

### 3.1 Diseño experimental

Se ejecutaron tres corridas modificando **únicamente el número de hilos**:

| Corrida | Hilos | Ramp-up | Loop | Muestras esperadas |
|---|---|---|---|---|
| 1 | 100 | 1 s | 1 | 500 |
| 2 | 300 | 1 s | 1 | 1 500 |
| 3 | 500 | 1 s | 1 | 2 500 |

El ramp-up se mantuvo en 1 segundo en las tres corridas de forma deliberada. Aunque un
arranque más escalonado sería preferible desde el punto de vista del generador de carga,
alterarlo entre corridas habría introducido una segunda variable y habría impedido
atribuir las diferencias observadas exclusivamente a la concurrencia.

Entre corrida y corrida se limpió el listener para evitar que las muestras se acumulasen.
El recuento de muestras obtenido (500, 1 500 y 2 500) coincide exactamente con el
esperado, lo que confirma que cada corrida se midió de forma aislada.

---

## 4. Resultados

Tiempos en milisegundos. Datos transcritos literalmente del `Aggregate Report`.

### 4.1 Corrida 1 — 100 hilos

| Etiqueta | # Muestras | Media | Mediana | 90% Line | 95% Line | 99% Line | Mín | Máx | % Error | Rendimiento | Kb/sec | Sent KB/sec |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| GET /api/deportes | 100 | 3 | 2 | 12 | 13 | 16 | 1 | 17 | 0.00% | 100.4/sec | 96.58 | 12.55 |
| GET /api/instituciones | 100 | 2 | 1 | 8 | 9 | 12 | 0 | 12 | 0.00% | 102.1/sec | 93.27 | 13.27 |
| GET /api/equipos | 100 | 6 | 2 | 24 | 34 | 46 | 1 | 48 | 0.00% | 102.0/sec | 106.62 | 12.66 |
| GET /api/partidos | 100 | 2 | 1 | 7 | 9 | 11 | 0 | 13 | 0.00% | 102.6/sec | 89.24 | 12.82 |
| GET /api/resultados/posiciones/1 | 100 | 4 | 2 | 13 | 22 | 24 | 1 | 27 | 0.00% | 103.0/sec | 61.35 | 14.38 |
| **Total** | **500** | **3** | **2** | **11** | **15** | **34** | **0** | **48** | **0.00%** | **498.0/sec** | **436.83** | **64.10** |

### 4.2 Corrida 2 — 300 hilos

| Etiqueta | # Muestras | Media | Mediana | 90% Line | 95% Line | 99% Line | Mín | Máx | % Error | Rendimiento | Kb/sec | Sent KB/sec |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| GET /api/deportes | 300 | 82 | 90 | 124 | 129 | 135 | 3 | 139 | 0.00% | 287.1/sec | 276.15 | 35.89 |
| GET /api/instituciones | 300 | 82 | 99 | 119 | 124 | 130 | 2 | 132 | 0.00% | 263.6/sec | 240.71 | 34.24 |
| GET /api/equipos | 300 | 373 | 378 | 529 | 532 | 535 | 26 | 537 | 0.00% | 207.8/sec | 217.09 | 25.77 |
| GET /api/partidos | 300 | 72 | 66 | 114 | 118 | 130 | 16 | 133 | 0.00% | 205.3/sec | 178.67 | 25.67 |
| GET /api/resultados/posiciones/1 | 300 | 181 | 178 | 301 | 325 | 346 | 63 | 352 | 0.00% | 197.6/sec | 117.73 | 27.60 |
| **Total** | **1500** | **158** | **112** | **378** | **468** | **532** | **2** | **537** | **0.00%** | **956.6/sec** | **839.11** | **123.13** |

### 4.3 Corrida 3 — 500 hilos

| Etiqueta | # Muestras | Media | Mediana | 90% Line | 95% Line | 99% Line | Mín | Máx | % Error | Rendimiento | Kb/sec | Sent KB/sec |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| GET /api/deportes | 500 | 119 | 126 | 181 | 184 | 186 | 2 | 187 | 0.00% | 395.9/sec | 380.81 | 49.49 |
| GET /api/instituciones | 500 | 124 | 133 | 178 | 181 | 182 | 2 | 184 | 0.00% | 358.9/sec | 327.74 | 46.62 |
| GET /api/equipos | 500 | 596 | 635 | 753 | 759 | 763 | 51 | 766 | 0.00% | 256.8/sec | 268.34 | 31.85 |
| GET /api/partidos | 500 | 117 | 116 | 154 | 176 | 181 | 26 | 184 | 0.00% | 250.3/sec | 217.75 | 31.28 |
| GET /api/resultados/posiciones/1 | 500 | 300 | 310 | 395 | 457 | 503 | 92 | 519 | 0.00% | 237.8/sec | 141.63 | 33.20 |
| **Total** | **2500** | **251** | **173** | **635** | **726** | **759** | **2** | **766** | **0.00%** | **1136.9/sec** | **997.21** | **146.33** |

---

## 5. Análisis

### 5.1 Fiabilidad

El porcentaje de error fue de **0.00 % en las tres corridas**, sin una sola excepción por
endpoint. La API atendió las **4 500 peticiones** de la campaña completa sin rechazar
ninguna, sin agotar el pool de conexiones de Knex y sin devolver ningún error 5xx.

Este resultado es significativo porque el pool está limitado a 10 conexiones simultáneas
mientras que la corrida de 500 hilos exige varios miles de consultas: el mecanismo de
encolado de Knex funcionó correctamente, degradando el tiempo de respuesta en lugar de
rechazar peticiones. Desde el punto de vista de la disponibilidad bajo carga, el
comportamiento es el deseable.

### 5.2 Evolución del tiempo de respuesta

| Hilos | Media | Mediana | 90% Line | 95% Line | 99% Line | Máx |
|---|---|---|---|---|---|---|
| 100 | 3 ms | 2 ms | 11 ms | 15 ms | 34 ms | 48 ms |
| 300 | 158 ms | 112 ms | 378 ms | 468 ms | 532 ms | 537 ms |
| 500 | 251 ms | 173 ms | 635 ms | 726 ms | 759 ms | 766 ms |

Con 100 hilos la respuesta es prácticamente instantánea (mediana de 2 ms). El salto a 300
hilos multiplica la media por más de 50, y el paso a 500 la vuelve a multiplicar por 1.6.

Conviene observar la **distancia entre la mediana y el percentil 99**, que mide la
dispersión: con 100 hilos es de 2 a 34 ms; con 500 hilos, de 173 a 759 ms. No solo se
degrada el tiempo medio, sino que la experiencia se vuelve mucho más **inconsistente**: el
usuario que peor lo pasa espera más de cuatro veces lo que espera el usuario mediano.

### 5.3 Punto de saturación

El dato más relevante del estudio no es el aumento de la latencia, sino que el
**rendimiento crece de forma sublineal**:

| Hilos | Rendimiento total | Rendimiento ideal (lineal) | Eficiencia | Peticiones/s por hilo |
|---|---|---|---|---|
| 100 | 498.0/sec | 498.0/sec | 100 % | 4.98 |
| 300 | 956.6/sec | 1 494.0/sec | 64 % | 3.19 |
| 500 | 1 136.9/sec | 2 490.0/sec | 46 % | 2.27 |

Triplicar los hilos de 100 a 300 solo multiplica el rendimiento por **1.92**, y aumentar
de 300 a 500 hilos (1.67 veces más carga) apenas lo multiplica por **1.19**. El
rendimiento por hilo cae de 4.98 a 2.27 peticiones por segundo.

**Interpretación:** el sistema alcanza su punto de saturación entre las corridas de 300 y
500 hilos. A partir de ahí, la carga adicional deja de traducirse en trabajo útil y se
convierte únicamente en tiempo de espera acumulado. Añadir más usuarios concurrentes no
haría que el sistema atendiese a más gente, solo que todos esperasen más.

### 5.4 Identificación del cuello de botella

`GET /api/equipos` es sistemáticamente el endpoint más lento en los tres escenarios y el
que peor se degrada:

| Endpoint | Media 100 | Media 300 | Media 500 | Factor 100→500 |
|---|---|---|---|---|
| GET /api/deportes | 3 ms | 82 ms | 119 ms | ×40 |
| GET /api/partidos | 2 ms | 72 ms | 117 ms | ×59 |
| GET /api/instituciones | 2 ms | 82 ms | 124 ms | ×62 |
| GET /api/resultados/posiciones/1 | 4 ms | 181 ms | 300 ms | ×75 |
| **GET /api/equipos** | **6 ms** | **373 ms** | **596 ms** | **×99** |

Con 500 hilos, `/api/equipos` responde en promedio **5 veces más lento** que
`/api/partidos` (596 ms frente a 117 ms) y es el único endpoint cuyo percentil 99 supera
los 750 ms. Es también el que menor rendimiento individual alcanza junto con
`/api/resultados/posiciones/1`.

El detalle revelador está en la corrida de 100 hilos: con carga baja, `/api/equipos`
tarda 6 ms frente a los 2 ms de `/api/partidos`. La diferencia absoluta es
insignificante, pero el **coste relativo por petición ya es tres veces mayor**. Al
multiplicarse por la concurrencia, esa diferencia se amplifica hasta dominar el
comportamiento del sistema.

### 5.5 Causa: patrón de consulta N+1

La revisión del código explica el resultado. El endpoint `GET /api/equipos`
(`src/routes/equipos.js`, líneas 17-20) incurre en un patrón **N+1**:

```js
const equipos = await q
// adjunta conteo de participantes
for (const e of equipos) {
  const [{ count }] = await db('participante').where({ equipo_id: e.id }).count()
  e.participantes = Number(count)
}
```

Tras recuperar la lista de equipos con una consulta, el bucle lanza **una consulta
adicional por cada equipo** para contar sus participantes, y lo hace de forma secuencial
(cada `await` espera a que termine el anterior). Con los 4 equipos de la semilla, cada
petición ejecuta **5 consultas en lugar de 1**.

Bajo 500 hilos concurrentes, esto supone del orden de **2 500 consultas** solo para este
endpoint, todas compitiendo por las 10 conexiones del pool. Los demás endpoints resuelven
con una única consulta y, en consecuencia, se degradan mucho menos.

**Corrección recomendada.** Sustituir el bucle por un único `LEFT JOIN` con `GROUP BY`
que devuelva el conteo agregado en la misma consulta, reduciendo el coste de N+1 a 1
consulta constante con independencia del número de equipos.

**No se implementó**, en coherencia con el criterio aplicado en todo el proceso de pruebas:
diagnosticar sin modificar el código de producción.

**Advertencia sobre la escalabilidad.** El impacto medido está *subestimado*. La base de
pruebas contiene solo 4 equipos. Como el número de consultas crece de forma proporcional
al número de equipos registrados, con un volumen realista de datos —decenas o centenares
de equipos por evento— la degradación de este endpoint sería considerablemente mayor que
la observada aquí.

---

## 6. Conclusiones

1. **La API es fiable bajo carga.** 0.00 % de error en 4 500 peticiones, con concurrencias
   de hasta 500 usuarios. El sistema degrada su tiempo de respuesta antes que rechazar
   peticiones, que es el comportamiento correcto.

2. **El sistema satura entre 300 y 500 usuarios concurrentes.** La eficiencia cae del
   100 % al 46 % respecto de un escalado lineal. Con 100 hilos el rendimiento es excelente
   (mediana de 2 ms); con 500, el usuario mediano espera 173 ms y el percentil 99 alcanza
   los 759 ms.

3. **El cuello de botella está identificado y tiene causa conocida.** `GET /api/equipos`
   concentra la degradación (×99 entre 100 y 500 hilos) debido a un patrón de consulta
   N+1 en `src/routes/equipos.js`. Es un defecto corregible con una sola consulta
   agregada, y su corrección es la acción de mayor impacto sobre el rendimiento global.

4. **Los resultados son comparativos, no absolutos.** Las limitaciones de la sección 7
   impiden extrapolar estas cifras a un entorno de producción.

---

## 7. Limitaciones de la medición

Los resultados deben interpretarse con tres reservas explícitas:

1. **El generador de carga comparte máquina con el sistema bajo prueba.** JMeter, la API
   Node.js y PostgreSQL se ejecutaron en el mismo equipo, compitiendo por los mismos
   núcleos. Parte de la latencia observada en las corridas de 300 y 500 hilos es
   atribuible al entorno de medición y no exclusivamente al servidor. Una medición
   rigurosa exigiría ejecutar el generador de carga en una máquina distinta.

2. **El ramp-up de 1 segundo concentra el arranque.** Con 500 hilos creándose en un solo
   segundo, el arranque es deliberadamente abrupto y exige un esfuerzo notable al propio
   JMeter. Se mantuvo así por indicación de la especificación y para preservar la
   comparabilidad entre corridas.

3. **Los volúmenes de datos son los de la semilla** (5 instituciones, 4 equipos, 4
   partidos, 44 participantes). Son volúmenes muy inferiores a los de un evento real, lo
   que —como se indicó en la sección 5.5— subestima el impacto del patrón N+1.

En consecuencia, los valores deben leerse como una **comparación relativa entre escenarios
de concurrencia**, no como una medición absoluta de la capacidad de la API en producción.

---

## 8. Evidencias gráficas

| Archivo | Contenido |
|---|---|
| `jmeter-100-consulta.png` | Grupo de Hilos de la corrida 1: 100 hilos, ramp-up 1, loop 1 |
| `jmeter-100-report.png` | Aggregate Report de la corrida 1 (500 muestras, 0.00 % error) |
| `jmeter-300-consulta.png` | Grupo de Hilos de la corrida 2: 300 hilos, ramp-up 1, loop 1 |
| `jmeter-300-report.png` | Aggregate Report de la corrida 2 (1 500 muestras, 0.00 % error) |
| `jmeter-500-consulta.png` | Grupo de Hilos de la corrida 3: 500 hilos, ramp-up 1, loop 1 |
| `jmeter-500-report.png` | Aggregate Report de la corrida 3 (2 500 muestras, 0.00 % error) |

Todos los valores de la sección 4 proceden literalmente de las tres capturas `*-report.png`.

---

## 9. Reproducción de las pruebas

1. Levantar PostgreSQL y cargar los datos de semilla:

   ```
   cd sistema-web-completo
   npm run db:reset
   ```

2. Iniciar la API (debe permanecer en ejecución durante toda la campaña):

   ```
   npm start
   ```

3. Comprobar que la API responde antes de lanzar la carga. Este paso no es opcional: una
   API caída produce un `Aggregate Report` con 100 % de error y tiempos de 0 ms, que a
   primera vista puede confundirse con un resultado excelente.

   ```
   curl http://localhost:4000/api/deportes
   ```

4. Abrir el plan en JMeter:

   ```
   java -jar bin/ApacheJMeter.jar -t olimpiadas-carga.jmx
   ```

5. Ejecutar las tres corridas cambiando `Number of Threads (users)` a 100, 300 y 500,
   pulsando el botón de limpiar entre una y otra para que el listener no acumule muestras
   de la corrida anterior.

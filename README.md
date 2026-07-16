# Plataforma de Gestión de Olimpiadas "Olimpiadas PERÚ"

Proyecto desarrollado para el curso de Arquitectura de Software. Consiste en una
plataforma web para administrar olimpiadas deportivas institucionales, desde el
registro de las instituciones participantes hasta el control de resultados,
estadísticas e incidencias. El sistema contempla cuatro disciplinas: fútbol,
básquet, vóley y ping pong.

## Enlaces del proyecto

| Recurso | Dirección |
|---|---|
| Aplicación publicada | https://t22ania.github.io/olimpiadas-peru-soa/ |
| Código fuente | https://github.com/t22ania/olimpiadas-peru-soa |

La aplicación publicada funciona en modo demostración: como GitHub Pages solo
admite sitios estáticos, el frontend se ejecuta con los datos de ejemplo cargados
en memoria, sin base de datos. Para revisar la arquitectura completa con los tres
servicios y PostgreSQL debe seguirse el punto 4.2 de este documento.

## 1. Descripción general

El sistema fue diseñado siguiendo el enfoque de Arquitectura Orientada a Servicios
(SOA). En lugar de construir una única aplicación monolítica, la solución se divide
en servicios independientes que se comunican entre sí mediante interfaces REST. Cada
servicio tiene una responsabilidad clara y puede ejecutarse o mantenerse por separado,
lo que facilita la escalabilidad y el mantenimiento del conjunto.

La justificación de este enfoque se resume en tres puntos:

- El servicio de autenticación puede modificarse sin afectar al registro de resultados.
- Cada servicio se despliega de forma independiente y puede crecer según la demanda.
- La seguridad se centraliza en un único servicio que emite y valida los tokens de acceso.

## 2. Componentes del sistema

| Componente | Función | Tecnología | Puerto |
|---|---|---|---|
| frontend | Interfaz web que utiliza el usuario | React + Vite | 5173 |
| servicio-login | Autenticación y emisión de tokens JWT | Express + JWT + bcrypt | 4001 |
| servicio-registro | Registro de usuarios e instituciones | Express + bcrypt | 4002 |
| sistema-web-completo | API principal, migraciones y datos | Express + Knex + PostgreSQL | 4000 |
| PostgreSQL | Base de datos compartida | Docker (postgres:16) | 5432 |

## 3. Requisitos previos

Antes de ejecutar el proyecto es necesario contar con lo siguiente instalado en el equipo:

- Node.js (versión 18 o superior).
- Docker Desktop, únicamente si se desea probar la versión completa con base de datos.

Este paquete se entrega sin la carpeta `node_modules`, por lo que la primera vez debe
ejecutarse `npm install` dentro de cada carpeta para descargar las dependencias.

## 4. Instalación y ejecución

Existen dos formas de ejecutar el sistema, según lo que se quiera revisar.

### 4.1. Ejecución rápida (solo interfaz)

El frontend puede ejecutarse de manera autónoma con datos de demostración, sin
necesidad de base de datos ni de los demás servicios. Es la opción recomendada para
revisar las pantallas y el flujo de la aplicación.

1. Abrir una terminal dentro de la carpeta `frontend`.
2. Ejecutar la instalación de dependencias:

   ```
   npm install
   ```

3. Iniciar la aplicación:

   ```
   npm run dev
   ```

4. Abrir en el navegador la dirección `http://localhost:5173`.

### 4.2. Ejecución completa (arquitectura SOA con base de datos)

Esta modalidad levanta la base de datos y los cuatro servicios. Requiere Docker Desktop.

1. Desde la carpeta raíz del proyecto, iniciar la base de datos:

   ```
   docker compose up -d
   ```

2. Preparar la API principal (crea las tablas, carga los datos y la deja en ejecución):

   ```
   cd sistema-web-completo
   npm install
   npm run db:reset
   npm run dev
   ```

3. En otra terminal, iniciar el servicio de login:

   ```
   cd servicio-login
   npm install
   npm run dev
   ```

4. En otra terminal, iniciar el servicio de registro:

   ```
   cd servicio-registro
   npm install
   npm run dev
   ```

5. En otra terminal, iniciar el frontend:

   ```
   cd frontend
   npm install
   npm run dev
   ```

6. Ingresar a `http://localhost:5173`.

En sistemas Windows, una vez instaladas las dependencias en cada carpeta, puede usarse
el archivo `iniciar-todo.bat` para levantar los cuatro servicios de una sola vez. La
base de datos debe estar en ejecución antes de usarlo.

## 5. Usuarios de acceso

El sistema se entrega con cuatro cuentas iniciales de demostración, una por cada rol.
**La contraseña de todas las cuentas es `123456`.**

| Rol | Correo | Contraseña | Alcance |
|---|---|---|---|
| Administrador | admin@demo.com | `123456` | Acceso a todas las vistas, incluidas reportes y gestión de usuarios |
| Coordinador | coordinador@demo.com | `123456` | Sorteo, resultados, incidencias y tabla de posiciones |
| Árbitro | arbitro@demo.com | `123456` | Registro de resultados e incidencias |
| Institución | institucion@demo.com | `123456` | Registro, inscripción de equipos y tabla de posiciones |

> **Importante (seguridad):** estas son credenciales de demostración públicas y
> son **idénticas en cualquier equipo** donde se instale el proyecto, porque se
> cargan desde el archivo de datos iniciales `sistema-web-completo/seeds/01_inicial.js`.
> En un entorno real deben cambiarse tras la primera instalación (ver punto 5.1).

Cada rol visualiza únicamente el menú correspondiente a sus permisos. Si un usuario
intenta ingresar a una vista que no le corresponde, el sistema lo redirige de forma
automática a una de sus vistas permitidas.

### 5.1. Gestión de cuentas y roles

El administrador dispone de la pantalla **«Usuarios y accesos»** (menú lateral,
solo visible para el rol administrador), desde la cual puede, sin tocar código:

- **Crear** nuevas cuentas indicando nombre, correo, contraseña y rol.
- **Cambiar el rol** de acceso de cualquier cuenta.
- **Editar** el correo y **restablecer la contraseña** de una cuenta existente.
- **Eliminar** cuentas.

Las contraseñas se almacenan cifradas con `bcrypt`; el sistema nunca guarda ni
devuelve la contraseña en texto plano. Como medida de seguridad, no se permite
quitar el rol ni eliminar la cuenta del **único** administrador, para evitar dejar
el sistema sin acceso de administración.

Esta pantalla es la vía recomendada para dejar de usar las credenciales de
demostración: al instalar el proyecto, ingresar como administrador y actualizar los
correos y contraseñas de cada cuenta (o crear las cuentas reales y eliminar las de
ejemplo). Los cambios se guardan en la base de datos del equipo donde se ejecuta.

### 5.2. ¿Dónde se guardan los cambios de cuentas? (GitHub vs. base de datos)

Es importante distinguir dos lugares de almacenamiento distintos:

| Almacena | GitHub (este repositorio) | Base de datos PostgreSQL |
|---|---|---|
| Qué guarda | El **código fuente** y el archivo semilla con las cuentas de ejemplo (contraseña `123456`) | Las cuentas **reales** y todos sus cambios: nuevos usuarios, correos y contraseñas |
| Dónde vive | En la nube, es público | En el equipo o servidor que ejecuta los servicios |

Cuando el administrador crea una cuenta o cambia una contraseña desde la pantalla
"Usuarios y accesos", ese cambio **se guarda en la base de datos, no en GitHub**. Por
diseño, las contraseñas reales **nunca** se suben al repositorio: sería una mala
práctica de seguridad. En consecuencia, si otra persona clona o descarga este
repositorio, obtiene el código y las cuentas de ejemplo con `123456`, pero **no** las
contraseñas que se hayan modificado en una instalación concreta.

### 5.3. Adaptación a un entorno de empresa (producción)

En un uso real no se distribuye la aplicación para que cada persona la descargue.
Se despliega **una sola instancia** en un servidor o en la nube, y su base de datos
conserva las cuentas de forma permanente. El procedimiento recomendado es:

1. Desplegar la aplicación junto con una base de datos PostgreSQL en un servidor o
   servicio en la nube (no en el equipo de cada usuario).
2. Crear las tablas y cargar **únicamente un administrador inicial**, en lugar de las
   cuatro cuentas de demostración.
3. Ese administrador ingresa y crea las cuentas reales o cambia las contraseñas desde
   la pantalla "Usuarios y accesos"; los datos quedan almacenados en la base de datos
   de producción.
4. Los usuarios acceden a la aplicación mediante su **dirección web**; no descargan
   ningún archivo.
5. La persistencia y el resguardo de las cuentas se garantizan mediante **copias de
   seguridad de la base de datos**, no a través de GitHub.
6. Los datos sensibles (por ejemplo, la clave `JWT_SECRET` de los tokens) se
   configuran en **variables de entorno** (`.env`) y nunca se incluyen en el
   repositorio.

## 6. Funcionalidades principales

- Registro de instituciones, con asignación automática del país representado según el grado.
- Inscripción de equipos y jugadores, con validación del número mínimo de participantes por deporte.
- Sorteo de series y generación del calendario de partidos.
- Registro y publicación de resultados.
- Tabla de posiciones y ranking de anotadores, recalculados a partir de los resultados publicados.
- Gestión de incidencias, con clasificación por tipo, tiempo límite de atención (SLA) y seguimiento del estado.
- Vista de reportes para el administrador, con totales del evento y ranking general de anotadores.
- Página de documentación con el diccionario de datos de las entidades del sistema.

## 7. Reglas de negocio consideradas

- Número mínimo de jugadores por equipo: fútbol 11, básquet 5, vóley 6 y ping pong entre 1 y 2.
- El sorteo es aleatorio pero reproducible: se conserva la semilla y el registro de cada paso.
- Puntuación de fútbol: victoria 3 puntos, empate 1 punto y derrota 0 puntos.
- Tiempo límite de atención de incidencias según su tipo: técnica menos de 2 horas,
  deportiva menos de 24 horas, administrativa menos de 48 horas y disciplinaria menos de 72 horas.

## 8. Modelo de datos

La base de datos está compuesta por trece tablas: institución, usuario, evento,
deporte, equipo, participante, serie, partido, resultado, estadística, incidencia,
notificación y sorteo. Las definiciones se encuentran en
`sistema-web-completo/migrations/` y los datos iniciales en `sistema-web-completo/seeds/`.

## 9. Consideraciones

Se trata de un producto mínimo viable con fines académicos. El envío real de correos
electrónicos no se encuentra implementado; en su lugar, las notificaciones se registran
en la base de datos. Las nuevas pantallas de incidencias y reportes trabajan con el
estado en memoria del frontend, sin persistencia en la base de datos.

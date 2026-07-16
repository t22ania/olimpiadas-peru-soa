# Gestión de cuentas y control de acceso

> Capítulo para el informe del curso de Arquitectura Orientada al Servicio.
> Describe la mejora de seguridad incorporada a la plataforma "Olimpiadas PERÚ":
> la administración de cuentas y roles desde una pantalla dedicada.

## 1. Objetivo de la mejora

En la versión inicial, la pantalla de inicio de sesión mostraba visiblemente las
cuatro cuentas de demostración junto con su contraseña (`123456`). Esto facilitaba
las pruebas, pero exponía credenciales en la interfaz y no ofrecía ningún mecanismo
para administrar los accesos sin editar el código.

La mejora persigue tres metas:

1. Retirar las credenciales visibles de la pantalla de inicio de sesión.
2. Ofrecer al administrador una pantalla para crear, editar, cambiar de rol y
   eliminar cuentas, sin necesidad de modificar el código ni la base de datos a mano.
3. Almacenar las contraseñas siempre cifradas y proteger el acceso administrativo.

## 2. Cambios en la interfaz de inicio de sesión

Se eliminó del componente de inicio de sesión el panel de "Cuentas de prueba" que
listaba los correos y la contraseña compartida. En su lugar se muestra el mensaje:
*"Acceso restringido. Solicita tus credenciales al administrador del sistema."*

Con ello, ningún usuario no autenticado puede leer credenciales válidas en la
interfaz pública.

## 3. Pantalla "Usuarios y accesos"

Se incorporó una nueva vista, visible únicamente para el rol **administrador**
(la restricción se aplica mediante el mapa de permisos `PERMISOS` del enrutador del
frontend, igual que el resto de las vistas del sistema). Desde ella el administrador
puede, sin tocar código:

| Acción | Descripción |
|---|---|
| Crear cuenta | Registra un usuario con nombre, correo, contraseña y rol de acceso. |
| Cambiar rol | Reasigna el rol de una cuenta mediante un desplegable en la tabla. |
| Editar cuenta | Modifica el nombre y el correo de una cuenta existente. |
| Restablecer contraseña | Asigna una contraseña nueva; se deja en blanco si no se desea cambiar. |
| Eliminar cuenta | Da de baja una cuenta del sistema. |

Los cuatro roles disponibles son **Administrador**, **Coordinador**, **Árbitro** e
**Institución**, y cada uno determina qué vistas del menú puede utilizar el usuario.

## 4. Arquitectura de la solución (enfoque SOA)

La funcionalidad respeta la separación de responsabilidades propia de SOA. La gestión
de cuentas se implementó en el **servicio de registro** (puerto 4002), que es el
componente responsable de la tabla `usuario`. Se añadieron las siguientes operaciones
REST:

| Método y ruta | Función |
|---|---|
| `GET /usuarios` | Lista las cuentas. Nunca devuelve el hash de la contraseña. |
| `POST /usuarios` | Crea una cuenta con la contraseña cifrada. |
| `PATCH /usuarios/:id` | Actualiza nombre, correo o contraseña. |
| `PATCH /usuarios/:id/rol` | Cambia el rol de acceso. |
| `DELETE /usuarios/:id` | Elimina la cuenta. |

El frontend consume estas rutas a través de su cliente HTTP. El **servicio de login**
(puerto 4001) sigue siendo el único responsable de validar credenciales y emitir el
token, sin verse afectado por estos cambios; esto ilustra la ventaja de SOA de poder
evolucionar un servicio sin impactar en los demás.

## 5. Medidas de seguridad aplicadas

- **Contraseñas cifradas:** se almacenan con el algoritmo `bcrypt` (factor de costo
  10). El sistema nunca guarda ni devuelve la contraseña en texto plano.
- **Correo único:** no se permite registrar ni reasignar un correo que ya pertenezca
  a otra cuenta (respuesta HTTP 409).
- **Protección del acceso administrativo:** no se puede quitar el rol ni eliminar la
  cuenta del **único** administrador existente, para evitar dejar el sistema sin
  posibilidad de administración (respuesta HTTP 409).
- **Autoprotección en la interfaz:** el administrador no puede eliminar ni cambiar el
  rol de su propia cuenta activa desde la tabla, evitando un autobloqueo accidental.

## 6. Cuentas iniciales y su configuración por equipo

El sistema se entrega con cuatro cuentas de demostración, una por rol, todas con la
contraseña inicial `123456`:

| Rol | Correo | Menú al que accede |
|---|---|---|
| Administrador | admin@demo.com | Todas las vistas, incluidas reportes y gestión de usuarios |
| Coordinador | coordinador@demo.com | Sorteo, resultados, incidencias y tabla de posiciones |
| Árbitro | arbitro@demo.com | Registro de resultados e incidencias |
| Institución | institucion@demo.com | Registro e inscripción de equipos y tabla de posiciones |

Estas cuentas provienen del archivo de datos iniciales
`sistema-web-completo/seeds/01_inicial.js`. Por ese motivo son **idénticas en
cualquier equipo** donde se instale el proyecto y se ejecute la carga inicial
(`npm run db:reset`): no se generan de forma aleatoria por instalación.

En consecuencia, se recomienda que, tras la primera instalación, el administrador
ingrese a la pantalla "Usuarios y accesos" y actualice los correos y contraseñas (o
cree las cuentas reales y elimine las de ejemplo). Esos cambios se guardan en la base
de datos del equipo donde se ejecuta, de modo que a partir de ese momento las
credenciales dejan de ser las públicas de demostración.

## 7. Trabajo pendiente identificado

La restricción de acceso a la pantalla de administración se aplica actualmente en el
frontend. Las rutas del servicio de registro aún no exigen un token de autenticación,
por lo que la protección definitiva requiere incorporar la validación del token JWT
como middleware en los servicios (hallazgo ya registrado en el informe de pruebas).
Esta mejora se documenta como trabajo futuro y no se implementó en esta entrega.

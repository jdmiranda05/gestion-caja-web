
# Gestión de Caja - Bodega

## 1. Descripción del proyecto

Gestión de Caja - Bodega es un sistema web desarrollado con Java y Spring Boot para administrar las operaciones de una bodega.

El sistema contempla la consulta de productos, la gestión de compras, el control de inventario, la administración de usuarios y el acceso a funcionalidades según el rol de cada usuario.

El proyecto separa el frontend del backend para mantener una estructura organizada, facilitar el mantenimiento y permitir que cada módulo tenga responsabilidades específicas.

### Objetivos principales

- Gestionar productos y existencias.
- Permitir que los clientes consulten productos y realicen compras.
- Registrar pedidos y conservar su historial.
- Permitir que los clientes presenten reclamos relacionados con sus compras.
- Restringir las operaciones según los permisos de cada usuario.
- Incorporar herramientas de gestión para los roles MANAGER y ADMIN.

---

## 2. Tecnologías utilizadas

- Java 25.
- Spring Boot 4.1.1.
- Spring Web MVC.
- Spring Data JPA.
- Spring Security.
- Hibernate.
- H2 Database.
- Maven.
- HTML.
- CSS.
- JavaScript.
- Git y GitHub.

La versión declarada en el proyecto debe comprobarse en `pom.xml`, ya que este archivo determina las dependencias y versiones utilizadas durante la compilación.

### ¿Por qué utilizamos estas tecnologías?

**Java:** permite desarrollar la lógica de negocio y modelar las entidades del sistema.

**Spring Boot:** simplifica la configuración y ejecución de la aplicación.

**Spring Web MVC:** permite crear controladores que reciben solicitudes HTTP y devuelven respuestas.

**Spring Data JPA:** facilita las operaciones de persistencia y consulta de información.

**Hibernate:** implementa el mapeo entre los objetos Java y las tablas de la base de datos.

**Spring Security:** controla la autenticación, las sesiones y los permisos de acceso.

**H2 Database:** proporciona una base de datos relacional para el desarrollo del proyecto.

**Maven:** administra las dependencias y las tareas de compilación.

**HTML, CSS y JavaScript:** construyen la interfaz que utiliza el usuario y permiten comunicarse con el backend.

**Git y GitHub:** permiten controlar versiones, trabajar con ramas y revisar cambios mediante Pull Requests.

---

## 3. Arquitectura general

El sistema utiliza una arquitectura por capas. Cada capa tiene una responsabilidad diferente.

### 3.1. Frontend

Es la parte visible de la aplicación.

Responsabilidades:
- Mostrar productos y sus precios.
- Gestionar la interacción con el carrito.
- Presentar formularios de registro e inicio de sesión.
- Mostrar el historial de compras.
- Permitir seleccionar un producto comprado para presentar un reclamo.
- Mostrar mensajes de confirmación y error.

Archivos principales:
- `src/main/resources/static/index.html`
- `src/main/resources/static/app.js`
- `src/main/resources/static/account.js`
- Los archivos CSS de la interfaz.

El archivo HTML define la estructura de la página; JavaScript controla las interacciones y las solicitudes HTTP.

### 3.2. Controladores

Los controladores reciben las solicitudes HTTP y conectan el frontend con los servicios del backend.

Ejemplos:
- `UserController`
- `PurchaseController`
- `ClaimController`

Su responsabilidad principal es recibir los datos, delegar las operaciones y devolver respuestas HTTP.

La lógica de negocio no debe concentrarse en los controladores, porque esto dificulta las pruebas y el mantenimiento.

### 3.3. Servicios

Los servicios contienen las reglas del negocio.

Ejemplos:
- `UserService`
- `PurchaseService`
- `ClaimService`

Un servicio puede validar información, consultar repositorios, ejecutar operaciones relacionadas y coordinar una transacción.

### 3.4. Repositorios

Los repositorios permiten consultar, guardar y modificar datos persistidos.

Ejemplos:
- `UserRepository`
- `ClaimRepository`
- Los repositorios de productos y compras del proyecto.

Se utiliza Spring Data JPA para reducir la cantidad de código necesario para realizar operaciones comunes sobre la base de datos.

### 3.5. Entidades

Las entidades representan objetos persistentes relacionados con las tablas de la base de datos.

Ejemplos:
- `User`
- `Product`
- `CustomerOrder`
- `OrderItem`
- `Claim`

Las entidades contienen los datos y las relaciones necesarias para representar el dominio de la aplicación.

### 3.6. DTO (Data Transfer Object)

Los DTO definen los datos que entran o salen de la aplicación a través de una API.

Ejemplos:
- `RegisterRequest`
- `UserResponse`
- `PurchaseRequest`
- `PurchaseResponse`
- `ClaimRequest`
- `ClaimResponse`

¿Por qué utilizamos DTO?

Las entidades pueden contener información interna que no debe exponerse directamente. Los DTO permiten controlar los campos recibidos y devueltos, reducir la exposición de datos sensibles y desacoplar la API del modelo de persistencia.

---

## 4. Base de datos

El proyecto utiliza H2 como base de datos relacional.

La base de datos está configurada para utilizar almacenamiento persistente en archivos, con la ubicación:

`data/gestion-caja`

La configuración exacta se encuentra en los archivos de configuración de Spring Boot.

Spring Data JPA y Hibernate permiten mapear las entidades Java a las tablas de la base de datos.

### ¿Por qué utilizamos persistencia en archivos?

Una base de datos persistente conserva los datos entre reinicios de la aplicación, a diferencia de una base de datos exclusivamente en memoria.

### Consideraciones

- La estructura de las tablas depende de las entidades y de la configuración de JPA.
- Los cambios de esquema deben revisarse cuidadosamente.
- Los datos de prueba deben distinguirse de los datos utilizados en otros entornos.
- La carpeta de datos y las credenciales locales deben tratarse según las reglas del repositorio.

### Entidades principales

| Entidad | Responsabilidad |
|---|---|
| `User` | Representar las cuentas de usuario. |
| `Product` | Representar los productos y sus datos comerciales. |
| `CustomerOrder` | Representar una compra o pedido de un cliente. |
| `OrderItem` | Representar cada producto incluido en una compra. |
| `Claim` | Representar un reclamo relacionado con una compra. |

Las entidades `Sale` y otros modelos del negocio deben documentarse según las operaciones que realmente implementen. Una venta y un pedido no deben considerarse equivalentes sin comprobar su relación en el código.

---

## 5. Roles del sistema

El sistema contempla tres roles principales.

### 5.1. CUSTOMER

Representa al cliente de la bodega.

Funcionalidades:
- Consultar productos.
- Buscar y filtrar productos, según las opciones disponibles.
- Agregar productos al carrito.
- Realizar compras.
- Consultar sus propias compras.
- Revisar los productos incluidos en una compra.
- Seleccionar un producto comprado para presentar un reclamo.
- Consultar el historial de reclamos, según las funcionalidades habilitadas.

El cliente solamente debe acceder a sus propios datos y operaciones autorizadas.

### 5.2. MANAGER

Representa al encargado de la operación de la bodega.

Funcionalidades previstas:
- Gestionar productos.
- Agregar y editar productos.
- Gestionar inventario.
- Consultar pedidos.
- Consultar ventas.
- Revisar información del negocio.
- Generar reportes.

Estas funcionalidades deben habilitarse y comprobarse individualmente antes de considerarlas terminadas.

### 5.3. ADMIN

Representa al administrador general del sistema.

Funcionalidades previstas:
- Gestionar usuarios.
- Administrar cuentas.
- Gestionar roles y permisos.
- Acceder a las funcionalidades administrativas autorizadas.
- Supervisar la configuración del sistema.

El rol ADMIN debe contar únicamente con los permisos definidos por las reglas de seguridad del proyecto.

---

## 6. Módulo de usuarios y autenticación

Este módulo administra las cuentas y permite identificar al usuario que realiza una solicitud.

### 6.1. `User.java`

Representa una cuenta de usuario.

Su modelo contempla los datos necesarios para identificar la cuenta, almacenar la contraseña cifrada y asociar un rol.

¿Por qué es una entidad?

Porque sus datos necesitan persistirse en la base de datos y participar en las operaciones de autenticación y autorización.

### 6.2. `UserRepository.java`

Permite guardar usuarios y consultar si existen cuentas con un nombre de usuario o correo electrónico determinado.

¿Por qué utilizamos un repositorio?

Para separar el acceso a datos de las reglas de negocio. El servicio no necesita implementar directamente todas las consultas SQL.

### 6.3. `UserService.java`

Centraliza la lógica del registro.

Responsabilidades:
- Validar los datos recibidos.
- Comprobar nombres de usuario y correos duplicados.
- Exigir una contraseña que cumpla la longitud mínima establecida.
- Codificar la contraseña mediante `PasswordEncoder`.
- Asignar el rol CUSTOMER desde el servidor durante el registro público.
- Guardar la cuenta utilizando el repositorio.

¿Por qué el servidor asigna el rol?

Porque un usuario no debe poder enviarse a sí mismo un rol privilegiado desde el navegador. El backend debe controlar las decisiones relacionadas con los permisos.

### 6.4. `RegisterRequest.java`

Define los datos aceptados para el registro.

El DTO recibe los campos necesarios, como el nombre de usuario, el correo y la contraseña.

No debe permitir que el cliente público determine libremente su rol.

### 6.5. `UserResponse.java`

Define la información pública que se devuelve sobre una cuenta.

Su finalidad es evitar que la respuesta de la API exponga la contraseña almacenada u otros datos internos innecesarios.

### 6.6. `UserController.java`

Expone las operaciones HTTP relacionadas con el usuario.

Entre las rutas documentadas se encuentran:

- `POST /api/users/register`: registrar una cuenta.
- `GET /api/users/me`: consultar la identidad o información de la cuenta autenticada.

La respuesta concreta de cada endpoint depende de su implementación.

### 6.7. `CustomUserDetailsService.java`

Busca la cuenta en la base de datos y proporciona a Spring Security la información necesaria para autenticar al usuario y reconocer sus autoridades.

Separa la consulta de las cuentas de la configuración general de seguridad.

### 6.8. `SecurityConfig.java`

Configura las reglas de seguridad de Spring Security.

Entre sus responsabilidades se encuentran:
- Definir las rutas públicas.
- Exigir autenticación en las rutas protegidas.
- Restringir operaciones según los roles.
- Configurar el mecanismo de inicio de sesión.
- Configurar el cierre de sesión.
- Definir el manejo de CSRF.
- Establecer las reglas necesarias para el entorno de desarrollo.

La configuración concreta debe verificarse en el código, ya que los permisos efectivos dependen de las reglas declaradas.

---

## 7. Protección de contraseñas y solicitudes HTTP

### 7.1. BCrypt

Las contraseñas no deben almacenarse en texto legible.

`PasswordEncoder`, configurado con BCrypt, transforma la contraseña en un hash que puede utilizarse para verificarla posteriormente.

¿Por qué utilizamos BCrypt?

Porque evita almacenar la contraseña original y aplica un mecanismo diseñado para hacer más costosa la comprobación masiva de contraseñas robadas.

Durante el inicio de sesión, Spring Security verifica la contraseña presentada utilizando el codificador configurado.

### 7.2. Autenticación y autorización

Son conceptos diferentes.

**Autenticación:** comprueba quién es el usuario.

**Autorización:** determina qué operaciones puede realizar ese usuario.

Por ejemplo, iniciar sesión correctamente no implica que un CUSTOMER pueda administrar usuarios o modificar el inventario.

### 7.3. Protección CSRF

CSRF es un tipo de ataque en el que se intenta inducir al navegador de un usuario autenticado a realizar una operación no deseada.

Spring Security puede exigir un token CSRF en solicitudes que modifican información.

El frontend debe enviar el token de la manera configurada por el backend.

Las excepciones deben limitarse a los casos justificados y no deben utilizarse para desproteger indiscriminadamente las operaciones del sistema.

### 7.4. Comunicación entre frontend y backend

El frontend se comunica con el backend mediante solicitudes HTTP.

Los datos se envían y reciben normalmente en formato JSON.

La interfaz puede validar campos antes de enviar una solicitud, pero esas comprobaciones no sustituyen las validaciones del servidor.

El backend debe comprobar los datos y los permisos independientemente de lo que muestre la interfaz.

---

## 8. Módulo de compras

El módulo de compras permite registrar los pedidos de los clientes y consultar su historial.

### 8.1. `PurchaseRequest`

Representa los datos de entrada de una operación de compra.

Puede incluir los productos y cantidades seleccionados por el cliente.

Los precios definitivos no deben aceptarse como confiables únicamente porque los envíe el navegador.

### 8.2. `PurchaseResponse`

Representa la respuesta pública de una compra.

Incluye información como:
- Identificador de la compra.
- Fecha de creación.
- Total.
- Lista de productos incluidos.

Cada elemento del detalle incluye:
- Identificador de la línea de compra.
- Identificador del producto.
- Nombre del producto.
- Cantidad.
- Precio unitario.
- Total de la línea.

¿Por qué se incluye el identificador de la línea de compra?

Porque una compra puede contener varios productos. El identificador de `OrderItem` permite distinguir cada línea y utilizarla como referencia al seleccionar un producto para presentar un reclamo.

### 8.3. `PurchaseController`

Expone las operaciones HTTP relacionadas con las compras.

Una de las rutas implementadas es:

`GET /api/purchases/my-orders`

Esta operación permite consultar las compras del usuario autenticado.

### 8.4. `PurchaseService`

Centraliza las reglas del proceso de compra.

Entre sus responsabilidades se encuentran:
- Validar los productos y las cantidades.
- Consultar los precios reales desde el backend.
- Comprobar la disponibilidad de existencias.
- Descontar el inventario.
- Guardar la compra y sus líneas.
- Consultar el historial del usuario autenticado.

¿Por qué se consulta el precio en el servidor?

Porque el navegador no es una fuente confiable. Si el backend aceptara sin comprobación el precio enviado por el cliente, alguien podría modificar la solicitud y alterar el importe de la compra.

### 8.5. Transacciones y control del inventario

Las operaciones que modifican el inventario y registran una compra deben coordinarse de forma consistente.

Cuando se utilizan transacciones, las operaciones relacionadas pueden confirmarse como una unidad o revertirse si ocurre un error.

Un método como `findByIdForUpdate`, cuando está implementado con el bloqueo adecuado en la consulta y en la base de datos, puede ayudar a evitar que dos compras concurrentes utilicen las mismas existencias disponibles.

El bloqueo no reemplaza la validación del stock ni garantiza por sí solo que todas las operaciones estén libres de errores de concurrencia.

### 8.6. Historial de compras

El historial debe obtenerse a partir de la identidad autenticada, no de un identificador de cliente elegido libremente por el navegador.

Esto evita que una persona intente consultar compras de otra cuenta modificando parámetros de la solicitud.

---

## 9. Módulo de reclamos del cliente

Este módulo permite presentar reclamos asociados con productos incluidos en compras anteriores.

### 9.1. Estructura del módulo

Los componentes principales son:

- `Claim.java`
- `ClaimController.java`
- `ClaimRepository.java`
- `ClaimRequest.java`
- `ClaimResponse.java`
- `ClaimService.java`
- `ClaimStatus.java`

### 9.2. `Claim.java`

Representa el reclamo almacenado en la base de datos.

Centraliza los datos necesarios para registrar y consultar un reclamo, de acuerdo con los campos definidos en la entidad.

### 9.3. `ClaimStatus.java`

Representa los estados que puede tener un reclamo.

¿Por qué utilizar un enum?

Porque limita los valores posibles a un conjunto definido y evita utilizar cadenas arbitrarias para representar los estados.

Los valores disponibles y sus transiciones deben consultarse en el código fuente.

### 9.4. `ClaimRequest.java`

Define los datos que recibe el backend al presentar un reclamo.

El servidor debe validar la solicitud y no confiar únicamente en los identificadores proporcionados por el navegador.

### 9.5. `ClaimResponse.java`

Define la información que se devuelve al consultar o registrar un reclamo.

Permite mantener separada la representación pública del reclamo de su entidad interna.

### 9.6. `ClaimRepository.java`

Proporciona las operaciones de persistencia necesarias para consultar y guardar reclamos.

### 9.7. `ClaimService.java`

Centraliza las reglas de negocio relacionadas con los reclamos.

La lógica debe verificar que el reclamo esté asociado a una compra y a una línea de compra válidas, y que el usuario autenticado tenga autorización para realizar la operación.

Estas comprobaciones deben ejecutarse en el backend aunque la interfaz solo muestre productos del historial del cliente.

### 9.8. `ClaimController.java`

Expone los endpoints del módulo de reclamos.

El controlador recibe las solicitudes y delega las validaciones y operaciones al servicio.

### 9.9. Integración con el frontend

La interfaz utiliza el historial de compras para mostrar los productos adquiridos.

Cada línea de compra dispone de un identificador propio. Este identificador permite seleccionar el producto al que se refiere el reclamo.

La integración contempla:
- Cargar las compras del usuario.
- Mostrar los productos de cada compra.
- Permitir seleccionar una línea de compra.
- Asociar la selección con el formulario.
- Enviar la solicitud al backend.
- Mostrar los mensajes de respuesta.
- Consultar el historial de reclamos.

### 9.10. Corrección del identificador del producto comprado

Durante las pruebas, los productos aparecían en el historial, pero no se podía seleccionarlos para presentar un reclamo.

La consola mostraba objetos con campos como `productId`, `productName`, `quantity`, `unitPrice` y `lineTotal`, pero no incluía el identificador de la línea de compra que esperaba el frontend.

El problema se encontraba en la respuesta de las compras: `PurchaseResponse.Item` no exponía el identificador de `OrderItem`.

La solución consistió en:
1. Añadir `id` al DTO `PurchaseResponse.Item`.
2. Modificar `PurchaseService.toResponse()` para incluir `item.getId()`.
3. Mantener separados el identificador de la línea de compra y el identificador del producto.
4. Permitir que el frontend identifique correctamente la línea seleccionada.

¿Por qué no basta con `productId`?

Porque una misma compra puede contener líneas distintas y el reclamo debe referirse a una línea concreta de una compra autorizada. El identificador de producto identifica el producto del catálogo, mientras que el identificador de `OrderItem` identifica el artículo dentro de la compra.

**Estado de esta corrección:** la selección del producto en la interfaz fue probada correctamente. La presentación del reclamo y el recorrido completo deben probarse de extremo a extremo antes de dar por cerrado el módulo.

---

## 10. Flujo general de una compra

El proceso de compra puede resumirse de la siguiente manera:

1. El cliente consulta el catálogo.
2. Agrega productos al carrito.
3. Envía la solicitud de compra.
4. El backend valida los datos recibidos.
5. El servicio consulta precios y existencias.
6. Se registra la compra y el detalle.
7. Se actualiza el inventario según las reglas del negocio.
8. El cliente puede consultar la compra en su historial.
9. Desde el historial puede seleccionar una línea de compra para presentar un reclamo.

Este flujo separa la interacción de la interfaz de las decisiones que afectan al inventario, los importes y la autorización.

---

## 11. Organización del código

La estructura general sigue la separación por módulos y responsabilidades.

```text
src/
└── main/
    ├── java/
    │   └── pe/edu/pe/gestion_caja_web/
    │       ├── user/
    │       │   ├── User.java
    │       │   ├── UserRepository.java
    │       │   ├── UserService.java
    │       │   ├── UserController.java
    │       │   ├── SecurityConfig.java
    │       │   └── ...
    │       ├── purchase/
    │       │   ├── PurchaseController.java
    │       │   ├── PurchaseService.java
    │       │   ├── PurchaseResponse.java
    │       │   ├── OrderItem.java
    │       │   └── ...
    │       ├── claim/
    │       │   ├── Claim.java
    │       │   ├── ClaimController.java
    │       │   ├── ClaimRepository.java
    │       │   ├── ClaimRequest.java
    │       │   ├── ClaimResponse.java
    │       │   ├── ClaimService.java
    │       │   └── ClaimStatus.java
    │       └── ...
    └── resources/
        ├── static/
        │   ├── index.html
        │   ├── app.js
        │   ├── account.js
        │   └── ...
        └── application.properties
```

La estructura anterior es una guía de organización, no un inventario exhaustivo de todos los archivos. Los nombres y las ubicaciones definitivas deben coincidir con el repositorio.

### ¿Por qué organizar el código por módulos?

La separación facilita localizar las funcionalidades, entender las dependencias, probar cada componente y trabajar en equipo sin concentrar toda la lógica en una sola clase.

---

## 12. Progreso del desarrollo

Las casillas deben actualizarse cuando la funcionalidad se haya implementado y probado.

### 12.1. Usuarios y seguridad

- [x] Incorporar Spring Security.
- [x] Crear el modelo y repositorio de usuarios.
- [x] Implementar la lógica del registro en `UserService`.
- [x] Configurar el codificador de contraseñas con BCrypt.
- [x] Implementar los DTO de usuario utilizados por la API.
- [x] Implementar los componentes de autenticación existentes.
- [x] Definir reglas de acceso en `SecurityConfig`.
- [ ] Completar y documentar las pruebas de registro e inicio de sesión.
- [ ] Verificar sistemáticamente los permisos de cada rol.
- [ ] Revisar las respuestas de error y los casos de acceso denegado.

### 12.2. Cliente y compras

- [x] Mostrar el catálogo de productos.
- [x] Implementar la interacción del carrito.
- [x] Implementar el proceso de compra existente.
- [x] Consultar el historial de compras del usuario.
- [x] Mostrar el detalle de cada compra.
- [x] Exponer el identificador de la línea de compra en `PurchaseResponse.Item`.
- [x] Corregir la selección del producto comprado para presentar un reclamo.
- [ ] Verificar el flujo completo de compra con distintos casos de stock.
- [ ] Verificar los comprobantes y su alcance real en la aplicación.

### 12.3. Reclamos

- [x] Crear las clases principales del módulo de reclamos.
- [x] Integrar el módulo con el frontend del cliente.
- [x] Mostrar la selección de productos comprados.
- [x] Corregir el identificador de la línea de compra.
- [ ] Probar el envío de un reclamo válido.
- [ ] Probar los casos de datos inválidos.
- [ ] Verificar que un cliente no pueda reclamar sobre compras de otro usuario.
- [ ] Verificar la consulta y visualización del historial.
- [ ] Comprobar los estados y las transiciones permitidas.

### 12.4. MANAGER

- [ ] Verificar la gestión de productos.
- [ ] Verificar la gestión de inventario.
- [ ] Verificar la consulta de pedidos.
- [ ] Verificar la consulta de ventas.
- [ ] Implementar o validar los reportes.

### 12.5. ADMIN

- [ ] Verificar la gestión de usuarios.
- [ ] Verificar la administración de cuentas.
- [ ] Implementar o validar la gestión de roles.
- [ ] Comprobar las restricciones de acceso administrativo.

---

## 13. Pruebas y criterios de validación

Una funcionalidad no debe considerarse terminada únicamente porque la interfaz se vea correctamente.

Para dar por validado un módulo se debe comprobar:
- Que las solicitudes HTTP se ejecuten correctamente.
- Que los datos se almacenen de forma consistente.
- Que los errores se gestionen adecuadamente.
- Que los permisos se apliquen en el backend.
- Que los datos de una cuenta no sean accesibles por otra cuenta sin autorización.
- Que los casos inválidos no alteren indebidamente la base de datos.

### Pruebas importantes para reclamos

1. Seleccionar un producto del historial.
2. Enviar un reclamo con datos válidos.
3. Comprobar la respuesta HTTP.
4. Comprobar que el reclamo se guarda.
5. Consultar el historial de reclamos.
6. Intentar utilizar una línea de compra ajena.
7. Intentar enviar identificadores inexistentes.
8. Comprobar el comportamiento ante solicitudes no autenticadas.

Los resultados de cada prueba deben registrarse en la documentación cuando se hayan ejecutado.

---

## 14. Control de versiones y trabajo en equipo

El proyecto utiliza Git para registrar los cambios y GitHub para compartirlos y revisarlos.

La rama de desarrollo utilizada en los cambios recientes es:

`feature/jhon-desarrollo`

### Flujo de trabajo

1. Trabajar en la rama asignada.
2. Probar los cambios localmente.
3. Revisar los archivos modificados con `git status` y `git diff`.
4. Preparar únicamente los archivos relacionados con la tarea.
5. Crear un commit con un mensaje descriptivo.
6. Subir la rama a GitHub.
7. Crear un Pull Request hacia la rama base acordada por el equipo.
8. Revisar los cambios antes de integrarlos.

### Convención de commits

Se utiliza la convención Conventional Commits.

Ejemplos:

- `feat(cliente): implementa la funcionalidad de reclamos`
- `fix(compras): incluye el identificador de la línea de compra`
- `docs(readme): actualiza la documentación técnica`
- `refactor(usuario): reorganiza la lógica de registro`

Los mensajes deben describir el propósito del cambio, no solamente indicar que se modificaron archivos.

---

## 15. Próximos pasos

Las siguientes tareas permiten consolidar lo implementado:

1. Completar las pruebas del envío y la consulta de reclamos.
2. Verificar que los permisos del cliente se apliquen en todas las rutas relacionadas.
3. Probar el proceso completo de compra y la actualización del inventario.
4. Actualizar esta documentación con los resultados reales de las pruebas.
5. Revisar los módulos MANAGER y ADMIN por separado.
6. Mantener los commits enfocados y revisar cada Pull Request.

---

## 16. Conceptos clave para estudiar

**Entidad:** representa información que se persiste en la base de datos.

**Repositorio:** abstrae las operaciones de acceso a datos.

**Servicio:** implementa las reglas del negocio.

**Controlador:** recibe solicitudes HTTP y devuelve respuestas.

**DTO:** define los datos que entran o salen de una API.

**Autenticación:** verifica la identidad del usuario.

**Autorización:** determina las operaciones permitidas para ese usuario.

**Hash de contraseña:** representación no reversible utilizada para almacenar y verificar contraseñas de forma segura.

**Transacción:** agrupa operaciones para preservar la consistencia de los datos.

**CSRF:** ataque que intenta aprovechar la sesión autenticada de un usuario para realizar acciones no deseadas.

**Conventional Commits:** convención para escribir mensajes de commit claros y estructurados.

**Pull Request:** mecanismo para revisar y proponer la integración de cambios en otra rama.

## Ejecutar

```text
./mvnw spring-boot:run
```

```text
$env:Path="$env:JAVA_HOME\bin;$env:Path"

$env:JAVA_HOME="C:\Program Files\Eclipse Adoptium\jdk-25.0.4.101-hotspot"

```
Estos comandos ejecutar si tienes errores de version con tu java y mvnw o idk

Luego abrir `http://localhost:8080`.

La consola H2 está disponible en `http://localhost:8080/h2-console` para revisar la base durante el desarrollo.

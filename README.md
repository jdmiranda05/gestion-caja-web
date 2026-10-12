
# Gestión de Caja Web

Sistema web para la gestión de una bodega, desarrollado con Java y Spring Boot.

El proyecto permite administrar productos, registrar ventas y ofrecer funcionalidades de compra y atención de reclamos a los clientes.

## 1. Tecnologías utilizadas

- Java 25
- Spring Boot 4.1.1
- Spring Security
- Spring Data JPA
- Spring Web MVC
- Maven
- Base de datos H2
- HTML, CSS y JavaScript
- JUnit 5, Mockito y MockMvc

## 2. Roles del sistema

El sistema contempla tres roles:

### CUSTOMER (Cliente)

Módulo desarrollado con las siguientes funcionalidades:

- Registro de cuentas.
- Inicio de sesión.
- Consulta del catálogo de productos.
- Búsqueda de productos por nombre.
- Filtrado por categorías.
- Paginación del catálogo.
- Carrito de compras.
- Selección de cantidades.
- Confirmación de compras.
- Consulta del historial de pedidos.
- Paginación del historial de compras.
- Presentación de reclamos asociados a productos comprados.
- Consulta del historial de reclamos.
- Paginación del historial de reclamos.

### MANAGER (Gerente)

Rol destinado a operaciones de gestión de productos y ventas.

Su desarrollo y validación integral forman parte de las siguientes etapas del proyecto.

### ADMIN (Administrador)

Rol destinado a las funciones administrativas del sistema.

Su desarrollo y validación integral forman parte de las siguientes etapas del proyecto.

## 3. Seguridad

El sistema utiliza Spring Security para controlar la autenticación y autorización.

Características implementadas:

- Contraseñas protegidas mediante BCrypt.
- Autenticación mediante formulario y sesión.
- Autenticación mediante JWT.
- Tokens JWT firmados con HS256.
- Expiración de JWT configurada en 60 minutos.
- Control de acceso según el rol del usuario.
- Protección CSRF para solicitudes basadas en sesión.

La clave JWT se obtiene mediante la variable de entorno `JWT_SECRET`.

No debe almacenarse una clave secreta real en el repositorio.

## 4. Base de datos

Durante el desarrollo se utiliza H2 con persistencia local.

Configuración principal:

`jdbc:h2:file:./data/gestion-caja`

Los archivos de la base de datos y las copias de seguridad locales están excluidos del control de versiones mediante `.gitignore`.

## 5. API REST

Principales rutas implementadas:

| Método | Ruta | Descripción |
|---|---|---|
| POST | /api/users/register | Registrar usuario |
| POST | /api/users/login | Obtener JWT |
| GET | /api/users/me | Consultar usuario autenticado |
| GET | /api/users/csrf | Obtener token CSRF |
| GET | /api/products | Consultar catálogo |
| POST | /api/products | Registrar producto, personal autorizado |
| GET | /api/purchases/my-orders | Consultar compras propias |
| POST | /api/claims | Presentar reclamo |
| GET | /api/claims/my-claims | Consultar reclamos propios |
| GET | /api/claims | Consultar reclamos, personal autorizado |

Las rutas de ventas y otras operaciones de productos están protegidas según el rol correspondiente.

## 6. Ejecución local

### Requisitos

- JDK 25
- Maven Wrapper incluido en el proyecto
- Variable de entorno `JWT_SECRET` configurada

La variable `JWT_SECRET` debe contener una clave aleatoria codificada en Base64 que represente al menos 32 bytes.

### Ejecutar en Windows

Desde PowerShell:

```powershell
.\mvnw.cmd spring-boot:run
```

Abrir en el navegador:

http://localhost:8080

### Si hay algun error de version


```$bytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$rng.Dispose()
$env:JWT_SECRET = [Convert]::ToBase64String($bytes)
Write-Host "JWT_SECRET configurada correctamente"
Este bloque genera 32 bytes aleatorios mediante un generador criptográficamente seguro y los guarda como Base64 en la variable de entorno.
```

```$env:JAVA_HOME="C:\Program Files\Eclipse Adoptium\jdk-25.0.4.101-hotspot"```
```$env:Path="$env:JAVA_HOME\bin;$env:Path"```



### Consola H2

Disponible durante el desarrollo en:

http://localhost:8080/h2-console

La consola H2 está habilitada únicamente para el entorno de desarrollo local y debe deshabilitarse antes de desplegar la aplicación públicamente.

## 7. Pruebas

Para ejecutar todas las pruebas automatizadas:

```powershell
.\mvnw.cmd clean test
```

### Pruebas automatizadas existentes

- Pruebas de controladores de productos.
- Pruebas de servicios de productos.
- Pruebas de controladores de ventas.
- Pruebas de servicios de ventas.
- Prueba de carga del contexto Spring Boot.
- Pruebas de seguridad de CUSTOMER.

### Verificaciones de seguridad realizadas

| Escenario | Resultado |
|---|---|
| Acceso a perfil sin autenticación | HTTP 401 |
| Inicio de sesión JWT válido | Correcto |
| Consulta de perfil mediante JWT | HTTP 200 |
| CUSTOMER intenta acceder a ventas | HTTP 403 |
| Solicitud de reclamo con JSON vacío | HTTP 400 |

La prueba de reclamo con JSON vacío no demuestra por sí sola que toda la protección CSRF esté validada.

## 8. Estado del proyecto

### Implementado

- Catálogo de productos.
- Registro de ventas.
- Autenticación y autorización.
- Funcionalidades principales de CUSTOMER.
- Historial de compras y reclamos.
- Pruebas automatizadas iniciales.

### Pendiente

- Desarrollo y validación integral de MANAGER.
- Desarrollo y validación integral de ADMIN.
- Ampliación de pruebas automatizadas de compras y reclamos.
- Revisión adicional de CSRF en operaciones JWT.
- Configuración de seguridad para producción.

## 9. Control de versiones

El proyecto utiliza Git y GitHub.

No deben subirse al repositorio:

- Bases de datos locales.
- Copias de seguridad.
- Archivos `.env` con secretos.
- Contraseñas y tokens JWT reales.
- Archivos generados por Maven.

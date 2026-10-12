

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



- Bases de datos locales.
- Copias de seguridad.
- Archivos `.env` con secretos.
- Contraseñas y tokens JWT reales.
- Archivos generados por Maven.

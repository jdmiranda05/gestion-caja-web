# Tienda Alondralu · Gestión de caja web

Aplicación web para una bodega de barrio: catálogo y compras en línea para clientes, y un panel de gestión de caja, inventario, reclamos y usuarios para el personal.

**Arquitectura:** Angular 22 (SPA) + Spring Boot 4.1 (API REST) + H2/JPA, con autenticación JWT y control de acceso por roles verificado en el backend.

Informe técnico y guía de demostración: [docs/INFORME_TECNICO.md](docs/INFORME_TECNICO.md).

## 1. Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | Angular 22 (componentes standalone, signals, Reactive Forms, Router con guards, `HttpClient` con interceptor) |
| Backend | Java 25, Spring Boot 4.1.1, Spring Web MVC, Spring Security (OAuth2 Resource Server / JWT HS256), Bean Validation |
| Persistencia | Spring Data JPA, consultas JPQL, H2 (archivo local), migraciones Flyway |
| Pruebas | JUnit 5, Mockito, MockMvc, Spring Security Test |
| Despliegue | Un solo servicio: Spring Boot sirve el build de Angular. `Dockerfile` multi-etapa incluido |

## 2. Estructura

```
gestion-caja-web/
├── frontend/                     # Proyecto Angular
│   └── src/
│       ├── app/
│       │   ├── core/             # AuthService, interceptor, guards, servicios de API, modelos
│       │   ├── shared/           # Componentes reutilizables: iconos, estados vacíos/carga, gráficos,
│       │   │                     # modal, toasts, paginación, errores de campo, pipes
│       │   ├── layout/           # Layout de tienda y layout del panel (barra lateral)
│       │   └── features/
│       │       ├── auth/         # Login y registro
│       │       ├── store/        # Catálogo, carrito, pedidos, reclamos (CUSTOMER)
│       │       └── panel/        # Resumen, caja, productos, reclamos, solicitudes, usuarios
│       └── styles/               # Tokens de diseño, base, componentes y layout
├── src/main/java/pe/edu/pe/gestion_caja_web/
│   ├── common/                   # Formato de error único (ApiErrorResponse) y manejador global
│   ├── config/                   # Datos iniciales y servidor de la SPA
│   ├── product/ sale/ purchase/ claim/   # controller · service · repository · model · dto
│   └── user/                     # cuentas, seguridad (JWT) y administración
├── src/main/resources/
│   ├── static/                   # Build de Angular (generado con `npm run build`)
│   └── db/migration/             # Flyway
└── Dockerfile
```

## 3. Roles

| Rol | Puede |
|---|---|
| Visitante | Ver y buscar el catálogo, armar el carrito, registrarse |
| CUSTOMER | Confirmar compras, ver su historial, registrar y seguir reclamos |
| MANAGER | Panel: resumen con gráficos, caja y boletas, CRUD de productos y stock, reclamos, aprobar/rechazar desactivaciones |
| ADMIN | Todo lo del gerente + usuarios y roles, solicitar y ejecutar desactivaciones |

## 4. Seguridad

- Login real contra la base de datos (BCrypt) que emite un **JWT HS256** con `sub`, `role` y expiración de 60 min.
- El frontend guarda el token en `sessionStorage` y el **interceptor** lo envía como `Authorization: Bearer <token>` en cada llamada a `/api`.
- **Guards** de Angular: `authGuard` (exige sesión), `roleGuard(...)` (exige rol) y `guestGuard` (evita volver al login con sesión).
- El **backend vuelve a verificar** cada permiso en `SecurityConfig`. API sin estado (`STATELESS`).
- Un token se invalida de inmediato si la cuenta se desactiva o cambia de rol (validador del `JwtDecoder`).
- Respuestas de error en JSON: **401** (sin sesión / token inválido) y **403** (rol sin permiso). El interceptor cierra la sesión ante un 401 y avisa ante un 403.
- CSRF: no aplica a la API porque el token viaja en una cabecera, no en cookies.

## 5. Validación y errores

- **Frontend:** Reactive Forms con validadores (obligatorio, longitudes, correo, mínimos/máximos, 2 decimales, enteros) y mensajes junto a cada campo.
- **Backend:** Bean Validation (`@Valid`, `@NotBlank`, `@Size`, `@DecimalMin`, …) más reglas de negocio en los servicios.
- Todas las respuestas de error tienen el mismo formato:

```json
{ "status": 400, "error": "Bad Request", "message": "Revisa los campos marcados.",
  "path": "/api/products", "timestamp": "…", "fieldErrors": { "price": "El precio mínimo es S/ 0.10." } }
```

Los `fieldErrors` del servidor se muestran en el campo correspondiente del formulario.

## 6. API REST principal

| Método | Ruta | Acceso |
|---|---|---|
| POST | `/api/users/register` · `/api/users/login` | Público |
| GET | `/api/users/me` | Autenticado |
| GET | `/api/products` · `/api/products/search` | Público |
| GET | `/api/products/{id}` · `/inactive` · `/low-stock` | MANAGER, ADMIN |
| POST · PUT · DELETE | `/api/products` · `/api/products/{id}` | MANAGER, ADMIN |
| PATCH | `/api/products/{id}/stock` · `/api/products/{id}/restore` | MANAGER, ADMIN |
| GET · POST | `/api/sales` · `/summary` · `/daily?days=` · `/{id}/receipt` | MANAGER, ADMIN |
| POST · GET | `/api/purchases` · `/api/purchases/my-orders` | CUSTOMER |
| POST · GET | `/api/claims` · `/api/claims/my-claims` | CUSTOMER |
| GET · POST | `/api/claims/staff` · `/{id}/review` · `/{id}/resolve` · `/{id}/history` | MANAGER, ADMIN |
| GET · PUT | `/api/users` · `/api/users/{id}/role` | ADMIN |
| GET · POST | `/api/approvals/deactivation-requests/**` | MANAGER, ADMIN |
| POST | `/api/admin/users/deactivation-requests/**` | ADMIN |

## 7. Ejecución local

Requisitos: JDK 25 y Node 22+ (solo para recompilar el frontend).

```powershell
# 1. (Solo si cambiaste el frontend) compilar Angular hacia src/main/resources/static
cd frontend; npm install; npm run build; cd ..

# 2. Levantar la aplicación completa (API + interfaz) en http://localhost:8080
.\mvnw.cmd spring-boot:run
```

Desarrollo del frontend con recarga en caliente (el proxy envía `/api` al puerto 8080):

```powershell
cd frontend; npm start   # http://localhost:4200
```

Variables de entorno:

| Variable | Uso |
|---|---|
| `JWT_SECRET` | Clave Base64 de al menos 32 bytes para firmar los JWT (obligatoria fuera de desarrollo) |
| `STAFF_PASSWORD` | Contraseña de las cuentas iniciales `gerente` y `admin` (solo se aplica al crearlas) |
| `RESET_STAFF_PASSWORD` | Solo desarrollo. Si es `true`, al arrancar reasigna `STAFF_PASSWORD` a `admin` y `gerente` sin borrar datos |
| `PORT` | Puerto HTTP (8080 por defecto) |

¿Olvidaste la contraseña de `admin` o `gerente`? Arranca una vez con el reinicio activado, inicia sesión y vuelve a arrancar sin él:

```powershell
$env:STAFF_PASSWORD = "TuClaveNueva2026"   # mínimo 8 caracteres
$env:RESET_STAFF_PASSWORD = "true"
.\mvnw.cmd spring-boot:run
# Después de iniciar sesión: detén la app y quita la bandera
Remove-Item Env:RESET_STAFF_PASSWORD
```

Generar un `JWT_SECRET` en PowerShell:

```powershell
$bytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create(); $rng.GetBytes($bytes); $rng.Dispose()
$env:JWT_SECRET = [Convert]::ToBase64String($bytes)
```

Consola H2 (solo desarrollo): http://localhost:8080/h2-console · JDBC `jdbc:h2:file:./data/gestion-caja`.

## 8. Despliegue

```bash
docker build -t alondralu .
docker run -p 8080:8080 -e JWT_SECRET=<clave-base64> -e STAFF_PASSWORD=<clave> alondralu
```

La imagen compila Angular, empaqueta el JAR y expone un único servicio en `PORT`, compatible con Render, Railway o Fly.io.

## 9. Pruebas

```powershell
.\mvnw.cmd clean test
```

Incluye pruebas de servicios, controladores, seguridad por rol (401/403), JWT, concurrencia de desactivaciones y el contrato de errores de la API (`ApiErrorContractTest`: 400 con `fieldErrors`, 401/403 en JSON, CRUD completo con persistencia).

## 10. Control de versiones

No subir al repositorio bases de datos locales (`data/`), archivos `.env`, contraseñas ni tokens reales, `target/` ni `frontend/node_modules/`.

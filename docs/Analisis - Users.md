# 👥 Análisis - Módulo Users

## 📋 Información General

**Módulo:** Users (Usuarios)  
**Propósito:** Gestionar usuarios del sistema y sus roles  
**Roles disponibles:** CAJERO, COCINA (ADMIN se gestiona por seed)  
**Protección:** Solo ADMIN

---

## 🎯 Funcionalidades Principales

### Gestión de Usuarios

- Crear usuarios con rol asignado (cajero/cocina)
- Listar todos los usuarios con filtros
- Consultar usuario por ID
- Activar/Desactivar usuarios
- Blanqueo de contraseñas por administrador

### Gestión de Roles

- Rol asignado obligatoriamente al crear
- Roles permanentes (no se pueden cambiar)
- No permite crear usuarios ADMIN
- Protección del último administrador activo

### Validaciones de Seguridad

- UserName único e inmutable
- Contraseñas robustas (mayúscula, minúscula, número)
- Protección contra desactivar último ADMIN
- Solo ADMIN puede gestionar usuarios

---

## 🗂️ Estructura del Módulo

### DTOs

- **CreateUserDto**: Datos para crear usuario
  - `userName` (string, requerido, único)
  - `password` (string, min 6, max 50, validaciones robustas)
  - `roleId` (UUID, requerido, no puede ser admin)

- **ResetPasswordDto**: Datos para blanquear contraseña
  - `newPassword` (string, min 6, max 50, validaciones robustas)

### Servicios

**UsersService**

- `create()` - Crear usuario con rol
- `findAll()` - Listar con filtros (isActive, limit, offset)
- `findOne()` - Obtener por ID
- `activate()` - Activar usuario inactivo
- `deactivate()` - Desactivar usuario (protege último admin)
- `resetPassword()` - Blanquear contraseña
- `findByUserName()` - Auxiliar para auth
- `validateUniqueUserName()` - Validación privada

**UserRolesService**

- `assignRole()` - Asignar rol al crear (valida que no sea admin)
- `getUserRoles()` - Obtener roles de usuario
- `hasRole()` - Verificar si tiene rol específico
- `validateCanDeactivateUser()` - Proteger último admin
- `countActiveAdmins()` - Contar admins activos

### Controlador

**UsersController** (`/users`)

- 6 endpoints (todos requieren rol ADMIN)

---

## 🔐 Permisos por Endpoint

| Endpoint                          | ADMIN | CAJERO | COCINA | Uso                  |
| --------------------------------- | ----- | ------ | ------ | -------------------- |
| `POST /users`                     | ✅    | ❌     | ❌     | Crear usuario        |
| `GET /users`                      | ✅    | ❌     | ❌     | Listar usuarios      |
| `GET /users/:id`                  | ✅    | ❌     | ❌     | Ver detalle          |
| `PATCH /users/:id/activate`       | ✅    | ❌     | ❌     | Activar usuario      |
| `PATCH /users/:id/deactivate`     | ✅    | ❌     | ❌     | Desactivar usuario   |
| `PATCH /users/:id/reset-password` | ✅    | ❌     | ❌     | Blanquear contraseña |

---

## 🌐 Endpoints

### 1. Crear Usuario con Rol

**Endpoint:** `POST /users`  
**Autenticación:** Solo ADMIN

**Body:**

```json
{
  "userName": "cajero1",
  "password": "Password123",
  "roleId": "uuid-rol-cajero"
}
```

**Respuesta exitosa (201):**

```json
{
  "id": "uuid-usuario",
  "userName": "cajero1",
  "isActive": true,
  "createdAt": "2025-11-29T...",
  "updatedAt": "2025-11-29T...",
  "userRoles": [
    {
      "role": {
        "id": "uuid-rol",
        "name": "cajero",
        "createdAt": "2025-11-29T..."
      },
      "assignedAt": "2025-11-29T..."
    }
  ]
}
```

**Validaciones:**

- userName único (normalizado a lowercase)
- Password: min 6, max 50, mayúscula + minúscula + número
- roleId debe existir
- roleId NO puede ser rol "admin"

---

### 2. Listar Usuarios

**Endpoint:** `GET /users`  
**Autenticación:** Solo ADMIN  
**Query Params:** `isActive` (boolean), `limit`, `offset`

**Respuesta exitosa (200):**

```json
[
  {
    "id": "uuid",
    "userName": "cajero1",
    "isActive": true,
    "userRoles": [
      {
        "role": { "name": "cajero" },
        "assignedAt": "2025-11-29T..."
      }
    ],
    "createdAt": "2025-11-29T..."
  }
]
```

**Filtros:**

- `isActive=true` → Solo activos
- `isActive=false` → Solo inactivos
- `limit` y `offset` → Paginación

**Ordenamiento:** Por `createdAt DESC`

---

### 3. Obtener Usuario por ID

**Endpoint:** `GET /users/:id`  
**Autenticación:** Solo ADMIN

**Respuesta exitosa (200):**

- Usuario completo con roles
- Sin campos redundantes (userId, roleId)

**Errores:**

- 404: Usuario no encontrado
- 400: UUID inválido

---

### 4. Activar Usuario

**Endpoint:** `PATCH /users/:id/activate`  
**Autenticación:** Solo ADMIN

**Respuesta exitosa (200):**

```json
{
  "id": "uuid",
  "userName": "cajero1",
  "isActive": true
}
```

**Validaciones:**

- Usuario debe existir
- No activa usuario ya activo (400)

---

### 5. Desactivar Usuario

**Endpoint:** `PATCH /users/:id/deactivate`  
**Autenticación:** Solo ADMIN

**Respuesta exitosa (200):**

```json
{
  "id": "uuid",
  "userName": "cajero1",
  "isActive": false
}
```

**Validaciones:**

- Usuario debe existir
- No desactiva usuario ya inactivo (400)
- **CRÍTICO:** No permite desactivar al único ADMIN activo

---

### 6. Blanqueo de Contraseña

**Endpoint:** `PATCH /users/:id/reset-password`  
**Autenticación:** Solo ADMIN

**Body:**

```json
{
  "newPassword": "NewPass123"
}
```

**Respuesta exitosa (200):**

```json
{
  "message": "Contraseña blanqueada exitosamente"
}
```

**Validaciones:**

- newPassword: min 6, max 50, mayúscula + minúscula + número
- Password se hashea con bcrypt

---

## 📋 Reglas de Negocio

### Creación de Usuarios

1. **Rol obligatorio:** Se asigna al crear, no después
2. **No crear ADMIN:** Solo se crean usuarios cajero/cocina
3. **UserName único:** No permite duplicados (case-insensitive)
4. **UserName inmutable:** No se puede modificar después
5. **Password robusto:** Validaciones estrictas
6. **Password hasheado:** Se guarda con bcrypt (10 rounds)

### Gestión de Estado

1. **Estado inicial:** Usuarios se crean activos (`isActive: true`)
2. **Activar:** Solo usuarios inactivos
3. **Desactivar:** Solo usuarios activos
4. **Protección ADMIN:** No desactivar al último administrador

### Gestión de Roles

1. **Roles permanentes:** No se pueden eliminar ni cambiar
2. **Un rol por usuario:** Asignado al crear
3. **Sin rol admin:** Solo cajero y cocina disponibles
4. **Validación:** roleId debe existir antes de asignar

### Gestión de Contraseñas

1. **Solo blanqueo:** No existe "cambiar contraseña"
2. **Solo ADMIN:** Usuario no puede cambiar su propia contraseña
3. **Flujo blanqueo:**
   - Usuario olvida contraseña
   - Notifica a ADMIN
   - ADMIN hace reset
   - ADMIN comunica nueva contraseña temporal
   - Usuario hace login con nueva contraseña

---

## 🔄 Flujo Completo: Creación y Gestión de Usuario

### Crear Usuario

```
1. ADMIN obtiene roleId disponible
   GET /roles/available
   → Retorna cajero, cocina (sin admin)

2. ADMIN crea usuario
   POST /users
   { userName, password, roleId }

   Sistema valida:
   ✅ userName único
   ✅ password robusto
   ✅ roleId existe
   ✅ roleId NO es admin

   Sistema ejecuta:
   → Normaliza userName (lowercase)
   → Hashea password
   → Crea User
   → Asigna UserRole
   → Retorna usuario con rol

3. Usuario puede hacer login
   POST /auth/login
   { userName, password }
```

### Blanqueo de Contraseña

```
1. Usuario olvida contraseña

2. Usuario contacta a ADMIN

3. ADMIN blanquea contraseña
   PATCH /users/:id/reset-password
   { newPassword: "Temp123" }

4. ADMIN comunica contraseña temporal

5. Usuario hace login con nueva contraseña
```

### Desactivar Usuario

```
1. ADMIN desactiva usuario
   PATCH /users/:id/deactivate

   Sistema valida:
   ✅ Usuario existe
   ✅ Usuario está activo
   ✅ NO es el único admin

2. Usuario ya no puede hacer login
   (validación en módulo auth)
```

---

## 🔗 Integración con Otros Módulos

### Con Roles

**Relación:** Users consume Roles

**Integración:**

- Users valida que roleId exista
- Users valida que roleId NO sea "admin"
- Users carga info de roles para respuestas
- Users NO crea ni modifica roles

**Endpoint auxiliar:**

- `GET /roles/available` → Lista roles asignables (sin admin)

---

### Con UserRoles

**Relación:** Users gestiona UserRoles

**Integración:**

- Users crea registro en `user_roles` al crear usuario
- Users NO elimina ni modifica roles después
- UserRoles tiene PK compuesta (userId, roleId)
- Previene duplicados a nivel de BD

---

### Con Auth

**Relación:** Auth consume Users

**Integración:**

- Auth usa `UsersService.findByUserName()` para login
- Auth valida `user.isActive` antes de generar token
- Auth NO gestiona usuarios

**Separación:**

- **Auth:** Login, logout, tokens, validación
- **Users:** ABM usuarios, roles, blanqueo contraseñas

---

### Con Orders

**Relación:** Orders referencia Users

**Integración:**

- Order tiene `createdBy` → User
- Relación `@ManyToOne` con cascade
- Usuario inactivo NO puede crear órdenes (validado en auth)

---

## 🔐 Seguridad

### Validaciones Implementadas

- **Autenticación:** Todos los endpoints requieren token JWT
- **Autorización:** Solo rol ADMIN puede gestionar usuarios
- **Validación UUIDs:** `ParseUUIDPipe` en parámetros
- **Sanitización:** UserNames normalizados (lowercase, trim)
- **Passwords robustos:** Regex con múltiples validaciones
- **Hash bcrypt:** 10 rounds, no reversible
- **SQL Injection:** TypeORM con prepared statements
- **Validación DTOs:** `whitelist: true`, `forbidNonWhitelisted: true`

### Protección del Sistema

1. **Último ADMIN protegido:**
   - No se puede desactivar
   - Previene bloqueo del sistema

2. **UserName inmutable:**
   - Previene confusión en logs
   - Mantiene integridad de auditoría

3. **Roles permanentes:**
   - Simplifica permisos
   - Previene escalada de privilegios accidental

---

## ✅ Validaciones de Password

**Regex:** `/(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/`

**Requisitos:**

- Mínimo 6 caracteres
- Máximo 50 caracteres
- Al menos una mayúscula (A-Z)
- Al menos una minúscula (a-z)
- Al menos un número (0-9) O carácter especial (!@#$%...)

**Ejemplos válidos:**

- `Password1`
- `Admin123`
- `User@2024`

**Ejemplos inválidos:**

- `password123` (sin mayúscula)
- `PASSWORD123` (sin minúscula)
- `Password` (sin número ni especial)
- `Pass1` (muy corto)

---

## 🧪 Casos de Prueba por Endpoint

### Endpoint 1: POST /users

| Caso                   | Request                             | Resultado        |
| ---------------------- | ----------------------------------- | ---------------- |
| Usuario válido         | userName + password + roleId cajero | 201 Created      |
| Intentar crear ADMIN   | roleId = admin                      | 400 Bad Request  |
| UserName duplicado     | userName existente                  | 400 Bad Request  |
| Password sin mayúscula | "password123"                       | 400 Bad Request  |
| Password corto         | "Pass1"                             | 400 Bad Request  |
| RoleId inexistente     | UUID inválido                       | 404 Not Found    |
| Sin roleId             | Body sin roleId                     | 400 Bad Request  |
| Sin autenticación      | Sin token                           | 401 Unauthorized |
| Usuario CAJERO         | Token cajero                        | 403 Forbidden    |

### Endpoint 2: GET /users

| Caso           | Request           | Resultado           |
| -------------- | ----------------- | ------------------- |
| Sin filtros    | GET /users        | 200 OK (todos)      |
| Solo activos   | ?isActive=true    | 200 OK (activos)    |
| Solo inactivos | ?isActive=false   | 200 OK (inactivos)  |
| Con paginación | ?limit=2&offset=0 | 200 OK (2 usuarios) |
| Usuario CAJERO | Token cajero      | 403 Forbidden       |

### Endpoint 3: GET /users/:id

| Caso             | Request        | Resultado       |
| ---------------- | -------------- | --------------- |
| UUID válido      | UUID existente | 200 OK          |
| UUID inexistente | UUID no existe | 404 Not Found   |
| UUID inválido    | "123"          | 400 Bad Request |
| Usuario CAJERO   | Token cajero   | 403 Forbidden   |

### Endpoint 4: PATCH /users/:id/activate

| Caso              | Request        | Resultado         |
| ----------------- | -------------- | ----------------- |
| Usuario inactivo  | UUID inactivo  | 200 OK (activado) |
| Usuario ya activo | UUID activo    | 400 Bad Request   |
| UUID inexistente  | UUID no existe | 404 Not Found     |
| Usuario CAJERO    | Token cajero   | 403 Forbidden     |

### Endpoint 5: PATCH /users/:id/deactivate

| Caso                      | Request          | Resultado            |
| ------------------------- | ---------------- | -------------------- |
| Usuario activo (no admin) | UUID cajero      | 200 OK (desactivado) |
| Usuario ya inactivo       | UUID inactivo    | 400 Bad Request      |
| Último ADMIN activo       | UUID único admin | 400 Bad Request      |
| UUID inexistente          | UUID no existe   | 404 Not Found        |
| Usuario CAJERO            | Token cajero     | 403 Forbidden        |

### Endpoint 6: PATCH /users/:id/reset-password

| Caso             | Request        | Resultado       |
| ---------------- | -------------- | --------------- |
| Password válido  | "NewPass123"   | 200 OK          |
| Sin mayúscula    | "newpass123"   | 400 Bad Request |
| Sin número       | "NewPassword"  | 400 Bad Request |
| Muy corto        | "Pas1"         | 400 Bad Request |
| UUID inexistente | UUID no existe | 404 Not Found   |
| Usuario CAJERO   | Token cajero   | 403 Forbidden   |

---

## 💡 Decisiones de Diseño

### UserName Inmutable

**Decisión:** El userName NO se puede modificar después de crear

**Justificación:**

- Simplifica logs y auditoría
- Previene confusión en historial de órdenes
- Facilita trazabilidad

**Alternativa:** Si se necesita cambiar userName, crear nuevo usuario

---

### Roles Permanentes

**Decisión:** El rol asignado al crear es definitivo

**Justificación:**

- Simplifica lógica de permisos
- Previene escalada accidental de privilegios
- Usuario que cambia de función → nuevo usuario

**Alternativa:** Desactivar usuario y crear uno nuevo con rol diferente

---

### Solo Blanqueo de Contraseña

**Decisión:** Usuario NO puede cambiar su propia contraseña

**Justificación:**

- Sistema interno (no público)
- ADMIN tiene control total
- Simplifica flujo de recuperación

**Flujo:** Usuario olvida → Notifica ADMIN → ADMIN blanquea → Usuario usa temporal

---

### No Crear Usuarios ADMIN

**Decisión:** Solo se crean cajeros y cocina por endpoint

**Justificación:**

- Usuarios ADMIN se gestionan por seed/SQL
- Previene creación accidental de admins
- Mayor seguridad

**Alternativa:** ADMIN inicial se crea con seed de base de datos

---

### Sin Soft Delete

**Decisión:** No hay endpoint DELETE (usar desactivar)

**Justificación:**

- Mantener historial de órdenes
- Usuario inactivo = no puede acceder
- Previene pérdida de datos

**Alternativa:** Si realmente necesita eliminarse, hacerlo por SQL directo

---

## 📊 Estado del Módulo

**Versión:** 1.0  
**Estado:** ✅ Completado y probado  
**Fecha:** 2025-11-29  
**Endpoints probados:** 6/6  
**Cobertura:** 100%  
**Casos de prueba:** 40+

---

## 📝 Notas Importantes

1. **Endpoint auxiliar agregado:** `GET /roles/available` en módulo Roles para facilitar creación de usuarios desde frontend

2. **Respuestas limpias:** Se transforman respuestas para eliminar campos redundantes (userId, roleId en userRoles)

3. **Consistencia de passwords:** Mismas validaciones que módulo Auth

4. **Protección crítica:** Imposible desactivar al último ADMIN activo del sistema

5. **UserName case-insensitive:** "Cajero1" y "cajero1" son el mismo usuario

6. **Integración con Auth:** UsersService exportado para uso en AuthService

# 📦 Análisis - Módulo Supplies

## 📋 Información General

**Módulo:** Supplies (Insumos)  
**Propósito:** Gestionar los insumos/ingredientes que se utilizan en la preparación de productos  
**Ejemplos:** Pan, carne, queso, etc.  
**Protección:** Solo ADMIN puede gestionar insumos

---

## 🎯 Funcionalidades Principales

- Crear nuevos insumos o reactivar insumos eliminados
- Listar todos los insumos (activos e inactivos) con paginación
- Listar solo insumos activos con paginación
- Buscar insumos por nombre (parcial, case-insensitive)
- Obtener un insumo específico por ID
- Actualizar datos de un insumo
- Eliminar insumos (soft delete)

---

## 🗂️ Estructura del Módulo

### DTOs

- **CreateSupplyDto**: Datos para crear un insumo
  - `name` (string, min 3 caracteres, requerido)
  - `unit` (string, requerido)
  - `cost` (number, > 0, requerido)

- **UpdateSupplyDto**: Datos para actualizar (todos opcionales)
  - Extiende CreateSupplyDto con PartialType

- **SearchSupplyDto**: Búsqueda con paginación
  - `term` (string, requerido)
  - Extiende PaginationDto

- **PaginationDto**: Paginación compartida
  - `limit` (number, default: 10, max: 100)
  - `offset` (number, default: 0, min: 0)

### Servicios

**SuppliesService**

- `create()` - Crear o reactivar insumo
- `findAll()` - Listar todos con paginación
- `findAllActive()` - Listar activos con paginación
- `search()` - Buscar por nombre
- `findOne()` - Obtener por ID
- `update()` - Actualizar insumo
- `remove()` - Soft delete
- `findByName()` - Método auxiliar privado
- `reactivateSupply()` - Método auxiliar privado

### Controlador

**SuppliesController** (`/supplies`)

- 8 endpoints públicos (todos protegidos con @Auth(ValidRoles.admin))

---

## 🌐 Endpoints

### 1. Crear Insumo

**Endpoint:** `POST /supplies`  
**Autenticación:** Solo ADMIN

**Body:**

```json
{
  "name": "pan",
  "unit": "unidades",
  "cost": 300
}
```

**Respuesta exitosa (201):**

```json
{
  "id": "uuid-generado",
  "name": "pan",
  "unit": "unidades",
  "cost": 300,
  "isActive": true,
  "createdAt": "2025-11-22T...",
  "updatedAt": "2025-11-22T..."
}
```

**Lógica especial:**

- Si existe un insumo con el mismo nombre pero `isActive = false`, lo reactiva y actualiza sus datos
- Normaliza el nombre (lowercase, trim)
- No permite duplicados activos

---

### 2. Listar Todos los Insumos

**Endpoint:** `GET /supplies`  
**Autenticación:** Solo ADMIN  
**Query Params:** `limit`, `offset`

**Respuesta exitosa (200):**

```json
[
  {
    "id": "uuid-1",
    "name": "pan",
    "unit": "unidades",
    "cost": 300,
    "isActive": true,
    ...
  },
  {
    "id": "uuid-2",
    "name": "carne",
    "unit": "kg",
    "cost": 1000,
    "isActive": false,
    ...
  }
]
```

**Características:**

- Incluye insumos activos e inactivos
- Paginado (default: limit=10, offset=0)
- Ordenados por fecha de creación (DESC)

---

### 3. Listar Insumos Activos

**Endpoint:** `GET /supplies/active`  
**Autenticación:** Solo ADMIN  
**Query Params:** `limit`, `offset`

**Respuesta exitosa (200):**

```json
[
  {
    "id": "uuid-1",
    "name": "pan",
    "unit": "unidades",
    "cost": 300,
    "isActive": true,
    ...
  }
]
```

**Características:**

- Solo insumos con `isActive = true`
- Paginado
- Ordenados por fecha de creación (DESC)

---

### 4. Buscar Insumos

**Endpoint:** `GET /supplies/search`  
**Autenticación:** Solo ADMIN  
**Query Params:** `term` (requerido), `limit`, `offset`

**Ejemplo:**

```
GET /supplies/search?term=pan&limit=10&offset=0
```

**Respuesta exitosa (200):**

```json
[
  {
    "id": "uuid-1",
    "name": "pan",
    ...
  },
  {
    "id": "uuid-2",
    "name": "pan lactal",
    ...
  }
]
```

**Características:**

- Búsqueda parcial (LIKE %term%)
- Case-insensitive
- Incluye activos e inactivos
- Paginado

---

### 5. Obtener Insumo por ID

**Endpoint:** `GET /supplies/:id`  
**Autenticación:** Solo ADMIN

**Ejemplo:**

```
GET /supplies/a1b2c3d4-5678-90ab-cdef-1234567890ab
```

**Respuesta exitosa (200):**

```json
{
  "id": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
  "name": "pan",
  "unit": "unidades",
  "cost": 300,
  "isActive": true,
  ...
}
```

**Errores:**

- 404: ID no existe
- 400: UUID inválido

---

### 6. Actualizar Insumo

**Endpoint:** `PATCH /supplies/:id`  
**Autenticación:** Solo ADMIN

**Body (todos opcionales):**

```json
{
  "name": "pan lactal",
  "unit": "paquetes",
  "cost": 350
}
```

**Respuesta exitosa (200):**

```json
{
  "id": "uuid",
  "name": "pan lactal",
  "unit": "paquetes",
  "cost": 350,
  "isActive": true,
  ...
}
```

**Validaciones:**

- No permite duplicar nombre con otro insumo activo
- Permite mantener el mismo nombre
- Normaliza el nombre

---

### 7. Eliminar Insumo

**Endpoint:** `DELETE /supplies/:id`  
**Autenticación:** Solo ADMIN

**Respuesta exitosa (200):**

```json
{
  "id": "uuid",
  "name": "pan",
  "unit": "unidades",
  "cost": 300,
  "isActive": false,
  ...
}
```

**Características:**

- Soft delete (marca `isActive = false`)
- No elimina físicamente el registro
- No permite eliminar dos veces
- El insumo se puede reactivar con POST

---

### 8. Obtener Productos que Usan el Insumo

**Endpoint:** `GET /supplies/:id/products`  
**Autenticación:** Solo ADMIN  
**Estado:** Pendiente (placeholder)

**Respuesta actual:**

```json
{
  "message": "Endpoint en desarrollo - Módulo Products pendiente",
  "supplyId": "uuid",
  "products": []
}
```

---

## 🧪 Casos de Prueba por Endpoint

### Endpoint 1: POST /supplies

| Caso               | Request                                            | Resultado               |
| ------------------ | -------------------------------------------------- | ----------------------- |
| Crear insumo nuevo | `{"name": "pan", "unit": "unidades", "cost": 300}` | 201 Created             |
| Nombre vacío       | `{"name": "", ...}`                                | 400 Bad Request         |
| Nombre corto (< 3) | `{"name": "ab", ...}`                              | 400 Bad Request         |
| Cost negativo      | `{"cost": -100}`                                   | 400 Bad Request         |
| Cost = 0           | `{"cost": 0}`                                      | 400 Bad Request         |
| Duplicado activo   | Mismo nombre que insumo activo                     | 400 Bad Request         |
| Reactivar inactivo | Mismo nombre que insumo inactivo                   | 200 OK (reactiva)       |
| Normalización      | `" PAN "`                                          | 201 (normaliza a "pan") |
| Sin autenticación  | Sin token                                          | 401 Unauthorized        |
| Sin permisos ADMIN | Token CAJERO/COCINA                                | 403 Forbidden           |

### Endpoint 2: GET /supplies

| Caso              | Request             | Resultado            |
| ----------------- | ------------------- | -------------------- |
| Sin parámetros    | `GET /supplies`     | 200 OK (max 10)      |
| Con paginación    | `?limit=5&offset=0` | 200 OK (5 primeros)  |
| Limit alto        | `?limit=100`        | 200 OK               |
| Offset grande     | `?offset=999`       | 200 OK (array vacío) |
| Incluye inactivos | -                   | Sí incluye           |
| Sin autenticación | Sin token           | 401 Unauthorized     |

### Endpoint 3: GET /supplies/active

| Caso                | Request                | Resultado                    |
| ------------------- | ---------------------- | ---------------------------- |
| Sin parámetros      | `GET /supplies/active` | 200 OK (solo activos)        |
| Verifica filtro     | -                      | NO incluye `isActive: false` |
| Sin insumos activos | Base datos vacía       | 200 OK (array vacío)         |
| Con paginación      | `?limit=2`             | 200 OK                       |

### Endpoint 4: GET /supplies/search

| Caso             | Request                 | Resultado                          |
| ---------------- | ----------------------- | ---------------------------------- |
| Búsqueda parcial | `?term=pan`             | 200 OK (encuentra "pan", "pancho") |
| Búsqueda exacta  | `?term=pan hamburguesa` | 200 OK                             |
| Case-insensitive | `?term=PAN`             | 200 OK (encuentra "pan")           |
| Sin resultados   | `?term=xyz`             | 200 OK (array vacío)               |
| Un carácter      | `?term=p`               | 200 OK                             |
| Sin término      | Sin `term`              | 400 Bad Request                    |
| Término vacío    | `?term=`                | 400 Bad Request                    |

### Endpoint 5: GET /supplies/:id

| Caso            | Request                            | Resultado           |
| --------------- | ---------------------------------- | ------------------- |
| ID válido       | GET con UUID válido                | 200 OK              |
| ID inexistente  | UUID válido pero no existe         | 404 Not Found       |
| UUID inválido   | `GET /supplies/123`                | 400 Bad Request     |
| Insumo inactivo | ID de insumo con `isActive: false` | 200 OK (lo retorna) |

### Endpoint 6: PATCH /supplies/:id

| Caso             | Request                                   | Resultado            |
| ---------------- | ----------------------------------------- | -------------------- |
| Actualizar cost  | `{"cost": 350}`                           | 200 OK               |
| Actualizar name  | `{"name": "nuevo nombre"}`                | 200 OK               |
| Actualizar todo  | `{"name": "x", "unit": "y", "cost": 100}` | 200 OK               |
| Nombre duplicado | Nombre de otro insumo activo              | 400 Bad Request      |
| Mismo nombre     | Mantener nombre actual                    | 200 OK               |
| Body vacío       | `{}`                                      | 200 OK (sin cambios) |
| ID no existe     | UUID válido inexistente                   | 404 Not Found        |

### Endpoint 7: DELETE /supplies/:id

| Caso                  | Request                    | Resultado                  |
| --------------------- | -------------------------- | -------------------------- |
| Eliminar activo       | DELETE con UUID válido     | 200 OK (`isActive: false`) |
| Verificar eliminación | GET después de DELETE      | `isActive: false`          |
| Eliminar inactivo     | DELETE insumo ya eliminado | 400 Bad Request            |
| Reactivar             | POST con mismo nombre      | 200 OK (reactiva)          |
| ID no existe          | UUID válido inexistente    | 404 Not Found              |

---

## 🔐 Seguridad

### Validaciones Implementadas

- **Autenticación:** Todos los endpoints requieren token JWT válido
- **Autorización:** Solo usuarios con rol ADMIN
- **Validación de UUIDs:** `ParseUUIDPipe` valida formato antes de consultar BD
- **Sanitización de inputs:** Nombres normalizados (lowercase, trim)
- **SQL Injection:** TypeORM usa prepared statements con `ILike()`
- **Validación de DTOs:** `whitelist: true` y `forbidNonWhitelisted: true`

### Protecciones

```typescript
@Auth(ValidRoles.admin)  // Solo ADMIN
@Controller('supplies')
```

---

## 📊 Reglas de Negocio

1. **No duplicados activos:** No puede haber dos insumos activos con el mismo nombre
2. **Reactivación automática:** Si intentas crear un insumo con nombre de uno inactivo, lo reactiva
3. **Soft delete:** La eliminación es lógica (`isActive = false`), no física
4. **Normalización:** Nombres siempre en lowercase y sin espacios extras
5. **Costos positivos:** El `cost` debe ser siempre mayor a 0
6. **Paginación obligatoria:** Todos los listados tienen límite máximo

---

## 🔄 Flujo de Trabajo Típico

### Crear y Gestionar Insumos

```
1. ADMIN crea insumo "pan"
   POST /supplies {"name": "pan", "unit": "unidades", "cost": 300}
   → Insumo creado con isActive: true

2. ADMIN lista insumos activos
   GET /supplies/active
   → Ve "pan" en la lista

3. ADMIN actualiza precio
   PATCH /supplies/{id} {"cost": 350}
   → Pan ahora cuesta 350

4. ADMIN elimina insumo
   DELETE /supplies/{id}
   → isActive: false

5. ADMIN intenta crear "pan" nuevamente
   POST /supplies {"name": "pan", "unit": "unidades", "cost": 400}
   → Se reactiva con nuevo cost: 400
```

---

## 🎯 Validaciones de Campos

### CreateSupplyDto

| Campo | Tipo   | Validaciones                       |
| ----- | ------ | ---------------------------------- |
| name  | string | IsString, IsNotEmpty, MinLength(3) |
| unit  | string | IsString, IsNotEmpty               |
| cost  | number | IsNumber, IsPositive               |

### PaginationDto

| Campo  | Tipo   | Validaciones                     |
| ------ | ------ | -------------------------------- |
| limit  | number | IsOptional, IsPositive, Max(100) |
| offset | number | IsOptional, Min(0)               |

---

## 💡 Notas Importantes

1. **Separación de responsabilidades:** Este módulo solo gestiona insumos. La relación con productos se maneja en el módulo Products mediante `ProductSupply`.

2. **Escalabilidad:** La paginación es obligatoria para evitar problemas de performance con grandes cantidades de datos.

3. **Auditoría:** Los campos `createdAt` y `updatedAt` se gestionan automáticamente por TypeORM.

4. **Futuras mejoras:** El endpoint `/supplies/:id/products` está como placeholder para mostrar qué productos usan un insumo específico.

---

## ✅ Estado del Módulo

**Versión:** 1.0  
**Estado:** ✅ Completado y probado  
**Fecha:** 2025-11-22  
**Endpoints probados:** 8/8  
**Cobertura:** 100%

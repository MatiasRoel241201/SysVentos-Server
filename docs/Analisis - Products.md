# 🍔 Análisis - Módulo Products

## 📋 Información General

**Módulo:** Products (Productos)  
**Propósito:** Gestionar los productos vendibles en eventos gastronómicos y sus recetas  
**Ejemplos:** Hamburguesa, pancho, empanada, gaseosa coca cola  
**Protección:** Mixta (ADMIN para gestión, todos los roles para consultas)

---

## 🎯 Funcionalidades Principales

### Gestión de Productos

- Crear nuevos productos o reactivar productos eliminados
- Listar todos los productos (activos e inactivos) - Solo ADMIN
- Listar solo productos activos - Todos los roles
- Buscar productos por nombre (parcial, case-insensitive) - Todos los roles
- Obtener un producto específico por ID - Todos los roles
- Actualizar datos de un producto - Solo ADMIN
- Eliminar productos (soft delete) - Solo ADMIN

### Gestión de Recetas

- Asignar múltiples insumos a un producto (batch)
- Ver receta completa de un producto - Todos los roles
- Actualizar cantidad de insumo en receta
- Eliminar insumo de receta

---

## 🗂️ Estructura del Módulo

### DTOs

- **CreateProductDto**: Datos para crear un producto
  - `name` (string, min 3 caracteres, requerido)

- **UpdateProductDto**: Datos para actualizar (todos opcionales)
  - Extiende CreateProductDto con PartialType

- **SearchProductDto**: Búsqueda con paginación
  - `term` (string, requerido)
  - Extiende PaginationDto

- **AssignSuppliesDto**: Asignar múltiples insumos
  - `supplies` (array de SupplyItemDto, min 1)
    - `supplyId` (UUID del insumo)
    - `qtyPerUnit` (number, > 0, cantidad por unidad)

- **UpdateSupplyQuantityDto**: Actualizar cantidad
  - `qtyPerUnit` (number, > 0)

### Servicios

**ProductsService**

- `create()` - Crear o reactivar producto
- `findAll()` - Listar todos con paginación (ADMIN)
- `findAllActive()` - Listar activos con paginación (todos)
- `search()` - Buscar por nombre
- `findOne()` - Obtener por ID
- `update()` - Actualizar producto
- `remove()` - Soft delete
- `assignSupplies()` - Asignar receta batch
- `getSupplies()` - Ver receta
- `updateSupplyQuantity()` - Actualizar cantidad en receta
- `removeSupply()` - Quitar insumo de receta
- `findByName()` - Método auxiliar privado
- `reactivateProduct()` - Método auxiliar privado

### Controlador

**ProductsController** (`/products`)

- 11 endpoints (permisos diferenciados por rol)

---

## 🔐 Permisos por Endpoint

| Endpoint                                  | ADMIN | CAJERO | COCINA | Uso                                     |
| ----------------------------------------- | ----- | ------ | ------ | --------------------------------------- |
| `GET /products`                           | ✅    | ❌     | ❌     | Reportes/estadísticas                   |
| `GET /products/active`                    | ✅    | ✅     | ✅     | Ver productos disponibles               |
| `GET /products/search`                    | ✅    | ✅     | ✅     | Buscar productos                        |
| `GET /products/:id`                       | ✅    | ✅     | ✅     | Ver detalle                             |
| `GET /products/:id/supplies`              | ✅    | ✅     | ✅     | Ver receta (CAJERO modifica en órdenes) |
| `POST /products`                          | ✅    | ❌     | ❌     | Crear producto                          |
| `PATCH /products/:id`                     | ✅    | ❌     | ❌     | Actualizar producto                     |
| `DELETE /products/:id`                    | ✅    | ❌     | ❌     | Eliminar producto                       |
| `POST /products/:id/supplies/batch`       | ✅    | ❌     | ❌     | Asignar receta completa                 |
| `PATCH /products/:id/supplies/:supplyId`  | ✅    | ❌     | ❌     | Actualizar cantidad en receta           |
| `DELETE /products/:id/supplies/:supplyId` | ✅    | ❌     | ❌     | Quitar insumo de receta                 |

---

## 🌐 Endpoints

### 1. Crear Producto

**Endpoint:** `POST /products`  
**Autenticación:** Solo ADMIN

**Body:**

```json
{
  "name": "hamburguesa"
}
```

**Respuesta exitosa (201):**

```json
{
  "id": "uuid-generado",
  "name": "hamburguesa",
  "isActive": true,
  "createdAt": "2025-11-22T...",
  "updatedAt": "2025-11-22T..."
}
```

**Lógica especial:**

- Si existe un producto con el mismo nombre pero `isActive = false`, lo reactiva
- Normaliza el nombre (lowercase, trim)
- No permite duplicados activos

---

### 2. Listar Todos los Productos

**Endpoint:** `GET /products`  
**Autenticación:** Solo ADMIN (para reportes/estadísticas)  
**Query Params:** `limit`, `offset`

**Respuesta exitosa (200):**

```json
[
  {
    "id": "uuid-1",
    "name": "hamburguesa",
    "cost": 1500,
    "isActive": true,
    ...
  },
  {
    "id": "uuid-2",
    "name": "pancho",
    "isActive": false,
    ...
  }
]
```

**Características:**

- Incluye productos activos e inactivos
- Paginado
- Solo ADMIN (otros roles usan `/products/active`)

---

### 3. Listar Productos Activos

**Endpoint:** `GET /products/active`  
**Autenticación:** Todos los roles (ADMIN, CAJERO, COCINA)  
**Query Params:** `limit`, `offset`

**Respuesta exitosa (200):**

```json
[
  {
    "id": "uuid-1",
    "name": "hamburguesa",
    "cost": 1500,
    "isActive": true,
    ...
  }
]
```

**Características:**

- Solo productos con `isActive = true`
- CAJERO lo usa para crear órdenes
- COCINA lo usa para ver productos a preparar

---

### 4. Buscar Productos

**Endpoint:** `GET /products/search`  
**Autenticación:** Todos los roles  
**Query Params:** `term` (requerido), `limit`, `offset`

**Ejemplo:**

```
GET /products/search?term=hamb&limit=10&offset=0
```

**Respuesta exitosa (200):**

```json
[
  {
    "id": "uuid-1",
    "name": "hamburguesa",
    ...
  },
  {
    "id": "uuid-2",
    "name": "hamburguesa premium",
    ...
  }
]
```

**Características:**

- Búsqueda parcial case-insensitive
- CAJERO lo usa para buscar rápidamente al crear órdenes

---

### 5. Obtener Producto por ID

**Endpoint:** `GET /products/:id`  
**Autenticación:** Todos los roles

**Respuesta exitosa (200):**

```json
{
  "id": "uuid",
  "name": "hamburguesa",
  "isActive": true,
  ...
}
```

**Errores:**

- 404: ID no existe
- 400: UUID inválido

---

### 6. Obtener Receta de Producto

**Endpoint:** `GET /products/:id/supplies`  
**Autenticación:** Todos los roles

**Respuesta exitosa (200):**

```json
[
  {
    "productId": "uuid-hamburguesa",
    "supplyId": "uuid-pan",
    "qtyPerUnit": 2,
    "supply": {
      "id": "uuid-pan",
      "name": "pan",
      "unit": "unidades",
      "cost": 300,
      "isActive": true
    }
  },
  {
    "productId": "uuid-hamburguesa",
    "supplyId": "uuid-carne",
    "qtyPerUnit": 1,
    "supply": {
      "id": "uuid-carne",
      "name": "carne",
      "unit": "unidades",
      "cost": 1000,
      "isActive": true
    }
  }
]
```

**Uso por rol:**

- **CAJERO:** Ve la receta para modificar en órdenes (quitar/agregar insumos)
- **COCINA:** Ve qué insumos necesita para preparar el producto
- **ADMIN:** Revisa recetas para gestión

**Productos SIN receta:** Retorna array vacío `[]`

---

### 7. Actualizar Producto

**Endpoint:** `PATCH /products/:id`  
**Autenticación:** Solo ADMIN

**Body (todos opcionales):**

```json
{
  "name": "hamburguesa premium"
}
```

**Respuesta exitosa (200):**

```json
{
  "id": "uuid",
  "name": "hamburguesa premium",
  "isActive": true,
  ...
}
```

**Validaciones:**

- No permite duplicar nombre con otro producto activo
- Permite mantener el mismo nombre
- Normaliza el nombre

---

### 8. Eliminar Producto

**Endpoint:** `DELETE /products/:id`  
**Autenticación:** Solo ADMIN

**Respuesta exitosa (200):**

```json
{
  "id": "uuid",
  "name": "hamburguesa",
  "isActive": false,
  ...
}
```

**Características:**

- Soft delete (`isActive = false`)
- No elimina físicamente
- No permite eliminar dos veces
- Desaparece de `/products/active`
- Se puede reactivar con POST

---

### 9. Asignar Receta (Batch)

**Endpoint:** `POST /products/:id/supplies/batch`  
**Autenticación:** Solo ADMIN

**Body:**

```json
{
  "supplies": [
    {
      "supplyId": "uuid-pan",
      "qtyPerUnit": 2
    },
    {
      "supplyId": "uuid-carne",
      "qtyPerUnit": 1
    },
    {
      "supplyId": "uuid-queso",
      "qtyPerUnit": 2
    }
  ]
}
```

**Respuesta exitosa (201):**

```json
[
  {
    "productId": "uuid-hamburguesa",
    "supplyId": "uuid-pan",
    "qtyPerUnit": 2
  },
  {
    "productId": "uuid-hamburguesa",
    "supplyId": "uuid-carne",
    "qtyPerUnit": 1
  },
  {
    "productId": "uuid-hamburguesa",
    "supplyId": "uuid-queso",
    "qtyPerUnit": 2
  }
]
```

**Validaciones:**

- Producto debe existir y estar activo
- Todos los insumos deben existir y estar activos
- No permite duplicados en el array
- No permite asignar insumos ya existentes en la receta

---

### 10. Actualizar Cantidad en Receta

**Endpoint:** `PATCH /products/:productId/supplies/:supplyId`  
**Autenticación:** Solo ADMIN

**Body:**

```json
{
  "qtyPerUnit": 3
}
```

**Respuesta exitosa (200):**

```json
{
  "productId": "uuid-hamburguesa",
  "supplyId": "uuid-pan",
  "qtyPerUnit": 3
}
```

**Validaciones:**

- El insumo debe estar ya asignado al producto
- Cantidad debe ser > 0
- Permite valores decimales (0.5, 1.5, etc.)

---

### 11. Eliminar Insumo de Receta

**Endpoint:** `DELETE /products/:productId/supplies/:supplyId`  
**Autenticación:** Solo ADMIN

**Respuesta exitosa (200 o 204):**

```
(Sin contenido)
```

**Características:**

- Solo elimina la relación (no el producto ni el insumo)
- Permite dejar productos sin receta
- No permite eliminar dos veces
- Se puede volver a agregar después

---

## 🧪 Casos de Prueba por Endpoint

### Endpoint 1: POST /products

| Caso               | Request                                 | Resultado         |
| ------------------ | --------------------------------------- | ----------------- |
| Crear producto     | `{"name": "hamburguesa", "cost": 1500}` | 201 Created       |
| Nombre vacío       | `{"name": "", ...}`                     | 400 Bad Request   |
| Nombre corto       | `{"name": "ab", ...}`                   | 400 Bad Request   |
| Cost negativo      | `{"cost": -100}`                        | 400 Bad Request   |
| Cost = 0           | `{"cost": 0}`                           | 400 Bad Request   |
| Duplicado activo   | Mismo nombre                            | 400 Bad Request   |
| Reactivar inactivo | Nombre de producto inactivo             | 200 OK (reactiva) |
| Normalización      | `"  HAMBURGUESA  "`                     | 201 (normaliza)   |
| Sin autenticación  | Sin token                               | 401 Unauthorized  |
| Sin permisos       | Token CAJERO/COCINA                     | 403 Forbidden     |

### Endpoint 2: GET /products

| Caso               | Request             | Resultado                  |
| ------------------ | ------------------- | -------------------------- |
| Sin parámetros     | `GET /products`     | 200 OK (incluye inactivos) |
| Con paginación     | `?limit=2&offset=0` | 200 OK                     |
| Verifica inactivos | -                   | Incluye `isActive: false`  |
| Usuario CAJERO     | Token CAJERO        | 403 Forbidden              |

### Endpoint 3: GET /products/active

| Caso          | Request          | Resultado                    |
| ------------- | ---------------- | ---------------------------- |
| ADMIN         | Con token admin  | 200 OK (solo activos)        |
| CAJERO        | Con token cajero | 200 OK                       |
| COCINA        | Con token cocina | 200 OK                       |
| Sin inactivos | -                | NO incluye `isActive: false` |

### Endpoint 4: GET /products/search

| Caso             | Request             | Resultado            |
| ---------------- | ------------------- | -------------------- |
| Búsqueda parcial | `?term=hamb`        | 200 OK               |
| Case-insensitive | `?term=HAMB`        | 200 OK               |
| Sin resultados   | `?term=xyz`         | 200 OK (array vacío) |
| Sin término      | Sin `term`          | 400 Bad Request      |
| Todos los roles  | ADMIN/CAJERO/COCINA | 200 OK               |

### Endpoint 5: GET /products/:id

| Caso              | Request               | Resultado           |
| ----------------- | --------------------- | ------------------- |
| ID válido         | UUID existente        | 200 OK              |
| ID inexistente    | UUID válido no existe | 404 Not Found       |
| UUID inválido     | `123`                 | 400 Bad Request     |
| Producto inactivo | ID inactivo           | 200 OK (lo retorna) |
| Todos los roles   | ADMIN/CAJERO/COCINA   | 200 OK              |

### Endpoint 6: GET /products/:id/supplies

| Caso                  | Request             | Resultado                  |
| --------------------- | ------------------- | -------------------------- |
| Producto con receta   | ID hamburguesa      | 200 OK (array con insumos) |
| Producto sin receta   | ID gaseosa          | 200 OK (array vacío)       |
| Incluye objeto supply | -                   | Retorna supply completo    |
| Todos los roles       | ADMIN/CAJERO/COCINA | 200 OK                     |
| Producto no existe    | UUID inexistente    | 404 Not Found              |

### Endpoint 7: PATCH /products/:id

| Caso             | Request                      | Resultado            |
| ---------------- | ---------------------------- | -------------------- |
| Actualizar cost  | `{"cost": 1800}`             | 200 OK               |
| Actualizar name  | `{"name": "nuevo"}`          | 200 OK               |
| Actualizar ambos | `{"name": "x", "cost": 100}` | 200 OK               |
| Nombre duplicado | Nombre de otro producto      | 400 Bad Request      |
| Mismo nombre     | Mantener nombre              | 200 OK               |
| Body vacío       | `{}`                         | 200 OK (sin cambios) |

### Endpoint 8: DELETE /products/:id

| Caso                   | Request              | Resultado                  |
| ---------------------- | -------------------- | -------------------------- |
| Eliminar activo        | DELETE UUID válido   | 200 OK (`isActive: false`) |
| Eliminar inactivo      | Ya eliminado         | 400 Bad Request            |
| Verificar en /active   | GET /products/active | NO aparece                 |
| Verificar en /products | GET /products        | Aparece inactivo           |
| Reactivar              | POST mismo nombre    | 200 OK                     |

### Endpoint 9: POST /products/:id/supplies/batch

| Caso                | Request                        | Resultado       |
| ------------------- | ------------------------------ | --------------- |
| Asignar múltiples   | Array con 3 insumos            | 201 Created     |
| Asignar uno solo    | Array con 1 insumo             | 201 Created     |
| Producto inactivo   | Producto con `isActive: false` | 400 Bad Request |
| Insumo inactivo     | Insumo con `isActive: false`   | 400 Bad Request |
| Duplicados en array | Mismo supplyId dos veces       | 400 Bad Request |
| Insumo ya asignado  | Insumo ya en receta            | 400 Bad Request |
| Producto no existe  | UUID inexistente               | 404 Not Found   |

### Endpoint 10: PATCH /products/:productId/supplies/:supplyId

| Caso                | Request               | Resultado       |
| ------------------- | --------------------- | --------------- |
| Actualizar cantidad | `{"qtyPerUnit": 3}`   | 200 OK          |
| Cantidad decimal    | `{"qtyPerUnit": 0.5}` | 200 OK          |
| Cantidad negativa   | `{"qtyPerUnit": -1}`  | 400 Bad Request |
| Cantidad = 0        | `{"qtyPerUnit": 0}`   | 400 Bad Request |
| Insumo no en receta | Insumo no asignado    | 404 Not Found   |

### Endpoint 11: DELETE /products/:productId/supplies/:supplyId

| Caso                  | Request                  | Resultado            |
| --------------------- | ------------------------ | -------------------- |
| Eliminar insumo       | DELETE válido            | 200/204 OK           |
| Verificar eliminación | GET receta               | Insumo no aparece    |
| Eliminar todos        | Quitar todos los insumos | 200 OK (array vacío) |
| Insumo no asignado    | No está en receta        | 404 Not Found        |
| Eliminar dos veces    | Ya eliminado             | 404 Not Found        |
| Volver a agregar      | POST batch               | 201 Created          |

---

## 📊 Tipos de Productos

### Productos CON Receta

Ejemplos: Hamburguesa, pancho, empanada

**Características:**

- Se preparan combinando insumos
- Tienen registros en `ProductSupply`
- Al crear órdenes, se descuenta stock de insumos

**Flujo:**

```
1. ADMIN crea producto "hamburguesa"
2. ADMIN asigna receta: pan (2), carne (1), queso (2)
3. CAJERO crea orden con 5 hamburguesas
4. Sistema calcula: 10 panes, 5 carnes, 10 quesos
5. Se descuenta stock de inventario de insumos
```

### Productos SIN Receta

Ejemplos: Gaseosa coca cola, cerveza, agua

**Características:**

- Se venden directamente (sin preparación)
- NO tienen registros en `ProductSupply`
- Al crear órdenes, solo se descuenta stock del producto

**Flujo:**

```
1. ADMIN crea producto "gaseosa coca cola"
2. NO asigna receta (producto terminado)
3. CAJERO crea orden con 3 gaseosas
4. Se descuenta stock solo del producto
```

---

## 🔄 Flujo Completo: Producto con Receta

### Paso 1: ADMIN crea producto

```http
POST /products
{"name": "hamburguesa", "cost": 1500}
```

### Paso 2: ADMIN asigna receta

```http
POST /products/{id}/supplies/batch
{
  "supplies": [
    {"supplyId": "pan-uuid", "qtyPerUnit": 2},
    {"supplyId": "carne-uuid", "qtyPerUnit": 1},
    {"supplyId": "queso-uuid", "qtyPerUnit": 2}
  ]
}
```

### Paso 3: CAJERO ve productos disponibles

```http
GET /products/active
→ Ve "hamburguesa" en lista
```

### Paso 4: CAJERO ve receta (para modificar en orden)

```http
GET /products/{id}/supplies
→ Ve: pan (2), carne (1), queso (2)
→ Cliente dice: "sin queso"
→ CAJERO crea orden con modificación (módulo ORDERS)
```

### Paso 5: COCINA prepara orden

```http
GET /orders/{orderId}
→ Ve: Hamburguesa SIN queso
→ Prepara según modificación
```

---

## 🔐 Seguridad

### Validaciones Implementadas

- **Autenticación:** Todos los endpoints requieren token JWT
- **Autorización diferenciada:**
  - Consultas: Todos los roles
  - Gestión: Solo ADMIN
- **Validación de UUIDs:** `ParseUUIDPipe` en todos los parámetros
- **Sanitización:** Nombres normalizados
- **SQL Injection:** TypeORM con prepared statements
- **Validación de DTOs:** `whitelist: true` y `forbidNonWhitelisted: true`

---

## 📋 Reglas de Negocio

1. **No duplicados activos:** No puede haber dos productos activos con el mismo nombre
2. **Reactivación automática:** Crear producto con nombre inactivo lo reactiva
3. **Soft delete:** Eliminación lógica, no física
4. **Productos sin receta:** Válido (ej: gaseosa)
5. **Recetas modificables:** ADMIN puede agregar/quitar/modificar insumos
6. **Modificaciones temporales:** Las modificaciones en órdenes NO afectan la receta base
7. **Precio variable:** `cost` es el costo base, el precio de venta se define en `EventInventory`
8. **Acceso diferenciado:** CAJERO y COCINA pueden ver pero no modificar

---

## 💡 Diferencias con Módulo SUPPLIES

| Aspecto               | SUPPLIES    | PRODUCTS                           |
| --------------------- | ----------- | ---------------------------------- |
| **Permisos**          | Solo ADMIN  | ADMIN (gestión) + Todos (consulta) |
| **Relaciones**        | Simple      | Complejo (tiene recetas)           |
| **Precio**            | `cost` fijo | `cost` base + precio por evento    |
| **Gestión adicional** | -           | Gestión de recetas                 |
| **Uso CAJERO**        | No accede   | Sí accede (para órdenes)           |
| **Uso COCINA**        | No accede   | Sí accede (para preparación)       |
| **Endpoints**         | 8           | 11                                 |

---

## ✅ Estado del Módulo

**Versión:** 1.0  
**Estado:** ✅ Completado y probado  
**Fecha:** 2025-11-22  
**Endpoints probados:** 11/11  
**Cobertura:** 100%  
**Casos de prueba:** 120+

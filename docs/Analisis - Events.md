# 🎪 Análisis - Módulo Events

## 📋 Información General

**Módulo:** Events (Eventos)  
**Propósito:** Gestionar eventos gastronómicos y su ciclo de vida completo  
**Ejemplos:** Kermese, festival, tómbola, feria  
**Protección:** Mixta (ADMIN para gestión, todos los roles para consultas)

---

## 🎯 Funcionalidades Principales

### Gestión de Eventos

- Crear nuevos eventos con validación de fechas
- Listar todos los eventos (solo ADMIN)
- Listar solo eventos activos (todos los roles)
- Buscar evento por ID
- Actualizar datos de eventos
- Eliminar eventos (soft delete)

### Gestión de Estados

- Activar eventos previamente desactivados
- Desactivar eventos temporalmente
- Cerrar eventos permanentemente (finalizado, no modificable)

### Consultas

- Ver estadísticas básicas por evento (placeholder)
- Filtrar eventos activos/inactivos/cerrados

---

## 🗂️ Estructura del Módulo

### DTOs

- **CreateEventDto**: Datos para crear un evento
  - `name` (string, min 3 caracteres, requerido)
  - `startDate` (ISO string, requerido, < endDate)
  - `endDate` (ISO string, requerido, > startDate)

- **UpdateEventDto**: Datos para actualizar (todos opcionales)
  - Extiende CreateEventDto con PartialType

### Servicios

**EventsService**

- `create()` - Crear o validar evento
- `findAll()` - Listar todos con paginación (ADMIN)
- `findAllActive()` - Listar activos con paginación (todos)
- `findOne()` - Obtener por ID
- `update()` - Actualizar evento
- `remove()` - Soft delete
- `activate()` - Activar evento
- `deactivate()` - Desactivar evento
- `close()` - Cerrar evento (finalizado)
- `getStats()` - Estadísticas básicas
- `findByName()` - Método auxiliar privado
- `validateEventDates()` - Método auxiliar privado

### Controlador

**EventsController** (`/events`)

- 10 endpoints (6 admin-only, 4 mixtos)

---

## 🔐 Permisos por Endpoint

| Endpoint                        | ADMIN | CAJERO | COCINA | Uso                       |
| ------------------------------- | ----- | ------ | ------ | ------------------------- |
| `POST /events`                  | ✅    | ❌     | ❌     | Crear evento              |
| `GET /events`                   | ✅    | ❌     | ❌     | Ver todos (reportes)      |
| `GET /events/active`            | ✅    | ✅     | ✅     | Ver activos (operaciones) |
| `GET /events/:id`               | ✅    | ✅     | ✅     | Ver detalle               |
| `PATCH /events/:id`             | ✅    | ❌     | ❌     | Actualizar                |
| `DELETE /events/:id`            | ✅    | ❌     | ❌     | Soft delete               |
| `PATCH /events/:id/activate`    | ✅    | ❌     | ❌     | Activar                   |
| `PATCH /events/:id/desactivate` | ✅    | ❌     | ❌     | Desactivar                |
| `PATCH /events/:id/close`       | ✅    | ❌     | ❌     | Cerrar                    |
| `GET /events/:id/stats`         | ✅    | ❌     | ❌     | Estadísticas              |

---

## 🌐 Endpoints

### 1. Crear Evento

**Endpoint:** `POST /events`  
**Autenticación:** Solo ADMIN

**Body:**

```json
{
  "name": "Kermese 2025",
  "startDate": "2025-12-01T10:00:00.000Z",
  "endDate": "2025-12-01T22:00:00.000Z"
}
```

**Respuesta exitosa (201):**

```json
{
  "id": "uuid-generado",
  "name": "kermese 2025",
  "startDate": "2025-12-01T10:00:00.000Z",
  "endDate": "2025-12-01T22:00:00.000Z",
  "isActive": true,
  "isClosed": false,
  "createdAt": "2025-11-23T..."
}
```

**Validaciones:**

- Normaliza nombre (lowercase, trim)
- No permite duplicados activos
- `startDate` debe ser < `endDate`
- Permite mismo día con horas diferentes

---

### 2. Listar Todos los Eventos

**Endpoint:** `GET /events`  
**Autenticación:** Solo ADMIN  
**Query Params:** `limit`, `offset`

**Respuesta exitosa (200):**

- Incluye activos, inactivos y cerrados
- Ordenados por `startDate DESC`
- Paginado

---

### 3. Listar Eventos Activos

**Endpoint:** `GET /events/active`  
**Autenticación:** Todos los roles  
**Query Params:** `limit`, `offset`

**Respuesta exitosa (200):**

- Solo eventos con `isActive: true` AND `isClosed: false`
- CAJERO y COCINA lo usan para operaciones diarias

---

### 4. Obtener Evento por ID

**Endpoint:** `GET /events/:id`  
**Autenticación:** Todos los roles

**Respuesta exitosa (200):**

- Retorna evento completo
- Incluye activos, inactivos y cerrados

---

### 5. Actualizar Evento

**Endpoint:** `PATCH /events/:id`  
**Autenticación:** Solo ADMIN

**Body (todos opcionales):**

```json
{
  "name": "Nuevo Nombre",
  "startDate": "2025-12-05T10:00:00.000Z",
  "endDate": "2025-12-05T20:00:00.000Z"
}
```

**Validaciones:**

- No permite modificar eventos cerrados
- Valida fechas con valores nuevos y existentes
- No permite duplicados con otros eventos activos
- Permite mantener el mismo nombre

---

### 6. Eliminar Evento

**Endpoint:** `DELETE /events/:id`  
**Autenticación:** Solo ADMIN

**Respuesta exitosa (200):**

- Soft delete: `isActive = false`
- No permite eliminar eventos cerrados
- No permite eliminar dos veces

---

### 7. Activar Evento

**Endpoint:** `PATCH /events/:id/activate`  
**Autenticación:** Solo ADMIN

**Respuesta exitosa (200):**

- Cambia `isActive` de `false` a `true`
- No permite activar eventos cerrados
- No permite activar eventos ya activos

---

### 8. Desactivar Evento

**Endpoint:** `PATCH /events/:id/desactivate`  
**Autenticación:** Solo ADMIN

**Respuesta exitosa (200):**

- Cambia `isActive` de `true` a `false`
- Mismo efecto que DELETE
- No permite desactivar eventos cerrados

---

### 9. Cerrar Evento

**Endpoint:** `PATCH /events/:id/close`  
**Autenticación:** Solo ADMIN

**Respuesta exitosa (200):**

```json
{
  "isActive": false,
  "isClosed": true,
  ...
}
```

**Características:**

- Estado permanente (no reversible)
- No permite cerrar dos veces
- Una vez cerrado, el evento es inmutable

---

### 10. Obtener Estadísticas Completas del Evento

**Endpoint:** `GET /events/:id/stats`  
**Autenticación:** Solo ADMIN

**Respuesta exitosa (200):**

```json
{
  "event": {
    "id": "uuid",
    "name": "kermese 2025",
    "startDate": "2025-12-01T10:00:00.000Z",
    "endDate": "2025-12-01T22:00:00.000Z",
    "isClosed": false
  },
  "summary": {
    "totalOrders": 25,
    "completedOrders": 23,
    "cancelledOrders": 2,
    "totalRevenue": 210000,
    "totalRefunds": 21000,
    "netRevenue": 189000,
    "salesByMethod": {
      "EFECTIVO": {
        "completed": { "count": 15, "amount": 150000 },
        "cancelled": { "count": 1, "amount": 10000 },
        "net": 140000
      },
      "TRANSFERENCIA": {
        "completed": { "count": 8, "amount": 60000 },
        "cancelled": { "count": 1, "amount": 11000 },
        "net": 49000
      }
    }
  },
  "products": {
    "topSelling": [
      {
        "product": "Hamburguesa Completa",
        "qtySold": 45,
        "revenue": 157500
      },
      {
        "product": "Papas Fritas",
        "qtySold": 30,
        "revenue": 45000
      }
    ],
    "leastSelling": [
      {
        "product": "Ensalada",
        "qtySold": 3,
        "revenue": 4500
      }
    ],
    "topProfitable": [
      {
        "product": "Hamburguesa Completa",
        "revenue": 157500,
        "cost": 67500,
        "profit": 90000,
        "profitMargin": 57.14
      },
      {
        "product": "Papas Fritas",
        "revenue": 45000,
        "cost": 15000,
        "profit": 30000,
        "profitMargin": 66.67
      }
    ],
    "leastProfitable": [
      {
        "product": "Ensalada",
        "revenue": 4500,
        "cost": 3500,
        "profit": 1000,
        "profitMargin": 22.22
      }
    ],
    "topRemaining": [
      {
        "product": "Milanesa Napolitana",
        "initialQty": 50,
        "currentQty": 35,
        "sold": 15,
        "remaining": 35,
        "wastedPercentage": 70.0
      }
    ],
    "leastRemaining": [
      {
        "product": "Hamburguesa Completa",
        "initialQty": 50,
        "currentQty": 5,
        "sold": 45,
        "remaining": 5,
        "wastedPercentage": 10.0
      }
    ],
    "mostWasted": [
      {
        "product": "Milanesa Napolitana",
        "initialQty": 50,
        "currentQty": 35,
        "sold": 15,
        "remaining": 35,
        "wastedPercentage": 70.0
      }
    ]
  }
}
```

**Métricas Calculadas:**

1. **Resumen de Ventas:**
   - Total de órdenes (completadas + canceladas)
   - Revenue total (ventas completadas)
   - Refunds (ventas canceladas/reembolsos)
   - Revenue neto (revenue - refunds)
   - Desglose por método de pago

2. **Productos Más/Menos Vendidos:**
   - Top 5 productos por cantidad vendida
   - Bottom 5 productos por cantidad vendida
   - Incluye revenue generado

3. **Productos con Mayor/Menor Ganancia:**
   - Top 5 productos por profit (revenue - cost)
   - Bottom 5 productos por profit
   - Margen de ganancia porcentual

4. **Sobrantes de Inventario:**
   - Top 5 productos con más stock restante
   - Bottom 5 productos con menos stock restante
   - Top 5 productos con mayor % de desperdicio

**Casos de Uso:**

- Análisis post-evento para proyecciones
- Identificar productos más rentables
- Detectar productos con bajo movimiento
- Optimizar compras futuras basado en sobrantes

---

## 🧪 Casos de Prueba por Endpoint

### Endpoint 1: POST /events

| Caso                     | Request                 | Resultado                   |
| ------------------------ | ----------------------- | --------------------------- |
| Crear evento válido      | Nombre + fechas válidas | 201 Created                 |
| Normalización            | `"  KERMESE  "`         | 201 (normaliza a "kermese") |
| Nombre duplicado         | Mismo nombre activo     | 400 Bad Request             |
| startDate >= endDate     | Fechas inválidas        | 400 Bad Request             |
| Mismo día, horas válidas | 08:00 → 20:00           | 201 Created                 |
| Mismo día y hora         | 10:00 → 10:00           | 400 Bad Request             |
| Nombre vacío             | `""`                    | 400 Bad Request             |
| Nombre corto (< 3)       | `"ab"`                  | 400 Bad Request             |
| Fecha inválida           | Formato no ISO          | 400 Bad Request             |
| Sin autenticación        | Sin token               | 401 Unauthorized            |
| Usuario CAJERO/COCINA    | Token no-admin          | 403 Forbidden               |

### Endpoint 2: GET /events

| Caso              | Request           | Resultado           |
| ----------------- | ----------------- | ------------------- |
| Sin parámetros    | Default           | 200 OK (max 10)     |
| Con paginación    | limit=2, offset=0 | 200 OK (2 primeros) |
| Incluye inactivos | -                 | Sí incluye          |
| Incluye cerrados  | -                 | Sí incluye          |
| Usuario CAJERO    | Token cajero      | 403 Forbidden       |

### Endpoint 3: GET /events/active

| Caso                 | Request      | Resultado              |
| -------------------- | ------------ | ---------------------- |
| ADMIN                | Token admin  | 200 OK                 |
| CAJERO               | Token cajero | 200 OK                 |
| COCINA               | Token cocina | 200 OK                 |
| NO incluye inactivos | -            | Solo `isActive: true`  |
| NO incluye cerrados  | -            | Solo `isClosed: false` |

### Endpoint 4: GET /events/:id

| Caso            | Request                 | Resultado       |
| --------------- | ----------------------- | --------------- |
| ID válido       | UUID existente          | 200 OK          |
| Todos los roles | ADMIN/CAJERO/COCINA     | 200 OK          |
| Evento inactivo | ID inactivo             | 200 OK          |
| Evento cerrado  | ID cerrado              | 200 OK          |
| ID no existe    | UUID válido inexistente | 404 Not Found   |
| UUID inválido   | `123`                   | 400 Bad Request |

### Endpoint 5: PATCH /events/:id

| Caso                   | Request                              | Resultado            |
| ---------------------- | ------------------------------------ | -------------------- |
| Actualizar solo name   | `{"name": "nuevo"}`                  | 200 OK               |
| Actualizar solo fechas | `{"startDate": ..., "endDate": ...}` | 200 OK               |
| Actualizar ambos       | `{name, startDate, endDate}`         | 200 OK               |
| Mismo nombre           | Mantener nombre propio               | 200 OK               |
| Nombre duplicado       | Nombre de otro evento                | 400 Bad Request      |
| Fechas inválidas       | startDate >= endDate                 | 400 Bad Request      |
| Modificar cerrado      | Evento con `isClosed: true`          | 400 Bad Request      |
| Body vacío             | `{}`                                 | 200 OK (sin cambios) |

### Endpoint 6: DELETE /events/:id

| Caso                 | Request            | Resultado                  |
| -------------------- | ------------------ | -------------------------- |
| Eliminar activo      | DELETE válido      | 200 OK (`isActive: false`) |
| Eliminar inactivo    | Ya eliminado       | 400 Bad Request            |
| Eliminar cerrado     | `isClosed: true`   | 400 Bad Request            |
| Verificar en /active | GET /events/active | NO aparece                 |
| Verificar en /events | GET /events        | Aparece inactivo           |

### Endpoint 7: PATCH /events/:id/activate

| Caso                 | Request            | Resultado                 |
| -------------------- | ------------------ | ------------------------- |
| Activar inactivo     | `isActive: false`  | 200 OK (`isActive: true`) |
| Activar activo       | Ya activo          | 400 Bad Request           |
| Activar cerrado      | `isClosed: true`   | 400 Bad Request           |
| Verificar en /active | GET /events/active | Ahora aparece             |

### Endpoint 8: PATCH /events/:id/desactivate

| Caso                | Request          | Resultado                  |
| ------------------- | ---------------- | -------------------------- |
| Desactivar activo   | `isActive: true` | 200 OK (`isActive: false`) |
| Desactivar inactivo | Ya inactivo      | 400 Bad Request            |
| Desactivar cerrado  | `isClosed: true` | 400 Bad Request            |

### Endpoint 9: PATCH /events/:id/close

| Caso                       | Request            | Resultado                 |
| -------------------------- | ------------------ | ------------------------- |
| Cerrar evento              | Cualquier estado   | 200 OK (`isClosed: true`) |
| Cerrar ya cerrado          | Ya cerrado         | 400 Bad Request           |
| Modificar cerrado (UPDATE) | PATCH /events/:id  | 400 Bad Request           |
| Eliminar cerrado (DELETE)  | DELETE /events/:id | 400 Bad Request           |
| Activar cerrado            | PATCH /activate    | 400 Bad Request           |

### Endpoint 10: GET /events/:id/stats

| Caso                               | Request          | Resultado                  |
| ---------------------------------- | ---------------- | -------------------------- |
| Estadísticas válidas               | UUID existente   | 200 OK (estructura básica) |
| Eventos activos/inactivos/cerrados | Cualquier estado | 200 OK                     |
| Usuario CAJERO                     | Token cajero     | 403 Forbidden              |

---

## 📊 Estados del Evento

### **Estados posibles**

| isActive | isClosed | Significado              | Operaciones permitidas           |
| -------- | -------- | ------------------------ | -------------------------------- |
| `true`   | `false`  | **Activo** (operativo)   | Crear órdenes, modificar, cerrar |
| `false`  | `false`  | **Inactivo** (pausado)   | Reactivar, modificar, cerrar     |
| `false`  | `true`   | **Cerrado** (finalizado) | Solo consulta                    |

### **Transiciones de estado**

```
Crear evento
  ↓
ACTIVO (isActive: true, isClosed: false)
  ↓
DELETE o DESACTIVATE
  ↓
INACTIVO (isActive: false, isClosed: false)
  ↓
ACTIVATE
  ↓
ACTIVO (isActive: true, isClosed: false)
  ↓
CLOSE
  ↓
CERRADO (isActive: false, isClosed: true) ← PERMANENTE
```

---

## 🔄 Flujo Completo: Ciclo de Vida de un Evento

### Antes del Evento

```
1. ADMIN crea evento
   POST /events {"name": "Kermese 2025", ...}
   → Estado: ACTIVO

2. ADMIN carga stock
   (Módulo Inventories - futuro)

3. CAJERO y COCINA ven evento
   GET /events/active
   → Evento disponible
```

### Durante el Evento

```
4. CAJERO crea órdenes
   (Módulo Orders - futuro)
   → Asociadas al evento

5. COCINA prepara órdenes
   → Descuenta stock del evento

6. CAJERO registra ventas
   (Módulo Sales - futuro)
```

### Después del Evento

```
7. ADMIN cierra evento
   PATCH /events/:id/close
   → Estado: CERRADO (permanente)

8. ADMIN consulta estadísticas
   GET /events/:id/stats
   → Análisis de resultados

9. Datos históricos protegidos
   → No se puede modificar ni eliminar
```

---

## 🔐 Seguridad

### Validaciones Implementadas

- **Autenticación:** Todos los endpoints requieren token JWT
- **Autorización diferenciada:**
  - Gestión: Solo ADMIN
  - Consultas: Todos los roles
- **Validación de UUIDs:** `ParseUUIDPipe` en todos los parámetros
- **Sanitización:** Nombres normalizados (lowercase, trim)
- **Validación de fechas:** startDate < endDate
- **SQL Injection:** TypeORM con prepared statements
- **Validación de DTOs:** `whitelist: true` y `forbidNonWhitelisted: true`

---

## 📋 Reglas de Negocio

1. **No duplicados activos:** No puede haber dos eventos activos con el mismo nombre
2. **Mismo día permitido:** Eventos pueden tener mismo día si horas son diferentes
3. **Fechas válidas:** startDate siempre < endDate (fecha + hora completas)
4. **Estado cerrado permanente:** Una vez cerrado, no se puede modificar
5. **Eventos cerrados inmutables:** No se pueden actualizar, eliminar ni reactivar
6. **Soft delete:** Eliminación lógica, no física
7. **Normalización:** Nombres en lowercase y sin espacios extras

---

## 💡 Diferencias entre Endpoints de Estado

| Endpoint                        | Acción     | Reversible | Uso típico                 |
| ------------------------------- | ---------- | ---------- | -------------------------- |
| `DELETE /events/:id`            | Desactivar | ✅ Sí      | Evento cancelado           |
| `PATCH /events/:id/activate`    | Activar    | ✅ Sí      | Reactivar evento pospuesto |
| `PATCH /events/:id/desactivate` | Desactivar | ✅ Sí      | Pausar temporalmente       |
| `PATCH /events/:id/close`       | Cerrar     | ❌ No      | Finalizar y proteger datos |

---

## 🔗 Integración con Otros Módulos

### **Con Inventories**

```typescript
// Inventories usa eventId para stock por evento
EventInventory { eventId, productId, quantity }
EventSupplyInventory { eventId, supplyId, quantity }
```

**Flujo:**

1. ADMIN crea evento
2. ADMIN carga stock asociado a `eventId`
3. Al completar órdenes, se descuenta stock de ese evento

### **Con Orders**

```typescript
// Orders asocia órdenes a eventos
Order { eventId, status, ... }
```

**Flujo:**

1. CAJERO selecciona evento activo
2. CAJERO crea orden con `eventId`
3. COCINA procesa órdenes del evento

### **Con Sales**

```typescript
// Sales se asocia indirectamente vía Order
Sale { orderId, ... } → Order { eventId }
```

**Flujo:**

1. CAJERO registra venta de orden
2. Sale queda asociada al evento
3. ADMIN consulta ventas por evento

---

## ✅ Estado del Módulo

**Versión:** 1.0  
**Estado:** ✅ Completado y probado  
**Fecha:** 2025-11-23  
**Endpoints probados:** 10/10  
**Cobertura:** 100%  
**Casos de prueba:** 90+

---

## 📝 Notas Importantes

1. **Módulo fundacional:** Events es prerequisito para Inventories, Orders y Sales

2. **Estadísticas placeholder:** `GET /events/:id/stats` retorna estructura básica. Se completará con módulos futuros.

3. **Estado cerrado irreversible:** Esta decisión protege datos históricos para auditoría y análisis.

4. **Permisos diferenciados:** CAJERO y COCINA necesitan ver eventos activos para trabajar, pero solo ADMIN puede gestionarlos.

5. **Validaciones de fechas:** Se comparan fecha + hora completas, permitiendo eventos en el mismo día con horas diferentes.

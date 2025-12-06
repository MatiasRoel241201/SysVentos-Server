# Módulo Orders

## Descripción General

El módulo **Orders** gestiona el ciclo completo de pedidos en eventos gastronómicos, desde la creación por parte del cajero hasta la preparación en cocina. Se integra automáticamente con el módulo **Sales** para registrar ventas al momento de crear el pedido.

### Características Principales

- ✅ **Creación de pedidos** con múltiples productos
- ✅ **Registro automático de ventas** al crear pedido
- ✅ **Gestión de estados:** PENDING → IN_PROGRESS → COMPLETED
- ✅ **Cancelación de pedidos** con reembolso automático
- ✅ **Cocina separada:** Endpoints específicos para preparación
- ✅ **Control de stock:** Validación y descuento automático
- ✅ **Numeración automática** por evento

---

## Flujo de Trabajo

### **Flujo Completo: Desde Pedido hasta Entrega**

```
1. Cliente hace pedido al CAJERO
   ↓
2. CAJERO crea orden + cobra
   POST /events/:eventId/orders {
     items: [...],
     paymentMethod: "EFECTIVO"  ← OBLIGATORIO
   }
   ↓
   Sistema automáticamente:
   - ✅ Valida stock de productos
   - ✅ Crea Order (PENDING)
   - ✅ Crea Sale (COMPLETED) ← VENTA REGISTRADA
   - ✅ Asigna número de orden
   ↓
3. COCINA ve pedido en lista de pendientes
   GET /kitchen/events/:eventId/orders/pending
   ↓
4. COCINA inicia preparación
   PATCH /kitchen/events/:eventId/orders/:orderId/start
   → Descuenta productos del inventario
   → Estado: IN_PROGRESS
   ↓
5. COCINA completa preparación
   PATCH /kitchen/events/:eventId/orders/:orderId/complete
   → Descuenta insumos según recetas
   → Estado: COMPLETED
   ↓
6. Cliente recibe su pedido ✅
```

### **Flujo de Cancelación**

```
Cliente solicita cancelación (pedido aún PENDING)
   ↓
ADMIN cancela pedido
   PATCH /events/:eventId/orders/:orderId/cancel
   ↓
   Sistema automáticamente:
   - ✅ Cambia Order a CANCELLED
   - ✅ Cancela Sale asociada (REEMBOLSO)
   - ✅ Marca items como cancelados
```

---

## Entidades

### **Order**

Representa un pedido realizado en un evento.

**Campos:**

- `id` (UUID): Identificador único
- `orderNumber` (int): Número secuencial por evento
- `event` (Event): Relación ManyToOne con Event
- `createdBy` (User): Relación ManyToOne con User (cajero)
- `status` (OrderStatus): Estado del pedido
- `totalAmount` (numeric): Monto total calculado
- `items` (OrderItem[]): Items del pedido
- `sales` (Sale[]): Venta asociada
- `createdAt` (timestamp): Fecha de creación

**Estados posibles:** PENDING, IN_PROGRESS, COMPLETED, CANCELLED

### **OrderItem**

Representa un producto dentro de un pedido.

**Campos:**

- `id` (UUID): Identificador único
- `order` (Order): Relación ManyToOne con Order
- `product` (Product): Relación ManyToOne con Product
- `qty` (numeric): Cantidad solicitada
- `unitPrice` (numeric): Precio unitario al momento del pedido
- `status` (string): Estado del item

### **OrderStatus**

Catálogo de estados de pedidos.

**Valores:** PENDING, IN_PROGRESS, COMPLETED, CANCELLED

---

## Endpoints

### **Endpoints para CAJERO**

#### **`POST /events/:eventId/orders`**

**Crear nuevo pedido con pago**

**Roles:** `CAJERO`, `ADMIN`

**Body:**

```json
{
  "items": [
    {
      "productId": "uuid-producto",
      "qty": 3
    },
    {
      "productId": "uuid-producto-2",
      "qty": 2
    }
  ],
  "paymentMethod": "EFECTIVO" // Obligatorio: EFECTIVO | TRANSFERENCIA
}
```

**Respuesta (201):**

```json
{
  "id": "uuid-order",
  "orderNumber": 5,
  "event": { "id": "uuid-event" },
  "createdBy": { "id": "uuid-user", "userName": "cajero1" },
  "status": { "name": "PENDING" },
  "totalAmount": 10500,
  "items": [
    {
      "product": { "name": "Hamburguesa Completa" },
      "qty": 3,
      "unitPrice": 3500
    }
  ],
  "createdAt": "2025-11-25T..."
}
```

**Validaciones:**

- ✅ Evento debe estar abierto (`isClosed = false`)
- ✅ Productos deben existir en inventario del evento
- ✅ Stock suficiente de cada producto
- ✅ `paymentMethod` debe ser EFECTIVO o TRANSFERENCIA
- ✅ Al menos un item en el pedido

**Acciones automáticas:**

- 🔹 Calcula `totalAmount` (suma de qty × unitPrice)
- 🔹 Asigna `orderNumber` secuencial por evento
- 🔹 **Crea venta automáticamente** con el método de pago
- 🔹 Registra cajero que creó el pedido

---

#### **`GET /events/:eventId/orders`**

**Listar pedidos del evento**

**Roles:** `CAJERO` (solo sus pedidos), `ADMIN` (todos)

**Query Params:**

- `status` (opcional): PENDING, IN_PROGRESS, COMPLETED, CANCELLED
- `createdBy` (opcional): UUID del cajero (solo ADMIN)
- `orderNumber` (opcional): Número de orden

**Respuesta (200) - CAJERO:**

```json
[
  {
    "orderNumber": 5,
    "status": { "name": "PENDING" },
    "totalAmount": 10500,
    "items": [...]
  }
]
```

**Nota:** CAJERO solo ve sus propias órdenes. ADMIN ve todas del evento.

---

#### **`GET /events/:eventId/orders/:orderId`**

**Obtener detalle de un pedido**

**Roles:** `CAJERO` (solo sus pedidos), `ADMIN` (todos)

**Respuesta (200):**

```json
{
  "id": "uuid",
  "orderNumber": 5,
  "status": { "name": "PENDING" },
  "totalAmount": 10500,
  "createdBy": { "userName": "cajero1" },
  "items": [
    {
      "product": { "name": "Hamburguesa Completa" },
      "qty": 3,
      "unitPrice": 3500
    }
  ],
  "createdAt": "2025-11-25T..."
}
```

**Validación:** Si el CAJERO intenta ver orden de otro cajero → `403 Forbidden`

---

#### **`PATCH /events/:eventId/orders/:orderId/cancel`**

**Cancelar pedido (solo PENDING)**

**Roles:** `ADMIN`

**Respuesta (200):**

```json
{
  "orderNumber": 5,
  "status": { "name": "CANCELLED" },
  "items": [{ "status": "CANCELLED" }]
}
```

**Validaciones:**

- ✅ Solo pedidos en estado `PENDING`
- ✅ Solo ADMIN puede cancelar

**Acciones automáticas:**

- 🔹 Cambia estado de Order a CANCELLED
- 🔹 Cambia estado de todos los items a CANCELLED
- 🔹 **Cancela venta asociada** (reembolso registrado)

---

### **Endpoints para COCINA**

#### **`GET /kitchen/events/:eventId/orders/pending`**

**Listar órdenes pendientes**

**Roles:** `COCINA`, `ADMIN`

**Respuesta (200):**

```json
[
  {
    "orderNumber": 5,
    "status": { "name": "PENDING" },
    "items": [
      {
        "product": { "name": "Hamburguesa Completa" },
        "qty": 3
      }
    ],
    "createdAt": "2025-11-25T10:30:00"
  }
]
```

**Uso:** Cocina ve lista de pedidos pendientes ordenados por antigüedad.

---

#### **`GET /kitchen/events/:eventId/orders`**

**Listar órdenes por estado**

**Roles:** `COCINA`, `ADMIN`

**Query Params:**

- `status` (opcional): IN_PROGRESS, COMPLETED, PENDING

**Respuesta (200):**

```json
[
  {
    "orderNumber": 6,
    "status": { "name": "IN_PROGRESS" },
    "items": [...],
    "createdAt": "2025-11-25T10:35:00"
  }
]
```

---

#### **`GET /kitchen/events/:eventId/orders/:orderId`**

**Ver detalle de orden con recetas**

**Roles:** `COCINA`, `ADMIN`

**Respuesta (200):**

```json
{
  "orderNumber": 5,
  "status": { "name": "PENDING" },
  "items": [
    {
      "product": {
        "name": "Hamburguesa Completa",
        "productSupplies": [
          {
            "supply": { "name": "Pan" },
            "qtyPerUnit": 1,
            "unit": "unidad"
          },
          {
            "supply": { "name": "Carne molida" },
            "qtyPerUnit": 0.15,
            "unit": "kg"
          }
        ]
      },
      "qty": 3
    }
  ]
}
```

**Uso:** Cocina ve qué insumos necesita para preparar el pedido.

---

#### **`PATCH /kitchen/events/:eventId/orders/:orderId/start`**

**Iniciar preparación**

**Roles:** `COCINA`, `ADMIN`

**Respuesta (200):**

```json
{
  "orderNumber": 5,
  "status": { "name": "IN_PROGRESS" }
}
```

**Validaciones:**

- ✅ Solo pedidos en estado `PENDING`
- ✅ Stock suficiente de productos

**Acciones automáticas:**

- 🔹 Cambia estado a IN_PROGRESS
- 🔹 **Descuenta productos** del inventario del evento
- 🔹 Marca items como IN_PROGRESS

---

#### **`PATCH /kitchen/events/:eventId/orders/:orderId/complete`**

**Completar preparación**

**Roles:** `COCINA`, `ADMIN`

**Respuesta (200):**

```json
{
  "orderNumber": 5,
  "status": { "name": "COMPLETED" }
}
```

**Validaciones:**

- ✅ Solo pedidos en estado `IN_PROGRESS`
- ✅ Stock suficiente de insumos según recetas

**Acciones automáticas:**

- 🔹 Cambia estado a COMPLETED
- 🔹 **Descuenta insumos** según recetas de los productos
- 🔹 Marca items como COMPLETED

---

## Reglas de Negocio

### **Creación de Pedidos**

1. ✅ **Pago inmediato:** El cajero cobra al crear el pedido
2. ✅ **Venta automática:** Sistema registra venta con método de pago
3. ✅ **Numeración por evento:** orderNumber secuencial por evento
4. ✅ **Validación de stock:** Valida disponibilidad antes de crear
5. ✅ **Evento abierto:** No se pueden crear pedidos en eventos cerrados
6. ✅ **Mínimo 1 item:** Pedido debe tener al menos un producto

### **Estados de Pedidos**

1. **PENDING:** Pedido creado, esperando preparación
2. **IN_PROGRESS:** Cocina comenzó a preparar
3. **COMPLETED:** Pedido listo para entregar
4. **CANCELLED:** Pedido cancelado con reembolso

### **Cancelación**

1. ✅ **Solo PENDING:** Solo se pueden cancelar pedidos pendientes
2. ✅ **Reembolso automático:** Sistema cancela venta asociada
3. ✅ **Solo ADMIN:** Solo administradores pueden cancelar
4. ✅ **Inmutable después:** No se puede revertir cancelación

### **Descuento de Stock**

1. ✅ **Al iniciar (START):** Descuenta productos del inventario
2. ✅ **Al completar (COMPLETE):** Descuenta insumos según recetas
3. ✅ **Validación previa:** Verifica stock antes de descontar
4. ✅ **Atómico:** Todo o nada, no permite descuentos parciales

---

## Integración con Otros Módulos

### **Sales**

- **Crear pedido** → Crea venta automáticamente
- **Cancelar pedido** → Cancela venta (reembolso)
- Relación 1:1 entre Order y Sale

### **Inventories**

- Valida stock de productos al crear pedido
- Descuenta productos al iniciar preparación
- Descuenta insumos al completar preparación

### **Events**

- Pedidos agrupados por evento
- Numeración secuencial por evento
- Validación de evento abierto

### **Products**

- Carga información de productos y recetas
- Calcula totalAmount según precios del inventario
- Consulta recetas para descuento de insumos

---

## Diferencias entre Endpoints

### **Cajero vs Cocina**

| Aspecto               | CAJERO               | COCINA                       |
| --------------------- | -------------------- | ---------------------------- |
| **Ruta base**         | `/events/:id/orders` | `/kitchen/events/:id/orders` |
| **Crear pedidos**     | ✅ Sí                | ❌ No                        |
| **Ver pedidos**       | Solo propios         | Todos del evento             |
| **Cancelar**          | ❌ No                | ❌ No (solo ADMIN)           |
| **Iniciar/Completar** | ❌ No                | ✅ Sí                        |
| **Ver recetas**       | ❌ No                | ✅ Sí                        |

---

## Casos de Uso

### **1. Cajero crea pedido y cobra**

```typescript
// Usuario: CAJERO
// Acción: Crear pedido con pago en efectivo

POST /events/{eventId}/orders
{
  "items": [
    { "productId": "uuid-hamburguesa", "qty": 3 }
  ],
  "paymentMethod": "EFECTIVO"
}

// Sistema:
// 1. Valida stock
// 2. Crea Order (PENDING)
// 3. Crea Sale (COMPLETED) ← Venta registrada
// 4. Asigna orderNumber: 1
```

### **2. Cocina prepara pedido**

```typescript
// Usuario: COCINA

// Paso 1: Ver pendientes
GET / kitchen / events / { eventId } / orders / pending;

// Paso 2: Iniciar preparación
PATCH / kitchen / events / { eventId } / orders / { orderId } / start;
// → Descuenta productos del inventario

// Paso 3: Completar
PATCH / kitchen / events / { eventId } / orders / { orderId } / complete;
// → Descuenta insumos según recetas
```

### **3. Admin cancela pedido (reembolso)**

```typescript
// Usuario: ADMIN
// Acción: Cancelar pedido aún PENDING

PATCH / events / { eventId } / orders / { orderId } / cancel;

// Sistema:
// 1. Cambia Order a CANCELLED
// 2. Cancela Sale (reembolso registrado)
// 3. Marca items como CANCELLED
```

---

## Ejemplos de Pruebas

### **Crear pedido con validaciones**

```bash
# 1. Crear pedido válido
POST /events/{id}/orders
{
  "items": [{ "productId": "uuid", "qty": 2 }],
  "paymentMethod": "EFECTIVO"
}
# Esperado: 201 Created + venta creada

# 2. Sin paymentMethod
POST /events/{id}/orders
{
  "items": [{ "productId": "uuid", "qty": 2 }]
}
# Esperado: 400 Bad Request

# 3. Método inválido
{
  "items": [...],
  "paymentMethod": "TARJETA"
}
# Esperado: 400 Bad Request
```

### **Flujo completo de preparación**

```bash
# 1. Crear pedido
POST /events/{id}/orders → orderNumber: 5

# 2. Cocina ve pendiente
GET /kitchen/events/{id}/orders/pending
# Debe incluir order #5

# 3. Iniciar preparación
PATCH /kitchen/events/{id}/orders/{id}/start
# Debe descontar productos

# 4. Completar
PATCH /kitchen/events/{id}/orders/{id}/complete
# Debe descontar insumos
```

---

## Modificaciones Recientes

### **Integración con Sales (2025-11-25)**

Se agregó integración automática con el módulo Sales:

1. **CreateOrderDto:**
   - Nuevo campo obligatorio: `paymentMethod`
   - Valores: "EFECTIVO" | "TRANSFERENCIA"

2. **OrdersService.create():**
   - Crea venta automáticamente después de crear la orden
   - Venta con status COMPLETED (ya cobrada)

3. **OrdersService.cancel():**
   - Cancela venta asociada automáticamente
   - Venta cambia a status CANCELLED (reembolso)

**Beneficio:** Registro automático de ventas y reembolsos sin intervención manual.

---

## Estado del Módulo

**Versión:** 2.0  
**Estado:** ✅ Completado y probado  
**Fecha última actualización:** 2025-11-25  
**Endpoints implementados:** 9  
**Integración con Sales:** ✅ Activa

# Módulo Sales

## Descripción General

El módulo **Sales** gestiona el registro y consulta de ventas asociadas a pedidos del sistema. Se integra automáticamente con el módulo **Orders** para registrar ventas cuando un cliente realiza un pedido y paga en caja.

### Características Principales

- ✅ **Registro automático de ventas** al crear pedidos
- ✅ **Cancelación automática** de ventas al cancelar pedidos (reembolsos)
- ✅ **Soporte para métodos de pago:** EFECTIVO y TRANSFERENCIA
- ✅ **Consulta y filtrado** de ventas por evento
- ✅ **Reportes de totales** con desglose por método de pago
- ✅ **Seguimiento de ingresos netos** (revenue - refunds)

---

## Flujo de Trabajo

### **Flujo Normal: Crear Pedido → Registrar Venta**

```
1. Cliente hace pedido al CAJERO
   ↓
2. CAJERO crea orden + cobra inmediatamente
   POST /events/:eventId/orders {
     items: [...],
     paymentMethod: "EFECTIVO" | "TRANSFERENCIA"
   }
   ↓
   Sistema automáticamente:
   - ✅ Crea Order (PENDING)
   - ✅ Crea Sale (COMPLETED) ← VENTA REGISTRADA
   ↓
3. Pedido pasa a COCINA para preparación
```

### **Flujo de Cancelación: Cancelar Orden → Reembolso**

```
ADMIN cancela orden (aún PENDING)
   PATCH /events/:eventId/orders/:orderId/cancel
   ↓
   Sistema automáticamente:
   - Order cambia a CANCELLED
   - Sale cambia a CANCELLED ← REEMBOLSO REGISTRADO
```

---

## Entidades

### **Sale**

Representa una venta/cobro asociado a un pedido.

**Campos:**

- `id` (UUID): Identificador único
- `order` (Order): Relación ManyToOne con Order
- `method` (string): Método de pago (EFECTIVO/TRANSFERENCIA)
- `amount` (numeric): Monto cobrado
- `status` (string): Estado de la venta (COMPLETED/CANCELLED)
- `createdAt` (timestamp): Fecha de creación

**Relaciones:**

- **Order** (ManyToOne): Relación 1:1 - Una venta por pedido

---

## Endpoints

### **`GET /events/:eventId/sales`**

**Listar ventas del evento**

**Roles:** `ADMIN`

**Query Params:**

- `method` (opcional): Filtrar por EFECTIVO o TRANSFERENCIA
- `status` (opcional): Filtrar por COMPLETED o CANCELLED

**Respuesta (200):**

```json
[
  {
    "id": "uuid",
    "order": {
      "orderNumber": 1,
      "createdBy": { "userName": "cajero1" }
    },
    "method": "EFECTIVO",
    "amount": 10500,
    "status": "COMPLETED",
    "createdAt": "2025-11-25T..."
  }
]
```

**Ejemplos:**

```bash
# Todas las ventas
GET /events/{id}/sales

# Solo ventas en efectivo
GET /events/{id}/sales?method=EFECTIVO

# Solo ventas canceladas (reembolsos)
GET /events/{id}/sales?status=CANCELLED
```

---

### **`GET /events/:eventId/sales/totals`**

**Obtener totales de ventas**

**Roles:** `ADMIN`

**Respuesta (200):**

```json
{
  "totalSales": 20,
  "completedSales": 18,
  "cancelledSales": 2,
  "totalRevenue": 210000,
  "totalRefunds": 21000,
  "netRevenue": 189000,
  "byMethod": {
    "EFECTIVO": {
      "completed": { "count": 12, "amount": 126000 },
      "cancelled": { "count": 1, "amount": 10500 },
      "net": 115500
    },
    "TRANSFERENCIA": {
      "completed": { "count": 6, "amount": 84000 },
      "cancelled": { "count": 1, "amount": 10500 },
      "net": 73500
    }
  }
}
```

**Validaciones:**

- ✅ `netRevenue = totalRevenue - totalRefunds`
- ✅ Totales calculados por método de pago
- ✅ Diferencia entre ventas completadas y canceladas

---

### **`GET /events/:eventId/sales/:saleId`**

**Obtener detalle de una venta**

**Roles:** `ADMIN`

**Respuesta (200):**

```json
{
  "id": "uuid",
  "method": "EFECTIVO",
  "amount": 10500,
  "status": "COMPLETED",
  "order": {
    "orderNumber": 1,
    "totalAmount": 10500,
    "createdBy": { "userName": "cajero1" },
    "items": [
      {
        "product": { "name": "Hamburguesa Completa" },
        "qty": 3,
        "unitPrice": 3500
      }
    ]
  },
  "createdAt": "2025-11-25T..."
}
```

---

## Reglas de Negocio

### **Creación de Ventas**

1. ✅ **Automática:** Se crea al confirmar un pedido
2. ✅ **1:1:** Un pedido tiene máximo una venta
3. ✅ **Validación de monto:** `sale.amount` debe coincidir con `order.totalAmount`
4. ✅ **Métodos permitidos:** Solo EFECTIVO o TRANSFERENCIA
5. ✅ **Estado inicial:** Siempre COMPLETED (ya se cobró)

### **Cancelación de Ventas**

1. ✅ **Automática:** Se cancela al cancelar el pedido asociado
2. ✅ **Solo reembolso:** No se elimina, cambia a status CANCELLED
3. ✅ **Restricción:** Solo pedidos PENDING pueden cancelarse
4. ✅ **Auditoría:** Ventas canceladas permanecen en BD

### **Consultas**

1. ✅ **Solo ADMIN** puede consultar ventas
2. ✅ **CAJERO y COCINA** NO tienen acceso
3. ✅ **Filtros disponibles:** método de pago, estado
4. ✅ **Ordenamiento:** Por fecha DESC (más recientes primero)

---

## Integración con Otros Módulos

### **Orders**

- Al crear pedido → Crea venta automáticamente
- Al cancelar pedido → Cancela venta automáticamente
- Relación 1:1 mediante `sale.order`

### **Events**

- Ventas agrupadas por evento
- Indirectamente mediante `Sale → Order → Event`
- Totales calculados por evento

---

## Casos de Uso

### **1. Registrar venta al crear pedido**

```typescript
// Usuario: CAJERO
// Acción: Crear pedido con pago

POST /events/{eventId}/orders
{
  "items": [
    { "productId": "uuid", "qty": 3 }
  ],
  "paymentMethod": "EFECTIVO"  // Obligatorio
}

// Sistema crea Order + Sale automáticamente
```

### **2. Consultar ventas del día (ADMIN)**

```typescript
// Usuario: ADMIN
// Acción: Ver todas las ventas

GET / events / { eventId } / sales;

// Retorna lista de todas las ventas del evento
```

### **3. Ver totales por método de pago**

```typescript
// Usuario: ADMIN
// Acción: Consultar reporte de ventas

GET / events / { eventId } / sales / totals;

// Retorna:
// - Total cobrado
// - Total reembolsado
// - Neto (cobrado - reembolsado)
// - Desglose por EFECTIVO/TRANSFERENCIA
```

### **4. Cancelar venta (reembolso)**

```typescript
// Usuario: ADMIN
// Acción: Cancelar pedido (implica reembolso)

PATCH / events / { eventId } / orders / { orderId } / cancel;

// Sistema:
// - Cancela Order
// - Cancela Sale (reembolso registrado)
```

---

## Ejemplos de Pruebas

### **Crear orden con venta**

```bash
# 1. Crear orden en efectivo
POST /events/{id}/orders
{
  "items": [{ "productId": "uuid", "qty": 2 }],
  "paymentMethod": "EFECTIVO"
}

# 2. Verificar venta creada
GET /events/{id}/sales
# Debe incluir la venta recién creada
```

### **Cancelar orden y verificar reembolso**

```bash
# 1. Cancelar orden
PATCH /events/{id}/orders/{orderId}/cancel

# 2. Verificar venta cancelada
GET /events/{id}/sales?status=CANCELLED
# Debe mostrar la venta con status=CANCELLED
```

### **Ver totales**

```bash
# Obtener resumen de ventas
GET /events/{id}/sales/totals

# Validar:
# - netRevenue = totalRevenue - totalRefunds
# - Suma de métodos = totalRevenue
```

---

## Notas Técnicas

### **Dependencias Circulares**

El módulo Sales tiene dependencia circular con Orders. Se resuelve usando `forwardRef()` en ambos módulos:

```typescript
// sales.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([Sale]),
    forwardRef(() => AuthModule),
  ],
  exports: [SalesService],
})

// orders.module.ts
@Module({
  imports: [
    forwardRef(() => SalesModule),
  ],
})
```

### **¿Por qué ventas separadas de pedidos?**

**Beneficios:**

1. **Control de cobranza:** Pedidos sin pagar identificables
2. **Reportes precisos:** Diferencia entre "pedido" y "cobrado"
3. **Auditoría:** Rastrear cuándo y cómo se cobró
4. **Reembolsos:** Histórico completo de cancelaciones


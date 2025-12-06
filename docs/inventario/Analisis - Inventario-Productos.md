# 📦 Inventario de Productos por Evento

## Descripción General

Módulo que gestiona el inventario de productos para cada evento, controlando stock, precios de venta, costos y márgenes de ganancia. Permite cargar productos al inventario de manera masiva o individual, con cálculo automático de costos para productos con receta.

---

## 🏗️ Arquitectura

### **Entidad Principal**

- **EventInventory** (`event_inventories`): Inventario de productos específico por evento

### **Relaciones**

- `Event` (ManyToOne): Evento al que pertenece el inventario
- `Product` (ManyToOne): Producto en inventario

---

## 📊 Modelo de Datos

### EventInventory Entity

```typescript
{
  id: UUID,
  eventId: UUID,           // FK → events
  productId: UUID,         // FK → products
  initialQty: NUMERIC,     // Stock inicial cargado
  currentQty: NUMERIC,     // Stock actual (se reduce con ventas)
  minQty: NUMERIC,         // Stock mínimo de alerta
  cost: NUMERIC,           // Costo unitario (calculado o manual)
  salePrice: NUMERIC,      // Precio de venta
  profitMargin: NUMERIC,   // Margen de ganancia (%)
  hasRecipe: BOOLEAN,      // Si el costo fue calculado automáticamente
  isActive: BOOLEAN,       // Estado del producto en inventario
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP
}
```

---

## 💰 Sistema de Precios

### **Cálculo Automático de Costos**

**Productos CON receta:**

```
cost = Σ (supply.cost × productSupply.qtyPerUnit)
```

- El costo se calcula sumando los costos de todos los insumos
- Se actualiza automáticamente al cargar el inventario
- `hasRecipe = true`
- **NO se puede modificar manualmente** en PATCH

**Productos SIN receta:**

- Se requiere proporcionar `cost` manualmente al cargar
- `hasRecipe = false`
- Se puede modificar en PATCH

### **Margen de Ganancia**

```
profitMargin = ((salePrice - cost) / cost) × 100
```

- Se calcula automáticamente
- Se recalcula al actualizar `cost` o `salePrice`

---

## 🔌 Endpoints

### **POST** `/events/:eventId/inventory/products`

Cargar inventario inicial (batch)

**Permisos:** ADMIN

**Request Body:**

```json
{
  "products": [
    {
      "productId": "uuid",
      "initialQty": 100,
      "minQty": 20,
      "salePrice": 3500,
      "cost": 1200 // Solo requerido si NO tiene receta
    }
  ]
}
```

**Validaciones:**

- ✅ Evento debe estar abierto (`isClosed = false`)
- ✅ Producto debe estar activo
- ✅ No puede haber duplicados en el inventario del evento
- ✅ `minQty <= initialQty`
- ✅ Si NO tiene receta, `cost` es obligatorio

**Casos de Uso:**

- Configuración inicial del inventario antes de un evento
- Carga masiva de productos

---

### **GET** `/events/:eventId/inventory/products`

Listar todo el inventario del evento

**Permisos:** Todos

**Response:**

```json
[
  {
    "id": "uuid",
    "productId": "uuid",
    "initialQty": 100,
    "currentQty": 85,
    "minQty": 20,
    "cost": 2350,
    "salePrice": 3500,
    "profitMargin": 48.94,
    "hasRecipe": true,
    "isActive": true,
    "product": {
      "id": "uuid",
      "name": "hamburguesa completa"
    }
  }
]
```

**Características:**

- Solo productos activos (`isActive = true`)
- Ordenados por nombre de producto
- Incluye relación con `Product`

---

### **GET** `/events/:eventId/inventory/products/available`

Listar productos con stock disponible

**Permisos:** Todos

**Filtro:** `currentQty > 0 AND isActive = true`

**Casos de Uso:**

- Mostrar productos disponibles para venta
- Validar antes de procesar órdenes

---

### **GET** `/events/:eventId/inventory/products/low-stock`

Listar productos con stock bajo

**Permisos:** Todos

**Filtro:** `currentQty <= minQty AND isActive = true`

**Ordenamiento:** `currentQty ASC` (más críticos primero)

**Casos de Uso:**

- Alertas de reabastecimiento
- Dashboard de control de stock

---

### **GET** `/events/:eventId/inventory/products/:productId`

Obtener inventario de un producto específico

**Permisos:** Todos

**Response:**

```json
{
  "id": "uuid",
  "eventId": "uuid",
  "productId": "uuid",
  "initialQty": 100,
  "currentQty": 85,
  "minQty": 20,
  "cost": 2350,
  "salePrice": 3500,
  "profitMargin": 48.94,
  "hasRecipe": true,
  "isActive": true,
  "product": { ... },
  "event": { ... }
}
```

**Características:**

- Incluye relaciones con `Product` y `Event`
- También retorna productos inactivos (útil para auditoría)

---

### **PATCH** `/events/:eventId/inventory/products/:productId`

Actualizar inventario de producto

**Permisos:** ADMIN

**Request Body (todos opcionales):**

```json
{
  "initialQty": 150,
  "currentQty": 120,
  "minQty": 30,
  "salePrice": 4000,
  "cost": 1500 // Solo si hasRecipe = false
}
```

**Validaciones:**

- ✅ Evento no debe estar cerrado
- ✅ `minQty <= initialQty`
- ✅ NO se puede modificar `cost` si `hasRecipe = true`

**Recalcula automáticamente:**

- `profitMargin` al actualizar `cost` o `salePrice`

**Casos de Uso:**

- Ajustar precios de venta
- Corregir stock por pérdidas/devoluciones
- Actualizar stock mínimo de alerta

---

### **DELETE** `/events/:eventId/inventory/products/:productId`

Desactivar producto del inventario (soft delete)

**Permisos:** ADMIN

**Comportamiento:**

- Cambia `isActive = false`
- NO se elimina físicamente
- NO aparece en listados (`GET /products`, `/available`, `/low-stock`)
- SÍ aparece en `GET /products/:productId` (auditoría)

**Validaciones:**

- ✅ Evento no debe estar cerrado
- ✅ Producto ya debe estar inactivo

**Casos de Uso:**

- Producto ya no se venderá en el evento
- Suspensión temporal de producto

---

## 🔄 Flujo de Trabajo Típico

### **1. Configuración Inicial del Evento**

```http
POST /events
→ Crear evento "Kermesse Navidad 2025"

POST /products
→ Crear productos (con/sin recetas)

POST /events/{eventId}/inventory/products
→ Cargar inventario inicial
```

### **2. Durante el Evento**

```http
GET /events/{eventId}/inventory/products/available
→ Ver productos disponibles para venta

GET /events/{eventId}/inventory/products/low-stock
→ Monitorear alertas de stock bajo

PATCH /events/{eventId}/inventory/products/{productId}
→ Ajustar precios o stock según necesidad
```

### **3. Post-Evento**

```http
GET /events/{eventId}/inventory/products
→ Revisar stock final

DELETE /events/{eventId}/inventory/products/{productId}
→ Desactivar productos no vendidos
```

---

## ⚙️ Métodos Internos del Servicio

### `decreaseStock(eventId, productId, qty)`

**Uso:** Módulo de Órdenes (ventas)

Descuenta stock al procesar una venta:

```typescript
inventory.currentQty -= qty;
```

**Validación:** `currentQty >= qty`

---

### `increaseStock(eventId, productId, qty)`

**Uso:** Devoluciones o ajustes manuales

Aumenta stock:

```typescript
inventory.currentQty += qty;
```

---

## 🎯 Reglas de Negocio

### **Costo de Productos**

1. **Con receta (`hasRecipe = true`):**
   - Costo calculado automáticamente
   - NO modificable manualmente
   - Para actualizarlo, modificar costos de insumos

2. **Sin receta (`hasRecipe = false`):**
   - Costo manual requerido
   - Modificable en PATCH

### **Stock**

- `initialQty`: Stock original cargado
- `currentQty`: Stock actual (se reduce con ventas)
- `minQty`: Umbral de alerta
- **Validación:** `minQty <= initialQty`

### **Precios**

- `cost`: Costo unitario
- `salePrice`: Precio de venta al público
- `profitMargin`: % de ganancia calculado

### **Estados**

- `isActive = true`: Producto disponible en el evento
- `isActive = false`: Producto desactivado (soft delete)

---

## 🔍 Ejemplos Prácticos

### **Cargar Producto CON Receta**

```json
{
  "products": [
    {
      "productId": "uuid-hamburguesa",
      "initialQty": 50,
      "minQty": 10,
      "salePrice": 3500
      // cost NO se envía, se calcula desde receta
    }
  ]
}
```

**Resultado:**

```json
{
  "cost": 2350, // Calculado: pan + carne + queso
  "profitMargin": 48.94, // ((3500-2350)/2350)*100
  "hasRecipe": true
}
```

---

### **Cargar Producto SIN Receta**

```json
{
  "products": [
    {
      "productId": "uuid-gaseosa",
      "initialQty": 100,
      "minQty": 20,
      "salePrice": 1200,
      "cost": 600 // ✅ Requerido
    }
  ]
}
```

**Resultado:**

```json
{
  "cost": 600,
  "profitMargin": 100, // ((1200-600)/600)*100
  "hasRecipe": false
}
```

---

### **Actualizar Precio de Venta**

```http
PATCH /events/{eventId}/inventory/products/{productId}
{
  "salePrice": 4000
}
```

**Resultado:**

```json
{
  "cost": 2350, // Sin cambios
  "salePrice": 4000, // Actualizado
  "profitMargin": 70.21 // Recalculado automáticamente
}
```

---

## ⚠️ Notas Importantes

### **Evento Cerrado**

Una vez cerrado un evento (`isClosed = true`):

- ❌ NO se puede cargar inventario
- ❌ NO se puede actualizar precios/stock
- ❌ NO se puede desactivar productos

### **Soft Delete**

Los productos desactivados:

- Se mantienen en la BD
- NO aparecen en listados
- SÍ se pueden consultar individualmente
- Útil para auditoría e historial

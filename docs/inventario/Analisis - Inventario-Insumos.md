# 📦 Inventario de Insumos por Evento

## Descripción General

Módulo que gestiona el inventario de insumos/ingredientes para cada evento, controlando stock disponible y niveles de alerta. Permite cargar insumos al inventario de manera masiva o individual para asegurar disponibilidad durante el evento.

---

## 🏗️ Arquitectura

### **Entidad Principal**
- **EventSupplyInventory** (`event_supply_inventories`): Inventario de insumos específico por evento

### **Relaciones**
- `Event` (ManyToOne): Evento al que pertenece el inventario
- `Supply` (ManyToOne): Insumo en inventario

---

## 📊 Modelo de Datos

### EventSupplyInventory Entity

```typescript
{
  id: UUID,
  eventId: UUID,           // FK → events
  supplyId: UUID,          // FK → supplies
  initialQty: NUMERIC,     // Stock inicial cargado
  currentQty: NUMERIC,     // Stock actual (se reduce con producción)
  minQty: NUMERIC,         // Stock mínimo de alerta
  isActive: BOOLEAN,       // Estado del insumo en inventario
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP
}
```

---

## 🔌 Endpoints

### **POST** `/events/:eventId/inventory/supplies`
Cargar inventario inicial de insumos (batch)

**Permisos:** ADMIN

**Request Body:**
```json
{
  "supplies": [
    {
      "supplyId": "uuid",
      "initialQty": 500,
      "minQty": 100
    },
    {
      "supplyId": "uuid",
      "initialQty": 200,
      "minQty": 50
    }
  ]
}
```

**Validaciones:**
- ✅ Evento debe estar abierto (`isClosed = false`)
- ✅ Insumo debe estar activo
- ✅ No puede haber duplicados en el inventario del evento
- ✅ `minQty <= initialQty`

**Casos de Uso:**
- Configuración inicial del inventario antes de un evento
- Carga masiva de insumos necesarios

---

### **GET** `/events/:eventId/inventory/supplies`
Listar todo el inventario de insumos del evento

**Permisos:** Todos

**Response:**
```json
[
  {
    "id": "uuid",
    "supplyId": "uuid",
    "initialQty": 500,
    "currentQty": 450,
    "minQty": 100,
    "isActive": true,
    "supply": {
      "id": "uuid",
      "name": "pan",
      "unit": "UNIDAD",
      "cost": 50
    }
  }
]
```

**Características:**
- Solo insumos activos (`isActive = true`)
- Ordenados por nombre de insumo
- Incluye relación con `Supply`

---

### **GET** `/events/:eventId/inventory/supplies/available`
Listar insumos con stock disponible

**Permisos:** Todos

**Filtro:** `currentQty > 0 AND isActive = true`

**Casos de Uso:**
- Mostrar insumos disponibles para producción
- Validar antes de elaborar productos
- Panel de cocina

---

### **GET** `/events/:eventId/inventory/supplies/low-stock`
Listar insumos con stock bajo

**Permisos:** Todos

**Filtro:** `currentQty <= minQty AND isActive = true`

**Ordenamiento:** `currentQty ASC` (más críticos primero)

**Casos de Uso:**
- Alertas de reabastecimiento urgente
- Dashboard de control de inventario
- Notificaciones automáticas

---

### **GET** `/events/:eventId/inventory/supplies/:supplyId`
Obtener inventario de un insumo específico

**Permisos:** Todos

**Response:**
```json
{
  "id": "uuid",
  "eventId": "uuid",
  "supplyId": "uuid",
  "initialQty": 500,
  "currentQty": 450,
  "minQty": 100,
  "isActive": true,
  "supply": {
    "id": "uuid",
    "name": "pan",
    "unit": "UNIDAD",
    "cost": 50
  },
  "event": {
    "id": "uuid",
    "name": "Kermesse Navidad",
    "isClosed": false
  }
}
```

**Características:**
- Incluye relaciones con `Supply` y `Event`
- También retorna insumos inactivos (útil para auditoría)

---

### **PATCH** `/events/:eventId/inventory/supplies/:supplyId`
Actualizar inventario de insumo

**Permisos:** ADMIN

**Request Body (todos opcionales):**
```json
{
  "initialQty": 800,
  "currentQty": 600,
  "minQty": 150
}
```

**Validaciones:**
- ✅ Evento no debe estar cerrado
- ✅ `minQty <= initialQty`

**Casos de Uso:**
- Ajustar stock por pérdidas/mermas
- Corregir errores de carga inicial
- Actualizar niveles de alerta
- Registrar reposiciones

---

### **DELETE** `/events/:eventId/inventory/supplies/:supplyId`
Desactivar insumo del inventario (soft delete)

**Permisos:** ADMIN

**Comportamiento:**
- Cambia `isActive = false`
- NO se elimina físicamente
- NO aparece en listados (`GET /supplies`, `/available`, `/low-stock`)
- SÍ aparece en `GET /supplies/:supplyId` (auditoría)

**Validaciones:**
- ✅ Evento no debe estar cerrado
- ✅ Insumo no debe estar ya inactivo

**Casos de Uso:**
- Insumo agotado y no se repondrá
- Suspensión temporal de insumo

---

## 🔄 Flujo de Trabajo Típico

### **1. Configuración Inicial del Evento**
```http
POST /events
→ Crear evento "Kermesse Navidad 2025"

POST /supplies
→ Crear insumos (pan, carne, queso, etc.)

POST /events/{eventId}/inventory/supplies
→ Cargar inventario inicial de insumos
```

### **2. Durante el Evento**
```http
GET /events/{eventId}/inventory/supplies/available
→ Ver insumos disponibles para cocina

GET /events/{eventId}/inventory/supplies/low-stock
→ Monitorear alertas de stock bajo

PATCH /events/{eventId}/inventory/supplies/{supplyId}
→ Ajustar stock por mermas o reposiciones
```

### **3. Consumo Automático (Interno)**
```typescript
// Desde el módulo de Órdenes
// Al preparar productos, se descuenta stock automáticamente
await eventSupplyInventoryService.decreaseStock(
  eventId,
  supplyId,
  qtyUsed
)
```

---

## ⚙️ Métodos Internos del Servicio

### `decreaseStock(eventId, supplyId, qty)`
**Uso:** Módulo de Órdenes (producción de productos)

Descuenta stock al elaborar productos con receta:
```typescript
inventory.currentQty -= qty
```

**Validación:** `currentQty >= qty`

**Ejemplo:**
```typescript
// Al preparar 5 hamburguesas
// Receta: 1 hamburguesa = 1 pan + 150g carne
await decreaseStock(eventId, 'pan-id', 5)       // -5 panes
await decreaseStock(eventId, 'carne-id', 750)   // -750g carne
```

---

### `increaseStock(eventId, supplyId, qty)`
**Uso:** Reposiciones o ajustes manuales

Aumenta stock:
```typescript
inventory.currentQty += qty
```

---

## 🎯 Reglas de Negocio

### **Stock**
- `initialQty`: Stock original cargado
- `currentQty`: Stock actual (se reduce con producción)
- `minQty`: Umbral de alerta
- **Validación:** `minQty <= initialQty`

### **Estados**
- `isActive = true`: Insumo disponible en el evento
- `isActive = false`: Insumo desactivado (soft delete)

### **Consumo**
- Stock se descuenta automáticamente al preparar productos
- Solo productos CON receta consumen insumos
- Cálculo: `qtyUsed = productQty × qtyPerUnit` (de receta)

---

## 🔍 Ejemplos Prácticos

### **Cargar Inventario Inicial**
```json
{
  "supplies": [
    {
      "supplyId": "uuid-pan",
      "initialQty": 500,
      "minQty": 100
    },
    {
      "supplyId": "uuid-carne",
      "initialQty": 20000,    // 20kg en gramos
      "minQty": 5000          // Alerta a 5kg
    },
    {
      "supplyId": "uuid-queso",
      "initialQty": 10000,    // 10kg
      "minQty": 2000
    }
  ]
}
```

---

### **Actualizar Stock por Merma**
```http
PATCH /events/{eventId}/inventory/supplies/{supplyId-carne}
{
  "currentQty": 18500  // Se perdieron 1.5kg por mal estado
}
```

---

### **Reposición de Insumo**
```http
PATCH /events/{eventId}/inventory/supplies/{supplyId-pan}
{
  "initialQty": 800,   // Se agregaron 300 panes más
  "currentQty": 750    // Stock actual después de la reposición
}
```

---

### **Verificar Stock Bajo**
```http
GET /events/{eventId}/inventory/supplies/low-stock
```

**Response:**
```json
[
  {
    "id": "uuid-inv-carne",
    "currentQty": 4500,    // ⚠️ Menor a minQty (5000)
    "minQty": 5000,
    "supply": {
      "name": "carne molida",
      "unit": "G"
    }
  }
]
```

---

## 📈 Integración con Otros Módulos

### **Con Módulo de Productos**
```typescript
// Al cargar producto al inventario del evento
// Se valida que tenga insumos suficientes (si tiene receta)

Product: "Hamburguesa Completa"
Recipe:
  - 1 pan (qtyPerUnit: 1)
  - 150g carne (qtyPerUnit: 150)
  - 50g queso (qtyPerUnit: 50)

// Para 50 hamburguesas necesito:
- 50 panes
- 7500g carne (7.5kg)
- 2500g queso (2.5kg)
```

### **Con Módulo de Órdenes**
```typescript
// Al PREPARAR una orden
Order: 3 Hamburguesas

// Sistema descuenta automáticamente:
decreaseStock(eventId, 'pan-id', 3)         // -3 panes
decreaseStock(eventId, 'carne-id', 450)     // -450g
decreaseStock(eventId, 'queso-id', 150)     // -150g

// Actualiza currentQty en inventario
```

---

## ⚠️ Notas Importantes

### **Evento Cerrado**
Una vez cerrado un evento (`isClosed = true`):
- ❌ NO se puede cargar inventario
- ❌ NO se puede actualizar stock
- ❌ NO se puede desactivar insumos

### **Soft Delete**
Los insumos desactivados:
- Se mantienen en la BD
- NO aparecen en listados
- SÍ se pueden consultar individualmente
- Útil para auditoría e historial

### **Unidades de Medida**
Los insumos usan enum `SupplyUnit`:
- `KG` - Kilogramos
- `G` - Gramos
- `LT` - Litros
- `ML` - Mililitros
- `UNIDAD` - Unidades
- `PAQUETE` - Paquetes

**Importante:** Las cantidades en inventario deben estar en la misma unidad del insumo.

---

## 🔗 Relación con Inventario de Productos

### **Diferencias Clave**

| Característica | Inventario Productos | Inventario Insumos |
|---------------|---------------------|-------------------|
| **Stock** | `currentQty` (ventas) | `currentQty` (producción) |
| **Precios** | `salePrice`, `cost`, `profitMargin` | N/A (precio en Supply) |
| **Consumo** | Ventas (órdenes) | Elaboración (recetas) |
| **Cálculos** | Margen de ganancia | Suma de costos |

### **Flujo Completo**
```
1. Cargar INSUMOS al inventario
   ↓
2. Cargar PRODUCTOS al inventario
   (cost calculado desde insumos)
   ↓
3. Vender PRODUCTOS
   (currentQty de productos ↓)
   ↓
4. Preparar productos vendidos
   (currentQty de insumos ↓)
```

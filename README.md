# 🎪 SisVentos - Sistema de Gestión Gastronómica para Eventos

Sistema backend para gestionar la parte gastronómica de eventos (festivales, kermeses, ferias, etc.), enfocado en la administración de productos, insumos, stock, órdenes y ventas.

---

## 📋 Descripción del Proyecto

SysVentos es una API REST desarrollada con **NestJS** y **TypeScript** que permite:

- 🍔 Gestionar productos vendibles y sus recetas
- 📦 Administrar insumos/ingredientes
- 📊 Controlar inventarios por evento
- 🧾 Registrar órdenes de compra
- 💰 Gestionar ventas y métodos de pago
- 👥 Control de acceso por roles (ADMIN, CAJERO, COCINA)

---

## 🎯 Objetivos del Sistema

1. **Registrar pedidos** de comida/bebida durante eventos
2. **Gestionar stock** de productos e insumos
3. **Registrar ventas** con métodos de pago
4. **Tracking de consumo** por evento para proyecciones futuras
5. **Control de acceso** diferenciado por rol

---

## 👥 Roles del Sistema

### 🔑 ADMIN

- Crea usuarios y asigna roles
- Crea eventos, insumos y productos
- Define recetas (productos ↔ insumos)
- Carga stock inicial por evento
- Consulta reportes y estadísticas

### 💵 CAJERO

- Selecciona evento activo
- Crea pedidos con múltiples productos
- Registra ventas y métodos de pago
- Puede modificar insumos en órdenes (quitar/agregar)

### 🍳 COCINA

- Ve pedidos pendientes del evento
- Cambia estado de órdenes: PENDING → PREPARING → COMPLETED
- Consulta recetas de productos

---

## 🏗️ Arquitectura

### Stack Tecnológico

- **Framework:** NestJS 10.x
- **Lenguaje:** TypeScript
- **Base de datos:** PostgreSQL
- **ORM:** TypeORM
- **Autenticación:** JWT (Passport)
- **Validación:** class-validator, class-transformer

### Módulos Implementados

- ✅ **Auth** - Autenticación y autorización
- ✅ **Users** - Gestión de usuarios y roles
- ✅ **Supplies** - Insumos/ingredientes
- ✅ **Products** - Productos vendibles y recetas
- ✅ **Events** - Gestión de eventos
- ✅ **Inventories** - Stock por evento
- ✅ **Orders** - Órdenes de compra
- ✅ **Sales** - Registro de ventas

---

## 📚 Documentación por Módulo

### Módulos Completados

- [👥 Users (Usuarios)](./docs/Analisis%20-%20Users.md)
- [📦 Supplies (Insumos)](./docs/Analisis%20-%20Supplies.md)
- [🍔 Products (Productos)](./docs/Analisis%20-%20Products.md)
- [🎪 Events (Eventos)](./docs/Analisis%20-%20Events.md)
- [📊 Inventario de Productos](./docs/inventario/Analisis%20-%20Inventario-Productos.md)
- [📦 Inventario de Insumos](./docs/inventario/Analisis%20-%20Inventario-Insumos.md)
- [🧾 Orders (Órdenes)](./docs/Analisis%20-%20Orders.md)
- [💰 Sales (Ventas)](./docs/Analisis%20-%20Sales.md)

---

## 🚀 Instalación y Configuración

### Prerequisitos

- Node.js >= 18.x
- PostgreSQL >= 14.x
- npm o yarn

### Instalación

```bash
# Clonar repositorio
git clone [URL_DEL_REPO]
cd SysServer

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales
```

### Variables de Entorno

```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=db_username
DB_PASSWORD=db_password
DB_NAME=db_name

# JWT
JWT_SECRET=jwt_secret_key

# Puerto
PORT=3001
```

### Ejecutar en Desarrollo

```bash
npm run start:dev
```

La API estará disponible en: `http://localhost:3001`

---

## 📖 Uso de la API

### Autenticación

Todos los endpoints (excepto login) requieren autenticación JWT.

**1. Login:**

```http
POST /auth/login
Content-Type: application/json

{
  "userName": "user_name",
  "password": "user_password"
}
```

**Respuesta:**

```json
{
  {
    "id": "user_id",
    "userName": "user_name",
    "password": "user_password",
    "token": "jwt_token"
}
}
```

**2. Usar el token en requests:**

```http
GET /products/active
Authorization: Bearer jwt_token
```

---

## 🔐 Seguridad

- ✅ Autenticación con JWT
- ✅ Autorización por roles (Guards)
- ✅ Validación de DTOs con class-validator
- ✅ Protección contra SQL Injection (TypeORM)
- ✅ Soft deletes para mantener historial
- ✅ Validación de UUIDs en parámetros
- ✅ Whitelist de propiedades en DTOs

---

## 📊 Modelo de Datos

### Entidades Principales

```
User ──┬──> UserRole ──> Role
       │
       └──> Order

Supply ──> ProductSupply <── Product
   │                            │
   │                            │
   └──> EventSupplyInventory    └──> EventInventory
              │                           │
              └─── Event ────────────────┘
                      │
                      └──> Order ──> OrderItem
                                │
                                └──> Sale
```

---

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod

# Linting
npm run lint

# Testing
npm run test
npm run test:watch
npm run test:cov
```

---

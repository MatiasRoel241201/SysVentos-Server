📌 1. Dominio del Sistema

El sistema está pensado para gestionar la parte gastronómica de eventos (tómbolas, kermeses, festivales, etc.).
Un evento puede tener otras actividades (juegos, bingo, etc.), pero el sistema SOLO se ocupa de la gastronomía.

🎯 Objetivos principales

Registrar pedidos de comida/bebida durante un evento.

Gestionar stock de:

Productos vendibles (hamburguesa, gaseosa, pancho, torta).

Insumos/ingredientes (pan, carne, botella de gaseosa).

Registrar las ventas (incluyendo método de pago) para generar reportes.

Registrar consumo de insumos y productos por evento para:

saber cuánto se usó de cada cosa;

poder hacer proyecciones de compra en futuros eventos y evitar sobrantes.

❌ No se manejan entradas, bingo ni juegos en esta versión; se eliminaron del alcance.

📌 2. Actores / Roles

El sistema tiene 3 roles fijos:

👤 ADMIN

Crea usuarios y les asigna roles.

Crea eventos.

Crea insumos.

Crea productos.

Define recetas (producto ↔ insumos).

Carga stock inicial de productos e insumos por evento.

Consulta reportes/estadísticas.

👤 CAJERO

Selecciona un evento activo.

Crea pedidos para clientes, con múltiples productos.

Registra la venta y el método de pago (efectivo / transferencia).

No puede modificar stock manualmente.

👤 COCINA

Ve los pedidos pendientes de un evento.

Cambia el estado de los pedidos:
PENDIENTE → EN_PREPARACION → COMPLETADO.

Al completar un pedido, se dispara la lógica de consumo de stock (productos e insumos).

📌 2. Reglas de Negocio Importantes

El sistema debe respetar las siguientes reglas:

🔗 Todo sucede dentro de un evento

Pedidos, stock, ventas y consumos siempre están asociados a un Evento (Event).

🍽️ Pedidos con múltiples productos

Una Order puede contener varios OrderItem, ej.:
gaseosa + hamburguesa + pancho + torta.

🔄 Flujo de estados de la orden

Estados fijos:

PENDIENTE

EN_PREPARACION

COMPLETADO

Solo usuarios con rol COCINA pueden cambiar el estado de una orden.

📦 Stock y Validaciones
Al crear un pedido:

Validar que haya stock suficiente de cada producto (y opcionalmente de sus insumos).

Al completar un pedido:

Descontar stock de EventInventory (productos).

Si corresponde, descontar stock de EventSupplyInventory usando la receta (ProductSupply).

El sistema debe registrar todos los movimientos de stock para calcular consumo por evento.

💰 Ventas y Métodos de Pago

Cada pedido tiene asociada una Sale.

Métodos de pago soportados:

EFECTIVO

TRANSFERENCIA

No existe integración con pasarelas reales; solo registro administrativo.

📊 Reportes y Proyecciones

El sistema debe poder generar reportes a partir de:

Orders

OrderItems

Sales

EventInventory

EventSupplyInventory

Debe mostrar:

Cantidad de productos vendidos por evento.

Cantidad de insumos consumidos por evento.

Ventas por método de pago.

Proyecciones de cuánto comprar para futuros eventos.
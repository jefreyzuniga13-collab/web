##    Organización final de la lógica (E-commerce / Chat)

### 1) `DetailPCGProduct` (UI de detalle del producto)
**Responsabilidad**
- Mostrar información del producto
- Permitir seleccionar sucursal/bodega
- Capturar **observación por producto**
- Agregar al carrito
- Enviar producto por chat (imagen + texto)

**Claves técnicas**
- Observación es **por producto**, no global
- Selección de sucursal:
  - Por defecto: primera sucursal con stock
  - El usuario puede seleccionar **cualquiera**
- Bloqueo anti-doble-click con `useRef`
- Botones deshabilitados inmediatamente (`sending`)

**Flujos**
- `Agregar al carrito` → llama `addProduct(...)`
- `Enviar` → llama `sendProductMessage({ product, observation })`

---

### 2) `SucursalPickerModal`
**Responsabilidad**
- Mostrar lista completa de sucursales + bodegas
- Permitir seleccionar **una sola** sucursal (no múltiple)

**Comportamiento**
- Si vienen 1, 10 o más registros → se listan todos
- No es obligatorio seleccionar la primera
- El botón *Confirmar* se habilita solo cuando hay selección válida

---

### 3) `useCartPCGFlow` (core de negocio del carrito)
**Responsabilidad**
- Resolver sucursal / bodega
- Crear o reutilizar `LogCart`
- Agregar productos al pedido
- Controlar estado `locked`

**Dónde se guarda cada cosa**
- **Observación por producto** → `buildCartRequest().observacion`
- **Sucursal/Bodega** → `branch`, `wherehouseCode`
- **Pedido (noPedido)** → `resolveOrder()`

**Regla clave**
- Cada producto se guarda **independiente**, con su propia observación

---

### 4) `buildCartRequest`
**Función**
- Construir el payload que va al backend por producto

**Incluye**
- `codproducto`
- `cantidad`
- `bodega`
- `sucursal`
- `observacion` ✅ (por producto)

---

### 5) `useProductMessageComposer`
**Responsabilidad**
- Enviar el producto por WhatsApp (imagen + caption)

**Caption incluye**
- Producto
- Precio
- Contenido
- Modificadores
- **Observación (opcional)**

**Protecciones**
- Límite de 1024 caracteres
- Bloqueo anti-doble-envío (`sending` + `useRef`)

---

### 6) `CarPCPanelTab` (carrito completo)
**Responsabilidad**
- Manejar observación **general del pedido**
- Dirección / retiro en sucursal
- Costo de transporte
- Persistencia temporal (localStorage)
- Envío de resumen por chat o PDF

**Diferencia clave**
- Observación aquí = **del pedido**
- Observación en `DetailPCGProduct` = **del producto**

---

### 7) Separación correcta de responsabilidades
| Nivel | Observación | Se guarda |
|-----|-------------|-----------|
| Producto | Nota del agente por ítem | `det_factura_tempo.observacion` |
| Pedido | Nota general | `log_cart.observacion` |
| Chat | Texto visible al cliente | Caption del mensaje |

---

### 8) Seguridad UX / Performance
- Anti-doble-click con `useRef`
- Botones deshabilitados inmediatamente
- No depende del re-render
- Previene duplicados por latencia



# Escáner de Códigos QR para Consumibles

## 📱 Funcionalidad Implementada

Se ha creado un sistema completo de escaneo de códigos QR para consumibles que permite a los usuarios registrar el consumo de materiales de forma rápida y eficiente.

## ✨ Características

### 1. Códigos QR Únicos
- Cada consumible tiene un código QR único con formato: `CONSUMABLE-{ID}-{TIMESTAMP}`
- Los códigos QR son permanentes y no cambian
- Se pueden descargar e imprimir desde la página de detalles del consumible

### 2. Página de Escaneo (`/consumables/scan`)
- Interfaz móvil optimizada para escanear códigos QR
- Acceso a la cámara del dispositivo
- Validación automática del formato del código QR
- Búsqueda instantánea del consumible

### 3. Información del Consumible
Después de escanear, se muestra:
- Nombre y descripción del consumible
- Stock actual y mínimo
- Estado del stock (In Stock / Low Stock / Out of Stock)
- Unidad de medida

### 4. Registro de Consumo
- Selección de cantidad a consumir
- Validación de cantidad disponible
- Registro automático con timestamp
- Actualización inmediata del inventario

## 🚀 Cómo Usar

### Para Administradores

#### 1. Generar Códigos QR
Los códigos QR se generan automáticamente al crear un consumible. Para consumibles existentes:

```bash
node scripts/generate-consumable-qr.js
```

#### 2. Imprimir Códigos QR
1. Ve a **Admin → Manage Consumables**
2. Haz clic en cualquier consumible
3. En el panel derecho verás el código QR
4. Usa los botones "Download QR Code" o "Print QR Code"

### Para Usuarios (Profesores)

#### 1. Acceder al Escáner
Desde la página de consumibles:
- Haz clic en el botón **"Scan QR"** en la esquina superior derecha

O directamente:
- Navega a `/consumables/scan`

#### 2. Escanear un Consumible
1. Permite el acceso a la cámara cuando se solicite
2. Apunta la cámara al código QR del consumible
3. El sistema detectará automáticamente el código

#### 3. Registrar Consumo
1. Verifica la información del consumible
2. Ajusta la cantidad a consumir (si es necesario)
3. Haz clic en **"Consume X units"**
4. Confirma la operación

## 📁 Archivos Creados

### Frontend
- `src/app/consumables/scan/page.tsx` - Página de escaneo de QR
- Actualizado: `src/app/admin/consumables/page.tsx` - Botón de escaneo agregado

### Backend
- `src/app/api/consumables/qr/[qrCode]/route.ts` - Endpoint para buscar consumibles por QR

### Scripts
- `scripts/generate-consumable-qr.js` - Genera códigos QR para consumibles
- `scripts/check-consumables-qr.js` - Verifica códigos QR existentes
- `scripts/add-qr-column.sql` - SQL para agregar columna QR

### Documentación
- `SETUP_QR_CODES.md` - Guía de configuración inicial
- `CONSUMABLE_QR_SCANNER.md` - Este archivo

## 🔧 Configuración Técnica

### Base de Datos
La tabla `consumable_stock` incluye:
- `qr_code` VARCHAR(255) UNIQUE - Código QR único
- Índice en `qr_code` para búsquedas rápidas

### API Endpoints

#### GET `/api/consumables/qr/[qrCode]`
Busca un consumible por su código QR.

**Respuesta exitosa:**
```json
{
  "data": {
    "id": 3,
    "qr_code": "CONSUMABLE-3-1759476347918",
    "current_quantity": 20,
    "minimum_threshold": 5,
    "unit_of_measure": "pieces",
    "item_type": {
      "name": "Batteries",
      "description": "AA batteries for devices",
      "category": "Supplies"
    }
  }
}
```

#### POST `/api/consumables/consume`
Registra el consumo de un consumible.

**Request body:**
```json
{
  "qr_code": "CONSUMABLE-3-1759476347918",
  "quantity": 2,
  "notes": "Consumed via QR scanner by user@example.com"
}
```

## 🎯 Flujo de Trabajo

```
1. Admin imprime códigos QR
   ↓
2. Códigos QR se colocan en los materiales
   ↓
3. Profesor necesita material
   ↓
4. Profesor escanea código QR
   ↓
5. Sistema muestra información del material
   ↓
6. Profesor selecciona cantidad
   ↓
7. Sistema registra consumo
   ↓
8. Inventario se actualiza automáticamente
```

## ⚠️ Validaciones

- El código QR debe tener formato `CONSUMABLE-*`
- La cantidad debe ser mayor a 0
- La cantidad no puede exceder el stock disponible
- No se puede consumir si el stock es 0
- Solo usuarios autenticados pueden escanear

## 🔐 Seguridad

- Autenticación requerida para escanear
- Validación de formato de código QR
- Validación de cantidad disponible
- Registro de auditoría con usuario y timestamp

## 📱 Compatibilidad

- Funciona en dispositivos móviles y desktop
- Requiere acceso a la cámara
- Compatible con lectores de QR estándar
- Responsive design para todas las pantallas

## 🐛 Solución de Problemas

### El código QR no se escanea
- Asegúrate de permitir el acceso a la cámara
- Verifica que haya buena iluminación
- Mantén el código QR estable y enfocado
- Intenta desde diferentes ángulos

### Error "Invalid QR code format"
- Verifica que estés escaneando un código QR de consumible
- Los códigos QR de herramientas no funcionarán aquí
- El código debe empezar con "CONSUMABLE-"

### Error "Consumable not found"
- El código QR puede estar desactualizado
- Verifica que el consumible existe en el sistema
- Contacta al administrador

## 📊 Métricas y Reportes

Cada consumo registrado incluye:
- Usuario que consumió
- Fecha y hora exacta
- Cantidad consumida
- Notas adicionales
- Stock antes y después

Estos datos se almacenan en la tabla `stock_movements` para auditoría y reportes.

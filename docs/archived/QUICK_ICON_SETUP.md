# 🚀 Configuración Rápida del Icono de Claro

## Opción 1: Automática (Recomendada) ⚡

### Paso 1: Preparar el icono fuente
Coloca tu icono de Claro (PNG, mínimo 1024x1024) en:
```
public/claro-icon-source.png
```

### Paso 2: Instalar dependencia
```bash
npm install sharp
```

### Paso 3: Generar todos los iconos
```bash
node scripts/generate-claro-icons.js
```

### Paso 4: Actualizar manifest.json
Copia y pega este contenido en `public/manifest.json`:

```json
{
  "name": "Claro Inventory System",
  "short_name": "Claro Inventory",
  "description": "Sistema de gestión de inventario educativo Claro",
  "theme_color": "#E30613",
  "background_color": "#FFFFFF",
  "display": "standalone",
  "orientation": "portrait",
  "scope": "/",
  "start_url": "/",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ]
}
```

### Paso 5: Generar favicon.ico
1. Ve a https://realfavicongenerator.net/
2. Sube `public/icons/icon-192x192.png`
3. Configura el color de fondo: #E30613
4. Descarga y reemplaza `public/favicon.ico`

### Paso 6: ¡Listo!
```bash
npm run dev
```

Abre http://localhost:3000 y verifica el nuevo icono en la pestaña del navegador.

---

## Opción 2: Manual 🛠️

Si no quieres usar el script automático:

### Paso 1: Usar herramienta online
1. Ve a https://realfavicongenerator.net/
2. Sube tu icono de Claro (PNG, mínimo 512x512)
3. Configura:
   - Color de fondo: #E30613
   - Nombre de la app: "Claro Inventory"
4. Descarga el paquete completo

### Paso 2: Extraer archivos
Extrae el contenido descargado en:
```
public/
├── favicon.ico
├── apple-touch-icon.png
└── icons/
    ├── icon-*.png (todos los tamaños)
    └── browserconfig.xml
```

### Paso 3: Actualizar manifest.json
Usa el contenido del Paso 4 de la Opción 1

### Paso 4: ¡Listo!
```bash
npm run dev
```

---

## ✅ Verificación

### Checklist Rápido
- [ ] Icono visible en pestaña del navegador
- [ ] Color rojo (#E30613) en barra de estado móvil
- [ ] Icono correcto al agregar a pantalla de inicio
- [ ] PWA instala con icono de Claro

### Comandos de Verificación
```bash
# Verificar que existen todos los iconos
ls -la public/icons/

# Debería mostrar:
# icon-16x16.png
# icon-32x32.png
# icon-72x72.png
# icon-96x96.png
# icon-128x128.png
# icon-144x144.png
# icon-152x152.png
# icon-192x192.png
# icon-384x384.png
# icon-512x512.png
```

---

## 🐛 Solución de Problemas

### El icono no se actualiza
```bash
# Limpiar caché del navegador
# Chrome: Ctrl+Shift+Delete
# O abrir en modo incógnito
```

### Error al generar iconos
```bash
# Verificar que sharp está instalado
npm list sharp

# Si no está, instalar:
npm install sharp
```

### Icono se ve pixelado
- Asegúrate de que el icono fuente sea al menos 1024x1024
- Usa PNG con transparencia
- Verifica que el fondo sea rojo (#E30613)

---

## 📚 Documentación Completa

Para más detalles, consulta:
- `CLARO_ICON_INTEGRATION_GUIDE.md` - Guía completa
- `scripts/generate-claro-icons.js` - Script de generación

---

**Tiempo estimado**: 10-15 minutos  
**Dificultad**: Fácil  
**Resultado**: Icono de Claro en toda la aplicación 🎉

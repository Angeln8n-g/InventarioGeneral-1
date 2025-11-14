# 🎨 Guía Visual - Sistema de Notificaciones Mejorado

## 📱 Interfaz de Usuario

### 1. Icono de Notificaciones en Header

```
┌─────────────────────────────────────────────────┐
│  Inventory System              🔔(3)  👤        │
│                                 ↑               │
│                          Badge con contador     │
└─────────────────────────────────────────────────┘
```

**Características:**
- Badge rojo con número de notificaciones no leídas
- Animación de pulso cuando hay nuevas
- Click para abrir dropdown

---

### 2. Dropdown de Notificaciones

```
┌─────────────────────────────────────────────────┐
│ 🔔 Notificaciones (3)              ⚙️  ✕       │
│                                                 │
│ [Todas] [No leídas (3)]  [Tipo ▼]             │
│ ─────────────────────────────────────────────  │
│                                                 │
│ ✓ Préstamo confirmado              5m    🗑️ ●  │
│   Tu préstamo ha sido aprobado                 │
│                                                 │
│ ⚠ Stock bajo                       2h    🗑️ ●  │
│   Quedan solo 3 unidades                       │
│                                                 │
│ ℹ Mantenimiento programado         1d    🗑️    │
│   Sistema no disponible mañana                 │
│                                                 │
│ ─────────────────────────────────────────────  │
│           Marcar todas como leídas             │
└─────────────────────────────────────────────────┘
```

**Elementos:**
- **Header:** Título, contador, botón de preferencias (⚙️), cerrar (✕)
- **Filtros:** Botones de estado y dropdown de tipo
- **Notificaciones:** Icono, título, mensaje, tiempo, eliminar (🗑️), indicador no leído (●)
- **Footer:** Botón para marcar todas como leídas

---

### 3. Modal de Preferencias

```
┌─────────────────────────────────────────────────┐
│  Preferencias de Notificaciones                 │
│                                                 │
│  Tipos de Notificaciones                       │
│  ┌───────────────────────────────────────────┐ │
│  │ Confirmación de préstamo          [ON]    │ │
│  │ Confirmación de devolución        [ON]    │ │
│  │ Recordatorio de préstamo          [ON]    │ │
│  │ Aviso de vencimiento              [ON]    │ │
│  │ Consumible entregado              [ON]    │ │
│  │ Consumible en backorder           [ON]    │ │
│  │ Anuncios del sistema              [ON]    │ │
│  │ Alertas de stock                  [ON]    │ │
│  │ Mantenimiento del sistema         [ON]    │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ─────────────────────────────────────────────  │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 🔊 Sonido de notificaciones       [OFF]  │ │
│  │    Reproducir sonido al recibir nuevas   │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ─────────────────────────────────────────────  │
│                                                 │
│                    [Cancelar] [Guardar Cambios]│
└─────────────────────────────────────────────────┘
```

**Características:**
- Toggles animados para cada tipo
- Sección separada para sonido
- Botones de acción en footer
- Indicador de cambios sin guardar

---

## 🎯 Flujos de Usuario

### Flujo 1: Ver Notificaciones

```
Usuario → Click 🔔 → Dropdown abre → Ver notificaciones
                                   ↓
                            Click notificación
                                   ↓
                          Marca como leída
                                   ↓
                        Badge actualiza contador
```

### Flujo 2: Filtrar Notificaciones

```
Usuario → Click 🔔 → Click "No leídas"
                            ↓
                   Solo muestra no leídas
                            ↓
                   Seleccionar tipo "Advertencia"
                            ↓
                   Solo muestra advertencias no leídas
```

### Flujo 3: Configurar Preferencias

```
Usuario → Click 🔔 → Click ⚙️ → Modal abre
                                    ↓
                          Cambiar preferencias
                                    ↓
                            Click "Guardar"
                                    ↓
                          Preferencias guardadas
                                    ↓
                            Modal cierra
```

### Flujo 4: Eliminar Notificación

```
Usuario → Click 🔔 → Hover notificación → Aparece 🗑️
                                              ↓
                                        Click 🗑️
                                              ↓
                                    Notificación eliminada
                                              ↓
                                    Contador actualiza
```

### Flujo 5: Sonido de Notificación

```
Nueva notificación → Polling detecta (30s)
                            ↓
                    Contador aumenta
                            ↓
                    ¿Sonido habilitado?
                            ↓
                          Sí → Reproduce sonido
                          No → Silencio
```

---

## 🎨 Estados Visuales

### Notificación No Leída
```
┌─────────────────────────────────────────────┐
│ ✓ Préstamo confirmado         5m    🗑️ ●   │
│   Tu préstamo ha sido aprobado              │
└─────────────────────────────────────────────┘
```
- Fondo rojo claro
- Título en rojo
- Punto rojo pulsante (●)

### Notificación Leída
```
┌─────────────────────────────────────────────┐
│ ℹ Mantenimiento programado    1d    🗑️     │
│   Sistema no disponible mañana              │
└─────────────────────────────────────────────┘
```
- Fondo normal
- Título en color normal
- Sin punto rojo

### Hover sobre Notificación
```
┌─────────────────────────────────────────────┐
│ ⚠ Stock bajo                  2h    🗑️ ●   │
│   Quedan solo 3 unidades                    │
└─────────────────────────────────────────────┘
     ↑                              ↑
  Fondo gris                  Papelera visible
```

---

## 🎭 Iconos por Tipo

```
✓  Success   - Verde   - Confirmaciones
⚠  Warning   - Amarillo - Advertencias
✕  Error     - Rojo    - Errores
ℹ  Info      - Azul    - Información
```

---

## 📊 Indicadores Visuales

### Badge de Contador
```
🔔(3)  → 3 notificaciones no leídas
🔔(9+) → 9 o más notificaciones
🔔     → Sin notificaciones no leídas
```

### Filtros Activos
```
[Todas]          → Fondo gris
[No leídas (3)]  → Fondo rojo, texto blanco
```

### Toggle de Preferencias
```
[ON]  → Fondo rojo, círculo a la derecha
[OFF] → Fondo gris, círculo a la izquierda
```

---

## 🌈 Tema Claro vs Oscuro

### Tema Claro
```
┌─────────────────────────────────────────────┐
│ Fondo: Blanco                               │
│ Texto: Negro                                │
│ Bordes: Gris claro                          │
│ Hover: Gris muy claro                       │
└─────────────────────────────────────────────┘
```

### Tema Oscuro
```
┌─────────────────────────────────────────────┐
│ Fondo: Gris oscuro                          │
│ Texto: Blanco                               │
│ Bordes: Gris medio                          │
│ Hover: Gris más oscuro                      │
└─────────────────────────────────────────────┘
```

**Nota:** El color rojo de Claro se mantiene en ambos temas.

---

## 📱 Responsividad

### Desktop (1920x1080)
```
┌────────────────────────────────────────────────┐
│  Inventory System           🔔(3)  👤          │
│                                                │
│  Dropdown: 320px ancho                         │
│  Modal: 600px ancho                            │
└────────────────────────────────────────────────┘
```

### Tablet (768x1024)
```
┌──────────────────────────────┐
│  Inventory System  🔔(3)  👤 │
│                              │
│  Dropdown: 90% ancho         │
│  Modal: 90% ancho            │
└──────────────────────────────┘
```

### Mobile (375x667)
```
┌─────────────────────┐
│  Inventory 🔔(3) 👤 │
│                     │
│  Dropdown: 100%     │
│  Modal: 100%        │
└─────────────────────┘
```

---

## 🎬 Animaciones

### Fade In (Dropdown)
```
Opacidad: 0 → 1
Duración: 200ms
```

### Pulse (Badge)
```
Escala: 1 → 1.1 → 1
Duración: 1s
Loop: Infinito
```

### Slide (Toggle)
```
Posición: Izquierda ↔ Derecha
Duración: 300ms
```

### Hover (Botones)
```
Fondo: Normal → Hover
Duración: 150ms
```

---

## 🔊 Feedback de Audio

### Sonido de Notificación
```
Trigger: Nueva notificación detectada
Condición: Sonido habilitado en preferencias
Volumen: 50%
Duración: ~0.5-1 segundo
Tipo: Tono agradable, no intrusivo
```

---

## 💡 Mejores Prácticas de UI

### Do's ✅
- Usar iconos consistentes
- Mantener colores del tema Claro
- Mostrar feedback inmediato
- Usar animaciones sutiles
- Mantener accesibilidad

### Don'ts ❌
- No usar colores muy brillantes
- No hacer animaciones largas
- No ocultar información importante
- No usar sonidos molestos
- No ignorar modo oscuro

---

## 🎨 Paleta de Colores

### Colores Principales
```
Claro Red:    #E30613
Success:      #10B981
Warning:      #F59E0B
Error:        #EF4444
Info:         #3B82F6
```

### Colores de Fondo (Claro)
```
Card:         #FFFFFF
Hover:        #F3F4F6
Border:       #E5E7EB
```

### Colores de Fondo (Oscuro)
```
Card:         #1F2937
Hover:        #374151
Border:       #4B5563
```

---

## 📐 Espaciado

```
Padding interno:     12px - 16px
Margin entre items:  8px - 12px
Border radius:       8px
Icon size:           20px - 24px
Font size (título):  14px
Font size (mensaje): 12px
```

---

## ♿ Accesibilidad

### ARIA Labels
```html
<button aria-label="Notificaciones">🔔</button>
<button aria-label="Cerrar">✕</button>
<button aria-label="Eliminar notificación">🗑️</button>
<button aria-label="Preferencias">⚙️</button>
```

### Keyboard Navigation
```
Tab:       Navegar entre elementos
Enter:     Activar botón/toggle
Escape:    Cerrar modal/dropdown
Space:     Activar toggle
```

### Screen Reader
- Todos los iconos tienen labels
- Contadores son anunciados
- Estados son comunicados
- Cambios son notificados

---

## 🎯 Conclusión

El sistema de notificaciones tiene una interfaz:
- ✅ Intuitiva y fácil de usar
- ✅ Visualmente atractiva
- ✅ Consistente con el tema Claro
- ✅ Responsive en todos los dispositivos
- ✅ Accesible para todos los usuarios
- ✅ Con feedback claro y animaciones sutiles

---

**Diseño completado:** 6 de Enero, 2025  
**Versión:** 2.0.0

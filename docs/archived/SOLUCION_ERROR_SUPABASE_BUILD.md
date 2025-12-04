# Solución: Error de Supabase en Build

## 🐛 Problema
```
Error: supabaseUrl is required.
[Error: Failed to collect page data for /api/admin/dashboard/stats]
```

## 🔍 Causa
Las variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` no están disponibles durante el proceso de build.

## ✅ Solución Aplicada

### 1. Código Defensivo en src/lib/supabase.ts

**Antes:**
```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

**Después:**
```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Validate Supabase configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase configuration missing. Some features may not work.')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)
```

### 2. Verificar Variables de Entorno en el Servidor

```bash
# Conectar al servidor
ssh root@tu-servidor

# Ir al directorio del proyecto
cd /root/Inventario-Academia-10.0

# Verificar que existe el archivo .env
ls -la .env

# Ver el contenido (sin mostrar valores sensibles)
cat .env | grep -E "NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY" | sed 's/=.*/=***/'
```

### 3. Crear/Actualizar .env en el Servidor

Si el archivo no existe o está incompleto:

```bash
# Crear .env con las variables necesarias
cat > .env << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui

# JWT Secret
JWT_SECRET=tu-jwt-secret-aqui

# Node Environment
NODE_ENV=production
EOF

# Asegurar permisos correctos
chmod 600 .env
```

## 🚀 Pasos para Aplicar

### En el Servidor:

1. **Verificar/Crear .env:**
   ```bash
   cd /root/Inventario-Academia-10.0
   
   # Si no existe, créalo con tus valores reales
   nano .env
   ```

2. **Limpiar builds anteriores:**
   ```bash
   rm -rf .next
   rm -rf node_modules/.cache
   ```

3. **Rebuild con variables de entorno:**
   ```bash
   npm run build
   ```

4. **Reiniciar la aplicación:**
   ```bash
   pm2 restart inventario-academia
   ```

## 📝 Verificación

### Verificar que las variables están cargadas:

```bash
# Ver logs de PM2
pm2 logs inventario-academia --lines 50

# Deberías ver:
# ✅ "Ready in X ms" sin errores de Supabase
# ❌ NO deberías ver "supabaseUrl is required"
```

### Verificar en el navegador:

```bash
# Abrir la consola del navegador y ejecutar:
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)

# Debería mostrar tu URL de Supabase, no undefined
```

## 🔒 Seguridad

**IMPORTANTE:** El archivo `.env` contiene información sensible:

```bash
# Verificar permisos (debe ser 600)
ls -la .env

# Si no es 600, corregir:
chmod 600 .env

# Verificar que NO está en git
cat .gitignore | grep .env
```

## 📚 Estructura del .env

```bash
# .env (en el servidor)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=tu-secret-super-seguro-aqui
NODE_ENV=production
```

## 🐛 Troubleshooting

### Si el error persiste:

1. **Verificar que las variables están en .env:**
   ```bash
   cat .env
   ```

2. **Verificar que PM2 carga el .env:**
   ```bash
   pm2 describe inventario-academia | grep env
   ```

3. **Reiniciar PM2 completamente:**
   ```bash
   pm2 delete inventario-academia
   pm2 start npm --name "inventario-academia" -- start
   pm2 save
   ```

4. **Verificar logs en tiempo real:**
   ```bash
   pm2 logs inventario-academia --lines 100
   ```

## ✅ Resultado Esperado

Después de aplicar la solución:

- ✅ Build completa sin errores
- ✅ No hay warnings de "supabaseUrl is required"
- ✅ La aplicación inicia correctamente
- ✅ Las rutas API funcionan
- ✅ Dashboard carga sin errores

## 🔧 Prevención Futura

Agregar al script de deploy:

```bash
# En tu script de deploy
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    exit 1
fi

if ! grep -q "NEXT_PUBLIC_SUPABASE_URL" .env; then
    echo "❌ Error: NEXT_PUBLIC_SUPABASE_URL not found in .env"
    exit 1
fi

echo "✅ Environment variables verified"
```

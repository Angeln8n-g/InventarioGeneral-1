# Configuración de Job Programado para Expiración de Reservas

Este documento explica cómo configurar un job programado (cron) para expirar automáticamente las reservas vencidas.

## 🎯 Objetivo

Ejecutar automáticamente el endpoint `/api/reservations/expire` cada hora para:
- Marcar reservas vencidas como `expired`
- Liberar el stock reservado
- Mantener el sistema actualizado

## 📋 Opciones de Implementación

### Opción 1: Vercel Cron Jobs (Recomendado para Vercel)

Si tu aplicación está desplegada en Vercel, puedes usar Vercel Cron Jobs:

1. **Crear archivo `vercel.json` en la raíz del proyecto:**

```json
{
  "crons": [
    {
      "path": "/api/reservations/expire",
      "schedule": "0 * * * *"
    }
  ]
}
```

2. **Agregar variable de entorno en Vercel:**
   - Ve a tu proyecto en Vercel Dashboard
   - Settings → Environment Variables
   - Agrega: `CRON_API_KEY=tu_clave_secreta_aqui`

3. **Deploy:**
   - El cron se activará automáticamente después del deploy
   - Se ejecutará cada hora (0 * * * *)

### Opción 2: GitHub Actions

Crear archivo `.github/workflows/expire-reservations.yml`:

```yaml
name: Expire Reservations

on:
  schedule:
    # Ejecutar cada hora
    - cron: '0 * * * *'
  workflow_dispatch: # Permite ejecución manual

jobs:
  expire:
    runs-on: ubuntu-latest
    steps:
      - name: Call expiration endpoint
        run: |
          curl -X POST https://tu-dominio.com/api/reservations/expire \
            -H "x-api-key: ${{ secrets.CRON_API_KEY }}" \
            -H "Content-Type: application/json"
```

**Configurar Secret:**
- Ve a tu repositorio → Settings → Secrets and variables → Actions
- Agrega: `CRON_API_KEY` con tu clave secreta

### Opción 3: Servicio Externo (EasyCron, cron-job.org)

1. **Registrarse en un servicio de cron:**
   - [EasyCron](https://www.easycron.com/)
   - [cron-job.org](https://cron-job.org/)

2. **Configurar el job:**
   - URL: `https://tu-dominio.com/api/reservations/expire`
   - Método: POST
   - Headers: `x-api-key: tu_clave_secreta`
   - Frecuencia: Cada hora

### Opción 4: Supabase Edge Functions

Si usas Supabase, puedes crear una Edge Function:

```typescript
// supabase/functions/expire-reservations/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  try {
    const response = await fetch('https://tu-dominio.com/api/reservations/expire', {
      method: 'POST',
      headers: {
        'x-api-key': Deno.env.get('CRON_API_KEY') || '',
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

Luego configurar en Supabase Dashboard → Edge Functions → Cron Jobs

### Opción 5: Servidor Propio (Linux Crontab)

Si tienes un servidor Linux:

```bash
# Editar crontab
crontab -e

# Agregar línea (ejecutar cada hora)
0 * * * * curl -X POST https://tu-dominio.com/api/reservations/expire -H "x-api-key: tu_clave_secreta" -H "Content-Type: application/json"
```

## 🔒 Seguridad

### Generar API Key Segura

```bash
# Opción 1: OpenSSL
openssl rand -base64 32

# Opción 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Opción 3: Online
# https://www.uuidgenerator.net/api/guid
```

### Configurar en .env

```env
CRON_API_KEY=tu_clave_generada_aqui
```

## 📊 Monitoreo

### Verificar Estado

```bash
# Ver estadísticas de expiración
curl https://tu-dominio.com/api/reservations/expire

# Respuesta esperada:
{
  "stats": {
    "total": 45,
    "active": 12,
    "expired": 8,
    "expiring_soon": 3,
    "overdue": 1
  },
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

### Ejecutar Manualmente

```bash
# Ejecutar job de expiración
curl -X POST https://tu-dominio.com/api/reservations/expire \
  -H "x-api-key: tu_clave_secreta" \
  -H "Content-Type: application/json"

# Respuesta esperada:
{
  "success": true,
  "message": "Reservation expiration job completed",
  "stats": {
    "active": 12,
    "expired": 8,
    "timestamp": "2024-01-15T10:00:00.000Z"
  }
}
```

## 🧪 Testing

### Probar Localmente

```bash
# 1. Iniciar servidor de desarrollo
npm run dev

# 2. En otra terminal, ejecutar:
curl -X POST http://localhost:3000/api/reservations/expire \
  -H "Content-Type: application/json"
```

### Verificar Logs

Los logs aparecerán en la consola del servidor:
```
🕐 Running reservation expiration job...
✅ Expiration job completed. Active: 12, Expired: 8
```

## 📅 Frecuencias Recomendadas

- **Cada hora (0 * * * *)**: Recomendado para producción
- **Cada 30 minutos (*/30 * * * *)**: Para alta demanda
- **Cada 6 horas (0 */6 * * *)**: Para bajo tráfico
- **Diario a medianoche (0 0 * * *)**: Mínimo recomendado

## ⚠️ Consideraciones

1. **Zona Horaria**: Asegúrate de que el cron use la zona horaria correcta
2. **Timeout**: El endpoint debe completarse en menos de 30 segundos
3. **Reintentos**: Configura reintentos en caso de fallo
4. **Notificaciones**: Considera agregar alertas si el job falla
5. **Logs**: Monitorea los logs para detectar problemas

## 🔄 Alternativa: Trigger en Base de Datos

Si prefieres, puedes usar un trigger de PostgreSQL en Supabase:

```sql
-- Crear función que se ejecuta periódicamente
CREATE OR REPLACE FUNCTION auto_expire_reservations()
RETURNS void AS $$
BEGIN
  UPDATE consumable_reservations
  SET status = 'expired',
      updated_at = CURRENT_TIMESTAMP
  WHERE status = 'active'
    AND expiration_date < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Programar con pg_cron (requiere extensión)
SELECT cron.schedule('expire-reservations', '0 * * * *', 'SELECT auto_expire_reservations()');
```

**Nota**: pg_cron requiere permisos de superusuario en Supabase.

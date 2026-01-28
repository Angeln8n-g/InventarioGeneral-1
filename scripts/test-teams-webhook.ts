/**
 * Script para probar la integración con Microsoft Teams
 * Usa el formato de texto simple compatible con Power Automate
 */

import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const WEBHOOK_URL = process.env.TEAMS_WEBHOOK_URL

if (!WEBHOOK_URL) {
  console.error('❌ Error: TEAMS_WEBHOOK_URL no está configurado')
  process.exit(1)
}

console.log('🔗 Webhook URL configurada\n')

// Formato de texto simple - compatible con Power Automate
const testPayload = {
  text: `📋 **Prueba de Integración**

¡La conexión con el Sistema de Inventario funciona correctamente!

• **Sistema:** Sistema de Inventario
• **Estado:** ✅ Conectado
• **Fecha:** ${new Date().toLocaleString('es-ES')}

🔗 [Abrir Sistema](${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'})`
}

async function testWebhook() {
  console.log('📤 Enviando notificación de prueba...\n')

  try {
    const response = await fetch(WEBHOOK_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    })

    console.log('📊 Status:', response.status, response.statusText)

    if (response.ok || response.status === 202) {
      console.log('\n✅ ¡Notificación enviada!')
      console.log('📱 Revisa el canal de Teams para ver el mensaje.')
    } else {
      const text = await response.text()
      console.error('\n❌ Error:', text)
    }
  } catch (error) {
    console.error('\n❌ Error de conexión:', error)
  }
}

testWebhook()

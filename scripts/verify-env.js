#!/usr/bin/env node

/**
 * Script de verificación de variables de entorno
 * Ejecutar en el servidor para diagnosticar problemas de configuración
 */

console.log('🔍 Verificando configuración de variables de entorno...\n')

const requiredEnvVars = {
    'NEXT_PUBLIC_SUPABASE_URL': {
        description: 'URL de tu proyecto Supabase',
        example: 'https://xxxxx.supabase.co',
        critical: true
    },
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': {
        description: 'Clave anónima de Supabase',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        critical: true
    },
    'JWT_SECRET': {
        description: 'Secreto para firmar tokens JWT',
        example: 'un-string-aleatorio-muy-seguro',
        critical: true
    },
    'NODE_ENV': {
        description: 'Entorno de ejecución',
        example: 'production',
        critical: false
    }
}

let hasErrors = false
let hasCriticalErrors = false

console.log('📋 Variables de entorno requeridas:\n')

for (const [varName, config] of Object.entries(requiredEnvVars)) {
    const value = process.env[varName]
    const status = value ? '✅' : (config.critical ? '❌' : '⚠️')

    console.log(`${status} ${varName}`)
    console.log(`   Descripción: ${config.description}`)

    if (value) {
        // Mostrar solo los primeros y últimos caracteres por seguridad
        const maskedValue = value.length > 20
            ? `${value.substring(0, 10)}...${value.substring(value.length - 10)}`
            : '***'
        console.log(`   Valor: ${maskedValue}`)
        console.log(`   Longitud: ${value.length} caracteres`)
    } else {
        console.log(`   ❗ NO CONFIGURADA`)
        console.log(`   Ejemplo: ${config.example}`)
        hasErrors = true
        if (config.critical) {
            hasCriticalErrors = true
        }
    }
    console.log()
}

// Verificar conectividad a Supabase
console.log('🌐 Verificando conectividad a Supabase...\n')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (supabaseUrl && supabaseKey) {
    console.log('Intentando conectar a:', supabaseUrl)

    fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
        }
    })
        .then(response => {
            if (response.ok) {
                console.log('✅ Conexión a Supabase exitosa!')
                console.log(`   Status: ${response.status}`)
            } else {
                console.log('❌ Error al conectar a Supabase')
                console.log(`   Status: ${response.status}`)
                console.log(`   Verifica que la URL y la clave sean correctas`)
                hasErrors = true
            }
        })
        .catch(error => {
            console.log('❌ Error de red al conectar a Supabase')
            console.log(`   Error: ${error.message}`)
            console.log('   Posibles causas:')
            console.log('   - Firewall bloqueando conexiones salientes')
            console.log('   - URL de Supabase incorrecta')
            console.log('   - Problemas de DNS')
            hasErrors = true
        })
        .finally(() => {
            console.log('\n' + '='.repeat(60))

            if (hasCriticalErrors) {
                console.log('\n❌ ERRORES CRÍTICOS ENCONTRADOS')
                console.log('La aplicación NO funcionará sin estas variables.')
                console.log('\nPara configurarlas:')
                console.log('1. Crea un archivo .env.production en la raíz del proyecto')
                console.log('2. Agrega las variables faltantes')
                console.log('3. Reinicia la aplicación (pm2 restart all)')
                console.log('\nVer PRODUCTION_SETUP.md para más detalles.')
                process.exit(1)
            } else if (hasErrors) {
                console.log('\n⚠️  ADVERTENCIAS ENCONTRADAS')
                console.log('La aplicación puede funcionar, pero revisa las advertencias.')
                process.exit(0)
            } else {
                console.log('\n✅ CONFIGURACIÓN CORRECTA')
                console.log('Todas las variables están configuradas.')
                process.exit(0)
            }
        })
} else {
    console.log('❌ No se puede verificar conectividad sin las variables de Supabase')
    console.log('\n' + '='.repeat(60))
    console.log('\n❌ ERRORES CRÍTICOS ENCONTRADOS')
    console.log('Configura las variables de entorno antes de continuar.')
    process.exit(1)
}

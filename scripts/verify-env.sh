#!/bin/bash

# Script para verificar variables de entorno antes del build

echo "🔍 Verificando variables de entorno..."

# Verificar que existe el archivo .env
if [ ! -f .env ]; then
    echo "❌ Error: Archivo .env no encontrado"
    echo "💡 Crea el archivo .env basándote en .env.example"
    exit 1
fi

# Verificar variables requeridas
REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "JWT_SECRET"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^${var}=" .env; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "❌ Error: Faltan las siguientes variables en .env:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "💡 Agrega estas variables a tu archivo .env"
    exit 1
fi

# Verificar que las variables no estén vacías
source .env

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ Error: NEXT_PUBLIC_SUPABASE_URL está vacía"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: NEXT_PUBLIC_SUPABASE_ANON_KEY está vacía"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ Error: JWT_SECRET está vacía"
    exit 1
fi

echo "✅ Todas las variables de entorno están configuradas correctamente"
echo ""
echo "📋 Configuración:"
echo "   - NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:0:30}..."
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY:0:30}..."
echo "   - JWT_SECRET: ***"
echo ""

exit 0

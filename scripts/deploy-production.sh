#!/bin/bash

# Script de despliegue en producción
# Ejecutar en el servidor: bash scripts/deploy-production.sh

set -e  # Salir si hay algún error

echo "🚀 Iniciando despliegue en producción..."
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_step() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# 1. Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    print_error "No se encontró package.json. Asegúrate de estar en el directorio del proyecto."
    exit 1
fi
print_step "Directorio del proyecto verificado"

# 2. Verificar variables de entorno
if [ ! -f ".env.production" ]; then
    print_warning "No se encontró .env.production"
    echo "Creando archivo de ejemplo..."
    cat > .env.production << 'EOF'
# CONFIGURAR ESTAS VARIABLES
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
JWT_SECRET=
NODE_ENV=production
EOF
    print_error "Por favor, configura las variables en .env.production antes de continuar"
    exit 1
fi
print_step "Archivo .env.production encontrado"

# 3. Verificar Node.js y npm
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
print_step "Node.js $NODE_VERSION y npm $NPM_VERSION detectados"

# 4. Instalar dependencias
echo ""
echo "📦 Instalando dependencias..."
npm ci --production=false
print_step "Dependencias instaladas"

# 5. Verificar variables de entorno
echo ""
echo "🔍 Verificando configuración..."
if command -v node &> /dev/null; then
    node scripts/verify-env.js || {
        print_error "Verificación de variables de entorno falló"
        echo "Por favor, revisa tu archivo .env.production"
        exit 1
    }
fi
print_step "Variables de entorno verificadas"

# 6. Build de producción
echo ""
echo "🏗️  Compilando aplicación..."
npm run build
print_step "Build completado exitosamente"

# 7. Detener aplicación actual (si existe)
echo ""
echo "🔄 Reiniciando aplicación..."
if command -v pm2 &> /dev/null; then
    pm2 stop all || true
    pm2 delete all || true
    print_step "Aplicación anterior detenida"
    
    # 8. Iniciar aplicación con PM2
    pm2 start npm --name "inventario-app" -- start
    pm2 save
    print_step "Aplicación iniciada con PM2"
else
    print_warning "PM2 no está instalado. Inicia la aplicación manualmente con: npm start"
fi

# 9. Verificar estado
echo ""
echo "📊 Estado de la aplicación:"
if command -v pm2 &> /dev/null; then
    pm2 status
fi

echo ""
echo -e "${GREEN}✅ Despliegue completado exitosamente!${NC}"
echo ""
echo "Próximos pasos:"
echo "  1. Verifica los logs: pm2 logs"
echo "  2. Accede a tu aplicación en el navegador"
echo "  3. Prueba el login con tus credenciales"
echo ""
echo "Si encuentras problemas:"
echo "  - Revisa los logs: pm2 logs"
echo "  - Verifica las variables: npm run verify-env"
echo "  - Consulta: SOLUCION_ERROR_PRODUCCION.md"

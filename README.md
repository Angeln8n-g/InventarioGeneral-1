# 🏢 Sistema de Inventario CCC - Claro

Sistema completo de gestión de inventario para herramientas, consumibles y dispositivos electrónicos con tema personalizado de Claro.

## 🚀 Quick Start

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase

# Iniciar servidor de desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📋 Características Principales

### 🔧 Gestión de Herramientas

- Préstamo y devolución de herramientas
- Escaneo QR para identificación rápida
- Sistema de "bulto" para préstamos múltiples
- Sistema de "vault" para devoluciones múltiples
- Tracking de estado y condición

### 📦 Gestión de Consumibles

- Solicitud de materiales
- Sistema de carrito de compras
- Escaneo QR para consumo
- Devolución de consumibles
- Control de stock en tiempo real
- Sistema de reservas

### 💻 Dispositivos Electrónicos

- Gestión de laptops, tablets, etc.
- Asignación a usuarios
- Tracking de garantías
- Historial de mantenimiento

### 📊 Reportes y Analytics

- Reportes de préstamos
- Reportes de consumibles
- Reportes de compras
- Reportes de reservas
- Exportación a PDF y Excel

### 🔔 Sistema de Notificaciones

- Notificaciones en tiempo real
- Preferencias personalizables
- Sonidos opcionales
- Historial de notificaciones

### 🎨 Tema Claro Personalizado

- Colores corporativos de Claro
- Modo oscuro/claro
- Diseño responsive
- Iconos personalizados

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 15.5.4 con Turbopack
- **React**: 19.1.0
- **Base de Datos**: Supabase (PostgreSQL)
- **Estado**: Redux Toolkit + RTK Query
- **Estilos**: Tailwind CSS
- **Notificaciones**: Sonner
- **QR Codes**: html5-qrcode
- **Gráficos**: Recharts
- **PDF**: jsPDF
- **Formularios**: React Hook Form + Yup

## 📁 Estructura del Proyecto

```
├── src/
│   ├── app/              # Páginas y rutas de Next.js
│   │   ├── api/          # API routes
│   │   ├── admin/        # Páginas de administración
│   │   ├── consumables/  # Gestión de consumibles
│   │   ├── tools/        # Gestión de herramientas
│   │   └── ...
│   ├── components/       # Componentes reutilizables
│   ├── contexts/         # React contexts
│   ├── features/         # Features por módulo
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Utilidades y configuración
│   ├── services/         # API services (RTK Query)
│   ├── types/            # TypeScript types
│   └── utils/            # Funciones utilitarias
├── public/               # Assets estáticos
├── docs/                 # Documentación
│   ├── features/         # Documentación de features
│   ├── guides/           # Guías de uso
│   ├── api/              # Documentación de API
│   ├── migrations/       # Guías de migración
│   ├── testing/          # Guías de testing
│   └── archived/         # Documentación histórica
├── scripts/              # Scripts de utilidad
└── supabase/             # Migraciones de base de datos
```

## 🔑 Comandos Principales

```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo
npm run build            # Build para producción
npm run start            # Iniciar servidor de producción

# Calidad de Código
npm run lint             # Ejecutar ESLint
npm run type-check       # Verificar tipos TypeScript

# Base de Datos
npm run import:tools     # Importar herramientas desde CSV
npm run cleanup:notifications  # Limpiar notificaciones de prueba

# Análisis
npm run analyze          # Analizar tamaño del bundle
```

## 🔐 Roles y Permisos

### Usuario Regular

- Ver y solicitar herramientas/consumibles
- Ver sus préstamos activos
- Devolver items
- Ver notificaciones

### Administrador

- Todas las funciones de usuario
- Gestión de inventario
- Gestión de usuarios
- Acceso a reportes
- Configuración del sistema

## 📚 Documentación

- **[Guías de Usuario](./docs/guides/)** - Cómo usar el sistema
- **[Documentación de Features](./docs/features/)** - Detalles de cada feature
- **[API Documentation](./docs/api/)** - Endpoints y ejemplos
- **[Guías de Migración](./docs/migrations/)** - Actualizaciones y migraciones
- **[Testing](./docs/testing/)** - Guías de testing

## 🚀 Deployment

### Producción con Docker (Recomendado)

El proyecto incluye scripts automatizados para despliegue en producción con Docker, Nginx y SSL.

#### Quick Start

**Linux/Ubuntu (Servidor de Producción):**
```bash
# Dar permisos de ejecución
chmod +x deploy.sh

# Despliegue completo automatizado
./deploy.sh --all
```

**Windows (Desarrollo Local):**
```powershell
# Despliegue completo automatizado
.\deploy.ps1 -All
```

#### Características del Script de Despliegue

- ✅ Verificación automática de prerequisitos
- ✅ Construcción optimizada de imágenes Docker
- ✅ Despliegue automatizado con Docker Compose
- ✅ Health checks automáticos
- ✅ Soporte para rollback
- ✅ Verificación de estado post-despliegue

#### Documentación Completa

- **[Guía de Despliegue Completa](./DEPLOYMENT.md)** - Instrucciones paso a paso
- **[Documentación de Scripts](./DEPLOYMENT_SCRIPTS.md)** - Detalles de los scripts
- **[Configuración SSL](./docs/SSL_SETUP.md)** - Setup de certificados SSL
- **[Configuración PostgreSQL](./docs/POSTGRESQL_SETUP.md)** - Setup de base de datos
- **[Guía de Portainer](./docs/PORTAINER_GUIDE.md)** - Gestión de contenedores
- **[Actualización y Rollback](./docs/UPDATE_ROLLBACK.md)** - Procedimientos de actualización

### Vercel (Alternativa)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker Manual

```bash
# Build imagen
docker build -t inventory-system .

# Ejecutar contenedor
docker run -p 3000:3000 inventory-system
```

## 🔧 Configuración

### Variables de Entorno

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT
JWT_SECRET=your_jwt_secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📝 Changelog

Ver [CHANGELOG.md](./docs/archived/CHANGELOG.md) para historial de cambios.

## 📄 Licencia

Este proyecto es privado y confidencial.

## 👥 Equipo

Desarrollado para Claro - Centro de Competencias Claro (CCC)

## 🆘 Soporte

Para soporte y preguntas:

- Revisar la [documentación](./docs/)
- Crear un issue en el repositorio
- Contactar al equipo de desarrollo

---

**Versión**: 1.0.0  
**Última actualización**: 2025  
**Next.js**: 15.5.4  
**React**: 19.1.0

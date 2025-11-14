# Plan de Implementación de Idiomas (i18n)

## 📊 Estado Actual del Proyecto

### ✅ Implementación Existente

El proyecto ya cuenta con:
- **LanguageContext** (`src/contexts/LanguageContext.tsx`) con sistema de traducciones
- **Idiomas soportados**: Inglés (en) y Español (es)
- **Función de traducción**: `t(key)` disponible mediante hook `useLanguage()`
- **Persistencia**: Idioma guardado en localStorage
- **Provider**: Integrado en el layout principal

### 📈 Cobertura Actual

**Páginas con traducciones implementadas:**
- ✅ Dashboard (`/dashboard`)
- ✅ My Loans (`/my-loans`)
- ✅ My Requests (`/my-requests`)
- ✅ Profile (`/profile`)
- ✅ Change Password (`/profile/change-password`)
- ✅ Scanner (`/scanner`)
- ✅ Consumables Scan (`/consumables/scan`)
- ✅ Tools Scan (`/tools/scan`)
- ✅ Tools Return (`/tools/return`)
- ✅ Admin Dashboard (`/admin/dashboard`)

**Componentes con traducciones:**
- ✅ MobileNavigation
- ✅ QuickActionButtons
- ✅ ActiveLoansSection
- ✅ LoanCard
- ✅ NotificationsDropdown
- ✅ MobileHeader


### ❌ Páginas SIN traducciones

**Páginas Admin:**
- ❌ `/admin/tools` - Manage Tools
- ❌ `/admin/tools/new` - Add New Tool
- ❌ `/admin/tools/[id]` - Tool Details
- ❌ `/admin/users` - Manage Users
- ❌ `/admin/users/new` - Add New User
- ❌ `/admin/users/[id]` - User Details
- ❌ `/admin/consumables` - Consumables Management
- ❌ `/admin/consumables/[id]` - Consumable Details
- ❌ `/admin/item-types/new` - Add Item Type
- ❌ `/admin/loans` - Manage Loans
- ❌ `/admin/reports` - Reports Hub
- ❌ `/admin/reports/categories` - Categories Report
- ❌ `/admin/reports/loans` - Loans Report
- ❌ `/admin/reports/tools` - Tools Report
- ❌ `/admin/reports/consumables` - Consumables Report
- ❌ `/admin/reports/purchases` - Purchases Report
- ❌ `/admin/audit` - Audit Log

**Páginas Públicas:**
- ❌ `/` - Landing Page
- ❌ `/login` - Login Page

**Otras Páginas:**
- ❌ `/consumables` - Consumables List

**Componentes sin traducciones:**
- ❌ Landing components (Navigation, Hero, Features, Benefits, CTA, Footer)
- ❌ BulkImportConsumables
- ❌ Bag components (BagButton, BagModal, LoanConfirmationModal)
- ❌ Cart components (CartButton, CartModal)
- ❌ Vault components (VaultButton, VaultModal)
- ❌ Scanner components (BatchConfirmation, QuantityModal, etc.)
- ❌ Reports components (todos)
- ❌ NotificationPreferences


## 🎯 Plan de Implementación

### Fase 1: Expansión del Diccionario de Traducciones (PRIORIDAD ALTA)

Agregar las siguientes claves al archivo `LanguageContext.tsx`:

#### 1.1 Admin - Tools Management
```typescript
// English
'admin.tools.title': 'Manage Tools',
'admin.tools.addNew': 'Add New Tool',
'admin.tools.backToDashboard': 'Back to Dashboard',
'admin.tools.totalTools': 'Total Tools',
'admin.tools.available': 'Available',
'admin.tools.loaned': 'Loaned',
'admin.tools.maintenance': 'Maintenance',
'admin.tools.search': 'Search',
'admin.tools.searchPlaceholder': 'Search by name, QR code, or serial number...',
'admin.tools.filterByStatus': 'Filter by Status',
'admin.tools.filterByCategory': 'Filter by Category',
'admin.tools.allStatus': 'All Status',
'admin.tools.allCategories': 'All Categories',
'admin.tools.activeFilters': 'Active filters:',
'admin.tools.clearAll': 'Clear all',
'admin.tools.noToolsFound': 'No Tools Found',
'admin.tools.noToolsMatch': 'No tools match your search criteria.',
'admin.tools.noToolsYet': 'No tools have been added yet.',
'admin.tools.clearFilters': 'Clear Filters',
'admin.tools.viewDetails': 'View Details',
'admin.tools.qrCode': 'QR Code',
'admin.tools.serial': 'Serial',
'admin.tools.category': 'Category',
'admin.tools.added': 'Added',
'admin.tools.notes': 'Notes',
'admin.tools.loadingTools': 'Loading tools...',

// Spanish
'admin.tools.title': 'Gestionar Herramientas',
'admin.tools.addNew': 'Agregar Nueva Herramienta',
'admin.tools.backToDashboard': 'Volver al Panel',
// ... (continuar con todas las traducciones)
```


#### 1.2 Admin - Users Management
```typescript
'admin.users.title': 'Manage Users',
'admin.users.addNew': 'Add New User',
'admin.users.totalUsers': 'Total Users',
'admin.users.admins': 'Admins',
'admin.users.regularUsers': 'Regular Users',
'admin.users.searchPlaceholder': 'Search by username or email...',
'admin.users.filterByRole': 'Filter by Role',
'admin.users.allRoles': 'All Roles',
'admin.users.admin': 'Admin',
'admin.users.user': 'User',
'admin.users.viewProfile': 'View Profile',
'admin.users.joined': 'Joined',
'admin.users.noUsersFound': 'No Users Found',
'admin.users.loadingUsers': 'Loading users...',
```

#### 1.3 Admin - Reports
```typescript
'admin.reports.title': 'Reports Center',
'admin.reports.subtitle': 'Access detailed reports and system inventory analysis',
'admin.reports.categories': 'Categories Dashboard',
'admin.reports.categoriesDesc': 'Complete inventory view organized by categories with key metrics',
'admin.reports.loans': 'Loans Reports',
'admin.reports.loansDesc': 'Detailed analysis of loans, return rates and most active users',
'admin.reports.tools': 'Tools Inventory Reports',
'admin.reports.toolsDesc': 'Inventory status, utilization rates and tools requiring maintenance',
'admin.reports.consumables': 'Consumables Reports',
'admin.reports.consumablesDesc': 'Consumption analysis by category, stock levels and restocking projections',
'admin.reports.about': 'About Reports',
'admin.reports.aboutDesc': 'All reports include interactive visualizations, advanced filters and export options in multiple formats (PDF, Excel, CSV). Data is updated in real-time from the database.',
```


#### 1.4 Landing Page
```typescript
'landing.nav.features': 'Features',
'landing.nav.benefits': 'Benefits',
'landing.nav.contact': 'Contact',
'landing.nav.login': 'Login',
'landing.hero.title': 'Educational Inventory Management System',
'landing.hero.subtitle': 'Efficient control of tools and consumables for educational institutions',
'landing.hero.cta': 'Get Started',
'landing.features.title': 'Key Features',
'landing.features.qr': 'QR Code Scanning',
'landing.features.qrDesc': 'Fast and accurate tool tracking',
'landing.features.realtime': 'Real-time Tracking',
'landing.features.realtimeDesc': 'Know the status of your inventory at all times',
'landing.features.reports': 'Detailed Reports',
'landing.features.reportsDesc': 'Analytics and insights for better decisions',
'landing.benefits.title': 'Benefits',
'landing.cta.title': 'Ready to optimize your inventory?',
'landing.cta.button': 'Start Now',
'landing.footer.rights': 'All rights reserved',
```

#### 1.5 Login Page
```typescript
'login.title': 'Login',
'login.welcome': 'Welcome back',
'login.subtitle': 'Enter your credentials to access',
'login.username': 'Username',
'login.password': 'Password',
'login.button': 'Login',
'login.loggingIn': 'Logging in...',
'login.error': 'Invalid credentials',
'login.required': 'All fields are required',
```


#### 1.6 Bag/Cart/Vault Components
```typescript
'bag.title': 'Tool Bag',
'bag.empty': 'Your bag is empty',
'bag.emptyDesc': 'Scan tools to add them to your bag',
'bag.items': 'items',
'bag.confirmLoan': 'Confirm Loan',
'bag.clear': 'Clear Bag',
'bag.addedSuccess': 'added to bag',

'cart.title': 'Shopping Cart',
'cart.empty': 'Your cart is empty',
'cart.emptyDesc': 'Scan consumables to add them to your cart',
'cart.confirmConsumption': 'Confirm Consumption',

'vault.title': 'Return Vault',
'vault.empty': 'No tools to return',
'vault.emptyDesc': 'Scan tools to add them to the return vault',
'vault.confirmReturn': 'Confirm Return',
'vault.items': 'tools to return',

'loanConfirmation.title': 'Confirm Loan',
'loanConfirmation.dueDate': 'Due Date',
'loanConfirmation.notes': 'Notes (optional)',
'loanConfirmation.notesPlaceholder': 'Add any notes about this loan...',
'loanConfirmation.confirm': 'Confirm Loan',
'loanConfirmation.cancel': 'Cancel',
'loanConfirmation.hasActiveLoan': 'You have an active loan. New tools will be added to it.',
```

#### 1.7 Scanner Components
```typescript
'scanner.batch.title': 'Batch Scan',
'scanner.batch.scanned': 'Scanned',
'scanner.batch.items': 'items',
'scanner.batch.confirm': 'Confirm Batch',
'scanner.batch.clear': 'Clear All',
'scanner.quantity.title': 'Enter Quantity',
'scanner.quantity.placeholder': 'Quantity',
'scanner.quantity.confirm': 'Confirm',
'scanner.multiMode.loan': 'Loan Mode',
'scanner.multiMode.return': 'Return Mode',
'scanner.multiMode.consume': 'Consume Mode',
```


#### 1.8 Status Labels
```typescript
'status.available': 'Available',
'status.loaned': 'Loaned',
'status.outOfService': 'Out of Service',
'status.lost': 'Lost',
'status.damaged': 'Damaged',
'status.pending': 'Pending',
'status.fulfilled': 'Fulfilled',
'status.cancelled': 'Cancelled',
'status.partial': 'Partially Fulfilled',
```

#### 1.9 Forms & Validation
```typescript
'form.required': 'This field is required',
'form.invalidEmail': 'Invalid email address',
'form.invalidFormat': 'Invalid format',
'form.minLength': 'Minimum {count} characters',
'form.maxLength': 'Maximum {count} characters',
'form.selectOption': 'Select an option',
'form.enterValue': 'Enter a value',
```

#### 1.10 Bulk Import
```typescript
'bulkImport.title': 'Bulk Import Consumables',
'bulkImport.button': 'Bulk Import',
'bulkImport.selectFile': 'Select CSV File',
'bulkImport.dragDrop': 'or drag and drop',
'bulkImport.fileFormat': 'CSV file with columns: name, description, category, current_stock, minimum_threshold',
'bulkImport.downloadTemplate': 'Download Template',
'bulkImport.uploading': 'Uploading...',
'bulkImport.processing': 'Processing...',
'bulkImport.success': 'Successfully imported {count} items',
'bulkImport.error': 'Error importing file',
'bulkImport.close': 'Close',
```


### Fase 2: Actualización de Páginas Admin (PRIORIDAD ALTA)

**Archivos a modificar:**

1. **`src/app/admin/tools/page.tsx`**
   - Reemplazar todos los textos hardcodeados con `t('admin.tools.*')`
   - Títulos, botones, labels, placeholders, mensajes

2. **`src/app/admin/users/page.tsx`**
   - Implementar `useLanguage()` hook
   - Traducir todos los textos

3. **`src/app/admin/reports/page.tsx`**
   - Traducir títulos y descripciones de reportes
   - Traducir sección informativa

4. **`src/app/admin/consumables/page.tsx`**
   - Traducir gestión de consumibles
   - Filtros y búsqueda

5. **`src/app/admin/loans/page.tsx`**
   - Traducir gestión de préstamos

6. **`src/app/admin/audit/page.tsx`**
   - Traducir log de auditoría

### Fase 3: Actualización de Componentes (PRIORIDAD MEDIA)

**Componentes a actualizar:**

1. **Bag Components**
   - `src/components/bag/BagButton.tsx`
   - `src/components/bag/BagModal.tsx`
   - `src/components/bag/LoanConfirmationModal.tsx`

2. **Cart Components**
   - `src/components/cart/CartButton.tsx`
   - `src/components/cart/CartModal.tsx`

3. **Vault Components**
   - `src/components/vault/VaultButton.tsx`
   - `src/components/vault/VaultModal.tsx`

4. **Scanner Components**
   - `src/components/scanner/BatchConfirmation.tsx`
   - `src/components/scanner/QuantityModal.tsx`
   - `src/components/scanner/MultiModeToggle.tsx`
   - `src/components/scanner/ScannedItemsList.tsx`

5. **Admin Components**
   - `src/components/admin/BulkImportConsumables.tsx`

6. **Reports Components**
   - Todos los componentes en `src/components/reports/`


### Fase 4: Landing Page y Login (PRIORIDAD MEDIA)

**Páginas públicas:**

1. **`src/app/page.tsx` (Landing)**
   - Implementar traducciones en todos los componentes landing

2. **`src/app/login/page.tsx`**
   - Traducir formulario de login
   - Mensajes de error

3. **Landing Components**
   - `src/components/landing/Navigation.tsx`
   - `src/components/landing/HeroSection.tsx`
   - `src/components/landing/FeaturesSection.tsx`
   - `src/components/landing/BenefitsSection.tsx`
   - `src/components/landing/CTASection.tsx`
   - `src/components/landing/Footer.tsx`

### Fase 5: Páginas de Detalle (PRIORIDAD BAJA)

**Páginas dinámicas:**

1. **`src/app/admin/tools/[id]/page.tsx`**
   - Detalles de herramienta

2. **`src/app/admin/users/[id]/page.tsx`**
   - Perfil de usuario

3. **`src/app/admin/consumables/[id]/page.tsx`**
   - Detalles de consumible

4. **`src/app/admin/tools/new/page.tsx`**
   - Formulario de nueva herramienta

5. **`src/app/admin/users/new/page.tsx`**
   - Formulario de nuevo usuario

6. **`src/app/admin/item-types/new/page.tsx`**
   - Formulario de nuevo tipo de artículo


## 🛠️ Guía de Implementación

### Paso 1: Agregar Traducciones al Diccionario

Editar `src/contexts/LanguageContext.tsx`:

```typescript
const translations = {
  en: {
    // ... traducciones existentes
    
    // Agregar nuevas claves aquí
    'admin.tools.title': 'Manage Tools',
    // ...
  },
  es: {
    // ... traducciones existentes
    
    // Agregar nuevas claves aquí
    'admin.tools.title': 'Gestionar Herramientas',
    // ...
  }
}
```

### Paso 2: Implementar en Componentes

**Antes:**
```typescript
<h1 className="text-2xl font-bold">Manage Tools</h1>
```

**Después:**
```typescript
import { useLanguage } from '@/contexts/LanguageContext'

function Component() {
  const { t } = useLanguage()
  
  return (
    <h1 className="text-2xl font-bold">{t('admin.tools.title')}</h1>
  )
}
```

### Paso 3: Manejo de Plurales y Variables

Para textos con variables, usar template strings:

```typescript
// En el diccionario
'bulkImport.success': 'Successfully imported {count} items',

// En el componente
const message = t('bulkImport.success').replace('{count}', count.toString())
```


## 📋 Checklist de Implementación

### Fase 1: Diccionario ✅
- [ ] Admin - Tools Management (30+ claves)
- [ ] Admin - Users Management (15+ claves)
- [ ] Admin - Reports (15+ claves)
- [ ] Admin - Consumables (20+ claves)
- [ ] Admin - Loans (15+ claves)
- [ ] Admin - Audit (10+ claves)
- [ ] Landing Page (25+ claves)
- [ ] Login Page (10+ claves)
- [ ] Bag/Cart/Vault (30+ claves)
- [ ] Scanner Components (15+ claves)
- [ ] Status Labels (10+ claves)
- [ ] Forms & Validation (10+ claves)
- [ ] Bulk Import (12+ claves)

### Fase 2: Páginas Admin ✅
- [ ] `/admin/tools`
- [ ] `/admin/users`
- [ ] `/admin/reports`
- [ ] `/admin/consumables`
- [ ] `/admin/loans`
- [ ] `/admin/audit`

### Fase 3: Componentes ✅
- [ ] BagButton, BagModal, LoanConfirmationModal
- [ ] CartButton, CartModal
- [ ] VaultButton, VaultModal
- [ ] Scanner components (4 archivos)
- [ ] BulkImportConsumables
- [ ] Reports components (5 archivos)

### Fase 4: Landing & Login ✅
- [ ] Landing page components (7 archivos)
- [ ] Login page

### Fase 5: Páginas de Detalle ✅
- [ ] Tool details & new
- [ ] User details & new
- [ ] Consumable details
- [ ] Item type new


## 🎨 Mejoras Recomendadas

### 1. Selector de Idioma Mejorado

Agregar un selector de idioma más visible en:
- Header principal
- Landing page
- Login page

```typescript
<button onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}>
  {language === 'en' ? '🇪🇸 Español' : '🇺🇸 English'}
</button>
```

### 2. Detección Automática de Idioma

Implementar detección basada en navegador:

```typescript
useEffect(() => {
  const savedLanguage = localStorage.getItem('language')
  if (!savedLanguage) {
    const browserLang = navigator.language.split('-')[0]
    if (browserLang === 'es' || browserLang === 'en') {
      setLanguageState(browserLang as Language)
    }
  }
}, [])
```

### 3. Formato de Fechas Localizado

Usar `Intl.DateTimeFormat` para fechas:

```typescript
const formatDate = (date: string) => {
  return new Intl.DateTimeFormat(language === 'es' ? 'es-ES' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date))
}
```

### 4. Números y Monedas

Formatear números según el idioma:

```typescript
const formatNumber = (num: number) => {
  return new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US').format(num)
}
```


## 📊 Estimación de Esfuerzo

### Tiempo Estimado por Fase

| Fase | Tareas | Tiempo Estimado | Prioridad |
|------|--------|----------------|-----------|
| Fase 1 | Diccionario (200+ claves) | 3-4 horas | Alta |
| Fase 2 | 6 páginas admin | 4-5 horas | Alta |
| Fase 3 | 15+ componentes | 5-6 horas | Media |
| Fase 4 | Landing + Login | 3-4 horas | Media |
| Fase 5 | Páginas detalle | 3-4 horas | Baja |
| **Total** | **~50 archivos** | **18-23 horas** | - |

### Orden de Implementación Recomendado

1. **Día 1-2**: Fase 1 (Diccionario completo)
2. **Día 2-3**: Fase 2 (Páginas admin críticas)
3. **Día 3-4**: Fase 3 (Componentes compartidos)
4. **Día 4-5**: Fase 4 (Landing y Login)
5. **Día 5-6**: Fase 5 (Páginas de detalle)

## 🧪 Testing

### Checklist de Pruebas

Para cada página/componente traducido:

- [ ] Verificar que todos los textos se muestran en inglés
- [ ] Verificar que todos los textos se muestran en español
- [ ] Cambiar idioma y verificar que se actualiza correctamente
- [ ] Verificar que no hay claves sin traducir (mostrando la clave en lugar del texto)
- [ ] Verificar que los textos no rompen el layout
- [ ] Verificar que los placeholders están traducidos
- [ ] Verificar que los mensajes de error están traducidos
- [ ] Verificar que los tooltips están traducidos

### Herramientas de Testing

```bash
# Buscar textos hardcodeados que deberían estar traducidos
grep -r "className.*>" src/app/admin/ | grep -E "(Manage|Add|Edit|Delete|Search|Filter)"

# Buscar claves de traducción faltantes
grep -r "t\('" src/ | sed "s/.*t('\([^']*\)'.*/\1/" | sort | uniq
```


## 🚀 Próximos Pasos

### Acción Inmediata

1. **Revisar y aprobar este plan**
2. **Decidir qué fases implementar primero**
3. **Comenzar con Fase 1**: Expandir el diccionario de traducciones

### Comando para Comenzar

```bash
# Abrir el archivo de contexto de idiomas
code src/contexts/LanguageContext.tsx

# Comenzar a agregar las nuevas claves de traducción
```

### Estructura Recomendada del Diccionario

Organizar las claves por secciones para mejor mantenibilidad:

```typescript
const translations = {
  en: {
    // ===== NAVIGATION =====
    'nav.*': '...',
    
    // ===== DASHBOARD =====
    'dashboard.*': '...',
    
    // ===== ADMIN =====
    'admin.dashboard.*': '...',
    'admin.tools.*': '...',
    'admin.users.*': '...',
    'admin.reports.*': '...',
    'admin.consumables.*': '...',
    'admin.loans.*': '...',
    'admin.audit.*': '...',
    
    // ===== COMPONENTS =====
    'bag.*': '...',
    'cart.*': '...',
    'vault.*': '...',
    'scanner.*': '...',
    
    // ===== LANDING =====
    'landing.*': '...',
    
    // ===== COMMON =====
    'common.*': '...',
    'status.*': '...',
    'form.*': '...',
  }
}
```

## 📝 Notas Finales

- El sistema de traducciones ya está funcionando correctamente
- Solo necesitamos expandir el diccionario y actualizar los componentes
- La arquitectura actual es sólida y escalable
- Se recomienda implementar por fases para facilitar el testing
- Priorizar páginas admin ya que son las más usadas por el equipo


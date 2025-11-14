# Traducciones Completas - Listas para Implementar

Este archivo contiene todas las traducciones necesarias organizadas por sección.
Copiar y pegar en `src/contexts/LanguageContext.tsx`

## 📦 ADMIN - TOOLS MANAGEMENT

### English
```typescript
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
'admin.tools.noCategoriesAvailable': 'No categories available',
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
'admin.tools.conditionNotes': 'Condition Notes',
'admin.tools.loadingTools': 'Loading tools...',
'admin.tools.statusAvailable': 'Available',
'admin.tools.statusLoaned': 'Loaned',
'admin.tools.statusOutOfService': 'Out of Service',
'admin.tools.statusLost': 'Lost',
'admin.tools.statusDamaged': 'Damaged',
```


### Spanish
```typescript
'admin.tools.title': 'Gestionar Herramientas',
'admin.tools.addNew': 'Agregar Nueva Herramienta',
'admin.tools.backToDashboard': 'Volver al Panel',
'admin.tools.totalTools': 'Herramientas Totales',
'admin.tools.available': 'Disponibles',
'admin.tools.loaned': 'Prestadas',
'admin.tools.maintenance': 'Mantenimiento',
'admin.tools.search': 'Buscar',
'admin.tools.searchPlaceholder': 'Buscar por nombre, código QR o número de serie...',
'admin.tools.filterByStatus': 'Filtrar por Estado',
'admin.tools.filterByCategory': 'Filtrar por Categoría',
'admin.tools.allStatus': 'Todos los Estados',
'admin.tools.allCategories': 'Todas las Categorías',
'admin.tools.noCategoriesAvailable': 'No hay categorías disponibles',
'admin.tools.activeFilters': 'Filtros activos:',
'admin.tools.clearAll': 'Limpiar todo',
'admin.tools.noToolsFound': 'No se Encontraron Herramientas',
'admin.tools.noToolsMatch': 'No hay herramientas que coincidan con tu búsqueda.',
'admin.tools.noToolsYet': 'No se han agregado herramientas aún.',
'admin.tools.clearFilters': 'Limpiar Filtros',
'admin.tools.viewDetails': 'Ver Detalles',
'admin.tools.qrCode': 'Código QR',
'admin.tools.serial': 'Serial',
'admin.tools.category': 'Categoría',
'admin.tools.added': 'Agregado',
'admin.tools.notes': 'Notas',
'admin.tools.conditionNotes': 'Notas de Condición',
'admin.tools.loadingTools': 'Cargando herramientas...',
'admin.tools.statusAvailable': 'Disponible',
'admin.tools.statusLoaned': 'Prestada',
'admin.tools.statusOutOfService': 'Fuera de Servicio',
'admin.tools.statusLost': 'Perdida',
'admin.tools.statusDamaged': 'Dañada',
```


## 👥 ADMIN - USERS MANAGEMENT

### English
```typescript
'admin.users.title': 'Manage Users',
'admin.users.addNew': 'Add New User',
'admin.users.totalUsers': 'Total Users',
'admin.users.admins': 'Admins',
'admin.users.regularUsers': 'Regular Users',
'admin.users.search': 'Search',
'admin.users.searchPlaceholder': 'Search by username or email...',
'admin.users.filterByRole': 'Filter by Role',
'admin.users.allRoles': 'All Roles',
'admin.users.admin': 'Admin',
'admin.users.user': 'User',
'admin.users.viewProfile': 'View Profile',
'admin.users.joined': 'Joined',
'admin.users.noUsersFound': 'No Users Found',
'admin.users.noUsersMatch': 'No users match your search criteria.',
'admin.users.noUsersYet': 'No users have been added yet.',
'admin.users.loadingUsers': 'Loading users...',
```

### Spanish
```typescript
'admin.users.title': 'Gestionar Usuarios',
'admin.users.addNew': 'Agregar Nuevo Usuario',
'admin.users.totalUsers': 'Usuarios Totales',
'admin.users.admins': 'Administradores',
'admin.users.regularUsers': 'Usuarios Regulares',
'admin.users.search': 'Buscar',
'admin.users.searchPlaceholder': 'Buscar por nombre de usuario o email...',
'admin.users.filterByRole': 'Filtrar por Rol',
'admin.users.allRoles': 'Todos los Roles',
'admin.users.admin': 'Administrador',
'admin.users.user': 'Usuario',
'admin.users.viewProfile': 'Ver Perfil',
'admin.users.joined': 'Registrado',
'admin.users.noUsersFound': 'No se Encontraron Usuarios',
'admin.users.noUsersMatch': 'No hay usuarios que coincidan con tu búsqueda.',
'admin.users.noUsersYet': 'No se han agregado usuarios aún.',
'admin.users.loadingUsers': 'Cargando usuarios...',
```


## 📊 ADMIN - REPORTS

### English
```typescript
'admin.reports.title': 'Reports Center',
'admin.reports.subtitle': 'Access detailed reports and system inventory analysis',
'admin.reports.categories': 'Categories Dashboard',
'admin.reports.categoriesDesc': 'Complete inventory view organized by categories with key metrics',
'admin.reports.categoriesStats': ['All categories', 'Tools and consumables', 'Utilization analysis'],
'admin.reports.loans': 'Loans Reports',
'admin.reports.loansDesc': 'Detailed analysis of loans, return rates and most active users',
'admin.reports.loansStats': ['Active loans', 'Return rate', 'Overdue loans'],
'admin.reports.tools': 'Tools Inventory Reports',
'admin.reports.toolsDesc': 'Inventory status, utilization rates and tools requiring maintenance',
'admin.reports.toolsStats': ['Total tools', 'Utilization rate', 'Maintenance required'],
'admin.reports.consumables': 'Consumables Reports',
'admin.reports.consumablesDesc': 'Consumption analysis by category, stock levels and restocking projections',
'admin.reports.consumablesStats': ['Consumable types', 'Low stock', 'Average consumption'],
'admin.reports.purchases': 'Purchase Reports',
'admin.reports.purchasesDesc': 'Purchase history and spending analysis',
'admin.reports.about': 'About Reports',
'admin.reports.aboutDesc': 'All reports include interactive visualizations, advanced filters and export options in multiple formats (PDF, Excel, CSV). Data is updated in real-time from the database.',
'admin.reports.loading': 'Loading...',
```

### Spanish
```typescript
'admin.reports.title': 'Centro de Reportes',
'admin.reports.subtitle': 'Accede a reportes detallados y análisis del sistema de inventario',
'admin.reports.categories': 'Dashboard de Categorías',
'admin.reports.categoriesDesc': 'Vista completa del inventario organizado por categorías con métricas clave',
'admin.reports.categoriesStats': ['Todas las categorías', 'Herramientas y consumibles', 'Análisis de utilización'],
'admin.reports.loans': 'Reportes de Préstamos',
'admin.reports.loansDesc': 'Análisis detallado de préstamos, tasas de devolución y usuarios más activos',
'admin.reports.loansStats': ['Préstamos activos', 'Tasa de devolución', 'Préstamos vencidos'],
'admin.reports.tools': 'Reportes de Inventario de Herramientas',
'admin.reports.toolsDesc': 'Estado del inventario, tasas de utilización y herramientas que requieren mantenimiento',
'admin.reports.toolsStats': ['Total de herramientas', 'Tasa de utilización', 'Mantenimiento requerido'],
'admin.reports.consumables': 'Reportes de Consumibles',
'admin.reports.consumablesDesc': 'Análisis de consumo por categoría, niveles de stock y proyecciones de reabastecimiento',
'admin.reports.consumablesStats': ['Tipos de consumibles', 'Stock bajo', 'Consumo promedio'],
'admin.reports.purchases': 'Reportes de Compras',
'admin.reports.purchasesDesc': 'Historial de compras y análisis de gastos',
'admin.reports.about': 'Acerca de los Reportes',
'admin.reports.aboutDesc': 'Todos los reportes incluyen visualizaciones interactivas, filtros avanzados y opciones de exportación en múltiples formatos (PDF, Excel, CSV). Los datos se actualizan en tiempo real desde la base de datos.',
'admin.reports.loading': 'Cargando...',
```


## 🎒 BAG / CART / VAULT COMPONENTS

### English
```typescript
'bag.title': 'Tool Bag',
'bag.empty': 'Your bag is empty',
'bag.emptyDesc': 'Scan tools to add them to your bag',
'bag.items': 'items',
'bag.item': 'item',
'bag.confirmLoan': 'Confirm Loan',
'bag.clear': 'Clear Bag',
'bag.addedSuccess': 'added to bag',
'bag.remove': 'Remove',
'bag.toolsInBag': 'tools in bag',

'cart.title': 'Shopping Cart',
'cart.empty': 'Your cart is empty',
'cart.emptyDesc': 'Scan consumables to add them to your cart',
'cart.confirmConsumption': 'Confirm Consumption',
'cart.clear': 'Clear Cart',
'cart.items': 'items',
'cart.item': 'item',
'cart.quantity': 'Quantity',
'cart.remove': 'Remove',

'vault.title': 'Return Vault',
'vault.empty': 'No tools to return',
'vault.emptyDesc': 'Scan tools to add them to the return vault',
'vault.confirmReturn': 'Confirm Return',
'vault.clear': 'Clear Vault',
'vault.items': 'tools to return',
'vault.item': 'tool to return',
'vault.remove': 'Remove',

'loanConfirmation.title': 'Confirm Loan',
'loanConfirmation.dueDate': 'Due Date',
'loanConfirmation.notes': 'Notes (optional)',
'loanConfirmation.notesPlaceholder': 'Add any notes about this loan...',
'loanConfirmation.confirm': 'Confirm Loan',
'loanConfirmation.cancel': 'Cancel',
'loanConfirmation.hasActiveLoan': 'You have an active loan. New tools will be added to it.',
'loanConfirmation.noActiveLoan': 'Select a due date for your loan.',
'loanConfirmation.confirming': 'Confirming...',
```


### Spanish
```typescript
'bag.title': 'Bulto de Herramientas',
'bag.empty': 'Tu bulto está vacío',
'bag.emptyDesc': 'Escanea herramientas para agregarlas a tu bulto',
'bag.items': 'artículos',
'bag.item': 'artículo',
'bag.confirmLoan': 'Confirmar Préstamo',
'bag.clear': 'Vaciar Bulto',
'bag.addedSuccess': 'agregado al bulto',
'bag.remove': 'Eliminar',
'bag.toolsInBag': 'herramientas en el bulto',

'cart.title': 'Carrito de Compras',
'cart.empty': 'Tu carrito está vacío',
'cart.emptyDesc': 'Escanea consumibles para agregarlos a tu carrito',
'cart.confirmConsumption': 'Confirmar Consumo',
'cart.clear': 'Vaciar Carrito',
'cart.items': 'artículos',
'cart.item': 'artículo',
'cart.quantity': 'Cantidad',
'cart.remove': 'Eliminar',

'vault.title': 'Bóveda de Devolución',
'vault.empty': 'No hay herramientas para devolver',
'vault.emptyDesc': 'Escanea herramientas para agregarlas a la bóveda de devolución',
'vault.confirmReturn': 'Confirmar Devolución',
'vault.clear': 'Vaciar Bóveda',
'vault.items': 'herramientas para devolver',
'vault.item': 'herramienta para devolver',
'vault.remove': 'Eliminar',

'loanConfirmation.title': 'Confirmar Préstamo',
'loanConfirmation.dueDate': 'Fecha de Vencimiento',
'loanConfirmation.notes': 'Notas (opcional)',
'loanConfirmation.notesPlaceholder': 'Agrega notas sobre este préstamo...',
'loanConfirmation.confirm': 'Confirmar Préstamo',
'loanConfirmation.cancel': 'Cancelar',
'loanConfirmation.hasActiveLoan': 'Tienes un préstamo activo. Las nuevas herramientas se agregarán a él.',
'loanConfirmation.noActiveLoan': 'Selecciona una fecha de vencimiento para tu préstamo.',
'loanConfirmation.confirming': 'Confirmando...',
```


## 📱 SCANNER COMPONENTS

### English
```typescript
'scanner.batch.title': 'Batch Scan',
'scanner.batch.scanned': 'Scanned',
'scanner.batch.items': 'items',
'scanner.batch.item': 'item',
'scanner.batch.confirm': 'Confirm Batch',
'scanner.batch.clear': 'Clear All',
'scanner.batch.summary': 'Batch Summary',
'scanner.quantity.title': 'Enter Quantity',
'scanner.quantity.placeholder': 'Quantity',
'scanner.quantity.confirm': 'Confirm',
'scanner.quantity.cancel': 'Cancel',
'scanner.multiMode.loan': 'Loan Mode',
'scanner.multiMode.return': 'Return Mode',
'scanner.multiMode.consume': 'Consume Mode',
'scanner.startScanning': 'Start Scanner',
'scanner.stopScanning': 'Stop Scanner',
'scanner.howToUse': 'How to use the scanner',
'scanner.step1': 'Scan the tool QR code',
'scanner.step2': 'Click "Add to Bag"',
'scanner.step3': 'Repeat for more tools',
'scanner.step4': 'Click the bag 🎒 to confirm loan',
'scanner.tip': 'The scanner remains active. Scan multiple tools and then confirm everything from the bag.',
'scanner.invalidQR': 'Invalid QR code. Please scan a valid tool QR code.',
'scanner.lookupError': 'Error looking up tool',
'scanner.addToBag': 'Add to Bag',
'scanner.addToCart': 'Add to Cart',
'scanner.addToVault': 'Add to Vault',
```

### Spanish
```typescript
'scanner.batch.title': 'Escaneo por Lotes',
'scanner.batch.scanned': 'Escaneados',
'scanner.batch.items': 'artículos',
'scanner.batch.item': 'artículo',
'scanner.batch.confirm': 'Confirmar Lote',
'scanner.batch.clear': 'Limpiar Todo',
'scanner.batch.summary': 'Resumen del Lote',
'scanner.quantity.title': 'Ingresar Cantidad',
'scanner.quantity.placeholder': 'Cantidad',
'scanner.quantity.confirm': 'Confirmar',
'scanner.quantity.cancel': 'Cancelar',
'scanner.multiMode.loan': 'Modo Préstamo',
'scanner.multiMode.return': 'Modo Devolución',
'scanner.multiMode.consume': 'Modo Consumo',
'scanner.startScanning': 'Iniciar Escáner',
'scanner.stopScanning': 'Detener Escáner',
'scanner.howToUse': 'Cómo usar el escáner',
'scanner.step1': 'Escanea el código QR de la herramienta',
'scanner.step2': 'Click en "Agregar al Bulto"',
'scanner.step3': 'Repite para más herramientas',
'scanner.step4': 'Click en el bulto 🎒 para confirmar préstamo',
'scanner.tip': 'El escáner permanece activo. Escanea múltiples herramientas y luego confirma todo desde el bulto.',
'scanner.invalidQR': 'Código QR inválido. Por favor escanea un código QR de herramienta válido.',
'scanner.lookupError': 'Error al buscar herramienta',
'scanner.addToBag': 'Agregar al Bulto',
'scanner.addToCart': 'Agregar al Carrito',
'scanner.addToVault': 'Agregar a la Bóveda',
```


## 🌐 LANDING PAGE

### English
```typescript
'landing.nav.features': 'Features',
'landing.nav.benefits': 'Benefits',
'landing.nav.technology': 'Technology',
'landing.nav.contact': 'Contact',
'landing.nav.login': 'Login',
'landing.hero.title': 'Educational Inventory Management System',
'landing.hero.subtitle': 'Efficient control of tools and consumables for educational institutions',
'landing.hero.description': 'Streamline your inventory management with QR code scanning, real-time tracking, and comprehensive reporting.',
'landing.hero.cta': 'Get Started',
'landing.hero.learnMore': 'Learn More',
'landing.features.title': 'Key Features',
'landing.features.subtitle': 'Everything you need to manage your inventory efficiently',
'landing.features.qr': 'QR Code Scanning',
'landing.features.qrDesc': 'Fast and accurate tool tracking with QR codes',
'landing.features.realtime': 'Real-time Tracking',
'landing.features.realtimeDesc': 'Know the status of your inventory at all times',
'landing.features.reports': 'Detailed Reports',
'landing.features.reportsDesc': 'Analytics and insights for better decisions',
'landing.features.notifications': 'Smart Notifications',
'landing.features.notificationsDesc': 'Stay informed about overdue items and low stock',
'landing.features.mobile': 'Mobile Friendly',
'landing.features.mobileDesc': 'Access from any device, anywhere',
'landing.features.secure': 'Secure & Reliable',
'landing.features.secureDesc': 'Your data is safe with enterprise-grade security',
'landing.benefits.title': 'Benefits',
'landing.benefits.subtitle': 'Why choose our system',
'landing.benefits.efficiency': 'Increased Efficiency',
'landing.benefits.efficiencyDesc': 'Reduce time spent on inventory management',
'landing.benefits.accuracy': 'Improved Accuracy',
'landing.benefits.accuracyDesc': 'Eliminate manual errors with automated tracking',
'landing.benefits.visibility': 'Better Visibility',
'landing.benefits.visibilityDesc': 'Real-time insights into your inventory',
'landing.technology.title': 'Built with Modern Technology',
'landing.technology.subtitle': 'Powered by industry-leading tools',
'landing.cta.title': 'Ready to optimize your inventory?',
'landing.cta.subtitle': 'Join educational institutions already using our system',
'landing.cta.button': 'Start Now',
'landing.footer.about': 'About',
'landing.footer.features': 'Features',
'landing.footer.pricing': 'Pricing',
'landing.footer.contact': 'Contact',
'landing.footer.privacy': 'Privacy Policy',
'landing.footer.terms': 'Terms of Service',
'landing.footer.rights': 'All rights reserved',
```


### Spanish
```typescript
'landing.nav.features': 'Características',
'landing.nav.benefits': 'Beneficios',
'landing.nav.technology': 'Tecnología',
'landing.nav.contact': 'Contacto',
'landing.nav.login': 'Iniciar Sesión',
'landing.hero.title': 'Sistema de Gestión de Inventario Educativo',
'landing.hero.subtitle': 'Control eficiente de herramientas y consumibles para instituciones educativas',
'landing.hero.description': 'Optimiza la gestión de tu inventario con escaneo de códigos QR, seguimiento en tiempo real y reportes completos.',
'landing.hero.cta': 'Comenzar',
'landing.hero.learnMore': 'Saber Más',
'landing.features.title': 'Características Principales',
'landing.features.subtitle': 'Todo lo que necesitas para gestionar tu inventario eficientemente',
'landing.features.qr': 'Escaneo de Códigos QR',
'landing.features.qrDesc': 'Seguimiento rápido y preciso de herramientas con códigos QR',
'landing.features.realtime': 'Seguimiento en Tiempo Real',
'landing.features.realtimeDesc': 'Conoce el estado de tu inventario en todo momento',
'landing.features.reports': 'Reportes Detallados',
'landing.features.reportsDesc': 'Análisis e información para mejores decisiones',
'landing.features.notifications': 'Notificaciones Inteligentes',
'landing.features.notificationsDesc': 'Mantente informado sobre artículos vencidos y stock bajo',
'landing.features.mobile': 'Compatible con Móviles',
'landing.features.mobileDesc': 'Accede desde cualquier dispositivo, en cualquier lugar',
'landing.features.secure': 'Seguro y Confiable',
'landing.features.secureDesc': 'Tus datos están seguros con seguridad de nivel empresarial',
'landing.benefits.title': 'Beneficios',
'landing.benefits.subtitle': 'Por qué elegir nuestro sistema',
'landing.benefits.efficiency': 'Mayor Eficiencia',
'landing.benefits.efficiencyDesc': 'Reduce el tiempo dedicado a la gestión de inventario',
'landing.benefits.accuracy': 'Mejor Precisión',
'landing.benefits.accuracyDesc': 'Elimina errores manuales con seguimiento automatizado',
'landing.benefits.visibility': 'Mejor Visibilidad',
'landing.benefits.visibilityDesc': 'Información en tiempo real sobre tu inventario',
'landing.technology.title': 'Construido con Tecnología Moderna',
'landing.technology.subtitle': 'Impulsado por herramientas líderes en la industria',
'landing.cta.title': '¿Listo para optimizar tu inventario?',
'landing.cta.subtitle': 'Únete a las instituciones educativas que ya usan nuestro sistema',
'landing.cta.button': 'Comenzar Ahora',
'landing.footer.about': 'Acerca de',
'landing.footer.features': 'Características',
'landing.footer.pricing': 'Precios',
'landing.footer.contact': 'Contacto',
'landing.footer.privacy': 'Política de Privacidad',
'landing.footer.terms': 'Términos de Servicio',
'landing.footer.rights': 'Todos los derechos reservados',
```


## 🔐 LOGIN PAGE

### English
```typescript
'login.title': 'Login',
'login.welcome': 'Welcome back',
'login.subtitle': 'Enter your credentials to access the system',
'login.username': 'Username',
'login.usernamePlaceholder': 'Enter your username',
'login.password': 'Password',
'login.passwordPlaceholder': 'Enter your password',
'login.button': 'Login',
'login.loggingIn': 'Logging in...',
'login.error': 'Invalid credentials',
'login.required': 'All fields are required',
'login.forgotPassword': 'Forgot password?',
'login.noAccount': "Don't have an account?",
'login.signUp': 'Sign up',
```

### Spanish
```typescript
'login.title': 'Iniciar Sesión',
'login.welcome': 'Bienvenido de nuevo',
'login.subtitle': 'Ingresa tus credenciales para acceder al sistema',
'login.username': 'Usuario',
'login.usernamePlaceholder': 'Ingresa tu usuario',
'login.password': 'Contraseña',
'login.passwordPlaceholder': 'Ingresa tu contraseña',
'login.button': 'Iniciar Sesión',
'login.loggingIn': 'Iniciando sesión...',
'login.error': 'Credenciales inválidas',
'login.required': 'Todos los campos son requeridos',
'login.forgotPassword': '¿Olvidaste tu contraseña?',
'login.noAccount': '¿No tienes una cuenta?',
'login.signUp': 'Registrarse',
```

## 📦 BULK IMPORT

### English
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
'bulkImport.cancel': 'Cancel',
'bulkImport.import': 'Import',
```

### Spanish
```typescript
'bulkImport.title': 'Importación Masiva de Consumibles',
'bulkImport.button': 'Importación Masiva',
'bulkImport.selectFile': 'Seleccionar Archivo CSV',
'bulkImport.dragDrop': 'o arrastra y suelta',
'bulkImport.fileFormat': 'Archivo CSV con columnas: name, description, category, current_stock, minimum_threshold',
'bulkImport.downloadTemplate': 'Descargar Plantilla',
'bulkImport.uploading': 'Subiendo...',
'bulkImport.processing': 'Procesando...',
'bulkImport.success': '{count} artículos importados exitosamente',
'bulkImport.error': 'Error al importar archivo',
'bulkImport.close': 'Cerrar',
'bulkImport.cancel': 'Cancelar',
'bulkImport.import': 'Importar',
```


## 📋 FORMS & VALIDATION

### English
```typescript
'form.required': 'This field is required',
'form.invalidEmail': 'Invalid email address',
'form.invalidFormat': 'Invalid format',
'form.minLength': 'Minimum {count} characters',
'form.maxLength': 'Maximum {count} characters',
'form.selectOption': 'Select an option',
'form.enterValue': 'Enter a value',
'form.invalidNumber': 'Please enter a valid number',
'form.positiveNumber': 'Please enter a positive number',
'form.invalidDate': 'Invalid date',
'form.futureDate': 'Date must be in the future',
'form.pastDate': 'Date must be in the past',
```

### Spanish
```typescript
'form.required': 'Este campo es requerido',
'form.invalidEmail': 'Dirección de email inválida',
'form.invalidFormat': 'Formato inválido',
'form.minLength': 'Mínimo {count} caracteres',
'form.maxLength': 'Máximo {count} caracteres',
'form.selectOption': 'Selecciona una opción',
'form.enterValue': 'Ingresa un valor',
'form.invalidNumber': 'Por favor ingresa un número válido',
'form.positiveNumber': 'Por favor ingresa un número positivo',
'form.invalidDate': 'Fecha inválida',
'form.futureDate': 'La fecha debe ser futura',
'form.pastDate': 'La fecha debe ser pasada',
```

## 🏷️ STATUS LABELS (Adicionales)

### English
```typescript
'status.inStock': 'In Stock',
'status.outOfStock': 'Out of Stock',
'status.lowStock': 'Low Stock',
'status.backorder': 'Backorder',
'status.good': 'Good',
'status.fair': 'Fair',
'status.poor': 'Poor',
```

### Spanish
```typescript
'status.inStock': 'En Stock',
'status.outOfStock': 'Sin Stock',
'status.lowStock': 'Stock Bajo',
'status.backorder': 'Pedido Pendiente',
'status.good': 'Bueno',
'status.fair': 'Regular',
'status.poor': 'Malo',
```


## 📊 ADMIN - CONSUMABLES

### English
```typescript
'admin.consumables.title': 'Consumables Management',
'admin.consumables.addItemType': 'Add Item Type',
'admin.consumables.bulkImport': 'Bulk Import',
'admin.consumables.totalItems': 'Total Items',
'admin.consumables.outOfStock': 'Out of Stock',
'admin.consumables.lowStock': 'Low Stock',
'admin.consumables.search': 'Search',
'admin.consumables.searchPlaceholder': 'Search by name or category...',
'admin.consumables.filterByCategory': 'Filter by Category',
'admin.consumables.allCategories': 'All Categories',
'admin.consumables.noItemsFound': 'No Items Found',
'admin.consumables.noItemsMatch': 'No items match your search criteria.',
'admin.consumables.loadingItems': 'Loading items...',
'admin.consumables.viewDetails': 'View Details',
'admin.consumables.updateStock': 'Update Stock',
```

### Spanish
```typescript
'admin.consumables.title': 'Gestión de Consumibles',
'admin.consumables.addItemType': 'Agregar Tipo de Artículo',
'admin.consumables.bulkImport': 'Importación Masiva',
'admin.consumables.totalItems': 'Artículos Totales',
'admin.consumables.outOfStock': 'Sin Stock',
'admin.consumables.lowStock': 'Stock Bajo',
'admin.consumables.search': 'Buscar',
'admin.consumables.searchPlaceholder': 'Buscar por nombre o categoría...',
'admin.consumables.filterByCategory': 'Filtrar por Categoría',
'admin.consumables.allCategories': 'Todas las Categorías',
'admin.consumables.noItemsFound': 'No se Encontraron Artículos',
'admin.consumables.noItemsMatch': 'No hay artículos que coincidan con tu búsqueda.',
'admin.consumables.loadingItems': 'Cargando artículos...',
'admin.consumables.viewDetails': 'Ver Detalles',
'admin.consumables.updateStock': 'Actualizar Stock',
```

## 📝 ADMIN - LOANS

### English
```typescript
'admin.loans.title': 'Manage Loans',
'admin.loans.activeLoans': 'Active Loans',
'admin.loans.overdueLoans': 'Overdue Loans',
'admin.loans.allLoans': 'All Loans',
'admin.loans.search': 'Search',
'admin.loans.searchPlaceholder': 'Search by user, tool, or serial number...',
'admin.loans.filterByStatus': 'Filter by Status',
'admin.loans.allStatus': 'All Status',
'admin.loans.noLoansFound': 'No Loans Found',
'admin.loans.loadingLoans': 'Loading loans...',
'admin.loans.viewDetails': 'View Details',
'admin.loans.markAsReturned': 'Mark as Returned',
```

### Spanish
```typescript
'admin.loans.title': 'Gestionar Préstamos',
'admin.loans.activeLoans': 'Préstamos Activos',
'admin.loans.overdueLoans': 'Préstamos Vencidos',
'admin.loans.allLoans': 'Todos los Préstamos',
'admin.loans.search': 'Buscar',
'admin.loans.searchPlaceholder': 'Buscar por usuario, herramienta o número de serie...',
'admin.loans.filterByStatus': 'Filtrar por Estado',
'admin.loans.allStatus': 'Todos los Estados',
'admin.loans.noLoansFound': 'No se Encontraron Préstamos',
'admin.loans.loadingLoans': 'Cargando préstamos...',
'admin.loans.viewDetails': 'Ver Detalles',
'admin.loans.markAsReturned': 'Marcar como Devuelto',
```


## 🔍 ADMIN - AUDIT LOG

### English
```typescript
'admin.audit.title': 'Audit Log',
'admin.audit.subtitle': 'System activity and changes log',
'admin.audit.action': 'Action',
'admin.audit.user': 'User',
'admin.audit.timestamp': 'Timestamp',
'admin.audit.details': 'Details',
'admin.audit.ipAddress': 'IP Address',
'admin.audit.userAgent': 'User Agent',
'admin.audit.filterByAction': 'Filter by Action',
'admin.audit.allActions': 'All Actions',
'admin.audit.search': 'Search',
'admin.audit.searchPlaceholder': 'Search by user or action...',
'admin.audit.noLogsFound': 'No Logs Found',
'admin.audit.loadingLogs': 'Loading logs...',
```

### Spanish
```typescript
'admin.audit.title': 'Registro de Auditoría',
'admin.audit.subtitle': 'Registro de actividad y cambios del sistema',
'admin.audit.action': 'Acción',
'admin.audit.user': 'Usuario',
'admin.audit.timestamp': 'Fecha y Hora',
'admin.audit.details': 'Detalles',
'admin.audit.ipAddress': 'Dirección IP',
'admin.audit.userAgent': 'Agente de Usuario',
'admin.audit.filterByAction': 'Filtrar por Acción',
'admin.audit.allActions': 'Todas las Acciones',
'admin.audit.search': 'Buscar',
'admin.audit.searchPlaceholder': 'Buscar por usuario o acción...',
'admin.audit.noLogsFound': 'No se Encontraron Registros',
'admin.audit.loadingLogs': 'Cargando registros...',
```

## 🎯 RESUMEN DE CONTEO

**Total de claves de traducción a agregar: ~250+**

### Por Sección:
- Admin Tools: 35 claves
- Admin Users: 18 claves
- Admin Reports: 25 claves
- Admin Consumables: 15 claves
- Admin Loans: 12 claves
- Admin Audit: 12 claves
- Bag/Cart/Vault: 40 claves
- Scanner: 25 claves
- Landing Page: 45 claves
- Login: 12 claves
- Bulk Import: 12 claves
- Forms & Validation: 12 claves
- Status Labels: 7 claves

**Total estimado: ~270 claves nuevas**


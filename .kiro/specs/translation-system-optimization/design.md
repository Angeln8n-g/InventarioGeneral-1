# Design Document - Translation System Optimization

## Overview

Este documento describe el diseño técnico para optimizar y completar el sistema de traducción (i18n) del sistema de gestión de inventario educativo. El sistema actual utiliza React Context API con un hook personalizado `useLanguage()` que proporciona traducciones en inglés y español. El objetivo es completar las traducciones faltantes, corregir inconsistencias y mejorar la experiencia de usuario.

## Architecture

### Current Architecture

```
┌─────────────────────────────────────────┐
│         LanguageContext                 │
│  - translations: { en: {}, es: {} }     │
│  - language: 'en' | 'es'                │
│  - setLanguage()                        │
│  - t(key: string): string               │
└─────────────────────────────────────────┘
                    │
                    │ Provider wraps app
                    ▼
┌─────────────────────────────────────────┐
│         App Layout                      │
│  - Provides context to all pages        │
└─────────────────────────────────────────┘
                    │
                    │ useLanguage() hook
                    ▼
┌─────────────────────────────────────────┐
│    Pages & Components                   │
│  - const { t, language } = useLanguage()│
│  - Use t('key') for translations        │
└─────────────────────────────────────────┘
```

### Proposed Enhancements

1. **Translation Key Organization**: Organizar las claves por módulos/secciones
2. **Variable Interpolation**: Mejorar el soporte para variables en traducciones
3. **Fallback Mechanism**: Mostrar la clave cuando falta una traducción
4. **Locale Formatting**: Agregar utilidades para formatear fechas y números

## Components and Interfaces

### 1. LanguageContext Enhancement

**Location**: `src/contexts/LanguageContext.tsx`

**Current Interface**:
```typescript
interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}
```

**Enhanced Interface**:
```typescript
interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, variables?: Record<string, string | number>) => string
  formatDate: (date: Date | string, format?: 'short' | 'long' | 'relative') => string
  formatNumber: (num: number) => string
}
```

**Key Changes**:
- `t()` function now supports variable interpolation
- Added `formatDate()` for localized date formatting
- Added `formatNumber()` for localized number formatting

### 2. Translation Dictionary Structure

**Organization by Module**:
```typescript
const translations = {
  en: {
    // ===== NAVIGATION =====
    'nav.*': '...',
    
    // ===== COMMON =====
    'common.*': '...',
    
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
    'bulkImport.*': '...',
    
    // ===== LANDING =====
    'landing.*': '...',
    
    // ===== LOGIN =====
    'login.*': '...',
    
    // ===== STATUS & FORMS =====
    'status.*': '...',
    'form.*': '...',
  },
  es: {
    // Same structure
  }
}
```

### 3. Translation Keys to Add

#### Admin - Tools Management (Already Complete)
✅ Ya implementado en el código actual

#### Admin - Users Management
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
'admin.users.email': 'Email',
'admin.users.role': 'Role',
'admin.users.status': 'Status',
'admin.users.actions': 'Actions',
```

#### Admin - Reports (Already Complete)
✅ Ya implementado en el código actual

#### Admin - Consumables (Already Complete)
✅ Ya implementado en el código actual

#### Admin - Loans
```typescript
'admin.loans.title': 'Manage Loans',
'admin.loans.allLoans': 'All Loans',
'admin.loans.search': 'Search',
'admin.loans.searchPlaceholder': 'Search by user, tool, or serial number...',
'admin.loans.filterByStatus': 'Filter by Status',
'admin.loans.allStatus': 'All Status',
'admin.loans.statusActive': 'Active',
'admin.loans.statusReturned': 'Returned',
'admin.loans.statusOverdue': 'Overdue',
'admin.loans.noLoansFound': 'No Loans Found',
'admin.loans.loadingLoans': 'Loading loans...',
'admin.loans.viewDetails': 'View Details',
'admin.loans.markAsReturned': 'Mark as Returned',
'admin.loans.user': 'User',
'admin.loans.tool': 'Tool',
'admin.loans.loanDate': 'Loan Date',
'admin.loans.dueDate': 'Due Date',
'admin.loans.returnDate': 'Return Date',
```

#### Admin - Audit
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

#### Landing Page
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
'landing.features.management': 'Easy Management',
'landing.features.managementDesc': 'Intuitive interface for managing tools and materials',
'landing.benefits.title': 'Benefits',
'landing.benefits.efficiency': 'Increased Efficiency',
'landing.benefits.efficiencyDesc': 'Reduce time spent on inventory management',
'landing.benefits.accuracy': 'Improved Accuracy',
'landing.benefits.accuracyDesc': 'Minimize errors with automated tracking',
'landing.benefits.visibility': 'Better Visibility',
'landing.benefits.visibilityDesc': 'Real-time insights into your inventory',
'landing.cta.title': 'Ready to optimize your inventory?',
'landing.cta.subtitle': 'Join educational institutions already using our system',
'landing.cta.button': 'Start Now',
'landing.footer.rights': 'All rights reserved',
'landing.footer.about': 'About',
'landing.footer.contact': 'Contact',
'landing.footer.privacy': 'Privacy Policy',
'landing.footer.terms': 'Terms of Service',
```

#### Login Page
```typescript
'login.title': 'Login',
'login.welcome': 'Welcome back',
'login.subtitle': 'Enter your credentials to access',
'login.username': 'Username',
'login.usernamePlaceholder': 'Enter your username',
'login.password': 'Password',
'login.passwordPlaceholder': 'Enter your password',
'login.button': 'Login',
'login.loggingIn': 'Logging in...',
'login.error': 'Invalid credentials',
'login.errorGeneric': 'An error occurred. Please try again.',
'login.required': 'All fields are required',
'login.forgotPassword': 'Forgot password?',
'login.noAccount': 'Don\'t have an account?',
'login.signUp': 'Sign up',
```

#### Bag/Cart/Vault Components
```typescript
// Bag
'bag.title': 'Tool Bag',
'bag.empty': 'Your bag is empty',
'bag.emptyDesc': 'Scan tools to add them to your bag',
'bag.items': 'items',
'bag.item': 'item',
'bag.confirmLoan': 'Confirm Loan',
'bag.clear': 'Clear Bag',
'bag.addedSuccess': 'added to bag',
'bag.removedSuccess': 'removed from bag',
'bag.remove': 'Remove',

// Cart
'cart.title': 'Shopping Cart',
'cart.empty': 'Your cart is empty',
'cart.emptyDesc': 'Scan consumables to add them to your cart',
'cart.confirmConsumption': 'Confirm Consumption',
'cart.clear': 'Clear Cart',
'cart.items': 'items',
'cart.item': 'item',
'cart.total': 'Total',
'cart.quantity': 'Quantity',

// Vault
'vault.title': 'Return Vault',
'vault.empty': 'No tools to return',
'vault.emptyDesc': 'Scan tools to add them to the return vault',
'vault.confirmReturn': 'Confirm Return',
'vault.clear': 'Clear Vault',
'vault.items': 'tools to return',
'vault.item': 'tool to return',

// Loan Confirmation Modal
'loanConfirmation.title': 'Confirm Loan',
'loanConfirmation.dueDate': 'Due Date',
'loanConfirmation.selectDate': 'Select due date',
'loanConfirmation.notes': 'Notes (optional)',
'loanConfirmation.notesPlaceholder': 'Add any notes about this loan...',
'loanConfirmation.confirm': 'Confirm Loan',
'loanConfirmation.cancel': 'Cancel',
'loanConfirmation.confirming': 'Confirming...',
'loanConfirmation.hasActiveLoan': 'You have an active loan. New tools will be added to it.',
'loanConfirmation.success': 'Loan confirmed successfully',
'loanConfirmation.error': 'Failed to confirm loan',
```

#### Scanner Components
```typescript
'scanner.batch.title': 'Batch Scan',
'scanner.batch.scanned': 'Scanned',
'scanner.batch.items': 'items',
'scanner.batch.item': 'item',
'scanner.batch.confirm': 'Confirm Batch',
'scanner.batch.clear': 'Clear All',
'scanner.batch.empty': 'No items scanned',

'scanner.quantity.title': 'Enter Quantity',
'scanner.quantity.label': 'Quantity',
'scanner.quantity.placeholder': 'Enter quantity',
'scanner.quantity.confirm': 'Confirm',
'scanner.quantity.cancel': 'Cancel',
'scanner.quantity.min': 'Minimum quantity is 1',
'scanner.quantity.max': 'Maximum quantity is {max}',

'scanner.multiMode.loan': 'Loan Mode',
'scanner.multiMode.return': 'Return Mode',
'scanner.multiMode.consume': 'Consume Mode',
'scanner.multiMode.switch': 'Switch Mode',

'scanner.error.notFound': 'Item not found',
'scanner.error.alreadyScanned': 'Item already scanned',
'scanner.error.unavailable': 'Item not available',
'scanner.error.generic': 'An error occurred while scanning',
```

#### Bulk Import
```typescript
'bulkImport.title': 'Bulk Import Materials',
'bulkImport.button': 'Bulk Import',
'bulkImport.selectFile': 'Select CSV File',
'bulkImport.dragDrop': 'or drag and drop',
'bulkImport.fileFormat': 'CSV file with columns: name, description, category, current_stock, minimum_threshold',
'bulkImport.downloadTemplate': 'Download Template',
'bulkImport.uploading': 'Uploading...',
'bulkImport.processing': 'Processing...',
'bulkImport.success': 'Successfully imported {count} items',
'bulkImport.error': 'Error importing file',
'bulkImport.errorDetails': 'Error: {error}',
'bulkImport.close': 'Close',
'bulkImport.cancel': 'Cancel',
'bulkImport.import': 'Import',
'bulkImport.validating': 'Validating file...',
'bulkImport.invalidFile': 'Invalid file format',
```

#### Form Validation
```typescript
'form.required': 'This field is required',
'form.invalidEmail': 'Invalid email address',
'form.invalidFormat': 'Invalid format',
'form.minLength': 'Minimum {count} characters',
'form.maxLength': 'Maximum {count} characters',
'form.minValue': 'Minimum value is {min}',
'form.maxValue': 'Maximum value is {max}',
'form.selectOption': 'Select an option',
'form.enterValue': 'Enter a value',
'form.invalidDate': 'Invalid date',
'form.dateInPast': 'Date must be in the future',
'form.dateInFuture': 'Date must be in the past',
'form.passwordMismatch': 'Passwords do not match',
'form.passwordTooShort': 'Password must be at least {min} characters',
```

## Data Models

### Translation Entry
```typescript
interface TranslationEntry {
  key: string
  en: string
  es: string
  variables?: string[] // List of variable names used in the translation
  module: string // e.g., 'admin.tools', 'landing', 'common'
}
```

### Translation Audit Result
```typescript
interface TranslationAuditResult {
  totalKeys: number
  missingKeys: string[]
  unusedKeys: string[]
  hardcodedTexts: Array<{
    file: string
    line: number
    text: string
  }>
  coverage: {
    admin: number // percentage
    landing: number
    components: number
    overall: number
  }
}
```

## Error Handling

### Missing Translation Keys
```typescript
// In LanguageContext
const t = (key: string, variables?: Record<string, string | number>): string => {
  const translation = translations[language][key]
  
  if (!translation) {
    console.warn(`Translation missing for key: ${key}`)
    return `[${key}]` // Show key in brackets for easy identification
  }
  
  // Handle variable interpolation
  if (variables) {
    return Object.entries(variables).reduce(
      (text, [varName, value]) => text.replace(`{${varName}}`, String(value)),
      translation
    )
  }
  
  return translation
}
```

### Fallback Language
```typescript
// If a translation is missing in the selected language, fall back to English
const t = (key: string, variables?: Record<string, string | number>): string => {
  let translation = translations[language][key]
  
  if (!translation && language !== 'en') {
    translation = translations['en'][key]
    console.warn(`Translation missing for key: ${key} in ${language}, using English fallback`)
  }
  
  if (!translation) {
    console.warn(`Translation missing for key: ${key} in all languages`)
    return `[${key}]`
  }
  
  // Handle variable interpolation...
}
```

## Testing Strategy

### 1. Translation Coverage Test
```typescript
// Test to ensure all required keys exist in both languages
describe('Translation Coverage', () => {
  it('should have all keys in both languages', () => {
    const enKeys = Object.keys(translations.en)
    const esKeys = Object.keys(translations.es)
    
    expect(enKeys.sort()).toEqual(esKeys.sort())
  })
  
  it('should not have empty translations', () => {
    Object.entries(translations).forEach(([lang, keys]) => {
      Object.entries(keys).forEach(([key, value]) => {
        expect(value).toBeTruthy()
        expect(value.trim()).not.toBe('')
      })
    })
  })
})
```

### 2. Component Translation Test
```typescript
// Test that components use translations correctly
describe('Component Translations', () => {
  it('should render translated text', () => {
    const { getByText } = render(<ManageToolsPage />)
    
    // Check that translated text appears
    expect(getByText('Manage Tools')).toBeInTheDocument()
  })
  
  it('should update when language changes', () => {
    const { getByText, rerender } = render(<ManageToolsPage />)
    
    // Change language
    act(() => {
      setLanguage('es')
    })
    
    rerender(<ManageToolsPage />)
    
    // Check that text updated
    expect(getByText('Gestionar Herramientas')).toBeInTheDocument()
  })
})
```

### 3. Visual Regression Test
```typescript
// Test that layout doesn't break with longer Spanish text
describe('Visual Regression', () => {
  it('should not break layout with Spanish text', () => {
    const { container } = render(<ManageToolsPage />)
    
    // Take snapshot in English
    const englishSnapshot = container.innerHTML
    
    // Change to Spanish
    act(() => {
      setLanguage('es')
    })
    
    // Check that no overflow or layout issues
    const buttons = container.querySelectorAll('button')
    buttons.forEach(button => {
      expect(button.scrollWidth).toBeLessThanOrEqual(button.clientWidth + 5)
    })
  })
})
```

### 4. Manual Testing Checklist
- [ ] Navigate to each page and verify all text is translated
- [ ] Change language and verify immediate update
- [ ] Reload page and verify language persists
- [ ] Check that no `[key]` placeholders appear
- [ ] Verify dates and numbers format correctly
- [ ] Test on mobile devices for layout issues
- [ ] Test with long Spanish text for overflow
- [ ] Verify form validation messages are translated
- [ ] Check that error messages are translated
- [ ] Verify tooltips and placeholders are translated

## Implementation Phases

### Phase 1: Foundation (Priority: HIGH)
1. Enhance LanguageContext with variable interpolation
2. Add formatDate() and formatNumber() utilities
3. Implement fallback mechanism for missing keys
4. Add all missing translation keys to dictionary

### Phase 2: Admin Pages (Priority: HIGH)
1. Update `/admin/users` page
2. Update `/admin/loans` page
3. Update `/admin/audit` page
4. Update admin detail pages (tools/[id], users/[id], etc.)
5. Update admin form pages (tools/new, users/new, etc.)

### Phase 3: Components (Priority: MEDIUM)
1. Update Bag components (BagButton, BagModal, LoanConfirmationModal)
2. Update Cart components (CartButton, CartModal)
3. Update Vault components (VaultButton, VaultModal)
4. Update Scanner components (BatchConfirmation, QuantityModal, etc.)
5. Update BulkImportConsumables component

### Phase 4: Landing & Login (Priority: MEDIUM)
1. Update Landing page components (Navigation, Hero, Features, Benefits, CTA, Footer)
2. Update Login page

### Phase 5: Polish & Testing (Priority: LOW)
1. Improve language selector UI
2. Add browser language detection
3. Implement comprehensive testing
4. Create documentation
5. Performance optimization

## Performance Considerations

### 1. Translation Dictionary Size
- Current dictionary is manageable (~500-600 keys)
- All translations loaded at once (acceptable for this size)
- If dictionary grows significantly, consider code-splitting by module

### 2. Re-render Optimization
```typescript
// Use React.memo for components that don't need to re-render on language change
const StaticComponent = React.memo(() => {
  // Component that doesn't use translations
})

// Components using translations will re-render when language changes
const TranslatedComponent = () => {
  const { t } = useLanguage()
  return <div>{t('key')}</div>
}
```

### 3. LocalStorage Access
```typescript
// Cache language preference to avoid repeated localStorage reads
const [language, setLanguageState] = useState<Language>(() => {
  if (typeof window !== 'undefined') {
    return (localStorage.getItem('language') as Language) || 'en'
  }
  return 'en'
})
```

## Security Considerations

1. **XSS Prevention**: All translations are static strings, no user input
2. **Variable Interpolation**: Sanitize variables before interpolation if they come from user input
3. **localStorage**: Language preference is safe to store (no sensitive data)

## Accessibility Considerations

1. **lang Attribute**: Update HTML lang attribute when language changes
```typescript
useEffect(() => {
  document.documentElement.lang = language
}, [language])
```

2. **Screen Readers**: Ensure translated text is properly announced
3. **Keyboard Navigation**: Language selector should be keyboard accessible
4. **ARIA Labels**: Translate ARIA labels and descriptions

## Documentation

### Developer Guide
Create `docs/i18n-guide.md` with:
1. How to add new translations
2. Naming conventions for keys
3. How to use `useLanguage()` hook
4. How to handle variables in translations
5. How to format dates and numbers
6. Testing guidelines

### Translation Key Naming Convention
```
<module>.<section>.<element>

Examples:
- admin.tools.title
- landing.hero.cta
- form.required
- common.loading
```

## Migration Strategy

1. **No Breaking Changes**: All existing translations continue to work
2. **Gradual Enhancement**: Add new features without disrupting current functionality
3. **Backward Compatibility**: Fallback to simple string if variables not provided
4. **Testing**: Test each updated component individually before moving to next

## Success Metrics

1. **Translation Coverage**: 100% of user-facing text translated
2. **No Missing Keys**: Zero `[key]` placeholders in production
3. **Performance**: No noticeable performance impact from translations
4. **User Satisfaction**: Users can effectively use the system in their preferred language
5. **Maintainability**: Developers can easily add new translations

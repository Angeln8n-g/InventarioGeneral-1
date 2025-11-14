# Dashboard + Scanner Unification - Implementation Tasks

## Task List

- [x] 1. Create unified dashboard page with 6 action cards



  - Add Scan to Loan card (red, highlighted)
  - Add Scan to Return card
  - Add Request Supplies card
  - Add My Loans card
  - Add Return Consumables card (with border)
  - Add Devolver Herramientas card
  - Arrange in 2x3 grid layout


  - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ] 2. Integrate QR scanner functionality
  - Create QRScannerModal component
  - Integrate with existing scanner logic from /tools/scan
  - Handle "Scan to Loan" mode

  - Handle "Scan to Return" mode
  - Maintain bag/bulto functionality
  - _Requirements: 2.1, 2.2, 2.5_

- [ ] 3. Add navigation handlers
  - Implement onClick for Scan to Loan (opens scanner modal)
  - Implement onClick for Scan to Return (opens scanner modal)
  - Implement onClick for Request Supplies (navigate to page)

  - Implement onClick for My Loans (navigate to page)
  - Implement onClick for Return Consumables (navigate to page)
  - Implement onClick for Devolver Herramientas (navigate to page)
  - _Requirements: 2.1, 2.2, 2.3, 2.4_



- [ ] 4. Update Active Loans section
  - Display active loans below action cards
  - Show empty state if no loans
  - Maintain existing functionality


  - _Requirements: 3.1, 3.2, 3.3_

- [x] 5. Update bottom navigation

  - Remove Scanner tab from bottom nav
  - Ensure Dashboard tab is highlighted when active
  - Update navigation items array
  - _Requirements: 4.1, 4.3_

- [x] 6. Create redirect for old Scanner route

  - Update /tools/scan/page.tsx to redirect to /dashboard
  - Preserve any query parameters if needed
  - _Requirements: 4.2_

- [ ] 7. Implement responsive design
  - Style for mobile (2x3 grid, stacked)
  - Style for tablet (2x3 grid, larger)
  - Style for desktop (2x3 grid or optimized layout)

  - Test all breakpoints
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 8. Add proper icons
  - Scan to Loan: QR scanner icon
  - Scan to Return: Check/return icon
  - Request Supplies: Box/package icon
  - My Loans: List/clipboard icon



  - Return Consumables: Recycle icon
  - Devolver Herramientas: Building/institution icon
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 9. Testing and validation
  - Test scanner modal opens correctly
  - Test QR scanning works in both modes
  - Test navigation to all pages
  - Test on mobile, tablet, desktop
  - Test dark mode
  - Verify no TypeScript errors
  - _Requirements: All requirements (testing)_

- [ ] 10. Documentation and cleanup
  - Update README with new dashboard info
  - Archive old Scanner page (don't delete yet)
  - Update navigation documentation
  - Add changelog entry
  - _Requirements: All requirements (documentation)_

## Detailed Implementation

### Task 1: Create Unified Dashboard

**File:** `src/app/dashboard/page.tsx`

**Implementation:**
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { ActionCard } from '@/components/dashboard/ActionCard'
import { ActiveLoansSection } from '@/components/dashboard/ActiveLoansSection'
import { BottomNav } from '@/components/dashboard/BottomNav'
import { QRScannerModal } from '@/components/scanner/QRScannerModal'
import { BagProvider } from '@/contexts/BagContext'

export default function UnifiedDashboard() {
  const router = useRouter()
  const [isScanning, setIsScanning] = useState(false)
  const [scanMode, setScanMode] = useState<'loan' | 'return' | null>(null)

  const handleScanToLoan = () => {
    setScanMode('loan')
    setIsScanning(true)
  }

  const handleScanToReturn = () => {
    setScanMode('return')
    setIsScanning(true)
  }

  return (
    <BagProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
        <DashboardHeader />
        
        <main className="max-w-7xl mx-auto px-4 py-6">
          {/* Action Cards Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <ActionCard
              icon={<QRIcon />}
              title="Scan to Loan"
              description="Escanea códigos QR de herramientas para crear un préstamo"
              color="red"
              onClick={handleScanToLoan}
            />
            
            <ActionCard
              icon={<ReturnIcon />}
              title="Scan to Return"
              description="Escanea herramientas para devolverlas"
              onClick={handleScanToReturn}
            />
            
            <ActionCard
              icon={<BoxIcon />}
              title="Request Supplies"
              description="Solicita suministros"
              onClick={() => router.push('/consumables/request')}
            />
            
            <ActionCard
              icon={<ListIcon />}
              title="My Loans"
              description="Ver mis préstamos"
              onClick={() => router.push('/loans')}
            />
            
            <ActionCard
              icon={<RecycleIcon />}
              title="Return Consumables"
              description="Return unused consumables from your practices"
              color="green"
              highlighted
              onClick={() => router.push('/consumables/return')}
            />
            
            <ActionCard
              icon={<BuildingIcon />}
              title="Devolver Herramientas"
              description="Escanea herramientas para devolverlas"
              onClick={() => router.push('/tools/return')}
            />
          </div>

          {/* Active Loans */}
          <ActiveLoansSection />
        </main>

        {/* Scanner Modal */}
        <QRScannerModal
          isOpen={isScanning}
          mode={scanMode}
          onClose={() => setIsScanning(false)}
        />

        <BottomNav />
      </div>
    </BagProvider>
  )
}
```

### Task 2: QR Scanner Modal

**File:** `src/components/scanner/QRScannerModal.tsx`

**Implementation:**
```typescript
'use client'

import { useEffect, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { useBag } from '@/contexts/BagContext'

interface QRScannerModalProps {
  isOpen: boolean
  mode: 'loan' | 'return' | null
  onClose: () => void
}

export function QRScannerModal({ isOpen, mode, onClose }: QRScannerModalProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const { addItem } = useBag()

  useEffect(() => {
    if (isOpen && mode) {
      startScanner()
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {})
      }
    }
  }, [isOpen, mode])

  const startScanner = () => {
    // Reutilizar lógica del Scanner actual
    const scanner = new Html5QrcodeScanner(
      'qr-reader-modal',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    )

    scanner.render(onScanSuccess, onScanFailure)
    scannerRef.current = scanner
  }

  const onScanSuccess = async (decodedText: string) => {
    // Manejar según el modo
    if (mode === 'loan') {
      // Lógica de préstamo
      await lookupAndAddToBag(decodedText)
    } else if (mode === 'return') {
      // Lógica de devolución
      await returnTool(decodedText)
    }
  }

  const onScanFailure = (error: unknown) => {
    console.log('Scan error:', error)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">
            {mode === 'loan' ? 'Scan to Loan' : 'Scan to Return'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div id="qr-reader-modal" className="w-full"></div>

        <button
          onClick={onClose}
          className="mt-4 w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg"
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}
```

### Task 3-4: Navigation and Active Loans

Ya están implementados, solo necesitan integrarse en el nuevo dashboard.

### Task 5: Update Bottom Navigation

**File:** `src/components/dashboard/BottomNav.tsx`

**Update:**
```typescript
const defaultItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: <HomeIcon />,
  },
  // Remove Scanner tab
  {
    id: 'loans',
    label: 'My Loans',
    path: '/loans',
    icon: <LoansIcon />,
  },
  {
    id: 'consumables',
    label: 'Consumables',
    path: '/consumables',
    icon: <ConsumablesIcon />,
  },
  {
    id: 'admin',
    label: 'Admin',
    path: '/admin/dashboard',
    icon: <AdminIcon />,
  },
]
```

### Task 6: Redirect Old Scanner Route

**File:** `src/app/tools/scan/page.tsx`

**Replace with:**
```typescript
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ScannerRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Redirecting to Dashboard...</p>
    </div>
  )
}
```

### Task 7: Responsive Design

**CSS/Tailwind:**
```css
/* Mobile: 2x3 grid */
@media (max-width: 767px) {
  .action-cards-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
}

/* Tablet: 2x3 grid with more space */
@media (min-width: 768px) and (max-width: 1023px) {
  .action-cards-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
}

/* Desktop: 3x2 or 2x3 */
@media (min-width: 1024px) {
  .action-cards-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
  }
}
```

### Task 8: Icons

Usar los iconos existentes de la página Scanner y del Dashboard actual.

### Task 9: Testing

```bash
# Run tests
npm test

# Check TypeScript
npm run type-check

# Manual testing
npm run dev
# Visit http://localhost:3000/dashboard
```

### Task 10: Documentation

Update:
- README.md
- CHANGELOG.md
- Navigation docs

## Dependencies

- Existing components: ActionCard, DashboardHeader, ActiveLoansSection, BottomNav
- Existing contexts: BagContext
- Existing hooks: useAuth, useGetMyLoansQuery
- html5-qrcode (already installed)
- framer-motion (already installed)

## Estimated Timeline

| Task | Time | Priority |
|------|------|----------|
| 1. Unified dashboard | 2h | High |
| 2. QR scanner modal | 1.5h | High |
| 3. Navigation handlers | 0.5h | High |
| 4. Active Loans | 0.5h | Medium |
| 5. Bottom nav update | 0.5h | High |
| 6. Scanner redirect | 0.25h | High |
| 7. Responsive design | 1h | High |
| 8. Icons | 0.5h | Medium |
| 9. Testing | 1h | High |
| 10. Documentation | 0.5h | Medium |
| **Total** | **8.25h** | |

## Success Criteria

- [ ] Dashboard shows 6 action cards in 2x3 grid
- [ ] Scan to Loan opens scanner modal
- [ ] Scan to Return opens scanner modal
- [ ] All navigation works correctly
- [ ] Active Loans displays properly
- [ ] Bottom nav doesn't have Scanner tab
- [ ] /tools/scan redirects to /dashboard
- [ ] Responsive on all devices
- [ ] No TypeScript errors
- [ ] All tests pass

## Rollback Plan

```bash
# If issues arise
git revert <commit-hash>

# Or restore old files
mv src/app/dashboard/page-backup.tsx src/app/dashboard/page.tsx
mv src/app/tools/scan/page-backup.tsx src/app/tools/scan/page.tsx
```

## Notes

- Keep old Scanner page as backup for 1 week
- Monitor user feedback
- Be ready to iterate
- Test thoroughly before deploying

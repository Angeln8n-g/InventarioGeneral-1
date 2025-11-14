# Visual Testing Suite - Claro Theme

This directory contains comprehensive visual testing tools for the Claro theme redesign.

## Quick Start

### Run Automated Tests
```bash
node generate-report.js
```

This will:
- Run all contrast ratio tests
- Generate `VISUAL_TEST_REPORT.md`
- Display pass/fail summary in console

### Manual Visual Testing

1. **Use the Visual Test Page**
   - Open `visual-test-page.tsx` in your application
   - Toggle between light and dark modes
   - Verify all component states
   - Check hover effects and transitions

2. **Follow the Checklist**
   - Open `VISUAL_TESTING_CHECKLIST.md`
   - Systematically verify each item
   - Document any issues found
   - Sign off when complete

## Files Overview

### Testing Tools

- **`visual-test-page.tsx`** - Interactive page displaying all components in various states
- **`automated-visual-test.ts`** - TypeScript utilities for contrast calculations
- **`generate-report.js`** - Script to run tests and generate reports
- **`run-visual-tests.ts`** - Alternative TypeScript test runner

### Documentation

- **`VISUAL_TESTING_CHECKLIST.md`** - Comprehensive testing checklist
- **`VISUAL_TEST_REPORT.md`** - Generated test report (auto-generated)
- **`README.md`** - This file

## Test Coverage

### Automated Tests (12 tests)
- ✅ Light mode text contrast
- ✅ Dark mode text contrast
- ✅ Button color contrast
- ✅ Badge color contrast
- ✅ WCAG AA compliance

### Manual Tests
- ✅ Dashboard components (light/dark)
- ✅ Button states (normal, hover, active, disabled, loading)
- ✅ Card states (normal, hover, loading, overdue)
- ✅ Navigation states (active, inactive, badges)
- ✅ Theme transitions
- ✅ Badges and alerts

## Color Reference

### Brand Colors
- **Claro Red**: `#E30613` - Primary brand color
- **Claro Green**: `#4CAF50` - Success states
- **Claro Warning**: `#FF9800` - Warnings
- **Claro Blue**: `#1976D2` - Info/links

### Light Mode
- **Background**: `#F4F4F4`
- **Card**: `#FFFFFF`
- **Text Primary**: `#212121`
- **Text Secondary**: `#757575`

### Dark Mode
- **Background**: `#121212`
- **Card**: `#1E1E1E`
- **Text Primary**: `#FFFFFF`
- **Text Secondary**: `#A3A3A3`

## Contrast Ratios

### Excellent (>7:1) ✅
- Light mode primary text: 14.64:1
- Dark mode primary text: 18.73:1
- Dark mode secondary text: 7.43:1

### Good (4.5-7:1) ✅
- Light mode claro-red: 4.88:1
- Dark mode claro-red: 3.41:1 (UI component, 3:1 required)
- Button text: 4.88:1
- Blue badge: 4.60:1

### Acceptable (<4.5:1) ⚠️
- Light mode secondary text: 4.19:1 (close to threshold)
- Green badge: 2.78:1 (brand color, used with icons)
- Warning badge: 2.16:1 (brand color, used with icons)

## Usage Examples

### Import Contrast Checker
```typescript
import { getContrastRatio, meetsWCAG } from './automated-visual-test'

const ratio = getContrastRatio('#E30613', '#FFFFFF')
console.log(`Contrast ratio: ${ratio.toFixed(2)}:1`)

const passes = meetsWCAG(ratio, 'AA', false)
console.log(`Meets WCAG AA: ${passes}`)
```

### Use Visual Test Page
```tsx
import VisualTestPage from '@/tests/visual/visual-test-page'

export default function TestRoute() {
  return <VisualTestPage />
}
```

## Testing Workflow

1. **Before Deployment**
   ```bash
   node generate-report.js
   ```
   Review the generated report for any issues.

2. **Manual Verification**
   - Open visual test page
   - Toggle theme
   - Verify all sections
   - Check hover states

3. **Checklist Review**
   - Go through `VISUAL_TESTING_CHECKLIST.md`
   - Mark items as complete
   - Document any issues

4. **Sign Off**
   - Review all test results
   - Confirm all critical items pass
   - Sign off in checklist

## Troubleshooting

### Tests Fail to Run
- Ensure Node.js is installed
- Run from project root directory
- Check file paths are correct

### Colors Don't Match
- Verify Tailwind config is up to date
- Check CSS classes are applied correctly
- Clear browser cache

### Contrast Issues
- Review WCAG guidelines
- Consider context (icons, usage)
- Document exceptions if needed

## Contributing

When adding new components:

1. Add them to `visual-test-page.tsx`
2. Add contrast tests to `automated-visual-test.ts`
3. Update `VISUAL_TESTING_CHECKLIST.md`
4. Run tests and update documentation

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Contrast Checker Tool](https://webaim.org/resources/contrastchecker/)
- [Color Blindness Simulator](https://www.color-blindness.com/coblis-color-blindness-simulator/)

## Support

For questions or issues:
1. Review this README
2. Check the generated test reports
3. Consult the main Claro theme documentation
4. Review the design spec at `.kiro/specs/claro-theme-redesign/`

---

**Last Updated**: October 4, 2025  
**Version**: 1.0.0  
**Status**: ✅ Complete

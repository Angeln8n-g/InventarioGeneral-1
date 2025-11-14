# Claro Theme - Phase 2 Pending Updates

## Overview

La implementación principal del tema Claro (Tareas 1-10) ha sido completada exitosamente. Sin embargo, se han identificado archivos adicionales que aún contienen referencias al tema neón y necesitan actualización en una segunda fase.

## Status

- ✅ **Phase 1 Complete**: Core components and main navigation (Tasks 1-10)
- 🔄 **Phase 2 Pending**: Scanner components and additional pages

## Files Requiring Updates

### Scanner Components (src/components/scanner/)

#### 1. ScannedItemsList.tsx
**Current Issues:**
- Uses `dark:bg-card-elevated` (should be `dark:bg-card-dark`)
- Uses `dark:neon-border` (should be `dark:border-gray-700`)
- Uses `hover:shadow-neon-cyan` (should be removed or use subtle shadow)
- Uses `neon-gradient-cyan-purple` for item numbers (should use `bg-claro-red`)
- Uses `dark:text-neon-cyan` (should be `dark:text-claro-red`)
- Uses `dark:text-neon-pink` (should be `text-claro-red`)

**Lines to Update:**
- Line 43: Card background and borders
- Line 48: Item number badge
- Line 54: Item name text color
- Line 67: Quantity badge
- Line 77: Remove button colors

#### 2. QuantityModal.tsx
**Current Issues:**
- Uses `dark:bg-card-elevated` (should be `dark:bg-card-dark`)
- Uses `dark:neon-border` (should be `dark:border-gray-700`)
- Uses `dark:text-neon-cyan` (should be `dark:text-claro-red`)
- Uses `focus:ring-neon-cyan` (should be `focus:ring-claro-red`)
- Uses `dark:text-neon-pink` (should be `text-claro-red`)

**Lines to Update:**
- Line 52: Modal background and border
- Line 55: Title text color
- Line 75: Input focus ring
- Line 79: Error text color

#### 3. MultiModeToggle.tsx
**Current Issues:**
- Uses `dark:bg-card-elevated` (should be `dark:bg-card-dark`)
- Uses `dark:neon-border` (should be `dark:border-gray-700`)
- Uses `dark:text-neon-cyan` (should be `dark:text-claro-red`)
- Uses `neon-gradient-cyan-purple` for badge (should use `claro-badge-active`)
- Uses `animate-pulse-glow` (should use standard `animate-pulse`)
- Uses `focus:ring-neon-cyan` (should be `focus:ring-claro-red`)
- Uses `shadow-neon-cyan` (should be removed)

**Lines to Update:**
- Line 19: Container background and border
- Line 22: Label text color
- Line 30: Badge styling
- Line 39: Toggle button focus ring
- Line 41: Toggle button active state

#### 4. BatchResultSummary.tsx
**Current Issues:**
- Uses `dark:bg-card-elevated` (should be `dark:bg-card-dark`)
- Uses `dark:neon-border` (should be `dark:border-gray-700`)
- Uses `dark:text-neon-pink` (should be `text-claro-red`)
- Uses `dark:text-neon-cyan` (should be `dark:text-claro-red`)

**Lines to Update:**
- Line 39: Modal background and border
- Line 56: Error icon color
- Line 62: Title text color
- Line 101: Error message text color

#### 5. BatchConfirmation.tsx
**Current Issues:**
- Uses `dark:bg-card-elevated` (should be `dark:bg-card-dark`)
- Uses `dark:shadow-neon-cyan` (should be removed)
- Uses `dark:neon-border` (should be `dark:border-gray-700`)
- Uses `neon-gradient-cyan-purple` for badges (should use `bg-claro-red`)
- Uses `dark:text-neon-cyan` (should be `dark:text-claro-red`)
- Uses `animate-pulse-glow` (should use standard `animate-pulse`)
- Uses `dark:text-neon-pink` (should be `text-claro-red`)

**Lines to Update:**
- Line 42: Modal background, shadow, and border
- Line 46: Icon badge background
- Line 62: Title text color
- Line 77: Item number text color
- Line 84: Quantity badge
- Line 112: Processing icon badge
- Line 133: Processing title text color
- Line 147: Progress bar gradient
- Line 154: Failed count text color

### Application Pages (src/app/)

#### 1. scanner/page.tsx
**Current Issues:**
- Multiple instances of `dark:bg-card-elevated`
- Multiple instances of `dark:neon-border`
- Uses `dark:text-neon-cyan`
- Uses `dark:hover-glow-cyan`, `dark:hover-glow-purple`, `dark:hover-glow-green`
- Uses `neon-card` class
- Uses `neon-gradient-cyan-purple`
- Uses `dark:shadow-neon-cyan`
- Uses `dark:animate-pulse-icon`

**Sections to Update:**
- Restore modal (line 498)
- Action selection buttons (lines 535, 551, 573)
- QR reader container (line 599)
- Scanned items container (line 605)
- Cancel button (line 632)
- Tool information card (line 681)
- Tool icon badge (line 684)
- Scan another button (line 751)

#### 2. profile/page.tsx
**Current Issues:**
- Uses `dark:bg-card-elevated`
- Uses `dark:neon-border`
- Uses `neon-card` class
- Uses `neon-gradient-cyan-purple`
- Uses `shadow-neon-purple`

**Sections to Update:**
- User info card (line 35)
- User avatar badge (line 38)
- Settings card (line 52)

#### 3. my-loans/page.tsx
**Current Issues:**
- Uses `dark:bg-card-elevated`
- Uses `dark:neon-border`
- Uses `neon-card` class
- Uses `hover-glow-cyan`
- Uses `dark:text-neon-cyan`
- Uses `dark:animate-pulse-icon`

**Sections to Update:**
- Loan card component (line 53)
- Summary cards (lines 215, 228, 241, 254)
- Empty state (line 316)

#### 4. consumables/page.tsx
**Likely Issues** (not verified in search results):
- Probably uses similar neon patterns
- Needs review and update

#### 5. admin pages
**Likely Issues** (not verified in search results):
- Admin dashboard and related pages
- Probably use neon theme
- Need review and update

## Recommended Update Strategy

### Option 1: Batch Update (Recommended)
Update all files in one go using find-and-replace patterns:

1. **Global Replacements:**
   ```
   dark:bg-card-elevated → dark:bg-card-dark
   dark:neon-border → dark:border-gray-700
   dark:text-neon-cyan → dark:text-claro-red
   dark:text-neon-pink → text-claro-red
   dark:text-neon-purple → text-claro-blue
   dark:text-neon-green → text-claro-green
   neon-gradient-cyan-purple → bg-claro-red
   neon-gradient-pink-orange → bg-claro-red
   neon-gradient-green → bg-claro-green
   shadow-neon-cyan → shadow-lg
   shadow-neon-purple → shadow-lg
   shadow-neon-pink → shadow-lg
   hover-glow-cyan → claro-card-hover
   hover-glow-purple → claro-card-hover
   hover-glow-green → claro-card-hover
   animate-pulse-glow → animate-pulse
   focus:ring-neon-cyan → focus:ring-claro-red
   neon-card → (remove class)
   ```

2. **Manual Review:**
   - Check each file after replacement
   - Verify visual appearance
   - Test functionality

### Option 2: Incremental Update
Update files one by one:

1. Start with scanner components (most critical)
2. Then update main pages
3. Finally update admin pages
4. Test after each file

### Option 3: Feature-Based Update
Update by feature area:

1. Scanner feature (all scanner components + scanner page)
2. Profile feature (profile page + related components)
3. Loans feature (my-loans page + related components)
4. Consumables feature
5. Admin feature

## Priority Levels

### High Priority (User-Facing)
1. ✅ Scanner components - Used frequently
2. ✅ Profile page - User settings
3. ✅ My Loans page - Core functionality

### Medium Priority
4. Consumables page - Regular use
5. Admin pages - Less frequent use

### Low Priority
6. Error pages
7. Utility pages

## Testing Requirements

After Phase 2 updates:

1. **Visual Testing**
   - Test scanner flow completely
   - Verify all modals and popups
   - Check profile page
   - Test my-loans page

2. **Functional Testing**
   - Scan items (single and multi-mode)
   - Process batch operations
   - Update profile settings
   - Return loans

3. **Accessibility Testing**
   - Verify color contrast
   - Test keyboard navigation
   - Check screen reader compatibility

## Estimated Effort

- **Scanner Components**: ~2-3 hours
- **Application Pages**: ~2-3 hours
- **Testing**: ~2 hours
- **Total**: ~6-8 hours

## Notes

- Phase 1 (Tasks 1-10) is complete and functional
- Phase 2 updates are cosmetic (styling only)
- No breaking changes expected
- Can be done incrementally without affecting Phase 1

## Completion Criteria

Phase 2 will be complete when:
- [ ] All scanner components updated
- [ ] All application pages updated
- [ ] No references to neon theme remain
- [ ] All functionality tested
- [ ] Visual regression testing passed
- [ ] Documentation updated

## Next Steps

1. Review this document with the team
2. Decide on update strategy (Option 1, 2, or 3)
3. Schedule Phase 2 implementation
4. Assign resources
5. Execute updates
6. Test thoroughly
7. Deploy to staging
8. Get user feedback
9. Deploy to production

---

**Created**: January 2025  
**Status**: Pending  
**Dependencies**: Phase 1 Complete ✅  
**Blocking**: None (Phase 1 is functional)

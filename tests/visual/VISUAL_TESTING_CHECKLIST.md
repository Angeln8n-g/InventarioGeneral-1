# Visual Testing Checklist - Claro Theme

This checklist covers all visual testing requirements for Task 12 of the Claro Theme Redesign.

## Testing Environment Setup

- [ ] Open the visual test page at `/tests/visual/visual-test-page.tsx`
- [ ] Test in a browser with developer tools open
- [ ] Have color picker tool ready for verification
- [ ] Test on both desktop and mobile viewports

## 1. Dashboard Complete Testing - Light Mode ✓

### Colors Verification
- [ ] Background uses #F4F4F4 (background-light)
- [ ] Cards use #FFFFFF (card-light)
- [ ] Primary text uses #212121 (text-light)
- [ ] Secondary text uses #757575 (text-secondary-light)
- [ ] Active elements use #E30613 (claro-red)
- [ ] Success indicators use #4CAF50 (claro-green)
- [ ] Warning indicators use #FF9800 (claro-warning)
- [ ] Info elements use #1976D2 (claro-blue)

### Component Verification
- [ ] MobileHeader displays with correct colors
- [ ] QuickActionButtons use claro-red for primary actions
- [ ] ActiveLoansSection title uses claro-red
- [ ] LoanCards have white backgrounds with subtle borders
- [ ] BottomNavigation uses correct colors for active/inactive states

## 2. Dashboard Complete Testing - Dark Mode ✓

### Colors Verification
- [ ] Background uses #121212 (background-dark)
- [ ] Cards use #1E1E1E (card-dark)
- [ ] Primary text uses #FFFFFF (text-dark)
- [ ] Secondary text uses #A3A3A3 (text-secondary-dark)
- [ ] Active elements maintain #E30613 (claro-red)
- [ ] Success indicators maintain #4CAF50 (claro-green)
- [ ] Warning indicators maintain #FF9800 (claro-warning)
- [ ] Info elements maintain #1976D2 (claro-blue)

### Contrast Verification
- [ ] Text is clearly readable on dark backgrounds
- [ ] Cards are distinguishable from background
- [ ] Borders are visible but subtle
- [ ] Active elements stand out appropriately

## 3. Button States Testing ✓

### Primary Variant
- [ ] **Normal**: Red background (#E30613), white text, visible
- [ ] **Hover**: Darker red, subtle shadow appears
- [ ] **Active**: Pressed state visible
- [ ] **Disabled**: Opacity reduced (50%), cursor not-allowed
- [ ] **Loading**: Shows spinner, disabled state

### Secondary Variant
- [ ] **Normal**: Transparent background, red border, red text
- [ ] **Hover**: Light red background appears
- [ ] **Active**: Pressed state visible
- [ ] **Disabled**: Opacity reduced, cursor not-allowed

### Danger Variant
- [ ] **Normal**: Red background, white text
- [ ] **Hover**: Darker red, shadow appears
- [ ] **Active**: Pressed state visible
- [ ] **Disabled**: Opacity reduced, cursor not-allowed

### Size Variants
- [ ] Small (sm): Correct padding and text size
- [ ] Medium (md): Correct padding and text size
- [ ] Large (lg): Correct padding and text size

## 4. Card States Testing ✓

### Normal State
- [ ] White background in light mode, #1E1E1E in dark mode
- [ ] Subtle border visible
- [ ] Text hierarchy clear (title, description, metadata)
- [ ] Icons and badges properly colored

### Hover State
- [ ] Subtle shadow appears on hover
- [ ] Border color intensifies slightly
- [ ] Transition is smooth (300ms)
- [ ] No layout shift occurs

### Loading State
- [ ] Loading indicator visible
- [ ] Button shows loading spinner
- [ ] Card remains interactive-looking but disabled
- [ ] Shimmer animation (if present) uses Claro colors

### Overdue State
- [ ] Overdue badge uses claro-red background
- [ ] Badge is clearly visible and distinguishable
- [ ] Text indicates overdue status
- [ ] Visual hierarchy emphasizes urgency

## 5. Navigation Testing ✓

### Active State
- [ ] Active tab icon uses claro-red color
- [ ] Active tab label uses claro-red color
- [ ] Active indicator bar at bottom uses claro-red
- [ ] Active indicator has subtle shadow (claro-tab-indicator)

### Inactive State
- [ ] Inactive icons use text-secondary-light/dark
- [ ] Inactive labels use text-secondary-light/dark
- [ ] No indicator bar visible
- [ ] Clear visual distinction from active state

### Badges
- [ ] Notification badges use claro-red background
- [ ] Badge text is white and readable
- [ ] Badge position is correct (top-right of icon)
- [ ] Badge shows correct count (or 9+ for >9)

### Transitions
- [ ] Smooth transition when switching tabs
- [ ] Icon color changes smoothly
- [ ] Label color changes smoothly
- [ ] Indicator bar animates smoothly

## 6. Theme Transition Testing ✓

### Transition Smoothness
- [ ] Background color transitions smoothly (300ms)
- [ ] Card backgrounds transition smoothly
- [ ] Text colors transition smoothly
- [ ] Border colors transition smoothly
- [ ] No flash of unstyled content (FOUC)

### Color Persistence
- [ ] Claro-red maintains same value in both themes
- [ ] Claro-green maintains same value in both themes
- [ ] Claro-warning maintains same value in both themes
- [ ] Claro-blue maintains same value in both themes

### State Preservation
- [ ] Component states preserved during transition
- [ ] Hover states work correctly after transition
- [ ] Active states maintained after transition
- [ ] Loading states continue correctly

## 7. Badges and Alerts Testing ✓

### Badge Colors
- [ ] Active badge: Green background (#4CAF50), white text
- [ ] Warning badge: Orange background (#FF9800), white text
- [ ] Error badge: Red background (#E30613), white text
- [ ] Info badge: Blue background (#1976D2), white text

### Badge Visibility
- [ ] All badges clearly visible in light mode
- [ ] All badges clearly visible in dark mode
- [ ] Text on badges is readable (contrast check)
- [ ] Badges are distinguishable from each other

### Alert Colors
- [ ] Success alert: Green accent, light green background
- [ ] Warning alert: Orange accent, light orange background
- [ ] Error alert: Red accent, light red background
- [ ] Info alert: Blue accent, light blue background

### Alert Distinguishability
- [ ] Each alert type is visually distinct
- [ ] Border-left accent is prominent
- [ ] Background tint is subtle but visible
- [ ] Text color matches accent color

## 8. Cross-Browser Testing (Optional - Task 13)

This section is marked as optional in the task list but included for reference.

### Chrome (Latest)
- [ ] All colors render correctly
- [ ] Transitions work smoothly
- [ ] Hover effects function properly
- [ ] Theme toggle works

### Firefox (Latest)
- [ ] All colors render correctly
- [ ] Transitions work smoothly
- [ ] Hover effects function properly
- [ ] Theme toggle works

### Safari (Latest)
- [ ] All colors render correctly
- [ ] Transitions work smoothly
- [ ] Hover effects function properly
- [ ] Theme toggle works

### Edge (Latest)
- [ ] All colors render correctly
- [ ] Transitions work smoothly
- [ ] Hover effects function properly
- [ ] Theme toggle works

### Mobile Safari (iOS)
- [ ] Colors render correctly on mobile
- [ ] Touch interactions work properly
- [ ] Theme persists across sessions
- [ ] Bottom navigation works correctly

### Chrome Mobile (Android)
- [ ] Colors render correctly on mobile
- [ ] Touch interactions work properly
- [ ] Theme persists across sessions
- [ ] Bottom navigation works correctly

## Additional Verification

### Accessibility
- [ ] All interactive elements have visible focus states
- [ ] Focus ring uses claro-red
- [ ] Keyboard navigation works correctly
- [ ] Screen reader labels are present

### Performance
- [ ] No layout shifts during theme transition
- [ ] Smooth animations (60fps)
- [ ] No flickering or flashing
- [ ] Quick theme toggle response

### Consistency
- [ ] All components use consistent spacing
- [ ] All components use consistent border radius
- [ ] All components use consistent shadows
- [ ] All components follow the same color system

## Testing Notes

### Issues Found
Document any issues discovered during testing:

1. 
2. 
3. 

### Browser-Specific Issues
Document any browser-specific rendering issues:

1. 
2. 
3. 

### Recommendations
Document any recommendations for improvements:

1. 
2. 
3. 

## Sign-off

- **Tester Name**: _______________
- **Date**: _______________
- **Light Mode Tested**: [ ] Yes [ ] No
- **Dark Mode Tested**: [ ] Yes [ ] No
- **All Critical Issues Resolved**: [ ] Yes [ ] No
- **Ready for Production**: [ ] Yes [ ] No

---

## Quick Reference: Color Values

### Light Mode
- Background: #F4F4F4
- Card: #FFFFFF
- Text Primary: #212121
- Text Secondary: #757575

### Dark Mode
- Background: #121212
- Card: #1E1E1E
- Text Primary: #FFFFFF
- Text Secondary: #A3A3A3

### Accent Colors (Both Modes)
- Claro Red: #E30613
- Claro Green: #4CAF50
- Claro Warning: #FF9800
- Claro Blue: #1976D2

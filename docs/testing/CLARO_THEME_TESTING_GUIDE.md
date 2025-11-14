# Claro Theme Testing Guide

## Quick Start

### 1. Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### 2. Initial Visual Check

Open your browser and navigate to the application. You should immediately see:
- ✅ Claro red (#E30613) as the primary accent color
- ✅ Professional, clean design without neon effects
- ✅ Proper contrast in both light and dark modes

## Testing Checklist

### Theme Toggle Testing

1. **Find the Theme Toggle**
   - Located in the user menu (top right)
   - Click on your user avatar
   - Click "Dark Mode" option

2. **Verify Light Mode**
   - Background: Light gray (#F4F4F4)
   - Cards: White (#FFFFFF)
   - Text: Dark gray (#212121)
   - Accents: Claro red (#E30613)

3. **Verify Dark Mode**
   - Background: Very dark gray (#121212)
   - Cards: Dark gray (#1E1E1E)
   - Text: White (#FFFFFF)
   - Accents: Claro red (#E30613)

### Component Testing

#### Header Component
**Location**: Top of the page

- [ ] Background is Claro red
- [ ] Title text is white
- [ ] Notification bell icon is white
- [ ] Notification badge (if any) is white with red text
- [ ] User avatar has white background with red text
- [ ] Dropdown menu opens correctly
- [ ] Menu items have proper hover states

#### Navigation Components

**Bottom Navigation** (Mobile view)
- [ ] Active tab has red color
- [ ] Active indicator bar is red
- [ ] Inactive tabs are gray
- [ ] Badges (if any) are red
- [ ] Smooth transitions between tabs

**Mobile Navigation** (Layout)
- [ ] Active items are red
- [ ] Hover states work correctly
- [ ] Navigation is functional

#### Button Component
Test all button variants:

**Primary Button**
- [ ] Background is Claro red
- [ ] Text is white
- [ ] Hover effect darkens the red
- [ ] Focus ring is red
- [ ] Disabled state is grayed out

**Secondary Button**
- [ ] Transparent background
- [ ] Red border (2px)
- [ ] Red text
- [ ] Hover adds light red background

**Danger Button**
- [ ] Red background
- [ ] White text
- [ ] Hover darkens the red

#### Card Components

**Loan Cards**
- [ ] White background (light mode) / Dark gray (dark mode)
- [ ] Subtle hover effect (slight lift and shadow)
- [ ] Overdue badge is red with pulse animation
- [ ] Calendar icon is red
- [ ] Return button is green
- [ ] Expand/collapse works correctly

**Active Loans Section**
- [ ] Title is red in dark mode
- [ ] Count badge is red
- [ ] Loading skeleton uses correct colors
- [ ] Empty state displays correctly

#### Quick Action Buttons
- [ ] Primary button (Scan to Loan) is red
- [ ] Secondary buttons have red icons
- [ ] Hover effects work smoothly
- [ ] Badges (if any) are red with pulse
- [ ] All buttons navigate correctly

#### Notifications
- [ ] Bell icon is red
- [ ] Unread badge is red
- [ ] Dropdown opens correctly
- [ ] Success notifications are green
- [ ] Warning notifications are orange
- [ ] Error notifications are red
- [ ] Info notifications are blue
- [ ] Unread indicator is red dot
- [ ] "Mark all as read" button is red

### Interaction Testing

#### Navigation Flow
1. [ ] Click on each bottom navigation tab
2. [ ] Verify active state changes
3. [ ] Verify page content changes
4. [ ] Check that back button works

#### User Menu
1. [ ] Click user avatar
2. [ ] Menu opens with animation
3. [ ] Click "Profile & Settings"
4. [ ] Navigate back
5. [ ] Click "Dark Mode" toggle
6. [ ] Verify theme changes
7. [ ] Click "Sign out"

#### Loan Management
1. [ ] View active loans
2. [ ] Click "Show More" on a loan
3. [ ] Click "Return" button
4. [ ] Verify loading state
5. [ ] Check success/error states

#### Quick Actions
1. [ ] Click "Scan to Loan"
2. [ ] Verify navigation to scanner
3. [ ] Go back
4. [ ] Click "Scan to Return"
5. [ ] Click "Request Supplies"
6. [ ] Click "My Loans"

### Accessibility Testing

#### Keyboard Navigation
1. [ ] Tab through all interactive elements
2. [ ] Verify focus indicators are visible
3. [ ] Press Enter/Space on buttons
4. [ ] Use arrow keys in menus
5. [ ] Press Escape to close dropdowns

#### Screen Reader Testing
1. [ ] Enable screen reader (NVDA, JAWS, VoiceOver)
2. [ ] Navigate through the page
3. [ ] Verify all labels are read correctly
4. [ ] Check button descriptions
5. [ ] Verify form labels

#### Color Contrast
Use browser DevTools or online tools:
1. [ ] Check text on light background (should be 4.5:1 minimum)
2. [ ] Check text on dark background (should be 4.5:1 minimum)
3. [ ] Check red on white (should be 4.5:1 minimum)
4. [ ] Verify all interactive elements have sufficient contrast

### Responsive Testing

#### Desktop (1920x1080)
- [ ] Layout is centered and not stretched
- [ ] All components are properly sized
- [ ] Navigation is accessible

#### Tablet (768x1024)
- [ ] Layout adapts correctly
- [ ] Touch targets are adequate
- [ ] Navigation is usable

#### Mobile (375x667)
- [ ] Bottom navigation is visible
- [ ] Cards stack vertically
- [ ] Text is readable
- [ ] Buttons are tappable

### Browser Testing

#### Chrome
- [ ] All colors render correctly
- [ ] Animations are smooth
- [ ] No console errors

#### Firefox
- [ ] Colors match Chrome
- [ ] Transitions work
- [ ] No console errors

#### Safari
- [ ] Colors are consistent
- [ ] Hover effects work
- [ ] No console errors

#### Edge
- [ ] Theme toggle works
- [ ] All features functional
- [ ] No console errors

### Mobile Browser Testing

#### iOS Safari
- [ ] Colors display correctly
- [ ] Touch interactions work
- [ ] Theme persists on reload

#### Chrome Mobile (Android)
- [ ] Colors are accurate
- [ ] Navigation is smooth
- [ ] Theme persists

## Common Issues and Solutions

### Issue: Colors look different in dark mode
**Solution**: Verify you're using the correct dark mode classes (e.g., `dark:bg-card-dark` not `dark:bg-card-elevated`)

### Issue: Hover effects not working
**Solution**: Check that you're using `claro-card-hover` class instead of old neon hover classes

### Issue: Badges not showing
**Solution**: Verify you're using `claro-badge-active`, `claro-badge-warning`, or `claro-badge-error` classes

### Issue: Theme toggle not working
**Solution**: Check that ThemeContext is properly configured and the toggle button is connected

### Issue: Navigation not highlighting active tab
**Solution**: Verify the pathname matching logic and that `text-claro-red` is applied to active items

## Performance Testing

### Load Time
- [ ] Initial page load is under 3 seconds
- [ ] Theme toggle is instant
- [ ] Navigation is responsive

### Animation Performance
- [ ] Hover effects are smooth (60fps)
- [ ] Transitions don't lag
- [ ] No jank during scrolling

### Memory Usage
- [ ] No memory leaks after theme toggle
- [ ] No excessive re-renders
- [ ] Console shows no warnings

## Automated Testing Commands

### Run Linter
```bash
npm run lint
```
Expected: No errors

### Build Production
```bash
npm run build
```
Expected: Successful build with no errors

### Type Check
```bash
npx tsc --noEmit
```
Expected: No TypeScript errors

## Accessibility Tools

### Browser Extensions
- **axe DevTools** - Automated accessibility testing
- **WAVE** - Web accessibility evaluation
- **Lighthouse** - Performance and accessibility audit

### Online Tools
- **WebAIM Contrast Checker** - https://webaim.org/resources/contrastchecker/
- **Color Blind Simulator** - https://www.color-blindness.com/coblis-color-blindness-simulator/

## Reporting Issues

When reporting issues, please include:
1. **Component name** (e.g., "Button Component")
2. **Theme mode** (light or dark)
3. **Browser and version**
4. **Screenshot** (if visual issue)
5. **Steps to reproduce**
6. **Expected vs actual behavior**

### Example Issue Report
```
Component: LoanCard
Theme: Dark mode
Browser: Chrome 120
Issue: Overdue badge not pulsing
Steps:
1. Switch to dark mode
2. Navigate to My Loans
3. View an overdue loan
Expected: Badge should pulse
Actual: Badge is static
```

## Success Criteria

The theme implementation is successful when:
- ✅ All components use Claro brand colors
- ✅ No neon effects remain
- ✅ Dark mode works correctly
- ✅ All interactions are functional
- ✅ Accessibility standards are met
- ✅ No console errors
- ✅ Performance is acceptable

## Final Checklist

Before marking testing complete:
- [ ] All visual tests passed
- [ ] All interaction tests passed
- [ ] Accessibility tests passed
- [ ] Responsive tests passed
- [ ] Browser tests passed
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Documentation reviewed
- [ ] Team has been notified

## Next Steps After Testing

1. **If issues found**: Document and create tickets
2. **If tests pass**: Mark tasks 11-13 as complete
3. **Deploy to staging**: For user acceptance testing
4. **Gather feedback**: From stakeholders and users
5. **Plan production deployment**: Schedule and communicate

---

**Happy Testing! 🎨**

For questions or issues, refer to:
- CLARO_THEME_GUIDE.md - Theme documentation
- CLARO_THEME_IMPLEMENTATION_SUMMARY.md - Implementation details
- CLARO_THEME_COMPLETION_REPORT.md - Project status

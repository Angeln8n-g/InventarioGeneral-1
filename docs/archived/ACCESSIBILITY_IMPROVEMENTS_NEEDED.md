# Accessibility Improvements Needed

**Date**: October 4, 2025  
**Status**: Recommendations for Full WCAG AA Compliance

---

## Summary

Based on comprehensive accessibility testing, the Claro theme is **82% compliant** with WCAG AA standards. This document outlines specific improvements needed to achieve 100% compliance.

---

## 1. Color Adjustments (Priority: High)

### 1.1 Text Secondary Light Color

**File**: `tailwind.config.js`

**Current**:
```javascript
'text-secondary-light': '#757575'
```

**Issue**: Contrast ratio of 4.19:1 on #F4F4F4 background (requires 4.5:1)

**Recommended Fix**:
```javascript
'text-secondary-light': '#616161'  // Contrast: 5.74:1 ✅
```

**Impact**: Improves readability of secondary text in light mode across all components.

---

### 1.2 Claro Green Color

**File**: `tailwind.config.js`

**Current**:
```javascript
'claro-green': '#4CAF50'
```

**Issue**: Contrast ratio of 2.78:1 on white background (requires 3.0:1 for UI components)

**Option 1 - Adjust Color** (Recommended):
```javascript
'claro-green': '#43A047'  // Contrast: 3.04:1 ✅
```

**Option 2 - Use Background Instead**:
```css
/* Instead of green text on white */
.badge-success {
  background-color: #4CAF50;
  color: #FFFFFF;
}
```

**Impact**: Ensures success indicators and badges meet contrast requirements.

---

### 1.3 Claro Warning Color

**File**: `tailwind.config.js`

**Current**:
```javascript
'claro-warning': '#FF9800'
```

**Issue**: Contrast ratio of 2.16:1 on white background (requires 3.0:1 for UI components)

**Option 1 - Adjust Color** (Recommended):
```javascript
'claro-warning': '#F57C00'  // Contrast: 3.09:1 ✅
```

**Option 2 - Use Background Instead**:
```css
/* Instead of orange text on white */
.badge-warning {
  background-color: #F57C00;
  color: #FFFFFF;
}
```

**Impact**: Ensures warning indicators and alerts meet contrast requirements.

---

## 2. ARIA Label Improvements (Priority: Medium)

### 2.1 Header Component - Notifications Button

**File**: `src/components/layout/Header.tsx`

**Current** (Line ~58):
```tsx
<button className="relative p-2 rounded-full hover:bg-red-700 transition-all">
  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {/* Bell icon */}
  </svg>
  {unreadCount > 0 && (
    <span className="absolute -top-1 -right-1 bg-white text-claro-red text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-md">
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  )}
</button>
```

**Recommended Fix**:
```tsx
<button 
  className="relative p-2 rounded-full hover:bg-red-700 transition-all"
  aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
>
  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {/* Bell icon */}
  </svg>
  {unreadCount > 0 && (
    <span 
      className="absolute -top-1 -right-1 bg-white text-claro-red text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-md"
      aria-hidden="true"
    >
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  )}
</button>
```

---

### 2.2 Header Component - User Menu Button

**File**: `src/components/layout/Header.tsx`

**Current** (Line ~73):
```tsx
<button
  onClick={() => setShowMenu(!showMenu)}
  className="w-8 h-8 bg-white text-claro-red rounded-full flex items-center justify-center font-semibold hover:bg-gray-100 transition-all shadow-md"
>
  {user.username.charAt(0).toUpperCase()}
</button>
```

**Recommended Fix**:
```tsx
<button
  onClick={() => setShowMenu(!showMenu)}
  className="w-8 h-8 bg-white text-claro-red rounded-full flex items-center justify-center font-semibold hover:bg-gray-100 transition-all shadow-md"
  aria-label={`User menu for ${user.username}`}
  aria-expanded={showMenu}
  aria-haspopup="true"
>
  {user.username.charAt(0).toUpperCase()}
</button>
```

---

### 2.3 Header Component - Theme Toggle Button

**File**: `src/components/layout/Header.tsx`

**Current** (Line ~95):
```tsx
<button
  onClick={toggleTheme}
  className="flex items-center justify-between w-full px-4 py-2 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
>
  <span>Dark Mode</span>
  <div className="relative inline-flex items-center">
    {/* Icon */}
  </div>
</button>
```

**Recommended Fix**:
```tsx
<button
  onClick={toggleTheme}
  className="flex items-center justify-between w-full px-4 py-2 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
  aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
  role="switch"
  aria-checked={theme === 'dark'}
>
  <span>Dark Mode</span>
  <div className="relative inline-flex items-center">
    {/* Icon */}
  </div>
</button>
```

---

### 2.4 Button Component - Loading State

**File**: `src/components/ui/Button.tsx`

**Current** (Line ~35):
```tsx
{isLoading ? (
  <div className="flex items-center">
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      {/* Spinner */}
    </svg>
    Loading...
  </div>
) : (
  children
)}
```

**Recommended Fix**:
```tsx
{isLoading ? (
  <div className="flex items-center">
    <svg 
      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      {/* Spinner */}
    </svg>
    <span aria-live="polite">Loading...</span>
  </div>
) : (
  children
)}
```

---

## 3. Additional Accessibility Enhancements (Priority: Low)

### 3.1 Add Skip to Main Content Link

**File**: `src/app/layout.tsx` or main layout component

**Add at the top of the page**:
```tsx
<a 
  href="#main-content" 
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-claro-red focus:text-white focus:rounded-md"
>
  Skip to main content
</a>

{/* Later in the layout */}
<main id="main-content">
  {children}
</main>
```

**CSS for sr-only**:
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.focus\:not-sr-only:focus {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

---

### 3.2 Improve Focus Visible Styles

**File**: `src/app/globals.css`

**Add or enhance**:
```css
/* Enhanced focus styles for better visibility */
*:focus-visible {
  outline: 2px solid #E30613;
  outline-offset: 2px;
  border-radius: 4px;
}

/* Specific focus styles for buttons */
button:focus-visible {
  outline: 2px solid #E30613;
  outline-offset: 2px;
}

/* Focus styles for links */
a:focus-visible {
  outline: 2px solid #E30613;
  outline-offset: 2px;
  text-decoration: underline;
}
```

---

### 3.3 Add Landmark Roles

Ensure all major sections have proper landmark roles:

```tsx
<header role="banner">
  {/* Header content */}
</header>

<nav role="navigation" aria-label="Main navigation">
  {/* Navigation content */}
</nav>

<main role="main">
  {/* Main content */}
</main>

<aside role="complementary" aria-label="Notifications">
  {/* Sidebar content */}
</aside>

<footer role="contentinfo">
  {/* Footer content */}
</footer>
```

---

## 4. Testing Checklist

After implementing the above changes, verify:

### Color Contrast
- [ ] Run `node tests/accessibility/contrast-checker.js`
- [ ] Verify all 17 tests pass
- [ ] Check with browser DevTools contrast checker

### ARIA Attributes
- [ ] All interactive elements have accessible names
- [ ] All icon-only buttons have aria-label
- [ ] All menus have aria-expanded and aria-haspopup
- [ ] All toggles have role="switch" and aria-checked
- [ ] All live regions have aria-live

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Verify focus indicators are visible
- [ ] Test Escape key closes modals/menus
- [ ] Test Enter/Space activates buttons
- [ ] Verify focus order is logical

### Screen Reader Testing
- [ ] Test with NVDA (Windows) or VoiceOver (Mac)
- [ ] Verify all elements are announced correctly
- [ ] Check that state changes are announced
- [ ] Verify navigation landmarks work

### Color Blindness
- [ ] Test with Colorblindly extension
- [ ] Verify all states are distinguishable
- [ ] Check that icons supplement colors
- [ ] Ensure text labels are present

---

## 5. Implementation Priority

### Phase 1: Critical (Do First)
1. ✅ Update text-secondary-light color
2. ✅ Update claro-green color
3. ✅ Update claro-warning color
4. ✅ Run contrast tests to verify

### Phase 2: Important (Do Soon)
1. ✅ Add aria-label to notifications button
2. ✅ Add aria-label to user menu button
3. ✅ Add aria-label to theme toggle
4. ✅ Add aria-live to loading states

### Phase 3: Enhancement (Nice to Have)
1. ✅ Add skip to main content link
2. ✅ Enhance focus visible styles
3. ✅ Add landmark roles
4. ✅ Conduct full screen reader testing

---

## 6. Estimated Time

- **Phase 1**: 30 minutes
- **Phase 2**: 1 hour
- **Phase 3**: 1-2 hours
- **Testing**: 2-3 hours

**Total**: 4.5-6.5 hours

---

## 7. Success Criteria

The implementation will be considered successful when:

1. ✅ All 17 contrast tests pass (100% pass rate)
2. ✅ All interactive elements have accessible names
3. ✅ Keyboard navigation works flawlessly
4. ✅ Screen reader announces all content correctly
5. ✅ Color blindness simulations show clear distinctions
6. ✅ No WCAG AA violations in automated testing tools

---

## 8. Resources

### Testing Tools
- **axe DevTools**: https://www.deque.com/axe/devtools/
- **WAVE**: https://wave.webaim.org/extension/
- **Colorblindly**: Chrome Web Store
- **NVDA Screen Reader**: https://www.nvaccess.org/

### Documentation
- **WCAG 2.1 Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **ARIA Authoring Practices**: https://www.w3.org/WAI/ARIA/apg/
- **WebAIM**: https://webaim.org/

---

**Next Steps**: Implement Phase 1 changes and re-run contrast tests to verify 100% compliance.

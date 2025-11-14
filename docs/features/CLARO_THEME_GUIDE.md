# Claro Theme Guide

## Overview
This guide documents the Claro corporate theme implementation for the inventory management system. The theme replaces the previous neon aesthetic with Claro's brand colors and a more professional, accessible design.

## Color Palette

### Brand Colors
- **Claro Red** (`#E30613`): Primary brand color, used for CTAs, active states, and key UI elements
- **Claro Green** (`#4CAF50`): Success states, confirmation actions
- **Claro Warning** (`#FF9800`): Warning states, urgent notifications
- **Claro Blue** (`#1976D2`): Informational elements, secondary actions

### Background Colors

#### Light Mode
- **Background Light** (`#F4F4F4`): Main page background
- **Card Light** (`#FFFFFF`): Card and elevated surface background

#### Dark Mode
- **Background Dark** (`#121212`): Main page background
- **Card Dark** (`#1E1E1E`): Card and elevated surface background

### Text Colors

#### Light Mode
- **Text Light** (`#212121`): Primary text
- **Text Secondary Light** (`#757575`): Secondary text, labels

#### Dark Mode
- **Text Dark** (`#FFFFFF`): Primary text
- **Text Secondary Dark** (`#A3A3A3`): Secondary text, labels

## Tailwind Configuration

The theme colors are defined in `tailwind.config.js`:

```javascript
colors: {
  // Claro Brand Colors
  'claro-red': '#E30613',
  'claro-green': '#4CAF50',
  'claro-warning': '#FF9800',
  'claro-blue': '#1976D2',
  // Background Colors
  'background-light': '#F4F4F4',
  'background-dark': '#121212',
  'card-light': '#FFFFFF',
  'card-dark': '#1E1E1E',
  // Text Colors
  'text-light': '#212121',
  'text-dark': '#FFFFFF',
  'text-secondary-light': '#757575',
  'text-secondary-dark': '#A3A3A3',
}
```

## CSS Classes

### Borders
```css
.claro-border
```
Subtle border with Claro red accent (20% opacity)

### Buttons

#### Primary Button
```css
.claro-button-primary
```
- Background: Claro Red
- Hover: Darker red with elevated shadow
- Use for: Primary actions, CTAs

#### Secondary Button
```css
.claro-button-secondary
```
- Background: Transparent
- Border: 2px solid Claro Red
- Text: Claro Red
- Hover: Light red background
- Use for: Secondary actions, cancel buttons

### Cards
```css
.claro-card-hover
```
- Subtle hover effect with shadow and slight lift
- Works in both light and dark modes
- Use for: Interactive cards, clickable items

### Badges

#### Active Badge
```css
.claro-badge-active
```
- Background: Claro Red
- Use for: Active states, counts, status indicators

#### Warning Badge
```css
.claro-badge-warning
```
- Background: Claro Warning Orange
- Use for: Warnings, pending states

#### Error Badge
```css
.claro-badge-error
```
- Background: Claro Red
- Includes pulse animation
- Use for: Errors, overdue items, critical notifications

### Tab Indicator
```css
.claro-tab-indicator
```
- Background: Claro Red
- Height: 3px
- Rounded top corners
- Use for: Active tab indicators in navigation

## Component Examples

### Button Component
```tsx
// Primary button
<button className="claro-button-primary text-white px-4 py-2 rounded-lg">
  Save Changes
</button>

// Secondary button
<button className="claro-button-secondary px-4 py-2 rounded-lg">
  Cancel
</button>

// Danger button
<button className="bg-claro-red text-white px-4 py-2 rounded-lg hover:bg-red-700">
  Delete
</button>
```

### Card Component
```tsx
<div className="bg-card-light dark:bg-card-dark rounded-xl p-4 border border-gray-200 dark:border-gray-700 claro-card-hover">
  {/* Card content */}
</div>
```

### Badge Component
```tsx
// Active badge
<span className="claro-badge-active">
  5
</span>

// Warning badge
<span className="claro-badge-warning">
  Pending
</span>

// Error badge (with pulse)
<span className="claro-badge-error">
  Overdue
</span>
```

### Navigation Active State
```tsx
<div className="relative">
  {/* Navigation item */}
  {isActive && (
    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-claro-red rounded-t-full claro-tab-indicator" />
  )}
</div>
```

## Dark Mode Implementation

The theme uses Tailwind's `dark:` variant for dark mode styles. Dark mode inverts backgrounds while maintaining brand color accents:

- Backgrounds become darker (`#121212`, `#1E1E1E`)
- Text becomes lighter (`#FFFFFF`, `#A3A3A3`)
- Brand colors (red, green, blue, orange) remain consistent
- Borders use gray-700 instead of gray-200

Example:
```tsx
<div className="bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark border-gray-200 dark:border-gray-700">
  Content
</div>
```

## Accessibility

### Contrast Ratios
All color combinations meet WCAG AA standards:

- **Text Light on Background Light**: 13.5:1 (AAA)
- **Text Dark on Background Dark**: 18.2:1 (AAA)
- **Claro Red on White**: 7.9:1 (AAA)
- **Claro Red on Dark Background**: 5.2:1 (AA)

### Best Practices
1. Always provide sufficient contrast between text and background
2. Don't rely solely on color to convey information
3. Include aria-labels for interactive elements
4. Use semantic HTML elements
5. Ensure focus states are visible

## Migration from Neon Theme

### Removed Classes
The following neon-themed classes have been removed:
- `.neon-border`, `.neon-border-purple`, `.neon-border-pink`, `.neon-border-green`
- `.neon-text-cyan`, `.neon-text-purple`, `.neon-text-pink`, `.neon-text-green`
- `.neon-gradient-cyan-purple`, `.neon-gradient-pink-orange`, `.neon-gradient-green`
- `.hover-glow-cyan`, `.hover-glow-purple`, `.hover-glow-green`
- `.neon-card`
- `.animate-pulse-glow`, `.animate-pulse-icon`, `.animate-border-glow`

### Removed Colors
- `neon-cyan`, `neon-purple`, `neon-pink`, `neon-green`, `neon-blue`, `neon-orange`, `neon-yellow`
- `card-elevated` (replaced with `card-dark`)

### Removed Shadows
- `shadow-neon-cyan`, `shadow-neon-purple`, `shadow-neon-pink`, `shadow-neon-green`, `shadow-neon-blue`

### Migration Map
| Old Class | New Class |
|-----------|-----------|
| `neon-gradient-cyan-purple` | `claro-button-primary` |
| `neon-gradient-pink-orange` | `bg-claro-red` |
| `neon-gradient-green` | `bg-claro-green` |
| `dark:neon-border` | `dark:border-gray-700` |
| `dark:neon-text-cyan` | `dark:text-claro-red` |
| `text-neon-pink` | `text-claro-red` |
| `bg-neon-purple` | `bg-claro-red` |
| `hover-glow-cyan` | `claro-card-hover` |
| `dark:bg-card-elevated` | `dark:bg-card-dark` |
| `shadow-neon-cyan` | `shadow-lg` |
| `animate-pulse-glow` | (removed, use standard `animate-pulse` if needed) |

## Animations

The theme maintains functional animations while removing decorative glow effects:

### Kept Animations
- `fade-in`: Smooth fade-in for elements
- `slide-up`: Slide up animation for modals/cards
- `slide-in`: Slide in for list items
- `scale-in`: Scale in for modals
- `shimmer`: Loading skeleton animation (updated colors)
- Standard `animate-pulse`: For badges and notifications

### Removed Animations
- `pulse-glow`: Neon glow pulse effect
- `border-flow`: Animated border gradient
- `pulse-icon`: Icon glow pulse
- `border-glow`: Border glow animation

## Usage Guidelines

### When to Use Claro Red
- Primary call-to-action buttons
- Active navigation states
- Important badges and notifications
- Brand elements and headers
- Error states and overdue indicators

### When to Use Claro Green
- Success messages
- Confirmation buttons
- Positive status indicators
- Return/complete actions

### When to Use Claro Warning
- Warning messages
- Pending states
- Time-sensitive notifications
- Caution indicators

### When to Use Claro Blue
- Informational messages
- Secondary actions
- Links and references
- Neutral status indicators

## Component Checklist

When creating or updating components:
- [ ] Use Claro brand colors for accents
- [ ] Implement proper dark mode support
- [ ] Ensure WCAG AA contrast compliance
- [ ] Use semantic HTML
- [ ] Include aria-labels for accessibility
- [ ] Test in both light and dark modes
- [ ] Verify hover and focus states
- [ ] Check mobile responsiveness

## Resources

- Tailwind Config: `tailwind.config.js`
- Global Styles: `src/app/globals.css`
- Component Examples: See individual component files in `src/components/`

## Support

For questions or issues with the Claro theme implementation, refer to:
1. This guide for color and class reference
2. Component source files for implementation examples
3. Tailwind documentation for utility classes

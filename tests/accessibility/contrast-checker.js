/**
 * Accessibility Contrast Checker for Claro Theme
 * Verifies WCAG AA compliance for all color combinations
 */

/**
 * Calculate relative luminance of a color
 * Formula from WCAG 2.1: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function getLuminance(hexColor) {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  const [rs, gs, bs] = [r, g, b].map(c => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * Formula from WCAG 2.1: https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */
function getContrastRatio(color1, color2) {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Test all Claro theme color combinations
 */
function testClaroThemeContrast() {
  console.log('🎨 Claro Theme Accessibility Contrast Testing\n');
  console.log('='.repeat(80));
  
  const colorPairs = [
    // Light Theme - Text on Backgrounds
    {
      name: 'Text Light on Background Light',
      foreground: '#212121',
      background: '#F4F4F4',
      requirement: 'AA',
      minRatio: 4.5
    },
    {
      name: 'Text Secondary Light on Background Light',
      foreground: '#757575',
      background: '#F4F4F4',
      requirement: 'AA',
      minRatio: 4.5
    },
    {
      name: 'Text Light on Card Light',
      foreground: '#212121',
      background: '#FFFFFF',
      requirement: 'AA',
      minRatio: 4.5
    },
    
    // Dark Theme - Text on Backgrounds
    {
      name: 'Text Dark on Background Dark',
      foreground: '#FFFFFF',
      background: '#121212',
      requirement: 'AA',
      minRatio: 4.5
    },
    {
      name: 'Text Secondary Dark on Background Dark',
      foreground: '#A3A3A3',
      background: '#121212',
      requirement: 'AA',
      minRatio: 4.5
    },
    {
      name: 'Text Dark on Card Dark',
      foreground: '#FFFFFF',
      background: '#1E1E1E',
      requirement: 'AA',
      minRatio: 4.5
    },
    
    // Claro Red on Light Backgrounds
    {
      name: 'Claro Red on White (Buttons)',
      foreground: '#E30613',
      background: '#FFFFFF',
      requirement: 'AA',
      minRatio: 3 // UI components need 3:1
    },
    {
      name: 'White Text on Claro Red (Button Text)',
      foreground: '#FFFFFF',
      background: '#E30613',
      requirement: 'AA',
      minRatio: 4.5
    },
    {
      name: 'Claro Red on Background Light',
      foreground: '#E30613',
      background: '#F4F4F4',
      requirement: 'AA',
      minRatio: 3
    },
    
    // Claro Red on Dark Backgrounds
    {
      name: 'Claro Red on Background Dark',
      foreground: '#E30613',
      background: '#121212',
      requirement: 'AA',
      minRatio: 3
    },
    {
      name: 'Claro Red on Card Dark',
      foreground: '#E30613',
      background: '#1E1E1E',
      requirement: 'AA',
      minRatio: 3
    },
    
    // Accent Colors on Light Backgrounds
    {
      name: 'Claro Green on White',
      foreground: '#4CAF50',
      background: '#FFFFFF',
      requirement: 'AA',
      minRatio: 3
    },
    {
      name: 'Claro Warning on White',
      foreground: '#FF9800',
      background: '#FFFFFF',
      requirement: 'AA',
      minRatio: 3
    },
    {
      name: 'Claro Blue on White',
      foreground: '#1976D2',
      background: '#FFFFFF',
      requirement: 'AA',
      minRatio: 3
    },
    
    // Accent Colors on Dark Backgrounds
    {
      name: 'Claro Green on Background Dark',
      foreground: '#4CAF50',
      background: '#121212',
      requirement: 'AA',
      minRatio: 3
    },
    {
      name: 'Claro Warning on Background Dark',
      foreground: '#FF9800',
      background: '#121212',
      requirement: 'AA',
      minRatio: 3
    },
    {
      name: 'Claro Blue on Background Dark',
      foreground: '#1976D2',
      background: '#121212',
      requirement: 'AA',
      minRatio: 3
    }
  ];

  let passCount = 0;
  let failCount = 0;
  const failures = [];

  colorPairs.forEach(pair => {
    const ratio = getContrastRatio(pair.foreground, pair.background);
    const passes = ratio >= pair.minRatio;
    const status = passes ? '✅ PASS' : '❌ FAIL';
    
    if (passes) {
      passCount++;
    } else {
      failCount++;
      failures.push(pair.name);
    }

    console.log(`\n${status} ${pair.name}`);
    console.log(`  Foreground: ${pair.foreground}`);
    console.log(`  Background: ${pair.background}`);
    console.log(`  Contrast Ratio: ${ratio.toFixed(2)}:1`);
    console.log(`  Required: ${pair.minRatio}:1 (WCAG ${pair.requirement})`);
    
    if (ratio >= 7) {
      console.log(`  ⭐ Exceeds AAA standard (7:1)`);
    } else if (ratio >= 4.5 && pair.minRatio === 4.5) {
      console.log(`  ✓ Meets AA standard for normal text`);
    } else if (ratio >= 3 && pair.minRatio === 3) {
      console.log(`  ✓ Meets AA standard for UI components`);
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 Summary:`);
  console.log(`  Total Tests: ${colorPairs.length}`);
  console.log(`  Passed: ${passCount} ✅`);
  console.log(`  Failed: ${failCount} ❌`);
  
  if (failCount > 0) {
    console.log(`\n⚠️  Failed Tests:`);
    failures.forEach(name => console.log(`  - ${name}`));
  } else {
    console.log(`\n🎉 All contrast tests passed! Theme is WCAG AA compliant.`);
  }
  
  console.log('\n' + '='.repeat(80));
  
  return failCount === 0;
}

// Run tests
testClaroThemeContrast();

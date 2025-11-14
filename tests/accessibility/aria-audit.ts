/**
 * ARIA Attributes Audit for Claro Theme Components
 * Checks for proper accessibility attributes in components
 */

import * as fs from 'fs';
import * as path from 'path';

interface AuditResult {
  file: string;
  issues: string[];
  warnings: string[];
  passed: string[];
}

/**
 * Check if a component file has proper ARIA attributes
 */
function auditComponentFile(filePath: string): AuditResult {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath);
  
  const result: AuditResult = {
    file: fileName,
    issues: [],
    warnings: [],
    passed: []
  };

  // Check for interactive elements without aria-label
  const interactivePatterns = [
    { pattern: /<button[^>]*>/g, name: 'button' },
    { pattern: /<a[^>]*>/g, name: 'link' },
    { pattern: /<input[^>]*>/g, name: 'input' },
    { pattern: /role="button"/g, name: 'role=button' }
  ];

  interactivePatterns.forEach(({ pattern, name }) => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const hasAriaLabel = /aria-label=/.test(match);
        const hasAriaLabelledBy = /aria-labelledby=/.test(match);
        const hasVisibleText = /<button[^>]*>[^<]+<\/button>/.test(match);
        const hasTitle = /title=/.test(match);
        
        if (!hasAriaLabel && !hasAriaLabelledBy && !hasVisibleText && !hasTitle) {
          if (name === 'button' && /onClick/.test(match)) {
            result.warnings.push(`${name} without accessible label found`);
          }
        } else {
          result.passed.push(`${name} has accessible label`);
        }
      });
    }
  });

  // Check for navigation elements with aria-current
  if (content.includes('navigation') || content.includes('nav')) {
    if (content.includes('aria-current')) {
      result.passed.push('Navigation uses aria-current for active state');
    } else {
      result.warnings.push('Navigation may need aria-current for active items');
    }
  }

  // Check for color-only state indicators
  const colorOnlyPatterns = [
    /className="[^"]*text-claro-red[^"]*"/g,
    /className="[^"]*bg-claro-red[^"]*"/g,
    /className="[^"]*text-claro-green[^"]*"/g,
    /className="[^"]*bg-claro-green[^"]*"/g
  ];

  let hasColorStates = false;
  colorOnlyPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      hasColorStates = true;
    }
  });

  if (hasColorStates) {
    // Check if there are also icons or text indicators
    const hasIcons = /Icon|icon|svg/.test(content);
    const hasStatusText = /status|state|active|inactive/i.test(content);
    
    if (hasIcons || hasStatusText) {
      result.passed.push('Color states supplemented with icons or text');
    } else {
      result.warnings.push('Color-based states should include icons or text for accessibility');
    }
  }

  // Check for images without alt text
  const imgMatches = content.match(/<img[^>]*>/g);
  if (imgMatches) {
    imgMatches.forEach(match => {
      if (!/alt=/.test(match)) {
        result.issues.push('Image without alt attribute found');
      } else {
        result.passed.push('Image has alt attribute');
      }
    });
  }

  // Check for form inputs with labels
  const inputMatches = content.match(/<input[^>]*>/g);
  if (inputMatches) {
    const hasLabel = /<label/.test(content);
    const hasAriaLabel = /aria-label/.test(content);
    
    if (!hasLabel && !hasAriaLabel) {
      result.warnings.push('Form inputs should have associated labels');
    } else {
      result.passed.push('Form inputs have labels');
    }
  }

  // Check for proper heading hierarchy
  const headings = content.match(/<h[1-6]/g);
  if (headings && headings.length > 0) {
    result.passed.push('Component uses semantic headings');
  }

  return result;
}

/**
 * Audit all component files
 */
export function auditAllComponents(): void {
  console.log('♿ Claro Theme ARIA Attributes Audit\n');
  console.log('='.repeat(80));

  const componentsToAudit = [
    'src/components/ui/Button.tsx',
    'src/components/dashboard/MobileHeader.tsx',
    'src/components/dashboard/ActiveLoansSection.tsx',
    'src/components/dashboard/LoanCard.tsx',
    'src/components/dashboard/BottomNavigation.tsx',
    'src/components/layout/Header.tsx',
    'src/components/layout/MobileNavigation.tsx'
  ];

  const results: AuditResult[] = [];
  let totalIssues = 0;
  let totalWarnings = 0;
  let totalPassed = 0;

  componentsToAudit.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const result = auditComponentFile(filePath);
      results.push(result);
      totalIssues += result.issues.length;
      totalWarnings += result.warnings.length;
      totalPassed += result.passed.length;

      console.log(`\n📄 ${result.file}`);
      
      if (result.issues.length > 0) {
        console.log(`  ❌ Issues (${result.issues.length}):`);
        result.issues.forEach(issue => console.log(`    - ${issue}`));
      }
      
      if (result.warnings.length > 0) {
        console.log(`  ⚠️  Warnings (${result.warnings.length}):`);
        result.warnings.forEach(warning => console.log(`    - ${warning}`));
      }
      
      if (result.passed.length > 0) {
        console.log(`  ✅ Passed (${result.passed.length}):`);
        result.passed.forEach(pass => console.log(`    - ${pass}`));
      }
      
      if (result.issues.length === 0 && result.warnings.length === 0) {
        console.log(`  ✅ No accessibility issues found`);
      }
    } else {
      console.log(`\n⚠️  File not found: ${filePath}`);
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 Summary:`);
  console.log(`  Components Audited: ${results.length}`);
  console.log(`  Critical Issues: ${totalIssues} ❌`);
  console.log(`  Warnings: ${totalWarnings} ⚠️`);
  console.log(`  Passed Checks: ${totalPassed} ✅`);

  if (totalIssues === 0 && totalWarnings === 0) {
    console.log(`\n🎉 All components pass accessibility audit!`);
  } else if (totalIssues === 0) {
    console.log(`\n✓ No critical issues, but review warnings for improvements.`);
  } else {
    console.log(`\n⚠️  Please address critical issues before deployment.`);
  }

  console.log('\n' + '='.repeat(80));
}

// Run audit if executed directly
if (require.main === module) {
  auditAllComponents();
}

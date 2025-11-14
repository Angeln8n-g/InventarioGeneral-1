#!/usr/bin/env node

/**
 * Visual Test Runner for Claro Theme
 * 
 * Run this script to execute automated visual tests and generate reports
 */

import { generateContrastReport, runContrastTests, verifyColorConsistency } from './automated-visual-test'
import * as fs from 'fs'
import * as path from 'path'

function main() {
  console.log('🎨 Running Claro Theme Visual Tests...\n')

  // Run contrast tests
  console.log('📊 Running contrast tests...')
  const contrastResults = runContrastTests()
  console.log(`   ✅ Passed: ${contrastResults.passed}`)
  console.log(`   ❌ Failed: ${contrastResults.failed}\n`)

  // Generate report
  console.log('📝 Generating contrast report...')
  const report = generateContrastReport()
  
  // Save report
  const reportPath = path.join(__dirname, 'CONTRAST_TEST_REPORT.md')
  fs.writeFileSync(reportPath, report)
  console.log(`   Report saved to: ${reportPath}\n`)

  // Verify color consistency
  console.log('🔍 Verifying color consistency...')
  const consistency = verifyColorConsistency()
  if (consistency.consistent) {
    console.log('   ✅ All colors are consistent\n')
  } else {
    console.log('   ⚠️  Issues found:')
    consistency.issues.forEach((issue) => {
      console.log(`      - ${issue}`)
    })
    console.log('')
  }

  // Print summary
  console.log('📋 Summary:')
  console.log('─'.repeat(50))
  console.log(`Total Contrast Tests: ${contrastResults.passed + contrastResults.failed}`)
  console.log(`Passed: ${contrastResults.passed}`)
  console.log(`Failed: ${contrastResults.failed}`)
  console.log(`Success Rate: ${((contrastResults.passed / (contrastResults.passed + contrastResults.failed)) * 100).toFixed(1)}%`)
  console.log('─'.repeat(50))

  // Exit with appropriate code
  if (contrastResults.failed > 0 || !consistency.consistent) {
    console.log('\n⚠️  Some tests failed. Please review the report.')
    process.exit(1)
  } else {
    console.log('\n✅ All tests passed!')
    process.exit(0)
  }
}

main()

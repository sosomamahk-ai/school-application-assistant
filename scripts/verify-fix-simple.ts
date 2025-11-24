/**
 * Simple Verification Script: Check code fixes without database connection
 * 
 * This script verifies that the code fixes are correctly implemented
 * by checking the logic in the source files.
 */

import * as fs from 'fs';
import * as path from 'path';

interface VerificationResult {
  file: string;
  check: string;
  passed: boolean;
  message: string;
}

const results: VerificationResult[] = [];

function addCheck(file: string, check: string, passed: boolean, message: string) {
  results.push({ file, check, passed, message });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} [${file}] ${check}: ${message}`);
}

function verifyCreateFromProfile() {
  const filePath = path.join(__dirname, '../src/pages/api/admin/templates/create-from-profile.ts');
  const content = fs.readFileSync(filePath, 'utf-8');

  // Check 1: finalCategory is initialized with default value
  if (content.includes('let finalCategory: string = \'国际学校\'')) {
    addCheck(
      'create-from-profile.ts',
      'finalCategory initialization',
      true,
      'finalCategory is initialized with default value'
    );
  } else {
    addCheck(
      'create-from-profile.ts',
      'finalCategory initialization',
      false,
      'finalCategory may not be initialized with default value'
    );
  }

  // Check 2: Multiple fallback strategies
  const hasAccurateCategory = content.includes('if (accurateCategory)');
  const hasProfileCategory = content.includes('else if (profile.category)');
  const hasSchoolIdExtraction = content.includes('schoolIdMatch');

  if (hasAccurateCategory && hasProfileCategory && hasSchoolIdExtraction) {
    addCheck(
      'create-from-profile.ts',
      'Fallback strategies',
      true,
      'Multiple fallback strategies implemented'
    );
  } else {
    addCheck(
      'create-from-profile.ts',
      'Fallback strategies',
      false,
      'Missing some fallback strategies'
    );
  }

  // Check 3: Category is set in create statement
  if (content.includes('category: finalCategory')) {
    addCheck(
      'create-from-profile.ts',
      'Category assignment',
      true,
      'Category is assigned in template creation'
    );
  } else {
    addCheck(
      'create-from-profile.ts',
      'Category assignment',
      false,
      'Category may not be assigned in template creation'
    );
  }
}

function verifyTemplatesIndex() {
  const filePath = path.join(__dirname, '../src/pages/api/templates/index.ts');
  const content = fs.readFileSync(filePath, 'utf-8');

  // Check 1: Fallback logic for null category
  if (content.includes('if (!finalCategory)')) {
    addCheck(
      'templates/index.ts',
      'Null category check',
      true,
      'Null category check implemented'
    );
  } else {
    addCheck(
      'templates/index.ts',
      'Null category check',
      false,
      'Null category check may be missing'
    );
  }

  // Check 2: Extract from schoolId
  if (content.includes('extractCategoryFromSchoolId')) {
    addCheck(
      'templates/index.ts',
      'SchoolId extraction',
      true,
      'Category extraction from schoolId implemented'
    );
  } else {
    addCheck(
      'templates/index.ts',
      'SchoolId extraction',
      false,
      'Category extraction from schoolId may be missing'
    );
  }

  // Check 3: Final fallback to default
  if (content.includes('finalCategory = \'国际学校\'')) {
    addCheck(
      'templates/index.ts',
      'Default fallback',
      true,
      'Default fallback to \'国际学校\' implemented'
    );
  } else {
    addCheck(
      'templates/index.ts',
      'Default fallback',
      false,
      'Default fallback may be missing'
    );
  }

  // Check 4: Warning log for null category
  if (content.includes('console.warn') && content.includes('null category')) {
    addCheck(
      'templates/index.ts',
      'Warning logging',
      true,
      'Warning log for null category implemented'
    );
  } else {
    addCheck(
      'templates/index.ts',
      'Warning logging',
      false,
      'Warning log for null category may be missing'
    );
  }
}

function verifyBackfillScript() {
  const filePath = path.join(__dirname, 'backfill-template-category.ts');
  
  if (fs.existsSync(filePath)) {
    addCheck(
      'backfill-template-category.ts',
      'Script exists',
      true,
      'Backfill script exists'
    );
  } else {
    addCheck(
      'backfill-template-category.ts',
      'Script exists',
      false,
      'Backfill script not found'
    );
  }
}

function verifyTestScript() {
  const filePath = path.join(__dirname, 'test-template-category-fix.ts');
  
  if (fs.existsSync(filePath)) {
    addCheck(
      'test-template-category-fix.ts',
      'Script exists',
      true,
      'Test script exists'
    );
  } else {
    addCheck(
      'test-template-category-fix.ts',
      'Script exists',
      false,
      'Test script not found'
    );
  }
}

function runVerification() {
  console.log('🔍 Verifying Code Fixes\n');
  console.log('='.repeat(60));

  verifyCreateFromProfile();
  verifyTemplatesIndex();
  verifyBackfillScript();
  verifyTestScript();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Verification Summary');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`Total checks: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log('\n❌ Failed checks:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - [${r.file}] ${r.check}: ${r.message}`);
    });
  }

  console.log('\n' + '='.repeat(60));

  if (failed === 0) {
    console.log('🎉 All code checks passed!');
    console.log('\n✅ Code fixes are correctly implemented.');
    console.log('📝 Next steps:');
    console.log('   1. Run database backfill: npm run backfill:template-category');
    console.log('   2. Test with real database: npm run test:template-category');
    console.log('   3. Deploy to production');
    return 0;
  } else {
    console.log('⚠️  Some checks failed. Please review the code.');
    return 1;
  }
}

// Run verification
if (require.main === module) {
  const exitCode = runVerification();
  process.exit(exitCode);
}

export { runVerification };


/**
 * Test Script: Verify Template Category Fix
 * 
 * This script tests that:
 * 1. Templates are created with non-null category
 * 2. Templates with null category can be read with fallback logic
 * 
 * Usage:
 *   npx ts-node scripts/test-template-category-fix.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function addTest(name: string, passed: boolean, message: string) {
  results.push({ name, passed, message });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}: ${message}`);
}

async function testTemplateCategoryCreation() {
  console.log('\n📝 Test 1: Template Creation with Category\n');

  // Get a sample template to check
  const sampleTemplate = await prisma.schoolFormTemplate.findFirst({
    where: { isActive: true },
    select: {
      id: true,
      schoolId: true,
      category: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!sampleTemplate) {
    addTest(
      'Template Creation',
      false,
      'No templates found in database. Cannot test creation.'
    );
    return;
  }

  // Check if category is set
  if (sampleTemplate.category === null) {
    addTest(
      'Template Creation - Category Not Null',
      false,
      `Template ${sampleTemplate.id} (${sampleTemplate.schoolId}) has null category`
    );
  } else {
    addTest(
      'Template Creation - Category Not Null',
      true,
      `Template ${sampleTemplate.id} has category: ${sampleTemplate.category}`
    );
  }

  // Check if category is a valid value
  const validCategories = ['国际学校', '本地中学', '本地小学', '幼稚园', '大学'];
  if (sampleTemplate.category && validCategories.includes(sampleTemplate.category)) {
    addTest(
      'Template Creation - Valid Category',
      true,
      `Category "${sampleTemplate.category}" is valid`
    );
  } else if (sampleTemplate.category) {
    addTest(
      'Template Creation - Valid Category',
      false,
      `Category "${sampleTemplate.category}" is not in valid list: ${validCategories.join(', ')}`
    );
  }
}

async function testTemplateCategoryRead() {
  console.log('\n📖 Test 2: Template Read with Fallback\n');

  // Get all templates
  const allTemplates = await prisma.schoolFormTemplate.findMany({
    where: { isActive: true },
    select: {
      id: true,
      schoolId: true,
      category: true
    }
  });

  if (allTemplates.length === 0) {
    addTest(
      'Template Read',
      false,
      'No templates found in database'
    );
    return;
  }

  // Count templates with null category
  const nullCategoryCount = allTemplates.filter(t => t.category === null).length;
  const nonNullCategoryCount = allTemplates.length - nullCategoryCount;

  addTest(
    'Template Read - Category Statistics',
    true,
    `${nonNullCategoryCount}/${allTemplates.length} templates have category set (${nullCategoryCount} with null)`
  );

  // Test fallback logic for templates with null category
  if (nullCategoryCount > 0) {
    const templatesWithNull = allTemplates.filter(t => t.category === null);
    console.log(`\n⚠️  Found ${nullCategoryCount} templates with null category. Testing fallback logic...\n`);

    templatesWithNull.slice(0, 5).forEach(template => {
      // Test schoolId extraction
      const match = template.schoolId.match(/-([a-z]{2})-\d{4}$/);
      if (match) {
        const abbr = match[1];
        const abbrMap: Record<string, string> = {
          'is': '国际学校',
          'ls': '本地中学',
          'lp': '本地小学',
          'kg': '幼稚园',
          'un': '大学'
        };
        const extractedCategory = abbrMap[abbr];
        if (extractedCategory) {
          addTest(
            `Fallback - Extract from schoolId (${template.schoolId})`,
            true,
            `Can extract category "${extractedCategory}" from schoolId format`
          );
        } else {
          addTest(
            `Fallback - Extract from schoolId (${template.schoolId})`,
            false,
            `Unknown abbreviation "${abbr}" in schoolId`
          );
        }
      } else {
        addTest(
          `Fallback - Extract from schoolId (${template.schoolId})`,
          false,
          `SchoolId "${template.schoolId}" does not match expected format`
        );
      }
    });
  } else {
    addTest(
      'Template Read - All Templates Have Category',
      true,
      'All templates have category set. No fallback needed.'
    );
  }
}

async function testCategoryConsistency() {
  console.log('\n🔍 Test 3: Category Consistency\n');

  // Get all templates
  const allTemplates = await prisma.schoolFormTemplate.findMany({
    where: { isActive: true },
    select: {
      id: true,
      schoolId: true,
      category: true
    }
  });

  const validCategories = ['国际学校', '本地中学', '本地小学', '幼稚园', '大学'];
  const invalidCategories: string[] = [];

  allTemplates.forEach(template => {
    if (template.category && !validCategories.includes(template.category)) {
      invalidCategories.push(`${template.schoolId}: "${template.category}"`);
    }
  });

  if (invalidCategories.length > 0) {
    addTest(
      'Category Consistency',
      false,
      `Found ${invalidCategories.length} templates with invalid categories: ${invalidCategories.slice(0, 3).join(', ')}`
    );
  } else {
    addTest(
      'Category Consistency',
      true,
      `All ${allTemplates.length} templates have valid categories`
    );
  }
}

async function runTests() {
  console.log('🧪 Running Template Category Fix Tests\n');
  console.log('='.repeat(60));

  try {
    await testTemplateCategoryCreation();
    await testTemplateCategoryRead();
    await testCategoryConsistency();

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Summary');
    console.log('='.repeat(60));

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const total = results.length;

    console.log(`Total tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);

    if (failed > 0) {
      console.log('\n❌ Failed tests:');
      results.filter(r => !r.passed).forEach(r => {
        console.log(`  - ${r.name}: ${r.message}`);
      });
    }

    console.log('\n' + '='.repeat(60));

    if (failed === 0) {
      console.log('🎉 All tests passed!');
      return 0;
    } else {
      console.log('⚠️  Some tests failed. Please review the results above.');
      return 1;
    }
  } catch (error: any) {
    console.error('\n💥 Test execution failed:', error);
    return 1;
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
if (require.main === module) {
  runTests()
    .then((exitCode) => {
      process.exit(exitCode);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { runTests };


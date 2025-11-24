/**
 * Database Backfill Script: Fix null category in SchoolFormTemplate
 * 
 * This script backfills the category field for templates that have null category.
 * It uses the same fallback logic as the API:
 * 1. Extract from schoolId format (for new standardized format)
 * 2. Try to get from WordPress data via /api/wordpress/school-profiles
 * 3. Fallback to default '国际学校'
 * 
 * Usage:
 *   npx ts-node scripts/backfill-template-category.ts
 * 
 * Or with tsx:
 *   npx tsx scripts/backfill-template-category.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to extract category from schoolId (for new format: {name_short}-{category_abbr}-{year})
const extractCategoryFromSchoolId = (schoolId: string): string | null => {
  const match = schoolId.match(/-([a-z]{2})-\d{4}$/);
  if (match) {
    const abbr = match[1];
    const abbrMap: Record<string, string> = {
      'is': '国际学校',
      'ls': '本地中学',
      'lp': '本地小学',
      'kg': '幼稚园',
      'un': '大学'
    };
    return abbrMap[abbr] || null;
  }
  return null;
};

// Get category mapping from WordPress API
async function getWordPressCategoryMap(): Promise<Map<string, string>> {
  const categoryMap = new Map<string, string>();
  
  try {
    // Determine base URL
    let baseUrl = 'http://localhost:3000';
    if (process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    } else if (process.env.NEXT_PUBLIC_APP_URL) {
      baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    }
    
    const url = `${baseUrl}/api/wordpress/school-profiles`;
    console.log(`[backfill] Fetching WordPress category map from ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-Internal-Request': 'true'
      }
    });

    if (!response.ok) {
      console.warn(`[backfill] Failed to fetch from WordPress API: ${response.status}`);
      return categoryMap;
    }

    const data = await response.json();
    if (!data.success || !data.profiles) {
      console.warn('[backfill] Invalid response from WordPress API');
      return categoryMap;
    }

    // Extract templateId -> profileType mapping
    Object.values(data.profiles).forEach((profileGroup: any) => {
      if (Array.isArray(profileGroup)) {
        profileGroup.forEach((profile: any) => {
          if (profile.templateId && profile.profileType) {
            categoryMap.set(profile.templateId, profile.profileType);
          }
        });
      }
    });

    console.log(`[backfill] ✅ Built WordPress category map with ${categoryMap.size} entries`);
  } catch (error: any) {
    console.error('[backfill] Failed to build WordPress category map:', error.message);
  }
  
  return categoryMap;
}

async function backfillTemplateCategories() {
  console.log('🚀 Starting template category backfill...\n');

  try {
    // Find all templates with null category
    const templatesWithNullCategory = await prisma.schoolFormTemplate.findMany({
      where: {
        category: null
      },
      select: {
        id: true,
        schoolId: true,
        category: true
      }
    });

    console.log(`📊 Found ${templatesWithNullCategory.length} templates with null category\n`);

    if (templatesWithNullCategory.length === 0) {
      console.log('✅ No templates need backfilling. All templates have category set.');
      return;
    }

    // Get WordPress category map
    const wpCategoryMap = await getWordPressCategoryMap();

    let updatedCount = 0;
    let skippedCount = 0;
    const updateResults: Array<{ id: string; schoolId: string; oldCategory: null; newCategory: string; source: string }> = [];

    // Process each template
    for (const template of templatesWithNullCategory) {
      let newCategory: string | null = null;
      let source = '';

      // Strategy 1: Extract from schoolId format
      const extractedCategory = extractCategoryFromSchoolId(template.schoolId);
      if (extractedCategory) {
        newCategory = extractedCategory;
        source = 'schoolId_format';
      }
      // Strategy 2: Try WordPress lookup
      else {
        const wpCategory = wpCategoryMap.get(template.schoolId);
        if (wpCategory) {
          newCategory = wpCategory;
          source = 'wordpress_api';
        }
      }

      // Strategy 3: Fallback to default
      if (!newCategory) {
        newCategory = '国际学校';
        source = 'default_fallback';
      }

      // Update the template
      try {
        await prisma.schoolFormTemplate.update({
          where: { id: template.id },
          data: { category: newCategory }
        });

        updatedCount++;
        updateResults.push({
          id: template.id,
          schoolId: template.schoolId,
          oldCategory: null,
          newCategory,
          source
        });

        console.log(`✅ Updated template ${template.id} (${template.schoolId}): ${newCategory} [${source}]`);
      } catch (error: any) {
        console.error(`❌ Failed to update template ${template.id}:`, error.message);
        skippedCount++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📈 Backfill Summary:');
    console.log('='.repeat(60));
    console.log(`Total templates with null category: ${templatesWithNullCategory.length}`);
    console.log(`Successfully updated: ${updatedCount}`);
    console.log(`Failed/Skipped: ${skippedCount}`);
    console.log('\nCategory sources:');
    
    const sourceStats: Record<string, number> = {};
    updateResults.forEach(r => {
      sourceStats[r.source] = (sourceStats[r.source] || 0) + 1;
    });
    Object.entries(sourceStats).forEach(([source, count]) => {
      console.log(`  ${source}: ${count}`);
    });

    console.log('\n✅ Backfill completed successfully!');
  } catch (error: any) {
    console.error('❌ Backfill failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the backfill
if (require.main === module) {
  backfillTemplateCategories()
    .then(() => {
      console.log('\n🎉 Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}

export { backfillTemplateCategories };


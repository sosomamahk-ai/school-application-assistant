import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { deserializeSchoolName } from '@/utils/templates';
import { parseWordPressTemplateId } from '@/services/wordpressSchoolService';

// Helper function to get templateId -> category mapping from /api/wordpress/school-profiles processed data
// This uses the same data source that the template list page uses
async function getTemplateCategoryMap(): Promise<Map<string, string>> {
  const categoryMap = new Map<string, string>();
  
  try {
    // Call /api/wordpress/school-profiles internally to get processed data
    // For server-side calls, use absolute URL
    let baseUrl = 'http://localhost:3000';
    if (process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    } else if (process.env.NEXT_PUBLIC_APP_URL) {
      baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    }
    
    const url = `${baseUrl}/api/wordpress/school-profiles`;
    console.log(`[api/templates] Fetching from ${url}`);
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        // Add a special header to indicate this is an internal call
        'X-Internal-Request': 'true'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[api/templates] Failed to fetch from /api/wordpress/school-profiles: ${response.status} ${response.statusText}`);
      return categoryMap;
    }

    const data = await response.json();
    if (!data.success || !data.profiles) {
      console.warn('[api/templates] Invalid response from /api/wordpress/school-profiles:', data);
      return categoryMap;
    }

    // Extract templateId -> profileType mapping from the grouped profiles
    // The data.profiles is an object with keys like '国际学校', '本地中学', etc.
    Object.values(data.profiles).forEach((profileGroup: any) => {
      if (Array.isArray(profileGroup)) {
        profileGroup.forEach((profile: any) => {
          // Each profile has templateId and profileType (already processed by /api/wordpress/school-profiles)
          if (profile.templateId && profile.profileType) {
            categoryMap.set(profile.templateId, profile.profileType);
            console.log(`[api/templates] Mapped template ${profile.templateId} -> ${profile.profileType}`);
          }
        });
      }
    });

    console.log(`[api/templates] ✅ Built category map with ${categoryMap.size} entries from /api/wordpress/school-profiles`);
  } catch (error: any) {
    if (error.name === 'TimeoutError') {
      console.error('[api/templates] Timeout while fetching from /api/wordpress/school-profiles');
    } else {
      console.error('[api/templates] Failed to build template category map from /api/wordpress/school-profiles:', error);
    }
  }
  
  return categoryMap;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const { schoolId } = req.query;

      // If schoolId is provided, get specific template (including inactive ones for main template)
      if (schoolId && typeof schoolId === 'string') {
        const template = await prisma.schoolFormTemplate.findUnique({
          where: { schoolId },
          select: {
            id: true,
            schoolId: true,
            schoolName: true,
            program: true,
            description: true,
            category: true,
            fieldsData: true,
            applicationStartDate: true,
            applicationEndDate: true,
            school: {
              select: {
                nameShort: true,
                permalink: true
              }
            }
          }
        });

        if (!template) {
          return res.status(404).json({ error: 'Template not found' });
        }

        return res.status(200).json({
          success: true,
          template: {
            id: template.id,
            schoolId: template.schoolId,
            schoolName: deserializeSchoolName(template.schoolName),
            program: template.program,
            description: template.description,
            category: template.category,
            fields: template.fieldsData,
            applicationStartDate: template.applicationStartDate,
            applicationEndDate: template.applicationEndDate,
            nameShort: template.school?.nameShort || null,
            permalink: template.school?.permalink || null
          }
        });
      }

      // Get all active templates
      // Simplified: only check isActive status, don't validate fieldsData structure
      // This ensures all enabled templates are shown in the school list
      const templates = await prisma.schoolFormTemplate.findMany({
        where: { 
          isActive: true
        },
        select: {
          id: true,
          schoolId: true,
          schoolName: true,
          program: true,
          description: true,
          category: true,
          fieldsData: true,
          isActive: true,
          applicationStartDate: true,
          applicationEndDate: true,
          school: {
            select: {
              nameShort: true,
              permalink: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Debug logging
      console.log('[api/templates] Query result:', {
        totalCount: templates.length,
        templates: templates.map(t => ({
          id: t.id,
          schoolId: t.schoolId,
          schoolName: t.schoolName,
          isActive: t.isActive,
          category: t.category,
          hasFieldsData: !!t.fieldsData,
          fieldsDataType: Array.isArray(t.fieldsData) ? 'array' : typeof t.fieldsData
        }))
      });

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

      // Build a map of templateId -> category
      // Priority: 1. New format schoolId extraction, 2. /api/wordpress/school-profiles data
      const templateCategoryMap = new Map<string, string>();
      
      // First pass: extract categories from new format schoolIds
      templates.forEach((template) => {
        const extractedCategory = extractCategoryFromSchoolId(template.schoolId);
        if (extractedCategory) {
          templateCategoryMap.set(template.id, extractedCategory);
        }
      });

      // Second pass: get categories from /api/wordpress/school-profiles processed data
      // This uses the same data source that the template list page uses
      const wpCategoryMap = await getTemplateCategoryMap();
      
      // Merge WordPress category map (only for templates not already in map)
      wpCategoryMap.forEach((category, templateId) => {
        if (!templateCategoryMap.has(templateId)) {
          templateCategoryMap.set(templateId, category);
        }
      });

      console.log(`[api/templates] Category map: ${templateCategoryMap.size} templates with categories`);

      // Return all active templates regardless of fieldsData structure
      // This allows templates to be displayed even if fieldsData is empty or has different structures
      const response = {
        success: true,
        templates: templates.map(template => {
          // Ensure schoolName is properly deserialized
          const deserializedName = deserializeSchoolName(template.schoolName);
          
          // Priority for category (defensive fallback chain):
          // 1. Use database category field if it exists and is not null
          // 2. Try to extract from schoolId format (for new standardized format: {name_short}-{category_abbr}-{year})
          // 3. Try WordPress lookup via templateCategoryMap (from /api/wordpress/school-profiles)
          // 4. Fallback to default ('国际学校')
          let finalCategory = template.category;
          
          // Only if category is null in database, try fallback strategies
          if (!finalCategory) {
            // Strategy 1: Extract from schoolId format (most reliable for new templates)
            const extractedCategory = extractCategoryFromSchoolId(template.schoolId);
            if (extractedCategory) {
              finalCategory = extractedCategory;
              console.log(`[api/templates] Template ${template.id} (${template.schoolId}): Extracted category from schoolId: ${extractedCategory}`);
            } 
            // Strategy 2: Try WordPress lookup (for templates created from WordPress profiles)
            else {
              const wpCategory = templateCategoryMap.get(template.id);
              if (wpCategory) {
                finalCategory = wpCategory;
                console.log(`[api/templates] Template ${template.id} (${template.schoolId}): Found category from WordPress: ${wpCategory}`);
              }
            }
          }
          
          // Final fallback: ensure category is never null (defensive programming)
          if (!finalCategory) {
            finalCategory = '国际学校';
            console.warn(`[api/templates] ⚠️ Template ${template.id} (${template.schoolId}) has null category in DB and no fallback found. Using default '国际学校'. This should be fixed by backfill script.`);
          }
          
          // Get nameShort from School table, fallback to WordPress if available
          let nameShort = template.school?.nameShort || null;
          let permalink = template.school?.permalink || null;
          
          // If School record doesn't exist or nameShort is null, try to get from WordPress
          // This is a fallback for templates created before School sync was implemented
          if (!nameShort || !permalink) {
            // Try to parse schoolId to get WordPress ID
            const parsed = parseWordPressTemplateId(template.schoolId);
            if (parsed) {
              // Note: We can't easily fetch WordPress data here without making another API call
              // The nameShort should be synced to School table when template is created
              // For now, we'll just return what's in the School table
            }
          }
          
          return {
            id: template.id,
            schoolId: template.schoolId,
            schoolName: deserializedName,
            program: template.program,
            description: template.description,
            category: finalCategory,
            fields: template.fieldsData,
            applicationStartDate: template.applicationStartDate,
            applicationEndDate: template.applicationEndDate,
            nameShort: nameShort,
            permalink: permalink
          };
        })
      };

      console.log('[api/templates] Response:', {
        success: response.success,
        templateCount: response.templates.length,
        templateIds: response.templates.map(t => t.id),
        schoolNames: response.templates.map(t => ({
          id: t.id,
          schoolName: typeof t.schoolName === 'string' ? t.schoolName : JSON.stringify(t.schoolName),
          schoolNameType: typeof t.schoolName
        }))
      });

      res.status(200).json(response);
    } catch (error) {
      console.error('Templates API error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'POST') {
    try {
      // Create new template (admin function)
      const { schoolId, schoolName, program, description, fields, category } = req.body;

      if (!schoolId || !schoolName || !program || !fields) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Extract category from schoolId if not provided
      let finalCategory = category;
      if (!finalCategory) {
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
          finalCategory = abbrMap[abbr] || '国际学校';
        } else {
          finalCategory = '国际学校'; // Default fallback
        }
      }

      const template = await prisma.schoolFormTemplate.create({
        data: {
          schoolId,
          schoolName,
          program,
          description,
          category: finalCategory, // Always set category to prevent null values
          fieldsData: fields
        }
      });

      res.status(201).json({
        success: true,
        template: {
          id: template.id,
          schoolId: template.schoolId,
          schoolName: template.schoolName,
          program: template.program,
          description: template.description,
          fields: template.fieldsData
        }
      });
    } catch (error) {
      console.error('Template creation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}


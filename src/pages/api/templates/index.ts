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
            fieldsData: true
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
            fields: template.fieldsData
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
          isActive: true
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
          
          // Determine category: use template.category if available and not default, 
          // otherwise use the category from WordPress lookup
          let finalCategory = template.category;
          
          // If category is null or default value, use the one from WordPress lookup
          if (!finalCategory || finalCategory === '国际学校') {
            const wpCategory = templateCategoryMap.get(template.id);
            if (wpCategory) {
              finalCategory = wpCategory;
            }
          }
          
          // Fallback to default if still null
          if (!finalCategory) {
            finalCategory = '国际学校';
          }
          
          return {
            id: template.id,
            schoolId: template.schoolId,
            schoolName: deserializedName,
            program: template.program,
            description: template.description,
            category: finalCategory,
            fields: template.fieldsData
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
      const { schoolId, schoolName, program, description, fields } = req.body;

      if (!schoolId || !schoolName || !program || !fields) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const template = await prisma.schoolFormTemplate.create({
        data: {
          schoolId,
          schoolName,
          program,
          description,
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


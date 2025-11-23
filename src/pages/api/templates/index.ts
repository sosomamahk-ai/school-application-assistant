import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { deserializeSchoolName } from '@/utils/templates';
import { parseWordPressTemplateId } from '@/services/wordpressSchoolService';
import { getWordPressSchools } from '@/services/wordpressSchoolService';

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

      // Get WordPress schools data to enrich category information
      let wordPressSchools: any[] = [];
      try {
        const wpData = await getWordPressSchools({ forceRefresh: false });
        wordPressSchools = wpData.profiles || [];
      } catch (error) {
        console.warn('[api/templates] Failed to fetch WordPress schools for category enrichment:', error);
      }

      // Return all active templates regardless of fieldsData structure
      // This allows templates to be displayed even if fieldsData is empty or has different structures
      const response = {
        success: true,
        templates: templates.map(template => {
          // Ensure schoolName is properly deserialized
          const deserializedName = deserializeSchoolName(template.schoolName);
          
          // Determine category: use template.category if available, otherwise try to extract from schoolId or WordPress
          let finalCategory = template.category;
          
          // If category is null or default value, try to get it from schoolId or WordPress
          // Note: We check for both null and "国际学校" because the database default is "国际学校"
          // but we want to get the actual category from WordPress if available
          if (!finalCategory || finalCategory === '国际学校') {
            // First try to extract from new format schoolId (e.g., "isf-is-2025")
            const extractedCategory = extractCategoryFromSchoolId(template.schoolId);
            if (extractedCategory && extractedCategory !== '国际学校') {
              finalCategory = extractedCategory;
            } else {
              // Try to get from WordPress by parsing old format schoolId (e.g., "wp-profile-123")
              const parsed = parseWordPressTemplateId(template.schoolId);
              if (parsed) {
                const wpSchool = wordPressSchools.find(
                  (wp: any) => wp.id === parsed.id && wp.type === parsed.type
                );
                if (wpSchool && wpSchool.category) {
                  // Map WordPress category to standard category
                  const categoryMap: Record<string, string> = {
                    '国际学校': '国际学校',
                    '香港国际学校': '国际学校',
                    '香港本地中学': '本地中学',
                    '本地中学': '本地中学',
                    '香港本地小学': '本地小学',
                    '本地小学': '本地小学',
                    '香港幼稚园': '幼稚园',
                    '幼稚园': '幼稚园',
                    '大学': '大学'
                  };
                  const mappedCategory = categoryMap[wpSchool.category] || wpSchool.category;
                  // Only use WordPress category if it's different from default
                  if (mappedCategory && mappedCategory !== '国际学校') {
                    finalCategory = mappedCategory;
                  } else if (!finalCategory) {
                    // If template.category is null, use WordPress category even if it's "国际学校"
                    finalCategory = mappedCategory || '国际学校';
                  }
                }
              }
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


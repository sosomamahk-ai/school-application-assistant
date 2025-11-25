import type { NextApiRequest, NextApiResponse } from 'next';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { deserializeSchoolName } from '@/utils/templates';

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
                nameEnglish: true,
                permalink: true,
                country: true,
                location: true,
                bandType: true,
                profileType: true
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
            nameEnglish: template.school?.nameEnglish || null,
            permalink: template.school?.permalink || null,
            country: template.school?.country || null,
            location: template.school?.location || null,
            bandType: template.school?.bandType || null
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
              nameEnglish: true,
              permalink: true,
              country: true,
              location: true,
              bandType: true,
              profileType: true
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
          // 3. Fallback to school.profileType or default
          let finalCategory = template.category;
          
          if (!finalCategory) {
            const extractedCategory = extractCategoryFromSchoolId(template.schoolId);
            if (extractedCategory) {
              finalCategory = extractedCategory;
              console.log(`[api/templates] Template ${template.id} (${template.schoolId}): Extracted category from schoolId: ${extractedCategory}`);
            } 
            else if (template.school?.profileType) {
              finalCategory = template.school.profileType;
            }
          }
          
          // Final fallback: ensure category is never null (defensive programming)
          if (!finalCategory) {
            finalCategory = '国际学校';
            console.warn(`[api/templates] ⚠️ Template ${template.id} (${template.schoolId}) has null category in DB and no fallback found. Using default '国际学校'. This should be fixed by backfill script.`);
          }
          
          // Get nameShort from School table, fallback to WordPress if available
          const nameShort = template.school?.nameShort || null;
          const nameEnglish = template.school?.nameEnglish || null;
          const permalink = template.school?.permalink || null;
          const country = template.school?.country || null;
          const location = template.school?.location || null;
          const bandType = template.school?.bandType || null;
          
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
            nameEnglish: nameEnglish,
            permalink: permalink,
            country,
            location,
            bandType
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
          id: randomUUID(),
          schoolId,
          schoolName,
          program,
          description,
          category: finalCategory, // Always set category to prevent null values
          fieldsData: fields,
          updatedAt: new Date()
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


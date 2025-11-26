import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAdmin } from '@/utils/auth';
import { prisma } from '@/lib/prisma';
import { isMasterTemplate } from '@/constants/templates';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify admin access
  const authResult = await authenticateAdmin(req);
  if (!authResult) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  const { id } = req.query;

  if (req.method === 'PATCH') {
    // Update template (e.g., toggle isActive, update dates)
    try {
      const {
        isActive,
        isApplicationOpenAllYear,
        applicationStartDate,
        applicationEndDate,
        earlyStartDate,
        earlyEndDate,
        regularStartDate,
        regularEndDate,
        springStartDate,
        springEndDate,
        fallStartDate,
        fallEndDate,
        centralStartDate,
        centralEndDate
      } = req.body;

      const updateData: any = {};
      
      // Helper function to parse date
      const parseDate = (dateStr: string | null | undefined): Date | null => {
        if (dateStr === undefined) return undefined as any;
        if (!dateStr) return null;
        try {
          return new Date(dateStr);
        } catch {
          return null;
        }
      };
      
      if (typeof isActive === 'boolean') {
        updateData.isActive = isActive;
      }
      
      if (typeof isApplicationOpenAllYear === 'boolean') {
        updateData.isApplicationOpenAllYear = isApplicationOpenAllYear;
      }
      
      // Standard dates
      if (applicationStartDate !== undefined) {
        updateData.applicationStartDate = parseDate(applicationStartDate);
      }
      
      if (applicationEndDate !== undefined) {
        updateData.applicationEndDate = parseDate(applicationEndDate);
      }

      // University dates
      if (earlyStartDate !== undefined) {
        updateData.earlyStartDate = parseDate(earlyStartDate);
      }
      
      if (earlyEndDate !== undefined) {
        updateData.earlyEndDate = parseDate(earlyEndDate);
      }
      
      if (regularStartDate !== undefined) {
        updateData.regularStartDate = parseDate(regularStartDate);
      }
      
      if (regularEndDate !== undefined) {
        updateData.regularEndDate = parseDate(regularEndDate);
      }

      // Local school dates
      if (springStartDate !== undefined) {
        updateData.springStartDate = parseDate(springStartDate);
      }
      
      if (springEndDate !== undefined) {
        updateData.springEndDate = parseDate(springEndDate);
      }
      
      if (fallStartDate !== undefined) {
        updateData.fallStartDate = parseDate(fallStartDate);
      }
      
      if (fallEndDate !== undefined) {
        updateData.fallEndDate = parseDate(fallEndDate);
      }
      
      if (centralStartDate !== undefined) {
        updateData.centralStartDate = parseDate(centralStartDate);
      }
      
      if (centralEndDate !== undefined) {
        updateData.centralEndDate = parseDate(centralEndDate);
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      const template = await prisma.schoolFormTemplate.update({
        where: { id: id as string },
        data: updateData
      });

      return res.status(200).json({
        success: true,
        template: {
          id: template.id,
          isActive: template.isActive,
          isApplicationOpenAllYear: template.isApplicationOpenAllYear,
          applicationStartDate: template.applicationStartDate,
          applicationEndDate: template.applicationEndDate,
          earlyStartDate: template.earlyStartDate,
          earlyEndDate: template.earlyEndDate,
          regularStartDate: template.regularStartDate,
          regularEndDate: template.regularEndDate,
          springStartDate: template.springStartDate,
          springEndDate: template.springEndDate,
          fallStartDate: template.fallStartDate,
          fallEndDate: template.fallEndDate,
          centralStartDate: template.centralStartDate,
          centralEndDate: template.centralEndDate
        }
      });
    } catch (error: any) {
      console.error('Template update error:', error);
      return res.status(500).json({ 
        error: 'Failed to update template',
        message: error?.message || 'Unknown error occurred'
      });
    }
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 验证管理员权限
    const authResult = await authenticateAdmin(req);
    if (!authResult) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { id } = req.query;

    // Check if template exists
    const template = await prisma.schoolFormTemplate.findUnique({
      where: { id: id as string }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Prevent deletion of master template
    if (isMasterTemplate(template.schoolId)) {
      return res.status(403).json({ 
        error: 'Cannot delete master template',
        message: 'The master template is a system template and cannot be deleted. It contains all available fields and is essential for creating new school templates.'
      });
    }

    // Delete all applications that use this template first
    // This is necessary because the foreign key constraint doesn't have onDelete: Cascade
    await prisma.application.deleteMany({
      where: { templateId: id as string }
    });

    // Update any schools that reference this template to remove the link
    await prisma.school.updateMany({
      where: { templateId: id as string },
      data: { templateId: null }
    });

    // Delete the template - all templates can be deleted, including system-generated ones
    await prisma.schoolFormTemplate.delete({
      where: { id: id as string }
    });

    console.log('[templates/[id]] Template deleted successfully:', {
      templateId: id,
      schoolId: template.schoolId
    });

    res.status(200).json({ success: true, message: 'Template deleted successfully' });
  } catch (error: any) {
    console.error('Template delete error:', error);
    
    // Provide more specific error messages
    if (error?.code === 'P2003') {
      // Foreign key constraint error
      return res.status(400).json({ 
        error: 'Cannot delete template: There are applications using this template. Please delete them first or contact support.' 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to delete template',
      message: error?.message || 'Unknown error occurred'
    });
  }
}


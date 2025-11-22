import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticate } from '@/utils/auth';
import { generateTemplateFromFormContent } from '@/services/ai/templateGenerator';
import { parsePDF } from '@/services/fileParser/pdfParser';
import { parseDOCX } from '@/services/fileParser/docxParser';
import { scrapePublicForm } from '@/services/scraper/authenticatedScraper';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb' // Allow large file uploads
    }
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate user (admin only for template scanning)
    const userId = await authenticate(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is admin (optional - remove if all users should have access)
    // const user = await prisma.user.findUnique({ where: { id: userId } });
    // if (user?.role !== 'admin') {
    //   return res.status(403).json({ error: 'Admin access required' });
    // }

    const { applicationFormUrl, fileData, fileName, sourceType } = req.body;

    let rawContent = '';
    let detectedSourceType: 'url' | 'pdf' | 'docx' = 'url';

    // Handle URL scanning
    if (applicationFormUrl) {
      try {
        const html = await scrapePublicForm(applicationFormUrl);
        // Extract form HTML (simplified - could be improved)
        const formMatch = html.match(/<form[^>]*>[\s\S]*?<\/form>/i);
        if (formMatch) {
          rawContent = formMatch[0];
        } else {
          // If no form tag found, extract all input/textarea/select elements
          const inputs = html.match(/<(input|textarea|select|button)[^>]*>/gi) || [];
          rawContent = inputs.join('\n');
        }
        detectedSourceType = 'url';
      } catch (error) {
        return res.status(400).json({
          error: `Failed to fetch URL: ${(error as Error).message}`
        });
      }
    }
    // Handle file upload (PDF or DOCX)
    else if (fileData) {
      try {
        // Decode base64 file data
        const fileBuffer = Buffer.from(fileData, 'base64');
        
        // Determine file type from filename or content
        const isPDF = fileName?.toLowerCase().endsWith('.pdf') || 
                     fileBuffer[0] === 0x25 && fileBuffer[1] === 0x50 && fileBuffer[2] === 0x44 && fileBuffer[3] === 0x46; // PDF magic bytes
        const isDOCX = fileName?.toLowerCase().endsWith('.docx') || 
                      fileName?.toLowerCase().endsWith('.doc') ||
                      (fileBuffer[0] === 0x50 && fileBuffer[1] === 0x4B); // ZIP/DOCX magic bytes

        if (isPDF) {
          const result = await parsePDF(fileBuffer);
          rawContent = result.text;
          detectedSourceType = 'pdf';
        } else if (isDOCX) {
          const result = await parseDOCX(fileBuffer);
          rawContent = result.text;
          detectedSourceType = 'docx';
        } else {
          return res.status(400).json({
            error: 'Unsupported file type. Please upload PDF or DOCX file.'
          });
        }
      } catch (error) {
        return res.status(400).json({
          error: `Failed to parse file: ${(error as Error).message}`
        });
      }
    } else {
      return res.status(400).json({
        error: 'Either applicationFormUrl or fileData must be provided'
      });
    }

    if (!rawContent || rawContent.trim().length === 0) {
      return res.status(400).json({
        error: 'No content extracted from the provided source'
      });
    }

    // Generate template using LLM
    const { template, confidence, fieldCount } = await generateTemplateFromFormContent(
      rawContent,
      detectedSourceType
    );

    res.status(200).json({
      success: true,
      templateJson: template,
      fieldsCount: fieldCount,
      confidence: confidence,
      source: detectedSourceType
    });
  } catch (error) {
    console.error('Template scan error:', error);
    res.status(500).json({
      error: 'Failed to scan template',
      message: (error as Error).message
    });
  }
}


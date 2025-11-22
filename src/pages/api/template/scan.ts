import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticate } from '@/utils/auth';
import { generateTemplateFromFormContent } from '@/services/ai/templateGenerator';
import { parsePDF } from '@/services/fileParser/pdfParser';
import { parseDOCX } from '@/services/fileParser/docxParser';
import { scrapePublicForm } from '@/services/scraper/authenticatedScraper';

// Pre-import OpenAI configuration to trigger initialization logging
// This ensures the configuration is loaded and logged when this API route is first compiled
import '@/lib/openai';

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
  console.log(`[Template Scan API] Request received. Method: ${req.method}`);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: true,
      message: 'Method not allowed. Only POST requests are supported.'
    });
  }

  try {
    // Authenticate user (admin only for template scanning)
    console.log(`[Template Scan API] Authenticating user...`);
    const userId = await authenticate(req);
    if (!userId) {
      console.error(`[Template Scan API] Authentication failed: No valid token`);
      return res.status(401).json({ 
        error: true,
        message: 'Unauthorized. Please provide a valid authentication token.'
      });
    }
    console.log(`[Template Scan API] User authenticated: ${userId}`);

    const { applicationFormUrl, fileData, fileName, sourceType } = req.body;
    console.log(`[Template Scan API] Request body:`, {
      hasUrl: !!applicationFormUrl,
      hasFileData: !!fileData,
      fileName: fileName || 'N/A'
    });

    let rawContent = '';
    let detectedSourceType: 'url' | 'pdf' | 'docx' = 'url';
    let extractionError: Error | null = null;

    // Handle URL scanning
    if (applicationFormUrl) {
      try {
        console.log(`[Template Scan API] Processing URL: ${applicationFormUrl}`);
        
        if (!applicationFormUrl || typeof applicationFormUrl !== 'string') {
          throw new Error('Invalid URL provided');
        }

        // Validate URL format
        try {
          new URL(applicationFormUrl);
        } catch (urlError) {
          throw new Error(`Invalid URL format: ${applicationFormUrl}`);
        }

        const html = await scrapePublicForm(applicationFormUrl);
        console.log(`[Template Scan API] HTML fetched. Length: ${html.length} chars`);
        
        if (!html || html.length === 0) {
          throw new Error('No HTML content received from URL');
        }

        // Extract form HTML - try multiple strategies
        let formMatch = html.match(/<form[^>]*>[\s\S]*?<\/form>/i);
        
        if (formMatch && formMatch[0]) {
          rawContent = formMatch[0];
          console.log(`[Template Scan API] Found <form> tag. Length: ${rawContent.length} chars`);
        } else {
          // If no form tag found, extract all form-related elements
          const formElements: string[] = [];
          
          // Extract all input, textarea, select elements
          const inputMatches = html.match(/<(input|textarea|select|button|label)[^>]*>[\s\S]*?<\/(input|textarea|select|button|label)>/gi);
          const inputTags = html.match(/<(input|textarea|select|button|label)[^>]*>/gi);
          
          if (inputMatches && inputMatches.length > 0) {
            formElements.push(...inputMatches);
          } else if (inputTags && inputTags.length > 0) {
            formElements.push(...inputTags);
          }

          if (formElements.length > 0) {
            rawContent = formElements.join('\n');
            console.log(`[Template Scan API] Extracted ${formElements.length} form elements. Length: ${rawContent.length} chars`);
          } else {
            // Last resort: use the full HTML but log a warning
            console.warn(`[Template Scan API] Warning: No form elements found. Using full HTML content.`);
            rawContent = html.substring(0, 50000); // Limit to first 50k chars
          }
        }
        
        detectedSourceType = 'url';
        
        if (!rawContent || rawContent.trim().length === 0) {
          throw new Error('No form content extracted from HTML. The page might not contain a form.');
        }
        
        console.log(`[Template Scan API] URL extraction completed. Content length: ${rawContent.length} chars`);
      } catch (error) {
        extractionError = error as Error;
        console.error(`[Template Scan API] URL extraction failed: ${extractionError.message}`);
        console.error(`[Template Scan API] Stack: ${extractionError.stack}`);
        return res.status(400).json({
          error: true,
          message: `Failed to fetch or extract content from URL: ${extractionError.message}`,
          stack: process.env.NODE_ENV === 'development' ? extractionError.stack : undefined
        });
      }
    }
    // Handle file upload (PDF or DOCX)
    else if (fileData) {
      try {
        console.log(`[Template Scan API] Processing file upload. File name: ${fileName || 'unknown'}`);
        
        if (!fileData || typeof fileData !== 'string') {
          throw new Error('Invalid file data. Expected base64-encoded string.');
        }

        // Decode base64 file data
        let fileBuffer: Buffer;
        try {
          fileBuffer = Buffer.from(fileData, 'base64');
          console.log(`[Template Scan API] Decoded base64. Buffer size: ${fileBuffer.length} bytes`);
        } catch (decodeError) {
          throw new Error('Failed to decode base64 file data. Invalid base64 string.');
        }
        
        if (fileBuffer.length === 0) {
          throw new Error('File buffer is empty. Please upload a valid file.');
        }
        
        // Determine file type from filename or content
        const isPDF = fileName?.toLowerCase().endsWith('.pdf') || 
                     (fileBuffer[0] === 0x25 && fileBuffer[1] === 0x50 && fileBuffer[2] === 0x44 && fileBuffer[3] === 0x46); // PDF magic bytes
        const isDOCX = fileName?.toLowerCase().endsWith('.docx') || 
                      fileName?.toLowerCase().endsWith('.doc') ||
                      (fileBuffer[0] === 0x50 && fileBuffer[1] === 0x4B); // ZIP/DOCX magic bytes

        if (isPDF) {
          console.log(`[Template Scan API] Detected PDF file`);
          const result = await parsePDF(fileBuffer);
          rawContent = result.text;
          detectedSourceType = 'pdf';
          console.log(`[Template Scan API] PDF parsed. Extracted ${rawContent.length} chars from ${result.pageCount} pages`);
        } else if (isDOCX) {
          console.log(`[Template Scan API] Detected DOCX file`);
          const result = await parseDOCX(fileBuffer);
          rawContent = result.text;
          detectedSourceType = 'docx';
          console.log(`[Template Scan API] DOCX parsed. Extracted ${rawContent.length} chars in ${result.paragraphCount} paragraphs`);
        } else {
          throw new Error('Unsupported file type. Please upload a PDF (.pdf) or DOCX (.docx, .doc) file.');
        }
      } catch (error) {
        extractionError = error as Error;
        console.error(`[Template Scan API] File parsing failed: ${extractionError.message}`);
        console.error(`[Template Scan API] Stack: ${extractionError.stack}`);
        return res.status(400).json({
          error: true,
          message: `Failed to parse file: ${extractionError.message}`,
          stack: process.env.NODE_ENV === 'development' ? extractionError.stack : undefined
        });
      }
    } else {
      return res.status(400).json({
        error: true,
        message: 'Either applicationFormUrl or fileData must be provided in the request body.'
      });
    }

    if (!rawContent || rawContent.trim().length === 0) {
      return res.status(400).json({
        error: true,
        message: 'No content extracted from the provided source. Please ensure the URL or file contains form content.'
      });
    }

    console.log(`[Template Scan API] Content extraction completed. Generating template with LLM...`);

    // Generate template using LLM
    let template, confidence, fieldCount;
    try {
      const result = await generateTemplateFromFormContent(
        rawContent,
        detectedSourceType
      );
      template = result.template;
      confidence = result.confidence;
      fieldCount = result.fieldCount;
      
      console.log(`[Template Scan API] Template generation completed. Fields: ${fieldCount}, Confidence: ${confidence}`);
    } catch (llmError) {
      const error = llmError as Error;
      console.error(`[Template Scan API] LLM template generation failed: ${error.message}`);
      console.error(`[Template Scan API] Stack: ${error.stack}`);
      return res.status(500).json({
        error: true,
        message: `Failed to generate template using AI: ${error.message}`,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }

    // Return success response
    res.status(200).json({
      success: true,
      error: false,
      templateJson: template,
      fieldsCount: fieldCount,
      confidence: confidence,
      source: detectedSourceType
    });
    
    console.log(`[Template Scan API] Request completed successfully`);
  } catch (error) {
    const err = error as Error;
    console.error(`[Template Scan API] Unexpected error: ${err.message}`);
    console.error(`[Template Scan API] Stack: ${err.stack}`);
    
    res.status(500).json({
      error: true,
      message: `Failed to scan template: ${err.message}`,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}


/**
 * DOCX Parser Service
 * Extracts text content from DOC/DOCX files
 * 
 * Note: This is a TypeScript wrapper. The actual DOCX parsing should be done
 * via a Python script or Node.js library.
 * For production, consider using a microservice or serverless function.
 */

export interface DOCXParseResult {
  text: string;
  paragraphCount: number;
}

/**
 * Parse DOCX file and extract text content
 * 
 * Implementation note: Since python-docx is a Python library, we have two options:
 * 1. Use a Node.js alternative like mammoth or docx
 * 2. Call a Python microservice/script
 * 
 * This implementation uses mammoth (Node.js) as a fallback.
 * For better accuracy with complex DOCX files, consider using a Python service.
 */
export async function parseDOCX(fileBuffer: Buffer): Promise<DOCXParseResult> {
  console.log(`[DOCX Parse] Starting DOCX parsing. Buffer size: ${fileBuffer.length} bytes`);
  
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error('DOCX buffer is empty or invalid');
  }

  try {
    // Dynamic import for mammoth
    console.log(`[DOCX Parse] Importing mammoth library...`);
    let mammoth: any;
    try {
      const mammothModule = await import('mammoth');
      mammoth = mammothModule.default || mammothModule;
    } catch (importError) {
      console.error(`[DOCX Parse] Failed to import mammoth: ${(importError as Error).message}`);
      throw new Error(
        'DOCX parsing library not installed. Please install mammoth: npm install mammoth\n' +
        'For better accuracy with complex DOCX files, consider using a Python service with python-docx.'
      );
    }

    console.log(`[DOCX Parse] Parsing DOCX buffer...`);
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    
    const text = result.value || '';
    const paragraphCount = text ? ((text.match(/\n\n/g) || []).length + 1) : 0;
    
    console.log(`[DOCX Parse] Parsing completed. Extracted ${text.length} chars in ${paragraphCount} paragraphs`);
    
    // Check if text extraction was successful
    if (!text || text.trim().length === 0) {
      console.warn(`[DOCX Parse] Warning: No text extracted from DOCX. File might be empty or corrupted.`);
      throw new Error('No text content extracted from DOCX file. The file might be empty or corrupted.');
    }

    return {
      text,
      paragraphCount
    };
  } catch (error) {
    console.error(`[DOCX Parse] Error parsing DOCX: ${(error as Error).message}`);
    console.error(`[DOCX Parse] Stack: ${(error as Error).stack}`);
    
    // If mammoth is not available, throw a helpful error
    if ((error as any).code === 'MODULE_NOT_FOUND' || 
        (error as any).message?.includes('Cannot find module') ||
        (error as any).message?.includes('not installed')) {
      throw new Error(
        'DOCX parsing library not installed. Please install mammoth: npm install mammoth\n' +
        'For better accuracy with complex DOCX files, consider using a Python service with python-docx.'
      );
    }
    
    // Re-throw with more context
    throw new Error(`Failed to parse DOCX: ${(error as Error).message}`);
  }
}

/**
 * Extract form fields from DOCX text using pattern matching
 * This is a basic implementation - LLM processing should be used for better results
 */
export function extractFormFieldsFromDOCXText(text: string): string[] {
  const fieldPatterns = [
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*):\s*\[?\s*\]?/g,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\(.*?\)/g,
    /Field:\s*(.+)/gi,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*Required/gi,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\*/g  // Fields with asterisk (required)
  ];

  const fields: Set<string> = new Set();

  fieldPatterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        fields.add(match[1].trim());
      }
    }
  });

  return Array.from(fields);
}


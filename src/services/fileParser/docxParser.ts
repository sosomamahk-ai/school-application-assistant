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
  try {
    // Try to use mammoth if available (converts DOCX to HTML/text)
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    
    return {
      text: result.value || '',
      paragraphCount: (result.value.match(/\n\n/g) || []).length + 1
    };
  } catch (error) {
    if ((error as any).code === 'MODULE_NOT_FOUND') {
      throw new Error(
        'DOCX parsing library not installed. Please install mammoth: npm install mammoth\n' +
        'For better accuracy with complex DOCX files, consider using a Python service with python-docx.'
      );
    }
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


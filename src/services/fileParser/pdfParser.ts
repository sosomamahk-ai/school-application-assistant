/**
 * PDF Parser Service
 * Extracts text content from PDF files
 * 
 * Note: This is a TypeScript wrapper. The actual PDF parsing should be done
 * via a Python script or Node.js library like pdf-parse.
 * For production, consider using a microservice or serverless function.
 */

export interface PDFParseResult {
  text: string;
  pageCount: number;
}

/**
 * Parse PDF file and extract text content
 * 
 * Implementation note: Since pdfplumber is a Python library, we have two options:
 * 1. Use a Node.js alternative like pdf-parse
 * 2. Call a Python microservice/script
 * 
 * This implementation uses pdf-parse (Node.js) as a fallback.
 * For better accuracy with complex PDFs, consider using a Python service.
 */
export async function parsePDF(fileBuffer: Buffer): Promise<PDFParseResult> {
  try {
    // Try to use pdf-parse if available
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(fileBuffer);
    
    return {
      text: data.text || '',
      pageCount: data.numpages || 0
    };
  } catch (error) {
    // If pdf-parse is not available, throw a helpful error
    if ((error as any).code === 'MODULE_NOT_FOUND') {
      throw new Error(
        'PDF parsing library not installed. Please install pdf-parse: npm install pdf-parse\n' +
        'For better accuracy with complex PDFs, consider using a Python service with pdfplumber.'
      );
    }
    throw new Error(`Failed to parse PDF: ${(error as Error).message}`);
  }
}

/**
 * Extract form fields from PDF text using pattern matching
 * This is a basic implementation - LLM processing should be used for better results
 */
export function extractFormFieldsFromPDFText(text: string): string[] {
  const fieldPatterns = [
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*):\s*\[?\s*\]?/g,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\(.*?\)/g,
    /Field:\s*(.+)/gi,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*Required/gi
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


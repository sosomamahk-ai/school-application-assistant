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
  console.log(`[PDF Parse] Starting PDF parsing. Buffer size: ${fileBuffer.length} bytes`);
  
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error('PDF buffer is empty or invalid');
  }

  try {
    // Dynamic import for pdf-parse
    console.log(`[PDF Parse] Importing pdf-parse library...`);
    let pdfParse: any;
    try {
      const pdfParseModule = await import('pdf-parse');
      pdfParse = pdfParseModule.default || pdfParseModule;
    } catch (importError) {
      console.error(`[PDF Parse] Failed to import pdf-parse: ${(importError as Error).message}`);
      throw new Error(
        'PDF parsing library not installed. Please install pdf-parse: npm install pdf-parse\n' +
        'For better accuracy with complex PDFs, consider using a Python service with pdfplumber.'
      );
    }

    console.log(`[PDF Parse] Parsing PDF buffer...`);
    const data = await pdfParse(fileBuffer);
    
    const text = data.text || '';
    const pageCount = data.numpages || data.numPages || 0;
    
    console.log(`[PDF Parse] Parsing completed. Extracted ${text.length} chars from ${pageCount} pages`);
    
    // Check if text extraction was successful
    if (!text || text.trim().length === 0) {
      console.warn(`[PDF Parse] Warning: No text extracted from PDF. This might be a scanned PDF or image-based PDF.`);
      // For scanned PDFs, we would need OCR here
      // TODO: Add OCR fallback using tesseract.js if text is empty
    }

    // If text is too short, it might be a scanned PDF
    if (text.length < 50 && pageCount > 0) {
      console.warn(`[PDF Parse] Warning: Very short text (${text.length} chars) from ${pageCount} pages. This might be a scanned PDF.`);
    }
    
    return {
      text,
      pageCount
    };
  } catch (error) {
    console.error(`[PDF Parse] Error parsing PDF: ${(error as Error).message}`);
    console.error(`[PDF Parse] Stack: ${(error as Error).stack}`);
    
    // If pdf-parse is not available, throw a helpful error
    if ((error as any).code === 'MODULE_NOT_FOUND' || 
        (error as any).message?.includes('Cannot find module') ||
        (error as any).message?.includes('not installed')) {
      throw new Error(
        'PDF parsing library not installed. Please install pdf-parse: npm install pdf-parse\n' +
        'For better accuracy with complex PDFs, consider using a Python service with pdfplumber.'
      );
    }
    
    // Re-throw with more context
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


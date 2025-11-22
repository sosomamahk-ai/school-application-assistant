# Template Auto-Generation Feature

## Overview

This feature automatically generates school application templates by scanning:
- Public application form URLs
- PDF application files
- DOC/DOCX files
- Login-required application form pages (via Playwright automation)

## Implementation Summary

### Part 1: UI Components ✅

**Location**: `src/pages/admin/templates.tsx`

Added a new collapsible section titled "扫描识别模版（Scan & Generate Template）" with:

1. **Public URL Scanning**
   - Input field for application form URL
   - "从网址扫描 (Scan from URL)" button

2. **File Scanning**
   - File upload for PDF, DOC, DOCX files
   - "从文件扫描 (Scan from File)" button

3. **Login-required Scanning**
   - Collapsible form with fields:
     - Login Page URL
     - Username
     - Password
     - Optional 2FA code input
     - Target Application Form URL
   - "登录后抓取并生成模版 (Scan with Login)" button

4. **Template Preview**
   - JSON preview panel showing generated template
   - Summary display (field count, confidence, source)
   - "保存为模版 (Save Template)" button

### Part 2: API Endpoints ✅

#### 1. POST `/api/template/scan`

**Location**: `src/pages/api/template/scan.ts`

Handles:
- Public HTML URL scanning
- PDF file parsing
- DOC/DOCX file parsing

**Request Body**:
```json
{
  "applicationFormUrl": "https://example.com/apply" // OR
  "fileData": "base64-encoded-file-data",
  "fileName": "application.pdf"
}
```

**Response**:
```json
{
  "success": true,
  "templateJson": {
    "schoolName": "...",
    "fields": [...]
  },
  "fieldsCount": 10,
  "confidence": 0.85,
  "source": "url|pdf|docx"
}
```

#### 2. POST `/api/template/scan-authenticated`

**Location**: `src/pages/api/template/scan-authenticated.ts`

Handles login-required school application forms using Playwright.

**Request Body**:
```json
{
  "loginUrl": "https://example.com/login",
  "username": "user@example.com",
  "password": "password123",
  "twoFaCode": "123456", // optional
  "targetFormUrl": "https://example.com/application-form"
}
```

**Response**:
```json
{
  "success": true,
  "templateJson": {
    "schoolName": "...",
    "fields": [...]
  },
  "fieldCount": 10,
  "loginStatus": "success",
  "confidence": 0.85
}
```

**Security Features**:
- Credentials are NOT stored
- Only used for the current request
- Secure error handling for login failures

### Part 3: Services ✅

#### LLM Template Generator

**Location**: `src/services/ai/templateGenerator.ts`

Function: `generateTemplateFromFormContent(rawContent: string, sourceType: 'url' | 'pdf' | 'docx')`

- Analyzes form content using OpenAI GPT-4o-mini
- Extracts form fields, types, labels, options
- Generates JSON template matching system schema
- Returns confidence score and field count

#### File Parsers

**Location**: `src/services/fileParser/`

1. **PDF Parser** (`pdfParser.ts`)
   - Uses `pdf-parse` library
   - Extracts text content from PDF files
   - Returns text and page count

2. **DOCX Parser** (`docxParser.ts`)
   - Uses `mammoth` library
   - Extracts text content from DOC/DOCX files
   - Returns text and paragraph count

#### Authenticated Scraper

**Location**: `src/services/scraper/authenticatedScraper.ts`

Functions:
- `scrapeAuthenticatedForm(credentials)`: Handles login and form extraction
- `scrapePublicForm(url)`: Scrapes public forms

Features:
- Automatic form field detection
- 2FA support
- Robust error handling
- Headless browser automation

### Part 4: Dependencies ✅

Added to `package.json`:
- `pdf-parse`: ^1.1.1 - PDF text extraction
- `mammoth`: ^1.6.0 - DOCX text extraction

## Usage

### For Administrators

1. Navigate to `/admin/templates`
2. Click on "扫描识别模版（Scan & Generate Template）" section
3. Choose scanning method:
   - **URL**: Enter public form URL
   - **File**: Upload PDF or DOCX file
   - **Login**: Provide login credentials and target URL
4. Click scan button
5. Review generated template in JSON preview
6. Click "保存为模版" to save

### API Usage

#### Scan Public URL
```bash
curl -X POST http://localhost:3000/api/template/scan \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"applicationFormUrl": "https://example.com/apply"}'
```

#### Scan with Login
```bash
curl -X POST http://localhost:3000/api/template/scan-authenticated \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "loginUrl": "https://example.com/login",
    "username": "user@example.com",
    "password": "password",
    "targetFormUrl": "https://example.com/form"
  }'
```

## Field Type Support

The system supports these field types:
- `text` - Single-line text input
- `number` - Numeric input
- `date` - Date picker
- `select` - Dropdown with options
- `checkbox` - Checkbox input
- `radio` - Radio button group
- `file` - File upload input
- `textarea` - Multi-line text input
- `email` - Email input
- `tel` - Phone number input

## Template Schema

Generated templates follow this structure:
```json
{
  "schoolName": "School Name",
  "fields": [
    {
      "id": "field_id",
      "label": "Field Label",
      "type": "text",
      "required": true,
      "options": ["option1", "option2"], // for select/radio
      "placeholder": "Placeholder text",
      "helpText": "Help text",
      "maxLength": 100
    }
  ]
}
```

## Error Handling

- Invalid URLs: Returns 400 with error message
- File parsing errors: Returns 400 with specific error
- Login failures: Returns 401 with login status
- LLM errors: Returns 500 with error details
- Network errors: Handled gracefully with user-friendly messages

## Security Considerations

1. **Credentials**: Never stored, only used for current request
2. **Authentication**: All endpoints require valid JWT token
3. **File Size**: Limited to 50MB (configurable in API config)
4. **Rate Limiting**: Consider adding rate limits for production
5. **Input Validation**: All inputs validated before processing

## Future Enhancements

Potential improvements:
1. OCR support for scanned PDFs (using Tesseract.js)
2. Support for more file formats (XLSX, ODT)
3. Batch scanning multiple URLs
4. Template validation and quality scoring
5. Field mapping suggestions
6. Multi-language form detection
7. Image-based form recognition

## Testing

To test the feature:

1. **Public URL Test**:
   - Use a publicly accessible form URL
   - Verify template generation

2. **File Upload Test**:
   - Upload a PDF or DOCX application form
   - Verify text extraction and template generation

3. **Authenticated Test**:
   - Provide valid login credentials
   - Verify login flow and form extraction

## Troubleshooting

### Common Issues

1. **"PDF parsing library not installed"**
   - Run: `npm install pdf-parse`

2. **"DOCX parsing library not installed"**
   - Run: `npm install mammoth`

3. **"OpenAI API key not configured"**
   - Set `OPENAI_API_KEY` in `.env` file

4. **"Login failed"**
   - Verify credentials are correct
   - Check if 2FA is required
   - Ensure target URL is accessible after login

5. **"No content extracted"**
   - Verify URL is accessible
   - Check if form is loaded via JavaScript (may need longer wait time)
   - Ensure file is not corrupted

## Notes

- The LLM uses GPT-4o-mini for cost efficiency
- For better accuracy with complex forms, consider using GPT-4
- PDF parsing accuracy depends on PDF structure (text-based PDFs work best)
- DOCX parsing extracts plain text (formatting is lost)
- Playwright runs in headless mode for performance


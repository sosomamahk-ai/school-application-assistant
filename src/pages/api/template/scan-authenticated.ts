import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticate } from '@/utils/auth';
import { scrapeAuthenticatedForm } from '@/services/scraper/authenticatedScraper';
import { generateTemplateFromFormContent } from '@/services/ai/templateGenerator';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log(`[Authenticated Scan API] Request received. Method: ${req.method}`);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: true,
      message: 'Method not allowed. Only POST requests are supported.'
    });
  }

  try {
    // Authenticate user
    console.log(`[Authenticated Scan API] Authenticating user...`);
    const userId = await authenticate(req);
    if (!userId) {
      console.error(`[Authenticated Scan API] Authentication failed: No valid token`);
      return res.status(401).json({ 
        error: true,
        message: 'Unauthorized. Please provide a valid authentication token.'
      });
    }
    console.log(`[Authenticated Scan API] User authenticated: ${userId}`);

    const { loginUrl, username, password, twoFaCode, targetFormUrl } = req.body;

    // Validate required fields
    if (!loginUrl || !username || !password || !targetFormUrl) {
      return res.status(400).json({
        error: true,
        message: 'Missing required fields: loginUrl, username, password, and targetFormUrl are required'
      });
    }

    // Validate URLs
    try {
      new URL(loginUrl);
      new URL(targetFormUrl);
    } catch (urlError) {
      return res.status(400).json({
        error: true,
        message: 'Invalid URL format. Please provide valid URLs for loginUrl and targetFormUrl.'
      });
    }

    // Security: Log that credentials were used (but don't store them)
    console.log(`[Authenticated Scan API] User ${userId} scanning authenticated form at ${targetFormUrl}`);
    console.log(`[Authenticated Scan API] Login URL: ${loginUrl}`);
    console.log(`[Authenticated Scan API] Has 2FA code: ${!!twoFaCode}`);

    // Scrape the authenticated form
    let scrapeResult;
    try {
      scrapeResult = await scrapeAuthenticatedForm({
        loginUrl,
        username,
        password,
        twoFaCode,
        targetFormUrl
      });
      console.log(`[Authenticated Scan API] Scraping completed. Login status: ${scrapeResult.loginStatus}`);
    } catch (scrapeError) {
      const error = scrapeError as Error;
      console.error(`[Authenticated Scan API] Scraping failed: ${error.message}`);
      console.error(`[Authenticated Scan API] Stack: ${error.stack}`);
      return res.status(500).json({
        error: true,
        message: `Failed to scrape authenticated form: ${error.message}`,
        loginStatus: 'failed',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }

    if (scrapeResult.loginStatus === 'failed') {
      console.error(`[Authenticated Scan API] Login failed: ${scrapeResult.error}`);
      return res.status(401).json({
        error: true,
        message: scrapeResult.error || 'Unable to authenticate with provided credentials',
        loginStatus: 'failed'
      });
    }

    if (!scrapeResult.html || scrapeResult.html.trim().length === 0) {
      console.error(`[Authenticated Scan API] No HTML content extracted`);
      return res.status(400).json({
        error: true,
        message: 'No content extracted from the form page. The page might be empty or inaccessible.'
      });
    }

    console.log(`[Authenticated Scan API] HTML extracted. Length: ${scrapeResult.html.length} chars`);

    // Extract form HTML from the page
    let formContent = scrapeResult.html;
    
    // Try to extract just the form element
    const formMatch = scrapeResult.html.match(/<form[^>]*>[\s\S]*?<\/form>/i);
    if (formMatch && formMatch[0]) {
      formContent = formMatch[0];
      console.log(`[Authenticated Scan API] Found <form> tag. Length: ${formContent.length} chars`);
    } else {
      // Extract all form-related elements
      const formElements = scrapeResult.html.match(/<(input|textarea|select|button|label)[^>]*>[\s\S]*?<\/(input|textarea|select|button|label)>/gi) || 
                          scrapeResult.html.match(/<(input|textarea|select|button|label)[^>]*>/gi) || [];
      if (formElements.length > 0) {
        formContent = formElements.join('\n');
        console.log(`[Authenticated Scan API] Extracted ${formElements.length} form elements. Length: ${formContent.length} chars`);
      } else {
        console.warn(`[Authenticated Scan API] Warning: No form elements found. Using full HTML.`);
        formContent = scrapeResult.html.substring(0, 50000); // Limit to first 50k chars
      }
    }

    if (!formContent || formContent.trim().length === 0) {
      return res.status(400).json({
        error: true,
        message: 'No form content extracted from the page. The page might not contain a form.'
      });
    }

    // Generate template using LLM
    console.log(`[Authenticated Scan API] Generating template with LLM...`);
    let template, confidence, fieldCount;
    try {
      const result = await generateTemplateFromFormContent(
        formContent,
        'url'
      );
      template = result.template;
      confidence = result.confidence;
      fieldCount = result.fieldCount;
      console.log(`[Authenticated Scan API] Template generation completed. Fields: ${fieldCount}, Confidence: ${confidence}`);
    } catch (llmError) {
      const error = llmError as Error;
      console.error(`[Authenticated Scan API] LLM template generation failed: ${error.message}`);
      console.error(`[Authenticated Scan API] Stack: ${error.stack}`);
      return res.status(500).json({
        error: true,
        message: `Failed to generate template using AI: ${error.message}`,
        loginStatus: 'success',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }

    // Security: Clear any sensitive data from memory
    // (Credentials are already not stored, this is just good practice)

    res.status(200).json({
      success: true,
      error: false,
      templateJson: template,
      fieldsCount: fieldCount,
      loginStatus: 'success',
      confidence: confidence,
      source: 'url'
    });
    
    console.log(`[Authenticated Scan API] Request completed successfully`);
  } catch (error) {
    const err = error as Error;
    console.error(`[Authenticated Scan API] Unexpected error: ${err.message}`);
    console.error(`[Authenticated Scan API] Stack: ${err.stack}`);
    
    res.status(500).json({
      error: true,
      message: `Failed to scan authenticated template: ${err.message}`,
      loginStatus: 'failed',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}


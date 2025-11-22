import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticate } from '@/utils/auth';
import { scrapeAuthenticatedForm } from '@/services/scraper/authenticatedScraper';
import { generateTemplateFromFormContent } from '@/services/ai/templateGenerator';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const userId = await authenticate(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { loginUrl, username, password, twoFaCode, targetFormUrl } = req.body;

    // Validate required fields
    if (!loginUrl || !username || !password || !targetFormUrl) {
      return res.status(400).json({
        error: 'Missing required fields: loginUrl, username, password, and targetFormUrl are required'
      });
    }

    // Security: Log that credentials were used (but don't store them)
    console.log(`[Template Scan] User ${userId} scanning authenticated form at ${targetFormUrl}`);

    // Scrape the authenticated form
    const scrapeResult = await scrapeAuthenticatedForm({
      loginUrl,
      username,
      password,
      twoFaCode,
      targetFormUrl
    });

    if (scrapeResult.loginStatus === 'failed') {
      return res.status(401).json({
        error: 'Login failed',
        loginStatus: 'failed',
        message: scrapeResult.error || 'Unable to authenticate with provided credentials'
      });
    }

    if (!scrapeResult.html || scrapeResult.html.trim().length === 0) {
      return res.status(400).json({
        error: 'No content extracted from the form page'
      });
    }

    // Extract form HTML from the page
    let formContent = scrapeResult.html;
    
    // Try to extract just the form element
    const formMatch = scrapeResult.html.match(/<form[^>]*>[\s\S]*?<\/form>/i);
    if (formMatch) {
      formContent = formMatch[0];
    } else {
      // Extract all form-related elements
      const formElements = scrapeResult.html.match(/<(input|textarea|select|button|label)[^>]*>[\s\S]*?<\/(input|textarea|select|button|label)>/gi) || 
                          scrapeResult.html.match(/<(input|textarea|select|button|label)[^>]*>/gi) || [];
      formContent = formElements.join('\n');
    }

    // Generate template using LLM
    const { template, confidence, fieldCount } = await generateTemplateFromFormContent(
      formContent,
      'url'
    );

    // Security: Clear any sensitive data from memory
    // (Credentials are already not stored, this is just good practice)

    res.status(200).json({
      success: true,
      templateJson: template,
      fieldCount: fieldCount,
      loginStatus: 'success',
      confidence: confidence
    });
  } catch (error) {
    console.error('Authenticated template scan error:', error);
    res.status(500).json({
      error: 'Failed to scan authenticated template',
      message: (error as Error).message,
      loginStatus: 'failed'
    });
  }
}


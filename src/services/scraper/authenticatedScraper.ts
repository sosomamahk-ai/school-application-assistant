import { chromium, type Browser, type Page } from 'playwright';

export interface LoginCredentials {
  loginUrl: string;
  username: string;
  password: string;
  twoFaCode?: string;
  targetFormUrl: string;
}

export interface ScrapeResult {
  html: string;
  loginStatus: 'success' | 'failed';
  error?: string;
}

/**
 * Scrape an authenticated application form using Playwright
 * 
 * This service handles:
 * 1. Navigation to login page
 * 2. Filling login credentials
 * 3. Handling 2FA if required
 * 4. Navigating to target form URL
 * 5. Extracting form HTML
 */
export async function scrapeAuthenticatedForm(
  credentials: LoginCredentials
): Promise<ScrapeResult> {
  let browser: Browser | null = null;

  try {
    // Launch browser
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();

    // Step 1: Navigate to login page
    console.log(`Navigating to login page: ${credentials.loginUrl}`);
    await page.goto(credentials.loginUrl, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Step 2: Fill username
    const usernameSelectors = [
      'input[name="username"]',
      'input[name="email"]',
      'input[type="email"]',
      'input[id*="username" i]',
      'input[id*="email" i]',
      'input[placeholder*="username" i]',
      'input[placeholder*="email" i]'
    ];

    let usernameFilled = false;
    for (const selector of usernameSelectors) {
      try {
        const input = page.locator(selector).first();
        if (await input.count() > 0) {
          await input.fill(credentials.username);
          usernameFilled = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!usernameFilled) {
      throw new Error('Could not find username/email input field');
    }

    // Step 3: Fill password
    const passwordSelectors = [
      'input[name="password"]',
      'input[type="password"]',
      'input[id*="password" i]',
      'input[placeholder*="password" i]'
    ];

    let passwordFilled = false;
    for (const selector of passwordSelectors) {
      try {
        const input = page.locator(selector).first();
        if (await input.count() > 0) {
          await input.fill(credentials.password);
          passwordFilled = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!passwordFilled) {
      throw new Error('Could not find password input field');
    }

    // Step 4: Handle 2FA if provided
    if (credentials.twoFaCode) {
      const twoFaSelectors = [
        'input[name*="2fa" i]',
        'input[name*="otp" i]',
        'input[name*="code" i]',
        'input[id*="2fa" i]',
        'input[id*="otp" i]',
        'input[id*="code" i]',
        'input[placeholder*="code" i]',
        'input[placeholder*="2fa" i]',
        'input[type="text"][maxlength="6"]'
      ];

      for (const selector of twoFaSelectors) {
        try {
          const input = page.locator(selector).first();
          if (await input.count() > 0) {
            await input.fill(credentials.twoFaCode);
            break;
          }
        } catch (e) {
          continue;
        }
      }
    }

    // Step 5: Submit login form
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Login")',
      'button:has-text("Sign in")',
      'button:has-text("登录")',
      'button:has-text("登入")',
      'form button',
      '[type="submit"]'
    ];

    let submitted = false;
    for (const selector of submitSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.count() > 0) {
          await button.click();
          submitted = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!submitted) {
      // Try pressing Enter on the password field
      await page.keyboard.press('Enter');
    }

    // Step 6: Wait for navigation (login to complete)
    try {
      await page.waitForURL(url => {
        const urlString = url.toString();
        return !urlString.includes('login') && !urlString.includes('signin');
      }, {
        timeout: 15000
      });
    } catch (e) {
      // Check if we're still on login page (login failed)
      const currentUrl = page.url();
      if (currentUrl.includes('login') || currentUrl.includes('signin')) {
        const errorText = await page.textContent('body').catch(() => '');
        throw new Error(`Login failed. Current URL: ${currentUrl}. Page content may indicate error.`);
      }
      // Otherwise, assume navigation happened
    }

    // Step 7: Navigate to target form URL
    console.log(`Navigating to target form: ${credentials.targetFormUrl}`);
    await page.goto(credentials.targetFormUrl, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Step 8: Wait for form to load
    await page.waitForSelector('form, [role="form"], input, textarea, select', {
      timeout: 10000
    }).catch(() => {
      // Form might be loaded via JavaScript, continue anyway
    });

    // Step 9: Extract HTML content
    const html = await page.content();

    await browser.close();
    browser = null;

    return {
      html,
      loginStatus: 'success'
    };
  } catch (error) {
    if (browser) {
      await browser.close().catch(() => {});
    }
    
    return {
      html: '',
      loginStatus: 'failed',
      error: (error as Error).message
    };
  }
}

/**
 * Extract form HTML from a public URL (no authentication required)
 * First tries a simple fetch, then falls back to Playwright for dynamic content
 */
export async function scrapePublicForm(url: string): Promise<string> {
  console.log(`[URL Scan] Starting fetch for: ${url}`);

  // Step 1: Try simple fetch first (faster for static HTML)
  try {
    console.log(`[URL Scan] Attempting simple fetch...`);
    const fetchModule = await import('node-fetch');
    const fetch = fetchModule.default || fetchModule;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    console.log(`[URL Scan] Simple fetch succeeded. HTML length: ${html.length} chars`);

    // Check if we have form elements
    const hasForms = /<form[^>]*>/i.test(html) || 
                     /<input[^>]*>/i.test(html) || 
                     /<textarea[^>]*>/i.test(html) || 
                     /<select[^>]*>/i.test(html);

    if (hasForms) {
      console.log(`[URL Scan] Forms detected in fetched HTML. Returning HTML.`);
      return html;
    } else {
      console.log(`[URL Scan] No forms detected in static HTML. Falling back to Playwright for dynamic content.`);
      // Fall through to Playwright
    }
  } catch (fetchError) {
    console.log(`[URL Scan] Simple fetch failed: ${(fetchError as Error).message}. Falling back to Playwright.`);
    // Fall through to Playwright
  }

  // Step 2: Use Playwright for dynamic content or if fetch failed
  let browser: Browser | null = null;

  try {
    console.log(`[URL Scan] Launching Playwright browser...`);
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      acceptDownloads: false
    });

    const page = await context.newPage();

    // Set longer timeout for slow pages
    page.setDefaultTimeout(60000);
    page.setDefaultNavigationTimeout(60000);

    console.log(`[URL Scan] Navigating to: ${url}`);
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    // Wait a bit for JavaScript to render
    await page.waitForTimeout(2000);

    // Try multiple selectors for form elements
    const formSelectors = ['form', '[role="form"]', 'input', 'textarea', 'select', '[class*="form"]', '[id*="form"]'];
    let formFound = false;

    for (const selector of formSelectors) {
      try {
        const count = await page.locator(selector).count();
        if (count > 0) {
          console.log(`[URL Scan] Found ${count} elements matching selector: ${selector}`);
          formFound = true;
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (!formFound) {
      console.warn(`[URL Scan] Warning: No form elements found with standard selectors. Proceeding anyway.`);
    }

    // Wait for network to be idle (optional, with timeout)
    try {
      await page.waitForLoadState('networkidle', { timeout: 10000 });
    } catch (e) {
      console.log(`[URL Scan] Network idle timeout, continuing...`);
    }

    // Get the full rendered HTML
    const html = await page.evaluate(() => document.documentElement.outerHTML);
    console.log(`[URL Scan] Playwright fetch succeeded. HTML length: ${html.length} chars`);

    // Verify we have some content
    if (!html || html.length < 100) {
      throw new Error('Extracted HTML is too short or empty');
    }

    await browser.close();
    browser = null;

    return html;
  } catch (error) {
    console.error(`[URL Scan] Playwright error: ${(error as Error).message}`);
    console.error(`[URL Scan] Stack: ${(error as Error).stack}`);
    
    if (browser) {
      await browser.close().catch(() => {});
    }
    throw new Error(`Failed to scrape public form: ${(error as Error).message}`);
  }
}


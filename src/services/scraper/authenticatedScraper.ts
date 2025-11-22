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
 */
export async function scrapePublicForm(url: string): Promise<string> {
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();

    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for form elements
    await page.waitForSelector('form, [role="form"], input, textarea, select', {
      timeout: 10000
    }).catch(() => {
      // Continue even if form elements not found
    });

    const html = await page.content();

    await browser.close();

    return html;
  } catch (error) {
    if (browser) {
      await browser.close().catch(() => {});
    }
    throw new Error(`Failed to scrape public form: ${(error as Error).message}`);
  }
}


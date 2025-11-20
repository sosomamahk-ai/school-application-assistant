import type { Page } from "playwright";

import type {
  AutoApplyUserLogin,
  LoginHandlerOptions,
} from "./types";

const EMAIL_SELECTORS = [
  'input[type="email"]',
  'input[name*="email" i]',
  'input[id*="email" i]',
];

const USERNAME_SELECTORS = [
  'input[name*="user" i]',
  'input[id*="user" i]',
  'input[name*="login" i]',
];

const PASSWORD_SELECTORS = [
  'input[type="password"]',
  'input[name*="pass" i]',
  'input[id*="pass" i]',
];

const SUBMIT_SELECTORS = [
  'button[type="submit"]',
  'input[type="submit"]',
  'button:has-text("Sign in")',
  'button:has-text("Log in")',
  'button:has-text("Login")',
  'button:has-text("继续")',
  'button:has-text("提交")',
];

export class LoginHandler {
  constructor(private readonly options: LoginHandlerOptions = {}) {}

  async maybeLogin(page: Page, credentials?: AutoApplyUserLogin): Promise<boolean> {
    if (!credentials || (!credentials.email && !credentials.username)) {
      return false;
    }

    const emailInput = await this.locateFirst(page, EMAIL_SELECTORS);
    const usernameInput = emailInput ? null : await this.locateFirst(page, USERNAME_SELECTORS);
    const passwordInput = await this.locateFirst(page, PASSWORD_SELECTORS);

    if (!passwordInput || (!emailInput && !usernameInput)) {
      return false;
    }

    if (emailInput && credentials.email) {
      await emailInput.fill(credentials.email);
    } else if (usernameInput && credentials.username) {
      await usernameInput.fill(credentials.username);
    }

    if (credentials.password) {
      await passwordInput.fill(credentials.password);
    }

    const submitButton = await this.locateFirst(page, SUBMIT_SELECTORS);
    if (submitButton) {
      await Promise.all([
        page.waitForNavigation({
          waitUntil: "domcontentloaded",
          timeout: this.options.submitTimeoutMs ?? 30_000,
        }).catch(() => undefined),
        submitButton.click(),
      ]);
      await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => undefined);
    } else {
      await passwordInput.press("Enter");
    }

    return true;
  }

  private async locateFirst(page: Page, selectors: string[]) {
    for (const selector of selectors) {
      const locator = page.locator(selector);
      if (await locator.count()) {
        return locator.first();
      }
    }
    return null;
  }
}


import { chromium, type Browser, type BrowserContext } from "playwright";

import type {
  BrowserContextOptions,
  BrowserManagerOptions,
} from "./types";

const DEFAULT_VIEWPORT = { width: 1366, height: 768 };

export class BrowserManager {
  private browser?: Browser;
  private readonly contexts = new Set<BrowserContext>();

  constructor(private readonly options: BrowserManagerOptions = {}) {}

  private async ensureBrowser(): Promise<Browser> {
    if (this.browser) {
      return this.browser;
    }

    this.browser = await chromium.launch({
      headless: this.options.headless ?? (process.env.PLAYWRIGHT_HEADLESS !== "false"),
      slowMo: this.options.slowMo,
      args: this.options.args,
      proxy: this.options.proxy,
    });

    return this.browser;
  }

  async newContext(
    contextOptions: BrowserContextOptions = {},
  ): Promise<BrowserContext> {
    const browser = await this.ensureBrowser();
    const context = await browser.newContext({
      viewport: DEFAULT_VIEWPORT,
      locale: this.options.locale ?? "en-US",
      timezoneId: this.options.timezoneId ?? "UTC",
      userAgent: this.options.userAgent,
      storageState: contextOptions.storageStatePath,
      extraHTTPHeaders: contextOptions.extraHTTPHeaders,
    });

    if (!contextOptions.disposable) {
      this.contexts.add(context);
      context.on("close", () => this.contexts.delete(context));
    }

    return context;
  }

  async withPage<T>(
    handler: (context: BrowserContext) => Promise<T>,
    options?: BrowserContextOptions,
  ): Promise<T> {
    const context = await this.newContext(options);
    try {
      return await handler(context);
    } finally {
      if (options?.disposable ?? true) {
        await context.close();
      }
    }
  }

  async dispose(): Promise<void> {
    await Promise.all(
      Array.from(this.contexts).map(async (context) => {
        await context.close().catch(() => undefined);
      }),
    );
    this.contexts.clear();

    if (this.browser) {
      await this.browser.close().catch(() => undefined);
      this.browser = undefined;
    }
  }
}


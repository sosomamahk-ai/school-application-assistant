import { mkdir, writeFile } from "fs/promises";
import { resolve } from "path";

import type { Page } from "playwright";

import type {
  AutomationUtilsConfig,
  AutoApplyResult,
} from "./types";

export class AutomationUtils {
  private readonly screenshotDir?: string;

  constructor(config: AutomationUtilsConfig = {}) {
    this.screenshotDir = config.screenshotDir;
  }

  async ensureDir(dir: string) {
    await mkdir(dir, { recursive: true });
  }

  async safeNavigate(page: Page, url: string): Promise<void> {
    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 45_000,
    });

    if (!response || !response.ok()) {
      throw new Error(
        `Failed to load ${url} - status ${
          response?.status() ?? "unknown"
        }`,
      );
    }
  }

  async waitForNetworkIdle(page: Page, timeout = 15_000): Promise<void> {
    await page.waitForLoadState("networkidle", { timeout });
  }

  async collectPageText(page: Page): Promise<string> {
    return page.evaluate(() => document.body.innerText.slice(0, 20_000));
  }

  async takeScreenshot(
    page: Page,
    runId: string,
    label: string,
  ): Promise<string | undefined> {
    if (!this.screenshotDir) {
      return undefined;
    }

    const safeLabel = label.replace(/[^a-z0-9_-]/gi, "_");
    const filePath = resolve(this.screenshotDir, `${runId}-${safeLabel}.png`);
    await this.ensureDir(this.screenshotDir);
    await page.screenshot({ path: filePath, fullPage: true });
    return filePath;
  }

  async persistHtmlDump(
    page: Page,
    runId: string,
  ): Promise<string | undefined> {
    if (!this.screenshotDir) {
      return undefined;
    }

    const path = resolve(this.screenshotDir, `${runId}-dom.html`);
    await this.ensureDir(this.screenshotDir);
    const html = await page.content();
    await writeFile(path, html, "utf-8");
    return path;
  }

  buildResultWithArtifacts(
    base: AutoApplyResult,
    artifacts: AutoApplyResult["artifacts"],
  ): AutoApplyResult {
    return {
      ...base,
      artifacts: {
        ...(base.artifacts ?? {}),
        ...(artifacts ?? {}),
      },
    };
  }
}


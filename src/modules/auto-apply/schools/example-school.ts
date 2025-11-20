import type { Locator, Page } from "playwright";

import type { SchoolAutomationScript } from "../engine/types";
import { remapTemplateFields } from "./common";

const APPLY_URL = "https://example.edu/apply";

export const exampleSchoolScript: SchoolAutomationScript = {
  id: "example-school",
  name: "Example International School",
  supportsLogin: true,
  description: "Demonstrates the structure required for new school automation scripts.",
  async run(ctx) {
    const { utils, formFiller, loginHandler, payload, page, logger } = ctx;
    try {
      await utils.safeNavigate(page, APPLY_URL);
      await loginHandler.maybeLogin(page, payload.userLogin);
      await utils.waitForNetworkIdle(page);

      const overrides = remapTemplateFields(payload.template, {
        english_first_name: { label: "First Name" },
        english_last_name: { label: "Last Name" },
        student_email: { label: "Email" },
        student_phone: { label: "Phone" },
        home_address: { label: "Street Address" },
      });

      const fields = overrides.length ? overrides : payload.template.fields;
      await formFiller.fillFields(page, fields);

      const submitButton = await locateSubmitButton(page);
      if (submitButton) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: "networkidle", timeout: 30_000 }).catch(() => undefined),
          submitButton.click(),
        ]);
      }

      await utils.waitForNetworkIdle(page);
      return {
        success: true,
        message: "Example school automation completed.",
      };
    } catch (error) {
      logger.error("Example school automation failed", { error });
      const [screenshotPath, htmlPath] = await Promise.all([
        utils.takeScreenshot(page, payload.runId, "example-school-error"),
        utils.persistHtmlDump(page, payload.runId),
      ]);
      return {
        success: false,
        message: (error as Error).message,
        errors: [(error as Error).stack ?? String(error)],
        artifacts: {
          screenshotPath,
          rawHtmlPath: htmlPath,
        },
      };
    }
  },
};

async function locateSubmitButton(page: Page): Promise<Locator | null> {
  const candidates = [
    page.getByRole("button", { name: /submit|apply|继续|提交/i }),
    page.locator('button[type="submit"]'),
    page.locator('input[type="submit"]'),
  ];

  for (const locator of candidates) {
    if (await locator.count()) {
      return locator.first();
    }
  }
  return null;
}


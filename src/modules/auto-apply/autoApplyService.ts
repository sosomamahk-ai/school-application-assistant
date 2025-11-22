import { randomUUID } from "crypto";

import { BrowserManager } from "./engine/browser-manager";
import { FormFiller } from "./engine/form-filler";
import { LoginHandler } from "./engine/login-handler";
import { AutomationUtils } from "./engine/utils";
import type {
  AutoApplyPayload,
  AutoApplyResult,
  AutomationLogger,
  SchoolScriptMap,
} from "./engine/types";
import { exampleSchoolScript } from "./schools/example-school";
import { dscInternationalSchoolScript } from "./schools/dsc-international-school";
import { dscHkis2025Script } from "./schools/dsc-hkis-2025";

export interface AutoApplyServiceOptions {
  logger?: AutomationLogger;
}

const defaultLogger: AutomationLogger = {
  info(message, meta) {
    console.info(`[auto-apply] ${message}`, meta ?? {});
  },
  warn(message, meta) {
    console.warn(`[auto-apply] ${message}`, meta ?? {});
  },
  error(message, meta) {
    console.error(`[auto-apply] ${message}`, meta ?? {});
  },
  child(meta = {}) {
    return {
      info(message, more) {
        defaultLogger.info(message, { ...meta, ...more });
      },
      warn(message, more) {
        defaultLogger.warn(message, { ...meta, ...more });
      },
      error(message, more) {
        defaultLogger.error(message, { ...meta, ...more });
      },
    };
  },
};

const scriptRegistry: SchoolScriptMap = {
  [exampleSchoolScript.id]: exampleSchoolScript,
  [dscInternationalSchoolScript.id]: dscInternationalSchoolScript,
  [dscHkis2025Script.id]: dscHkis2025Script,
};

export class AutoApplyService {
  private readonly logger: AutomationLogger;

  constructor(options: AutoApplyServiceOptions = {}) {
    this.logger = options.logger ?? defaultLogger;
  }

  registerScript(script: SchoolScriptMap[string]) {
    scriptRegistry[script.id] = script;
  }

  async run(payload: AutoApplyPayload): Promise<AutoApplyResult> {
    const runId = payload.runId ?? randomUUID();
    const normalizedPayload: AutoApplyPayload = { ...payload, runId };

    const script = scriptRegistry[normalizedPayload.schoolId];
    if (!script) {
      return {
        success: false,
        message: `No automation script registered for ${normalizedPayload.schoolId}`,
      };
    }

    const browserManager = new BrowserManager({
      headless: process.env.PLAYWRIGHT_HEADLESS !== "false",
    });
    const formFiller = new FormFiller();
    const loginHandler = new LoginHandler();
    const utils = new AutomationUtils({
      screenshotDir:
        normalizedPayload.screenshotDir ??
        process.env.AUTO_APPLY_SCREENSHOTS ??
        "tmp/auto-apply",
    });
    const contextualLogger =
      this.logger.child?.({
        schoolId: normalizedPayload.schoolId,
        runId,
      }) ?? this.logger;

    let context;
    let page;

    try {
      context = await browserManager.newContext({ disposable: true });
      page = await context.newPage();

      return await script.run({
        browserManager,
        context,
        page,
        formFiller,
        loginHandler,
        utils,
        payload: normalizedPayload,
        logger: contextualLogger,
      });
    } catch (error) {
      contextualLogger.error("Auto apply run failed", { error });
      const artifacts = page
        ? {
            screenshotPath: await utils
              .takeScreenshot(page, runId, "auto-apply-error")
              .catch(() => undefined),
            rawHtmlPath: await utils.persistHtmlDump(page, runId).catch(() => undefined),
          }
        : undefined;

      return utils.buildResultWithArtifacts(
        {
          success: false,
          message: (error as Error).message ?? "Auto apply failed",
          errors: [(error as Error).stack ?? String(error)],
        },
        artifacts,
      );
    } finally {
      await Promise.all([
        page?.close().catch(() => undefined),
        context?.close().catch(() => undefined),
        browserManager.dispose(),
      ]);
    }
  }
}

export const autoApplyService = new AutoApplyService();


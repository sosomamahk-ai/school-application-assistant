import type { BrowserContext, Page } from "playwright";

import type { BrowserManager } from "./browser-manager";
import type { FormFiller } from "./form-filler";
import type { LoginHandler } from "./login-handler";
import type { AutomationUtils } from "./utils";

export interface BrowserManagerOptions {
  headless?: boolean;
  slowMo?: number;
  userAgent?: string;
  locale?: string;
  timezoneId?: string;
  proxy?: {
    server: string;
    username?: string;
    password?: string;
  };
  args?: string[];
}

export interface BrowserContextOptions {
  storageStatePath?: string;
  extraHTTPHeaders?: Record<string, string>;
  disposable?: boolean;
}

export interface AutoApplyTemplateField {
  fieldId: string;
  label?: string;
  value: string | string[] | boolean;
  htmlType?: "text" | "textarea" | "select" | "radio" | "checkbox" | "date";
  metadata?: Record<string, unknown>;
}

export interface AutoApplyTemplate {
  id: string;
  name?: string;
  fields: AutoApplyTemplateField[];
  metadata?: Record<string, unknown>;
}

export interface AutoApplyUserLogin {
  username?: string;
  email?: string;
  password?: string;
  extra?: Record<string, string>;
}

export interface AutoApplyPayload {
  schoolId: string;
  template: AutoApplyTemplate;
  userLogin?: AutoApplyUserLogin;
  runId: string;
  locale?: string;
  screenshotDir?: string;
  metadata?: Record<string, unknown>;
}

export interface AutoApplyResult {
  success: boolean;
  message?: string;
  errors?: string[];
  artifacts?: {
    screenshotPath?: string;
    logLines?: string[];
    rawHtmlPath?: string;
  };
}

export interface FieldDetectionHints {
  labelTexts?: string[];
  placeholders?: string[];
  ariaLabels?: string[];
  dataTestIds?: string[];
}

export interface AiMappingInput {
  field: AutoApplyTemplateField;
  pagePreviewText?: string;
}

export interface FieldMappingSuggestion {
  hints?: FieldDetectionHints;
  selector?: string;
  confidence: number;
}

export interface AiFieldMapper {
  generateSuggestion(
    input: AiMappingInput,
  ): Promise<FieldMappingSuggestion | null>;
}

export interface FormFillerOptions {
  aiMapper?: AiFieldMapper;
  typingDelayMs?: number;
}

export interface LoginHandlerOptions {
  maxRetries?: number;
  submitTimeoutMs?: number;
}

export interface AutomationLogger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  child?(meta: Record<string, unknown>): AutomationLogger;
}

export interface AutomationUtilsConfig {
  screenshotDir?: string;
}

export interface SchoolAutomationContext {
  browserManager: BrowserManager;
  context: BrowserContext;
  page: Page;
  formFiller: FormFiller;
  loginHandler: LoginHandler;
  utils: AutomationUtils;
  payload: AutoApplyPayload;
  logger: AutomationLogger;
}

export interface SchoolAutomationScript {
  id: string;
  name: string;
  description?: string;
  supportsLogin?: boolean;
  run(ctx: SchoolAutomationContext): Promise<AutoApplyResult>;
}

export type SchoolScriptMap = Record<string, SchoolAutomationScript>;


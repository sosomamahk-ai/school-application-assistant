import type { Locator, Page } from "playwright";

import type {
  AutoApplyTemplateField,
  FieldMappingSuggestion,
  FormFillerOptions,
} from "./types";

const TEXT_INPUT_SELECTOR =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="file"])';
const TEXTAREA_SELECTOR = "textarea";
const SELECTOR_SELECT = "select";
const CHECKBOX_SELECTOR = 'input[type="checkbox"]';
const RADIO_SELECTOR = 'input[type="radio"]';

export class FormFiller {
  private cachedPagePreview?: string;

  constructor(private readonly options: FormFillerOptions = {}) {}

  async fillFields(page: Page, fields: AutoApplyTemplateField[]) {
    for (const field of fields) {
      await this.fillField(page, field);
    }
  }

  async fillField(page: Page, field: AutoApplyTemplateField) {
    const locator = await this.locateField(page, field);
    if (!locator) {
      throw new Error(`Unable to locate field ${field.fieldId}`);
    }

    const nodeName = await locator.evaluate((el) =>
      el.tagName.toLowerCase(),
    );

    if (nodeName === "textarea") {
      await this.fillText(locator, field.value as string);
      return;
    }

    if (nodeName === "select") {
      await this.selectValue(locator, field.value);
      return;
    }

    const type = await locator.evaluate((el) =>
      (el as HTMLInputElement).type ?? "text",
    );

    if (type === "radio") {
      await this.selectRadio(locator, field.value as string);
      return;
    }

    if (type === "checkbox") {
      await this.toggleCheckbox(locator, field.value);
      return;
    }

    await this.fillText(locator, field.value as string);
  }

  private async fillText(locator: Locator, value: string) {
    await locator.scrollIntoViewIfNeeded();
    await locator.click({ trial: true }).catch(() => undefined);
    await locator.fill("");
    if (this.options.typingDelayMs) {
      await locator.type(value, { delay: this.options.typingDelayMs });
    } else {
      await locator.fill(value);
    }
  }

  private async selectValue(locator: Locator, value: unknown) {
    await locator.scrollIntoViewIfNeeded();
    if (Array.isArray(value)) {
      await locator.selectOption(value.map((v) => ({ label: `${v}`, value: `${v}` })));
      return;
    }
    await locator.selectOption({ label: `${value}`, value: `${value}` });
  }

  private async selectRadio(locator: Locator, value: string) {
    const groupName = await locator.getAttribute("name");
    if (!groupName) {
      await locator.check();
      return;
    }

    const page = locator.page();
    const candidates = page.locator(`input[type="radio"][name="${groupName}"]`);
    const count = await candidates.count();
    for (let i = 0; i < count; i += 1) {
      const candidate = candidates.nth(i);
      const text = await candidate.evaluate((el) => el.getAttribute("value") ?? el.getAttribute("aria-label"));
      if (text && text.toLowerCase().includes(value.toLowerCase())) {
        await candidate.check();
        return;
      }
    }

    await locator.check();
  }

  private async toggleCheckbox(locator: Locator, value: unknown) {
    const shouldCheck = typeof value === "boolean" ? value : Boolean(value);
    const isChecked = await locator.isChecked();
    if (shouldCheck !== isChecked) {
      await locator.click();
    }
  }

  private async locateField(
    page: Page,
    field: AutoApplyTemplateField,
  ): Promise<Locator | null> {
    const terms = this.buildSearchTerms(field);

    for (const term of terms) {
      const labelMatch = page.getByLabel(term, { exact: false });
      if (await labelMatch.count()) {
        return labelMatch.first();
      }
    }

    for (const term of terms) {
      const selector = `${TEXT_INPUT_SELECTOR}[placeholder*="${term}" i], ${TEXTAREA_SELECTOR}[placeholder*="${term}" i]`;
      const placeholderMatch = page.locator(selector);
      if (await placeholderMatch.count()) {
        return placeholderMatch.first();
      }
    }

    for (const term of terms) {
      const ariaMatch = page.locator(
        `${TEXT_INPUT_SELECTOR}[aria-label*="${term}" i], ${TEXTAREA_SELECTOR}[aria-label*="${term}" i]`,
      );
      if (await ariaMatch.count()) {
        return ariaMatch.first();
      }
    }

    for (const term of terms) {
      const selectMatch = page.locator(
        `${SELECTOR_SELECT}[aria-label*="${term}" i], ${SELECTOR_SELECT}[data-testid*="${term}" i]`,
      );
      if (await selectMatch.count()) {
        return selectMatch.first();
      }
    }

    for (const term of terms) {
      const checkboxMatch = page.locator(
        `${CHECKBOX_SELECTOR}[name*="${term}" i], ${CHECKBOX_SELECTOR}[aria-label*="${term}" i]`,
      );
      if (await checkboxMatch.count()) {
        return checkboxMatch.first();
      }
    }

    for (const term of terms) {
      const radioMatch = page.locator(
        `${RADIO_SELECTOR}[name*="${term}" i], ${RADIO_SELECTOR}[aria-label*="${term}" i]`,
      );
      if (await radioMatch.count()) {
        return radioMatch.first();
      }
    }

    const aiSuggestion = await this.tryAiSuggestion(page, field);
    if (aiSuggestion?.selector) {
      const aiLocator = page.locator(aiSuggestion.selector);
      if (await aiLocator.count()) {
        return aiLocator.first();
      }
    }

    if (aiSuggestion?.hints?.labelTexts) {
      for (const hint of aiSuggestion.hints.labelTexts) {
        const locator = page.getByLabel(hint, { exact: false });
        if (await locator.count()) {
          return locator.first();
        }
      }
    }

    return null;
  }

  private buildSearchTerms(field: AutoApplyTemplateField): string[] {
    const terms = new Set<string>();
    if (field.label) {
      terms.add(field.label);
    }
    terms.add(field.fieldId);

    const normalized = Array.from(terms)
      .flatMap((term) =>
        term
          .split(/[\s_\-]+/)
          .map((part) => part.trim())
          .filter(Boolean),
      )
      .map((term) => term.toLowerCase());

    return Array.from(new Set([...terms, ...normalized]));
  }

  private async tryAiSuggestion(
    page: Page,
    field: AutoApplyTemplateField,
  ): Promise<FieldMappingSuggestion | null> {
    if (!this.options.aiMapper) {
      return null;
    }

    if (!this.cachedPagePreview) {
      this.cachedPagePreview = await page.evaluate(() =>
        document.body.innerText.slice(0, 5000),
      );
    }

    return this.options.aiMapper.generateSuggestion({
      field,
      pagePreviewText: this.cachedPagePreview,
    });
  }
}


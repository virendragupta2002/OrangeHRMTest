const { WaitHelper } = require('../utils/WaitHelper');
const { ScreenshotHelper } = require('../utils/ScreenshotHelper');
const { RetryHelper } = require('../utils/RetryHelper');

class BasePage {
  constructor(page) {
    this.page = page;
    this.wait = new WaitHelper(page);
  }

  // Accepts either a CSS selector string or a Playwright Locator object
  _loc(selectorOrLocator) {
    return typeof selectorOrLocator === 'string'
      ? this.page.locator(selectorOrLocator).first()
      : selectorOrLocator.first();
  }

  async navigate(path) {
    await RetryHelper.retryNavigation(this.page, path);
    await this.wait.waitForSpinnerToDisappear();
  }

  async click(selectorOrLocator, options = {}) {
    const locator = this._loc(selectorOrLocator);
    await locator.waitFor({ state: 'visible', timeout: options.timeout || 15000 });
    await locator.scrollIntoViewIfNeeded();
    await locator.click(options);
    await this.wait.waitForSpinnerToDisappear(5000).catch(() => {});
  }

  async fill(selectorOrLocator, value, options = {}) {
    const locator = this._loc(selectorOrLocator);
    await locator.waitFor({ state: 'visible', timeout: options.timeout || 15000 });
    await locator.clear();
    await locator.fill(String(value));
  }

  async selectOption(selectorOrLocator, value) {
    const locator = this._loc(selectorOrLocator);
    await locator.waitFor({ state: 'visible', timeout: 15000 });
    await locator.selectOption(value);
  }

  async selectDropdown(triggerSelector, optionText) {
    await this.click(triggerSelector);
    await this.page.waitForTimeout(500);
    const option = this.page.locator('.oxd-select-dropdown span', { hasText: optionText }).first();
    await option.waitFor({ state: 'visible', timeout: 10000 });
    await option.click();
  }

  async selectAutoComplete(inputSelector, value) {
    const input = this.page.locator(inputSelector).first();
    await input.waitFor({ state: 'visible', timeout: 15000 });
    await input.clear();
    await input.fill(value);
    await this.page.waitForTimeout(1000);

    const option = this.page.locator('.oxd-autocomplete-dropdown span', {
      hasText: value,
    }).first();
    await option.waitFor({ state: 'visible', timeout: 10000 });
    await option.click();
  }

  async getText(selectorOrLocator) {
    const locator = this._loc(selectorOrLocator);
    await locator.waitFor({ state: 'visible', timeout: 10000 });
    return (await locator.textContent()).trim();
  }

  async isVisible(selectorOrLocator, timeout = 5000) {
    try {
      await this._loc(selectorOrLocator).waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  async isEnabled(selectorOrLocator) {
    return this._loc(selectorOrLocator).isEnabled();
  }

  async waitForToast(expectedText = null, timeout = 10000) {
    const toast = this.page.locator('.oxd-toast').first();
    await toast.waitFor({ state: 'visible', timeout });

    if (expectedText) {
      await this.page.waitForFunction(
        ({ selector, text }) => {
          const el = document.querySelector(selector);
          return el && el.textContent.includes(text);
        },
        { selector: '.oxd-toast', text: expectedText },
        { timeout }
      );
    }

    const message = await toast.textContent();
    await toast.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
    return message.trim();
  }

  async getToastType() {
    const successToast = this.page.locator('.oxd-toast--success');
    const errorToast = this.page.locator('.oxd-toast--error');

    if (await successToast.count() > 0) return 'success';
    if (await errorToast.count() > 0) return 'error';
    return 'unknown';
  }

  async screenshot(name) {
    return ScreenshotHelper.capture(this.page, name);
  }

  async getPageTitle() {
    return this.page.title();
  }

  async getCurrentUrl() {
    return this.page.url();
  }

  async scrollToElement(selectorOrLocator) {
    await this._loc(selectorOrLocator).scrollIntoViewIfNeeded();
  }

  async hoverElement(selectorOrLocator) {
    await this._loc(selectorOrLocator).hover();
  }

  async pressKey(key) {
    await this.page.keyboard.press(key);
  }

  async waitForPageLoad() {
    await this.wait.waitForSpinnerToDisappear();
    await this.wait.waitForNetworkIdle(5000).catch(() => {});
  }
}

module.exports = { BasePage };

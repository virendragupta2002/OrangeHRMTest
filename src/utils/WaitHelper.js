class WaitHelper {
  constructor(page) {
    this.page = page;
  }

  async waitForNetworkIdle(timeout = 10000) {
    await this.page.waitForLoadState('networkidle', { timeout });
  }

  async waitForDOMContent(timeout = 10000) {
    await this.page.waitForLoadState('domcontentloaded', { timeout });
  }

  async waitForElement(selector, options = {}) {
    const { timeout = 30000, state = 'visible' } = options;
    return await this.page.waitForSelector(selector, { timeout, state });
  }

  async waitForElementToDisappear(selector, timeout = 15000) {
    await this.page.waitForSelector(selector, { state: 'hidden', timeout });
  }

  async waitForText(text, timeout = 15000) {
    await this.page.waitForFunction(
      (searchText) => document.body.innerText.includes(searchText),
      text,
      { timeout }
    );
  }

  async waitForUrl(urlPattern, timeout = 30000) {
    await this.page.waitForURL(urlPattern, { timeout });
  }

  async waitForSpinnerToDisappear(timeout = 30000) {
    const spinnerSelectors = [
      '.oxd-loading-spinner',
      '[class*="spinner"]',
      '.loading',
      '[data-testid="spinner"]',
    ];

    for (const selector of spinnerSelectors) {
      const spinner = this.page.locator(selector);
      const count = await spinner.count();
      if (count > 0) {
        await spinner.first().waitFor({ state: 'hidden', timeout });
      }
    }
  }

  async waitForToastToDisappear(timeout = 10000) {
    const toast = this.page.locator('.oxd-toast');
    const count = await toast.count();
    if (count > 0) {
      await toast.waitFor({ state: 'hidden', timeout });
    }
  }

  async waitForApiResponse(urlPattern, action, timeout = 30000) {
    const [response] = await Promise.all([
      this.page.waitForResponse(
        (res) => res.url().includes(urlPattern) && res.status() < 400,
        { timeout }
      ),
      action(),
    ]);
    return response;
  }

  async retryUntil(condition, { maxAttempts = 5, delay = 1000, timeout = 30000 } = {}) {
    const start = Date.now();
    let attempt = 0;

    while (attempt < maxAttempts) {
      if (Date.now() - start > timeout) {
        throw new Error(`Condition not met within ${timeout}ms after ${attempt} attempts`);
      }

      try {
        const result = await condition();
        if (result) return result;
      } catch {
        // continue retrying
      }

      attempt++;
      if (attempt < maxAttempts) {
        await this.page.waitForTimeout(delay);
      }
    }

    throw new Error(`Condition not met after ${maxAttempts} attempts`);
  }

  static async sleep(ms) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = { WaitHelper };

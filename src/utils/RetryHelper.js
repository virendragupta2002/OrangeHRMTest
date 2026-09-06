class RetryHelper {
  static async retry(fn, options = {}) {
    const {
      maxRetries = 3,
      delay = 1000,
      backoff = 1.5,
      onRetry = null,
      retryOn = null,
    } = options;

    let lastError;
    let currentDelay = delay;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        return await fn(attempt);
      } catch (error) {
        lastError = error;

        if (retryOn && !retryOn(error)) {
          throw error;
        }

        if (attempt > maxRetries) break;

        if (onRetry) {
          await onRetry(error, attempt);
        } else {
          console.warn(`[RetryHelper] Attempt ${attempt} failed: ${error.message}. Retrying in ${currentDelay}ms...`);
        }

        await new Promise((resolve) => setTimeout(resolve, currentDelay));
        currentDelay = Math.floor(currentDelay * backoff);
      }
    }

    throw lastError;
  }

  static async retryClick(page, selector, options = {}) {
    return this.retry(
      async () => {
        await page.locator(selector).click({ timeout: 5000 });
      },
      {
        maxRetries: 3,
        delay: 500,
        retryOn: (error) => error.message.includes('timeout') || error.message.includes('detached'),
        ...options,
      }
    );
  }

  static async retryFill(page, selector, value, options = {}) {
    return this.retry(
      async () => {
        const locator = page.locator(selector);
        await locator.waitFor({ state: 'visible', timeout: 5000 });
        await locator.clear();
        await locator.fill(value);
      },
      {
        maxRetries: 3,
        delay: 500,
        ...options,
      }
    );
  }

  static async retryNavigation(page, url, options = {}) {
    return this.retry(
      async () => {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      },
      {
        maxRetries: 3,
        delay: 2000,
        retryOn: (error) =>
          error.message.includes('net::') ||
          error.message.includes('Navigation') ||
          error.message.includes('timeout'),
        ...options,
      }
    );
  }

  static async retryApiCall(apiCall, options = {}) {
    return this.retry(apiCall, {
      maxRetries: 3,
      delay: 1000,
      backoff: 2,
      retryOn: (error) => {
        const status = error.response?.status;
        return !status || status === 429 || status >= 500;
      },
      ...options,
    });
  }

  static async withTimeout(promise, timeout, message = 'Operation timed out') {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(message)), timeout)
      ),
    ]);
  }
}

module.exports = { RetryHelper };

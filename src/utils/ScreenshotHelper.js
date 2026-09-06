const fs = require('fs');
const path = require('path');

class ScreenshotHelper {
  static screenshotDir = path.resolve(process.cwd(), 'test-results/screenshots');

  static ensureDir(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  static sanitizeFilename(name) {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 100);
  }

  static async capture(page, name, options = {}) {
    const { fullPage = true, type = 'png' } = options;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${this.sanitizeFilename(name)}_${timestamp}.${type}`;
    const dir = options.dir || this.screenshotDir;

    this.ensureDir(dir);
    const filepath = path.join(dir, filename);

    await page.screenshot({ path: filepath, fullPage, type });
    console.log(`[Screenshot] Saved: ${filepath}`);
    return filepath;
  }

  static async captureOnFailure(page, testInfo) {
    const dir = path.join(this.screenshotDir, 'failures');
    this.ensureDir(dir);

    const filename = `FAIL_${this.sanitizeFilename(testInfo.title)}_${Date.now()}.png`;
    const filepath = path.join(dir, filename);

    await page.screenshot({ path: filepath, fullPage: true });
    await testInfo.attach('failure-screenshot', {
      path: filepath,
      contentType: 'image/png',
    });

    console.error(`[Screenshot] Failure captured: ${filepath}`);
    return filepath;
  }

  static async captureElement(page, selector, name, options = {}) {
    const dir = options.dir || this.screenshotDir;
    this.ensureDir(dir);

    const timestamp = Date.now();
    const filename = `${this.sanitizeFilename(name)}_${timestamp}.png`;
    const filepath = path.join(dir, filename);

    const element = page.locator(selector).first();
    await element.screenshot({ path: filepath });
    return filepath;
  }

  static async captureWithHighlight(page, selector, name) {
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (el) {
        el.style.outline = '3px solid red';
        el.style.outlineOffset = '2px';
      }
    }, selector);

    const filepath = await this.capture(page, name);

    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (el) {
        el.style.outline = '';
        el.style.outlineOffset = '';
      }
    }, selector);

    return filepath;
  }

  static async captureViewport(page, name) {
    return this.capture(page, name, { fullPage: false });
  }
}

module.exports = { ScreenshotHelper };

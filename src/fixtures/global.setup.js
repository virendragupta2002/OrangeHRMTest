const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { ConfigLoader } = require('../utils/ConfigLoader');
const { admin } = require('../../test-data/credentials.js');

const AUTH_STATE_FILE = path.resolve(process.cwd(), '.auth/admin.json');

async function globalSetup() {
  const env = process.env.ENVIRONMENT || 'dev';
  const config = ConfigLoader.load(env);

  console.log(`\n[GlobalSetup] Environment: ${env}`);
  console.log(`[GlobalSetup] Base URL: ${config.baseUrl}`);

  const dirs = [
    '.auth',
    'allure-results',
    'test-results',
    'test-results/screenshots',
    'reports',
  ];

  for (const dir of dirs) {
    const fullPath = path.resolve(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }

  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();

    const creds = admin;

    console.log(`[GlobalSetup] Logging in as: ${creds.username}`);
    await page.goto(`${config.baseUrl}/web/index.php/auth/login`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    await page.fill('input[name="username"]', creds.username);
    await page.fill('input[name="password"]', creds.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard/index', { timeout: 30000 });

    await context.storageState({ path: AUTH_STATE_FILE });
    console.log(`[GlobalSetup] Auth state saved to: ${AUTH_STATE_FILE}`);

    await context.close();
  } catch (error) {
    console.error(`[GlobalSetup] Failed: ${error.message}`);
    throw error;
  } finally {
    await browser.close();
  }

  console.log('[GlobalSetup] Complete\n');
}

module.exports = globalSetup;

// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const { ConfigLoader } = require('./src/utils/ConfigLoader');

const env = process.env.ENVIRONMENT || 'dev';
const config = ConfigLoader.load(env);

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 4 : 2,
  timeout: 60000,
  expect: { timeout: 15000 },

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['allure-playwright', {
      detail: true,
      outputFolder: 'allure-results',
      suiteTitle: false,
      categories: [
        {
          name: 'Ignored tests',
          messageRegex: '.*ignored.*',
          matchedStatuses: ['skipped'],
        },
        {
          name: 'Infrastructure problems',
          messageRegex: '.*net::ERR.*|.*TimeoutError.*|.*Navigation.*',
          matchedStatuses: ['broken'],
        },
        {
          name: 'Flaky tests',
          matchedStatuses: ['flaky'],
        },
      ],
    }],
    ['junit', { outputFile: 'reports/junit-results.xml' }],
  ],

  use: {
    baseURL: config.baseUrl,
    headless: process.env.HEADED !== 'true',
    viewport: { width: 1280, height: 720 },
    actionTimeout: 30000,
    navigationTimeout: 30000,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    ignoreHTTPSErrors: true,
    locale: 'en-US',
    timezoneId: 'America/New_York',
  },

  projects: [
    // --- Global login setup ---
    {
      name: 'setup',
      testMatch: /global\.setup\.js/,
    },

    // --- Ordered execution using project dependencies ---
    // Each project waits for the previous one to fully complete before starting.

    {
      name: '1-auth',
      testMatch: /login\.spec\.js/,
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
      dependencies: ['setup'],
    },
    {
      name: '2-employee-create',
      testMatch: /employee-create\.spec\.js/,
      use: { ...devices['Desktop Chrome'], channel: 'chrome', storageState: '.auth/admin.json' },
      dependencies: ['1-auth'],
    },
    {
      name: '3-employee-update',
      testMatch: /employee-update\.spec\.js/,
      use: { ...devices['Desktop Chrome'], channel: 'chrome', storageState: '.auth/admin.json' },
      dependencies: ['2-employee-create'],
    },
    {
      name: '4-employee-delete',
      testMatch: /employee-delete\.spec\.js/,
      use: { ...devices['Desktop Chrome'], channel: 'chrome', storageState: '.auth/admin.json' },
      dependencies: ['3-employee-update'],
    },
    {
      name: '5-role-validation',
      testMatch: /role-validation\.spec\.js/,
      use: { ...devices['Desktop Chrome'], channel: 'chrome', storageState: '.auth/admin.json' },
      dependencies: ['4-employee-delete'],
    },
    {
      name: '6-api',
      testMatch: /employee-api\.spec\.js/,
      use: { ...devices['Desktop Chrome'], channel: 'chrome', storageState: '.auth/admin.json' },
      dependencies: ['5-role-validation'],
    },
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    //   dependencies: ['setup'],
    // },
    // {
    //   name: 'edge',
    //   use: {
    //     ...devices['Desktop Edge'],
    //     channel: 'msedge',
    //   },
    //   dependencies: ['setup'],
    // },
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    //   dependencies: ['setup'],
    // },
  ],

  outputDir: 'test-results/',
  globalSetup: require.resolve('./src/fixtures/global.setup.js'),
  globalTeardown: require.resolve('./src/fixtures/global.teardown.js'),
});

const { test, expect } = require('../../src/fixtures/fixtures');

test.describe('@smoke @regression Authentication', () => {
  // Auth tests must start without a session so login/redirect flows work correctly
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('TC_AUTH_001 - Login page renders required elements', async ({ loginPage }) => {
    expect(await loginPage.isLoginPageVisible()).toBe(true);
    expect(await loginPage.isLogoVisible()).toBe(true);
  });

  test('TC_AUTH_002 - Admin login with valid credentials', async ({ loginPage, dashboardPage }) => {
    await loginPage.loginAsAdmin();
    expect(await dashboardPage.isLoaded()).toBe(true);
    // Just verify a welcome message is shown — display name varies on shared demo site
    const welcome = await dashboardPage.getWelcomeMessage();
    expect(welcome.length).toBeGreaterThan(0);
  });

  test('TC_AUTH_003 - Login fails with invalid credentials', async ({ loginPage }) => {
    await loginPage.login('invalid_user', 'wrong_password');
    const errorMsg = await loginPage.getErrorMessage();
    expect(errorMsg).toMatch(/Invalid credentials|failed/i);
  });

  test('TC_AUTH_004 - Session persists on page refresh', async ({ loginPage, dashboardPage, page }) => {
    await loginPage.loginAsAdmin();
    await dashboardPage.isLoaded();
    await page.reload({ waitUntil: 'domcontentloaded' });
    expect(await dashboardPage.isLoaded()).toBe(true);
  });

  test('TC_AUTH_005 - Forgot your password button navigates to reset page', async ({ loginPage }) => {
    await loginPage.clickForgotPassword();
    await loginPage.page.waitForURL('**/auth/requestPasswordResetCode', { timeout: 10000 });
    expect(loginPage.page.url()).toContain('/auth/requestPasswordResetCode');
  });

});

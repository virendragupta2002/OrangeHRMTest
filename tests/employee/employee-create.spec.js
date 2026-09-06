const { test, expect } = require('../../src/fixtures/fixtures');

test.describe('@regression Employee Creation', () => {
  // storageState in playwright.config.js keeps each test logged in automatically.
  // We just navigate to the dashboard to confirm the session is active.
  test.beforeEach(async ({ page }) => {
    await page.goto('/web/index.php/dashboard/index');
  });

  test('TC_EMP_CREATE_001 - Create new employee', async ({
    page,
    employeeListPage,
    addEmployeePage,
    testEmployee,
  }, testInfo) => {

    await test.step('Navigate to Add Employee page', async () => {
      await employeeListPage.goto();
      await employeeListPage.clickAddEmployee();
    });

    await test.step('Fill and submit employee form', async () => {
      await addEmployeePage.addEmployee(testEmployee);
      // OrangeHRM redirects to personal details only on a successful save
      await expect(addEmployeePage.page).toHaveURL(/pim\/viewPersonalDetails/, { timeout: 20000 });
    });

    await test.step('Verify employee appears in PIM list', async () => {
      // Build full name from all three parts so search and list check use the same value
      const fullName = [testEmployee.firstName, testEmployee.middleName, testEmployee.lastName]
        .filter(n => n && n.trim())
        .join(' ');

      // Brief wait — shared demo site takes a moment to index a newly created employee
      await page.waitForTimeout(2000);

      await employeeListPage.goto();
      await employeeListPage.searchByName(fullName);

      const found = await employeeListPage.isEmployeeInList(fullName);
      expect(found).toBe(true);

      // Attach a screenshot as confirmation in the HTML and Allure report
      const screenshot = await page.screenshot();
      await testInfo.attach('Employee found in PIM list', {
        body: screenshot,
        contentType: 'image/png',
      });
    });

  });
});

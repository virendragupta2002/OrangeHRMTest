const { test, expect } = require('../../src/fixtures/fixtures');

const employees = require('../../test-data/employees.js');

test.describe('@regression Employee Update', () => {
  const employee = employees[0];
  const fullName = [employee.firstName, employee.middleName, employee.lastName]
    .filter(n => n && n.trim())
    .join(' ');

  test.beforeEach(async ({ page, loginPage, dashboardPage }) => {
    await page.context().clearCookies();
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    await dashboardPage.isLoaded();
  });

  test('TC_EMP_UPDATE_001 - Update mobile number of employee found by name search', async ({
    employeeListPage,
    editEmployeePage,
  }) => {
    await employeeListPage.goto();
    await employeeListPage.searchByName(fullName);

    const found = await employeeListPage.isEmployeeInList(fullName);
    if (!found) {
      test.skip(true, `No records found for "${fullName}" — nothing to update`);
      return;
    }

    await employeeListPage.clickEditForEmployee();
    await editEmployeePage.waitForLoad();
    const toast = await editEmployeePage.updateContactDetails({
      mobile: employee.phone,
    });
    expect(toast).toContain('Successfully Updated');
  });

  test('TC_EMP_UPDATE_002 - Update work email of employee found by name search', async ({
    employeeListPage,
    editEmployeePage,
  }) => {
    await employeeListPage.goto();
    await employeeListPage.searchByName(fullName);

    const found = await employeeListPage.isEmployeeInList(fullName);
    if (!found) {
      test.skip(true, `No records found for "${fullName}" — nothing to update`);
      return;
    }

    await employeeListPage.clickEditForEmployee();
    await editEmployeePage.waitForLoad();
    const toast = await editEmployeePage.updateContactDetails({
      workEmail: employee.email,
    });
    expect(toast).toContain('Successfully Updated');
  });

});

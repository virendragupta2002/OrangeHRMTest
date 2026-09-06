const { test, expect } = require('../../src/fixtures/fixtures');

const employees = require('../../test-data/employees.js');

test.describe('@regression Employee Deletion', () => {
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

  test('TC_EMP_DELETE_001 - Delete employee by name search', async ({ employeeListPage }) => {
    await employeeListPage.goto();
    await employeeListPage.searchByName(fullName);

    const found = await employeeListPage.isEmployeeInList(fullName);
    if (!found) {
      test.skip(true, `No records found for "${fullName}" — nothing to delete`);
      return;
    }

    // Capture the specific employee ID before deleting — multiple employees
    // may share the same name, so verify by ID not by name after deletion
    const employeeId = await employeeListPage.getEmployeeIdFromList(fullName);

    await employeeListPage.clickDeleteForEmployee();
    await employeeListPage.confirmDelete();

    // Search by the specific ID — that exact record should be gone
    await employeeListPage.resetSearch();
    await employeeListPage.searchByEmployeeId(employeeId);
    const stillExists = await employeeListPage.isEmployeeInList(fullName);
    expect(stillExists).toBe(false);
  });

  // test('TC_EMP_DELETE_002 - Delete employee by employee ID search', async ({ employeeListPage }) => {
  //   await employeeListPage.goto();
  //   await employeeListPage.searchByName(fullName);

  //   const found = await employeeListPage.isEmployeeInList(fullName);
  //   if (!found) {
  //     test.skip(true, `No records found for "${fullName}" — nothing to delete`);
  //     return;
  //   }

  //   const employeeId = await employeeListPage.getEmployeeIdFromList(fullName);
  //   await employeeListPage.resetSearch();
  //   await employeeListPage.searchByEmployeeId(employeeId);

  //   await employeeListPage.clickDeleteForEmployee();
  //   await employeeListPage.confirmDelete();

  //   // Verify deletion by searching again — employee should no longer appear
  //   await employeeListPage.searchByEmployeeId(employeeId);
  //   const stillExists = await employeeListPage.isEmployeeInList(fullName);
  //   expect(stillExists).toBe(false);
  // });

});

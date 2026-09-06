const { test, expect } = require('../../src/fixtures/fixtures');

const employees = require('../../test-data/employees.js');

test.describe('@regression Role-Based Validation', () => {
  // Demo site is slow and shared — allow more retries and longer timeout per test
  test.describe.configure({ retries: 2, timeout: 120000 });
  let employee;
  let systemUser;

  test.beforeEach(async ({ page, employeeListPage, addEmployeePage }) => {
    await page.goto('/web/index.php/dashboard/index');

    // Bob is used here — Alice is reserved for employee-create, update and delete tests
    employee = employees[1];

    // Create the employee on OrangeHRM — role can only be assigned to an existing employee
    await employeeListPage.goto();
    await employeeListPage.clickAddEmployee();
    await addEmployeePage.addEmployee(employee);
    await addEmployeePage.page.waitForURL(/pim\/viewPersonalDetails/, { timeout: 60000 });

    // Build the system user object for this employee
    systemUser = {
      ...employee,
      username: `ess_${Date.now().toString().slice(-6)}`, // unique per run
      password: 'Test@1234!',
      role: 'ESS',
      status: 'Enabled',
    };
  });

  test('TC_ROLE_001 - Admin can assign ESS role to an employee', async ({
    userManagementPage,
  }) => {
    await userManagementPage.goto();
    await userManagementPage.createUser(systemUser);

    const toast = await userManagementPage.waitForToast(null, 10000);
    expect(toast).toContain('Successfully Saved');

    // Clean up
    await userManagementPage.goto();
    await userManagementPage.deleteUser(systemUser.username);
  });

  test('TC_ROLE_002 - Assigned ESS role appears correctly in User Management', async ({
    userManagementPage,
  }) => {
    await userManagementPage.goto();
    await userManagementPage.createUser(systemUser);
    await userManagementPage.waitForToast(null, 10000);

    // Search for the user and verify the role shown is ESS
    await userManagementPage.goto();
    await userManagementPage.searchByUsername(systemUser.username);

    const isPresent = await userManagementPage.isUserInList(systemUser.username);
    expect(isPresent).toBe(true);

    const role = await userManagementPage.getUserRoleForUser(systemUser.username);
    expect(role).toContain('ESS');

    // Clean up
    await userManagementPage.deleteUser(systemUser.username);
  });

});

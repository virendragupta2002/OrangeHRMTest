const { test: base, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { DashboardPage } = require('../pages/DashboardPage');
const { EmployeeListPage } = require('../pages/EmployeeListPage');
const { AddEmployeePage } = require('../pages/AddEmployeePage');
const { EditEmployeePage } = require('../pages/EditEmployeePage');
const { UserManagementPage } = require('../pages/UserManagementPage');
const { EmployeeApi } = require('../api/EmployeeApi');
const { ScreenshotHelper } = require('../utils/ScreenshotHelper');
const { admin } = require('../../test-data/credentials.js');

const employees = require('../../test-data/employees.js');
let employeeIndex = 0; // increments each time testEmployee fixture is used

const test = base.extend({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  employeeListPage: async ({ page }, use) => {
    await use(new EmployeeListPage(page));
  },

  addEmployeePage: async ({ page }, use) => {
    await use(new AddEmployeePage(page));
  },

  editEmployeePage: async ({ page }, use) => {
    await use(new EditEmployeePage(page));
  },

  userManagementPage: async ({ page }, use) => {
    await use(new UserManagementPage(page));
  },

  employeeApi: async ({ request }, use) => {
    await use(new EmployeeApi(request));
  },

  authenticatedPage: async ({ page, loginPage, dashboardPage }, use) => {
    await loginPage.goto();
    await loginPage.login(admin.username, admin.password);
    await dashboardPage.isLoaded();
    await use(page);
  },

  authenticatedApi: async ({ request }, use) => {
    // request fixture carries the admin session from storageState — no separate login needed
    await use(new EmployeeApi(request));
  },

  testEmployee: async ({}, use) => {
    const base = employees[employeeIndex % employees.length];
    employeeIndex++;
    const ts = Date.now().toString().slice(-4);
    await use({
      ...base,
      username: `${base.firstName.toLowerCase()}${ts}`,
      password: 'Test@1234!',
    });
  },
});

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === 'failed') {
    await ScreenshotHelper.captureOnFailure(page, testInfo);
  }
});

module.exports = { test, expect };

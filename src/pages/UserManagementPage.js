const { BasePage } = require('./BasePage');

class UserManagementPage extends BasePage {
  constructor(page) {
    super(page);
    this.addUserButton   = page.getByRole('button', { name: 'Add' });
    this.saveButton      = page.getByRole('button', { name: 'Save' });
    this.searchButton    = page.getByRole('button', { name: 'Search' });
    this.resetButton     = page.getByRole('button', { name: 'Reset' });
    // Keep CSS for dropdowns and complex form fields with no clear ARIA role
    this.userRoleDropdown    = '.oxd-input-group:has(.oxd-label:has-text("User Role")) .oxd-select-wrapper';
    this.statusDropdown      = '.oxd-input-group:has(.oxd-label:has-text("Status")) .oxd-select-wrapper';
    this.employeeNameInput   = '.oxd-input-group:has(.oxd-label:has-text("Employee Name")) input';
    this.tableRows           = '.oxd-table-body .oxd-table-row';
  }

  async goto() {
    await this.navigate('/web/index.php/admin/viewSystemUsers');
    await this.waitForPageLoad();
  }

  async clickAddUser() {
    await this.click(this.addUserButton);
    await this.page.waitForURL('**/admin/saveSystemUser', { timeout: 15000 });
    await this.wait.waitForSpinnerToDisappear(10000);
  }

  async setUserRole(role) {
    const roleWrapper = this.page.locator(this.userRoleDropdown);
    await roleWrapper.click();
    await this.page.locator('.oxd-select-dropdown span', { hasText: role }).first().click();
  }

  async setStatus(status) {
    const statusWrapper = this.page.locator(this.statusDropdown);
    await statusWrapper.click();
    await this.page.locator('.oxd-select-dropdown span', { hasText: status }).first().click();
  }

  async setEmployeeName(name) {
    await this.selectAutoComplete(this.employeeNameInput, name);
  }

  async setUsername(username) {
    const usernameInput = this.page.locator('.oxd-input-group:has(.oxd-label:has-text("Username")) input');
    await usernameInput.waitFor({ state: 'visible', timeout: 10000 });
    await usernameInput.fill(username);
  }

  async setPassword(password, confirm) {
    const passwordFields = this.page.locator('input[type="password"]');
    await passwordFields.first().fill(password);
    await passwordFields.last().fill(confirm || password);
  }

  async createUser(userData) {
    await this.clickAddUser();
    await this.setUserRole(userData.role || 'ESS');
    await this.page.waitForTimeout(500);
    await this.setEmployeeName(`${userData.firstName} ${userData.lastName}`);
    await this.page.waitForTimeout(500);
    await this.setStatus(userData.status || 'Enabled');
    await this.setUsername(userData.username);
    await this.setPassword(userData.password);

    // Click Save and wait for the loading spinner to finish
    await this.click(this.saveButton);
    await this.wait.waitForSpinnerToDisappear(15000);
  }

  async searchByUsername(username) {
    const usernameInput = this.page.locator('.oxd-input-group:has(.oxd-label:has-text("Username")) input');
    await usernameInput.waitFor({ state: 'visible', timeout: 10000 });
    await usernameInput.fill(username);
    await this.click(this.searchButton);
    await this.wait.waitForSpinnerToDisappear(10000);
    await this.page.waitForTimeout(1000);
  }

  async isUserInList(username) {
    const rows = await this.page.locator(this.tableRows).count();
    for (let i = 0; i < rows; i++) {
      const text = await this.page.locator(this.tableRows).nth(i).textContent();
      if (text.includes(username)) return true;
    }
    return false;
  }

  async getUserRoleForUser(username) {
    const rows = this.page.locator(this.tableRows);
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const text = await row.textContent();
      if (text.includes(username)) {
        const cells = row.locator('.oxd-table-cell');
        return (await cells.nth(2).textContent()).trim();
      }
    }
    return null;
  }

  async deleteUser(username) {
    const rows = this.page.locator(this.tableRows);
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const text = await row.textContent();
      if (text.includes(username)) {
        await row.locator('button:has(.bi-trash)').click();
        const confirmBtn = this.page.getByRole('button', { name: 'Yes, Delete' });
        await confirmBtn.waitFor({ state: 'visible', timeout: 10000 });
        await confirmBtn.click();
        await this.wait.waitForSpinnerToDisappear(15000);
        return true;
      }
    }
    return false;
  }
}

module.exports = { UserManagementPage };

const { BasePage } = require('./BasePage');

class EmployeeListPage extends BasePage {
  constructor(page) {
    super(page);
    // Employee Name is a single autocomplete — "First Name" / "Last Name" inputs do not exist
    this.searchNameInput       = page.getByPlaceholder('Type for hints...').first();
    this.searchEmployeeIdInput = '.oxd-input-group:has(.oxd-label:has-text("Employee Id")) input';
    this.searchButton          = page.getByRole('button', { name: 'Search' });
    this.resetButton           = page.getByRole('button', { name: 'Reset' });
    // Table selectors have no clean getByRole equivalent — keep as CSS
    this.tableRows     = '.oxd-table-body .oxd-table-row';
    this.noRecordsText = '.oxd-table-cell:has-text("No Records Found")';
    this.recordCount   = '.orangehrm-bottom-container span';
  }

  async goto() {
    await this.navigate('/web/index.php/pim/viewEmployeeList');
    // Wait for the URL to confirm the PIM page actually loaded (not redirected to login)
    await this.page.waitForURL('**/pim/viewEmployeeList', { timeout: 30000 });
    await this.waitForPageLoad();
  }

  async clickAddEmployee() {
    // getByRole matches by ARIA role + name — more reliable than CSS text selectors
    await this.page.getByRole('button', { name: 'Add' }).click({ timeout: 30000 });
    await this.page.waitForURL('**/pim/addEmployee', { timeout: 15000 });
    // Wait for the form to fully render before returning — Vue.js renders after URL change
    await this.page.getByPlaceholder('First Name').first().waitFor({ state: 'visible', timeout: 15000 });
  }

  async searchByName(name) {
    await this.fill(this.searchNameInput, name);
    await this.click(this.searchButton);
    await this.wait.waitForSpinnerToDisappear(15000);
    await this.page.waitForTimeout(2000);
  }

  async searchByEmployeeId(employeeId) {
    await this.fill(this.searchEmployeeIdInput, employeeId);
    await this.click(this.searchButton);
    await this.wait.waitForSpinnerToDisappear(15000);
    await this.page.waitForTimeout(1000);
  }

  async resetSearch() {
    await this.click(this.resetButton);
    await this.wait.waitForSpinnerToDisappear(10000);
  }

  async getEmployeeRowCount() {
    await this.page.waitForTimeout(500);
    return this.page.locator(this.tableRows).count();
  }

  async isEmployeeInList(fullName) {
    // The table shows First+Middle in one column and Last in another, so
    // "Alice Johnson" never appears as one string — check each part separately
    const parts = fullName.trim().split(' ');
    const rows = await this.page.locator(this.tableRows).count();
    for (let i = 0; i < rows; i++) {
      const rowText = await this.page.locator(this.tableRows).nth(i).textContent();
      if (parts.every(part => rowText.includes(part))) return true;
    }
    return false;
  }

  async getEmployeeIdFromList(fullName) {
    const parts = fullName.trim().split(' ');
    const rows = this.page.locator(this.tableRows);
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const text = await row.textContent();
      if (parts.every(part => text.includes(part))) {
        const idCell = row.locator('.oxd-table-cell').nth(1);
        return (await idCell.textContent()).trim();
      }
    }
    return null;
  }

  async clickEditForEmployee() {
    // Search already filtered the list — click the edit button on the first result
    const editButton = this.page.locator(`${this.tableRows} button:has(.bi-pencil-fill)`).first();
    await editButton.waitFor({ state: 'visible', timeout: 10000 });
    await editButton.click();
    await this.wait.waitForSpinnerToDisappear(15000);
  }

  async clickDeleteForEmployee() {
    // Search already filtered the list — click the delete button on the first result
    const deleteButton = this.page.locator(`${this.tableRows} button:has(.bi-trash)`).first();
    await deleteButton.waitFor({ state: 'visible', timeout: 10000 });
    await deleteButton.click();
  }

  async confirmDelete() {
    const confirmButton = this.page.getByRole('button', { name: 'Yes, Delete' });
    await confirmButton.waitFor({ state: 'visible', timeout: 10000 });
    await confirmButton.click();
    await this.wait.waitForSpinnerToDisappear(15000);
  }

  async hasNoRecords() {
    return this.isVisible(this.noRecordsText, 5000);
  }

  async getRecordCount() {
    try {
      const text = await this.getText(this.recordCount);
      const match = text.match(/\d+/);
      return match ? parseInt(match[0]) : 0;
    } catch {
      return 0;
    }
  }
}

module.exports = { EmployeeListPage };

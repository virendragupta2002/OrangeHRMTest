const { BasePage } = require('./BasePage');

class DashboardPage extends BasePage {
  constructor(page) {
    super(page);
    this.userDropdown = '.oxd-userdropdown-img';
    this.userDropdownMenu = '.oxd-userdropdown-tab';
    // Keep CSS for header/sidebar elements — no reliable ARIA equivalent
    this.dashboardHeading = '.oxd-topbar-header-breadcrumb h6';
    this.sidebarMenu      = '.oxd-main-menu';
  }

  async isLoaded() {
    await this.page.waitForURL('**/dashboard/index', { timeout: 30000 });
    return this.isVisible('.oxd-layout-context', 10000);
  }

  async getWelcomeMessage() {
    const dropdown = this.page.locator(this.userDropdownMenu);
    await dropdown.waitFor({ state: 'visible', timeout: 10000 });
    return (await dropdown.textContent()).trim();
  }

  async logout() {
    await this.click(this.userDropdown);
    await this.page.getByRole('menuitem', { name: 'Logout' }).click();
    await this.page.waitForURL('**/auth/login', { timeout: 15000 });
  }

  async navigateToPIM() {
    await this.page.getByRole('link', { name: 'PIM' }).click();
    await this.page.waitForURL('**/pim/viewEmployeeList', { timeout: 15000 });
  }

  async navigateToAdmin() {
    await this.page.getByRole('link', { name: 'Admin' }).click();
    await this.page.waitForURL('**/admin/**', { timeout: 15000 });
  }

  async navigateToMyInfo() {
    await this.click(this.userDropdown);
    await this.page.getByRole('menuitem', { name: 'My Info' }).click();
    await this.page.waitForURL('**/pim/viewMyDetails**', { timeout: 15000 });
  }

  async getPageTitle() {
    const el = this.page.locator(this.dashboardHeading).first();
    await el.waitFor({ state: 'visible', timeout: 10000 });
    return (await el.textContent()).trim();
  }

  async isSidebarVisible() {
    return this.isVisible(this.sidebarMenu);
  }
}

module.exports = { DashboardPage };

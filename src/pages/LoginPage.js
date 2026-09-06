const { BasePage } = require('./BasePage');

class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    this.usernameInput  = page.getByPlaceholder('Username');
    this.passwordInput  = page.getByPlaceholder('Password');
    this.loginButton    = page.getByRole('button', { name: 'Login' });
    this.errorAlert     = '.oxd-alert-content-text';
    this.logoImage      = '.orangehrm-login-logo img';
  }

  async goto() {
    await this.navigate('/web/index.php/auth/login');
    await this.waitForPageLoad();
  }

  async login(username, password) {
    await this.fill(this.usernameInput, username);
    await this.fill(this.passwordInput, password);
    await this.click(this.loginButton);
    await this.wait.waitForSpinnerToDisappear(15000);
  }

  async loginAsAdmin() {
    const { admin } = require('../../test-data/credentials.js');
    await this.login(admin.username, admin.password);
  }

  async getErrorMessage() {
    const locator = this.page.locator(this.errorAlert);
    await locator.waitFor({ state: 'visible', timeout: 10000 });
    return (await locator.textContent()).trim();
  }

  async isLoginPageVisible() {
    return this.isVisible(this.loginButton);
  }

  async isLogoVisible() {
    return this.isVisible(this.logoImage);
  }

  async clickForgotPassword() {
    await this.page.getByText('Forgot your password?').click();
  }
}

module.exports = { LoginPage };

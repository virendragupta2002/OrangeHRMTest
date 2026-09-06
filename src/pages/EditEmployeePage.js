const { BasePage } = require('./BasePage');

class EditEmployeePage extends BasePage {
  constructor(page) {
    super(page);
    this.firstNameInput      = page.getByPlaceholder('First Name');
    this.middleNameInput     = page.getByPlaceholder('Middle Name');
    this.lastNameInput       = page.getByPlaceholder('Last Name');
    this.employeeIdInput     = '.oxd-input-group:has(.oxd-label:has-text("Employee Id")) input';
    this.saveButton          = page.getByRole('button', { name: 'Save' });
    this.personalDetailsTab  = page.getByRole('link', { name: 'Personal Details' });
    this.contactDetailsTab   = page.getByRole('link', { name: 'Contact Details' });
    this.jobTab              = page.getByRole('link', { name: 'Job' });
    this.qualificationsTab   = page.getByRole('link', { name: 'Qualifications' });
    this.workEmailInput      = '.oxd-input-group:has(.oxd-label:has-text("Work Email")) input';
    this.mobileInput         = '.oxd-input-group:has(.oxd-label:has-text("Mobile")) input';
    // Keep CSS for fields with no reliable ARIA equivalent
    this.nicknameInput       = '.oxd-input-group:has(.oxd-label:has-text("Nickname")) input';
    this.dobInput            = '.oxd-input-group:has(.oxd-label:has-text("Date of Birth")) input';
    this.genderMale          = 'input[type="radio"][value="1"]';
    this.genderFemale        = 'input[type="radio"][value="2"]';
  }

  async waitForLoad() {
    await this.page.waitForURL('**/pim/viewPersonalDetails**', { timeout: 20000 });
    await this.wait.waitForSpinnerToDisappear(15000);
  }

  async updatePersonalDetails(data) {
    if (data.firstName) await this.fill(this.firstNameInput, data.firstName);
    if (data.middleName !== undefined) await this.fill(this.middleNameInput, data.middleName);
    if (data.lastName) await this.fill(this.lastNameInput, data.lastName);
    if (data.nickname) await this.fill(this.nicknameInput, data.nickname);

    if (data.dateOfBirth) {
      await this.page.locator(this.dobInput).first().fill(data.dateOfBirth);
    }

    if (data.gender) {
      const genderSelector = data.gender === 'Male' ? this.genderMale : this.genderFemale;
      await this.page.locator(genderSelector).check();
    }

    return this.savePersonalDetails();
  }

  async savePersonalDetails() {
    await this.saveButton.first().click();
    await this.wait.waitForSpinnerToDisappear(15000);
    return this.waitForToast();
  }

  async navigateToContactDetails() {
    await this.click(this.contactDetailsTab);
    await this.wait.waitForSpinnerToDisappear(10000);
  }

  async updateContactDetails(data) {
    await this.navigateToContactDetails();
    if (data.workEmail) await this.fill(this.workEmailInput, data.workEmail);
    if (data.mobile) await this.fill(this.mobileInput, data.mobile);
    return this.savePersonalDetails();
  }

  async navigateToJob() {
    await this.click(this.jobTab);
    await this.wait.waitForSpinnerToDisappear(10000);
  }

  async updateJobDetails(data) {
    await this.navigateToJob();

    if (data.jobTitle) {
      await this.selectAutoComplete(
        '.oxd-input-group:has(.oxd-label:has-text("Job Title")) input',
        data.jobTitle
      );
    }

    if (data.department) {
      await this.selectAutoComplete(
        '.oxd-input-group:has(.oxd-label:has-text("Sub Unit")) input',
        data.department
      );
    }

    return this.savePersonalDetails();
  }

  async getFirstName() {
    return this.firstNameInput.inputValue();
  }

  async getLastName() {
    return this.lastNameInput.inputValue();
  }

  async getEmployeeId() {
    return this.page.locator(this.employeeIdInput).inputValue();
  }

  async getCurrentUrl() {
    return this.page.url();
  }
}

module.exports = { EditEmployeePage };

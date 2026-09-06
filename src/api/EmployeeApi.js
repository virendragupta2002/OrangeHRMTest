const { ApiClient } = require('./ApiClient');

class EmployeeApi {
  constructor(request, token = null) {
    this.client = new ApiClient(request, token);
  }

  async getEmployees(params = {}) {
    return this.client.get('/pim/employees', {
      limit: 50,
      offset: 0,
      ...params,
    });
  }

  async getEmployee(empNumber) {
    return this.client.get(`/pim/employees/${empNumber}`);
  }

  async searchEmployee(firstName, lastName = '') {
    const params = {};
    if (firstName) params.nameOrId = firstName;
    return this.client.get('/pim/employees', params);
  }

  async createEmployee(employeeData) {
    return this.client.post('/pim/employees', {
      firstName: employeeData.firstName,
      lastName: employeeData.lastName,
      middleName: employeeData.middleName || '',
      employeeId: employeeData.employeeId || '',
    });
  }

  async updateEmployee(empNumber, updateData) {
    return this.client.patch(`/pim/employees/${empNumber}/personal-details`, {
      firstName: updateData.firstName,
      lastName: updateData.lastName,
      middleName: updateData.middleName || '',
      employeeId: updateData.employeeId,
    });
  }

  async deleteEmployee(empNumber) {
    return this.client.delete(`/pim/employees/${empNumber}`);
  }

  async bulkDeleteEmployees(empNumbers) {
    return this.client.delete('/pim/employees', {
      ids: empNumbers,
    });
  }

  async getEmployeePersonalDetails(empNumber) {
    return this.client.get(`/pim/employees/${empNumber}/personal-details`);
  }

  async getJobDetails(empNumber) {
    return this.client.get(`/pim/employees/${empNumber}/job-details`);
  }

  async getContactDetails(empNumber) {
    return this.client.get(`/pim/employees/${empNumber}/contact-details`);
  }

  async findEmployeeByName(fullName) {
    const parts = fullName.trim().split(' ');
    const firstName = parts[0];
    const lastName = parts[parts.length - 1];

    const result = await this.getEmployees({ nameOrId: firstName });
    if (!result.ok) return null;

    const employees = result.body?.data || [];
    return employees.find(
      (e) =>
        e.firstName.toLowerCase() === firstName.toLowerCase() &&
        e.lastName.toLowerCase() === lastName.toLowerCase()
    );
  }

  async getEmployeeCount() {
    const result = await this.getEmployees({ limit: 1, offset: 0 });
    return result.body?.meta?.total || 0;
  }
}

module.exports = { EmployeeApi };

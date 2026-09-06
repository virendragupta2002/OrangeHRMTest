const ExcelJS = require('exceljs');
const path = require('path');

class ExcelHelper {
  static async read(filepath, sheetName) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filepath);

    const sheet = sheetName
      ? workbook.getWorksheet(sheetName)
      : workbook.worksheets[0];

    if (!sheet) {
      throw new Error(`Sheet "${sheetName}" not found in ${filepath}`);
    }

    const headers = [];
    const rows = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        row.eachCell((cell) => headers.push(String(cell.value || '').trim()));
        return;
      }

      const rowData = {};
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1];
        if (header) {
          rowData[header] = cell.value instanceof Date
            ? cell.value.toISOString().split('T')[0]
            : String(cell.value ?? '').trim();
        }
      });

      if (Object.values(rowData).some((v) => v !== '')) {
        rows.push(rowData);
      }
    });

    return rows;
  }

  static async write(filepath, sheetName, headers, rows) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(sheetName);

    sheet.addRow(headers);
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    rows.forEach((row) => {
      sheet.addRow(headers.map((h) => row[h] ?? ''));
    });

    headers.forEach((_, i) => {
      sheet.getColumn(i + 1).width = 20;
    });

    await workbook.xlsx.writeFile(filepath);
    console.log(`[ExcelHelper] Written: ${filepath}`);
  }

  static async generate(outputDir) {
    const { faker } = require('@faker-js/faker');
    const filepath = path.join(outputDir, 'test-data.xlsx');

    const employees = Array.from({ length: 10 }, (_, i) => ({
      FirstName: faker.person.firstName(),
      LastName: faker.person.lastName(),
      EmployeeId: `EMP${(1000 + i).toString()}`,
      Email: faker.internet.email(),
      Phone: faker.phone.number('##########'),
      Department: faker.helpers.arrayElement(['Engineering', 'HR', 'Finance']),
      JobTitle: faker.helpers.arrayElement(['Engineer', 'Manager', 'Analyst']),
    }));

    await this.write(
      filepath,
      'Employees',
      ['FirstName', 'LastName', 'EmployeeId', 'Email', 'Phone', 'Department', 'JobTitle'],
      employees
    );

    return filepath;
  }
}

module.exports = { ExcelHelper };

const path = require('path');
const { ExcelHelper } = require('../src/utils/ExcelHelper');

async function main() {
  const outputDir = path.resolve(__dirname, '../test-data/excel');
  const filepath = await ExcelHelper.generate(outputDir);
  console.log(`Test data Excel generated: ${filepath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

const fs = require('fs');
const path = require('path');

async function globalTeardown() {
  console.log('\n[GlobalTeardown] Cleaning up...');

  const authFile = path.resolve(process.cwd(), '.auth/admin.json');
  if (fs.existsSync(authFile)) {
    fs.unlinkSync(authFile);
    console.log('[GlobalTeardown] Auth state cleared');
  }

  console.log('[GlobalTeardown] Complete\n');
}

module.exports = globalTeardown;

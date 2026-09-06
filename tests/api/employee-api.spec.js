const { test, expect } = require('../../src/fixtures/fixtures');
const { ConfigLoader } = require('../../src/utils/ConfigLoader');

const config = ConfigLoader.load(process.env.ENVIRONMENT || 'dev');

test.describe('@regression @api Employee API Verification', () => {

  test('TC_API_001 - Successful login allows authenticated access to employee API', async ({ request }) => {
    // The admin session is established by global setup (login via browser).
    // The request fixture carries that session cookie automatically.
    // A 200 response confirms the login was successful and the session is valid.
    const response = await request.get(`${config.apiBaseUrl}/pim/employees?limit=1`);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('data');
  });

  test('TC_API_002 - GET /pim/employees returns 200 with data array', async ({ authenticatedApi }) => {
    const result = await authenticatedApi.getEmployees({ limit: 10, offset: 0 });

    expect(result.status).toBe(200);
    expect(result.body).toHaveProperty('data');
    expect(Array.isArray(result.body.data)).toBe(true);
  });

  test('TC_API_003 - GET /pim/employees includes meta total count', async ({ authenticatedApi }) => {
    const result = await authenticatedApi.getEmployees({ limit: 1 });

    expect(result.status).toBe(200);
    expect(result.body).toHaveProperty('meta');
    expect(result.body.meta).toHaveProperty('total');
    expect(typeof result.body.meta.total).toBe('number');
  });

});

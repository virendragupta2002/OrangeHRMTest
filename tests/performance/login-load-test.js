import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// ─── Custom Metrics ───────────────────────────────────────────────
const loginDuration  = new Trend('login_duration',  true);  // login response time
const loginFailRate  = new Rate('login_fail_rate');          // % of failed logins
const loginCount     = new Counter('login_count');           // total login attempts

// ─── Test Configuration ───────────────────────────────────────────
export const options = {
  stages: [
    { duration: '30s', target: 5  },  // ramp up to 5 users over 30s
    { duration: '1m',  target: 5  },  // hold at 5 users for 1 minute
    { duration: '30s', target: 0  },  // ramp down to 0
  ],

  thresholds: {
    http_req_duration:    ['p(95)<3000'],   // 95% of requests must finish under 3s
    login_duration:       ['p(95)<3000'],   // 95% of logins must finish under 3s
    login_fail_rate:      ['rate<0.05'],    // less than 5% failure rate
    http_req_failed:      ['rate<0.05'],    // less than 5% HTTP errors
  },
};

// ─── Constants ────────────────────────────────────────────────────
const BASE_URL  = 'https://opensource-demo.orangehrmlive.com';
const LOGIN_URL = `${BASE_URL}/web/index.php/auth/login`;
const VALIDATE_URL = `${BASE_URL}/web/index.php/auth/validate`;

const CREDENTIALS = {
  username: 'Admin',
  password: 'admin123',
};

// ─── Helper: extract CSRF token from HTML ─────────────────────────
function getCsrfToken(html) {
  // OrangeHRM embeds the token in a hidden input inside a PHP-rendered form
  const match = html.match(/name="_token"[^>]*value="([^"]+)"/);
  if (!match) {
    const reverseMatch = html.match(/value="([^"]+)"[^>]*name="_token"/);
    return reverseMatch ? reverseMatch[1] : null;
  }
  return match[1];
}

// ─── Main Test Function (runs once per virtual user per iteration) ─
export default function () {

  // Step 1: Load the login page to get the CSRF token
  const loginPage = http.get(LOGIN_URL, {
    headers: { 'Accept': 'text/html' },
    tags: { name: 'GET login page' },
  });

  check(loginPage, {
    'Login page loaded (200)': (r) => r.status === 200,
    'Login page has form':     (r) => r.body.includes('_token'),
  });

  // Extract CSRF token — required by OrangeHRM for form submission
  const csrfToken = getCsrfToken(loginPage.body);
  if (!csrfToken) {
    loginFailRate.add(1);
    console.warn('CSRF token not found — skipping login');
    return;
  }

  // Step 2: Submit login credentials
  const loginStart = Date.now();

  const loginResponse = http.post(
    VALIDATE_URL,
    {
      _token:   csrfToken,
      username: CREDENTIALS.username,
      password: CREDENTIALS.password,
    },
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept':       'text/html',
      },
      redirects: 5,
      tags: { name: 'POST login submit' },
    }
  );

  const duration = Date.now() - loginStart;
  loginDuration.add(duration);
  loginCount.add(1);

  // Step 3: Verify login succeeded
  const loginSucceeded =
    loginResponse.status === 200 &&
    loginResponse.url.includes('/dashboard');

  check(loginResponse, {
    'Login succeeded (200)':         (r) => r.status === 200,
    'Redirected to dashboard':        (r) => r.url.includes('/dashboard'),
    'Dashboard content visible':      (r) => r.body.includes('dashboard'),
    'Login response under 3s':        ()  => duration < 3000,
  });

  loginFailRate.add(!loginSucceeded ? 1 : 0);

  if (!loginSucceeded) {
    console.error(`Login failed — status: ${loginResponse.status} | url: ${loginResponse.url}`);
  }

  // Step 4: Wait between iterations (simulate real user think time)
  sleep(1);
}

// ─── Summary printed after test completes ─────────────────────────
export function handleSummary(data) {
  const passed = data.metrics.login_fail_rate.values.rate < 0.05;

  return {
    stdout: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  OrangeHRM Login Load Test — Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Total logins attempted : ${data.metrics.login_count.values.count}
  Login fail rate        : ${(data.metrics.login_fail_rate.values.rate * 100).toFixed(2)}%
  Avg login duration     : ${data.metrics.login_duration.values.avg.toFixed(0)}ms
  p95 login duration     : ${data.metrics.login_duration.values['p(95)'].toFixed(0)}ms
  Result                 : ${passed ? '✅ PASSED' : '❌ FAILED'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`,
  };
}

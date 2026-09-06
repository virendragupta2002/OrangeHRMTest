# OrangeHRM Automation Framework

End-to-end test automation for OrangeHRM using Playwright + JavaScript.

## Architecture

```
orangehrm-automation/
├── .github/workflows/       # GitHub Actions CI/CD pipelines
├── config/environments/     # YAML configs per environment (dev/staging/prod)
├── src/
│   ├── pages/               # Page Object Model classes
│   ├── api/                 # API client & endpoint wrappers
│   ├── utils/               # ConfigLoader, TestDataManager, WaitHelper, etc.
│   └── fixtures/            # Playwright fixtures + global setup/teardown
├── tests/
│   ├── auth/                # Authentication tests
│   ├── employee/            # Employee CRUD + lifecycle tests
│   └── api/                 # API-level verification tests
├── test-data/
│   ├── json/                # JSON test data (employees, credentials)
│   └── excel/               # Excel-driven test data
└── scripts/                 # Utility scripts (generate test data)
```

## Prerequisites

- Node.js >= 18
- npm >= 9
- (Optional) Allure CLI for reports: `npm install -g allure-commandline`

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Install Playwright browsers
npx playwright install --with-deps

# 3. Copy env file
cp .env.example .env

# 4. (Optional) Generate Excel test data
npm run setup:excel
```

## Running Tests

```bash
# All tests (all browsers, parallel)
npm test

# Single browser
npm run test:chrome
npm run test:firefox
npm run test:edge

# By scope
npm run test:auth
npm run test:employee
npm run test:api
npm run test:lifecycle

# By tag
npx playwright test --grep @smoke
npx playwright test --grep @regression

# Headed (visible browser)
npm run test:headed

# Debug mode (step-through)
npm run test:debug

# Specific environment
npm run test:staging

# With retry override
npx playwright test --retries=3
```

## Reports

```bash
# Playwright HTML report (auto-opens after run)
npm run report

# Allure report
npm run allure:generate
npm run allure:open

# Allure live server
npm run allure:serve
```

## Test Tags

| Tag         | Description                              |
|-------------|------------------------------------------|
| `@smoke`    | Critical path, fast — run on every push  |
| `@regression` | Full suite — run on PRs and nightly    |
| `@api`      | API-only tests                           |

## Flaky Test Strategy

### Detection
- Playwright's built-in retry records a test as **flaky** when it fails on attempt 1 but passes on retry.
- Allure report's **Flaky** category surfaces these automatically.
- CI reports include `--reporter=junit` XML for trend tracking in tools like Jira Xray.

### Mitigation
1. **Smart waits** — `WaitHelper` uses `waitForSelector`, `waitForResponse`, `waitForURL` instead of `page.waitForTimeout`.
2. **Retry logic** — `RetryHelper.retry()` wraps flaky interactions (clicks, fills, navigation) with exponential backoff.
3. **Stable locators** — selectors target semantic attributes (`name`, `type`, `role`, `placeholder`) not CSS classes that change on redeploy.
4. **Test isolation** — each test creates its own data and cleans up; no shared state between tests.
5. **Network intercept** — `waitForApiResponse()` ensures UI updates only after the network call resolves.
6. **Spinner guard** — `waitForSpinnerToDisappear()` called after every navigation and save.

## CI/CD Pipeline

The GitHub Actions workflow runs:
1. **Install** — caches browsers and `node_modules`
2. **Smoke** — Chrome only, fast gate on every push
3. **Regression** — Chrome, Firefox, Edge in parallel (on PRs and schedule)
4. **Allure Report** — merges all results, deploys to GitHub Pages on `main`

### Secrets Required

| Secret           | Description           |
|------------------|-----------------------|
| `ADMIN_USERNAME` | OrangeHRM admin user  |
| `ADMIN_PASSWORD` | OrangeHRM admin pass  |

## Data-Driven Testing

- **JSON** (`test-data/json/employees.json`) — static datasets for consistent regression runs
- **Excel** (`test-data/excel/test-data.xlsx`) — generated via `npm run setup:excel`, read via `ExcelHelper`
- **Faker** — `TestDataManager.generateEmployee()` creates unique runtime data to avoid conflicts

## Environment Configuration

Edit `config/environments/<env>.yaml` to change base URLs, timeouts, and retry counts per environment.
Sensitive values use `${ENV_VAR}` interpolation resolved at runtime from the shell or `.env`.

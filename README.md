# OrangeHRM Automation Framework

End-to-end test automation for [OrangeHRM](https://opensource-demo.orangehrmlive.com) using **Playwright + JavaScript**.

---

## Project Structure

```
orangehrm-automation/
├── .github/workflows/       # GitHub Actions CI/CD pipeline
├── config/environments/     # YAML configs per environment (dev/staging/prod)
├── src/
│   ├── pages/               # Page Object Model — one class per page
│   ├── api/                 # API client and EmployeeApi wrapper
│   ├── utils/               # ConfigLoader, WaitHelper, RetryHelper, etc.
│   └── fixtures/            # Playwright fixtures, global setup/teardown
├── test-data/
│   ├── employees.js         # Static employee data (comment out to skip)
│   └── credentials.js       # Admin login credentials
└── tests/
    ├── auth/                # Authentication tests
    ├── employee/            # Employee create, update, delete, role validation
    └── api/                 # API-level verification tests
```

---

## Prerequisites

- Node.js >= 18
- npm >= 9
- Git

---

## Setup Instructions

```bash
# 1. Clone the repository
git clone https://github.com/virendragupta2002/OrangeHRMTest.git
cd OrangeHRMTest

# 2. Install dependencies
npm install

# 3. Install Playwright browser
npx playwright install chromium
```

---

## Execution Steps

### Run all tests in correct order (recommended)
```bash
npm run test:all
```
Runs in this guaranteed sequence:
`Authentication → Employee Create → Employee Update → Employee Delete → Role Validation → API Tests`

### Run individual test suites
```bash
# Authentication tests
npx playwright test tests/auth/

# Employee tests (create → update → delete in order)
npm run test:employee

# API tests
npx playwright test tests/api/

# Single test file
npx playwright test tests/employee/employee-create.spec.js --headed
```

### View the report after running
```bash
npx playwright show-report
```

---

## Test Coverage

| File | Tests | Description |
|------|-------|-------------|
| `login.spec.js` | 5 | Login page, valid/invalid credentials, session, forgot password |
| `employee-create.spec.js` | 1 | Create employee and verify in PIM list |
| `employee-update.spec.js` | 2 | Update mobile and work email via name search |
| `employee-delete.spec.js` | 2 | Delete by name search and by employee ID |
| `role-validation.spec.js` | 2 | Assign ESS role, verify role in User Management |
| `employee-api.spec.js` | 3 | Authenticated API access, employee list structure |

---

## Key Design Decisions

### 1. Page Object Model (POM)
Every page has its own class in `src/pages/`. Tests never interact with the browser directly — they call page methods. This means if OrangeHRM changes a selector, only one file needs updating.

### 2. BasePage with `_loc()` helper
`BasePage` provides `click()`, `fill()`, `isVisible()` etc. that accept both CSS selector strings AND Playwright `getBy*` Locator objects. All shared waiting and scrolling logic lives here once.

### 3. Static test data over random data
Replaced `faker` library with a static `employees.js` file. Entries can be commented out with `//` to skip specific employees. Sequential index ensures create → update → delete always operate on the same person.

### 4. storageState for authentication
Global setup logs in once and saves the session to `.auth/admin.json`. All tests reuse this session automatically — no per-test login needed. Auth tests override this with `test.use({ storageState: {} })` to start unauthenticated.

### 5. Project dependencies for test ordering
Playwright's project `dependencies` feature enforces `create → update → delete` order at the framework level — not via command-line flags that can be forgotten.

### 6. Graceful skip over failure
Update and delete tests skip (not fail) when no matching employee is found: `test.skip(true, "No records found")`. This handles the shared demo site where data changes between runs.

### 7. getByRole / getByPlaceholder locators
Migrated from brittle CSS class selectors to semantic Playwright locators where supported. OrangeHRM's custom Vue components (`oxd-label`) don't support ARIA associations, so those fields keep CSS selectors.

---

## CI/CD Pipeline

GitHub Actions runs automatically on every push to `main`:

```
Push to main
    ↓
Install Node.js + dependencies
    ↓
Install Playwright (chromium)
    ↓
npm run test:all
    ↓
Upload Playwright report as artifact
```

Download the test report from the **Actions** tab → select a run → **Artifacts**.

---

## Environment Configuration

Edit `config/environments/dev.yaml` to change base URLs and timeouts.

| Environment | Command |
|---|---|
| dev (default) | `npm run test:all` |
| staging | `ENVIRONMENT=staging npm run test:all` |

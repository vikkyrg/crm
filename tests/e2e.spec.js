import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.TEST_USER_EMAIL || 'admin@innomatrics.com';
const ADMIN_PASSWORD = process.env.TEST_USER_PASSWORD || 'AdminPassword123!';
const API_BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:5000';

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

async function loginViaUi(page) {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
  await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /Sign In to Portal/i }).click();
  await page.waitForURL('**/');
  await expect(page.getByText(/Vikram Sharma/i)).toBeVisible();
}

async function getAdminToken(request) {
  const response = await request.post(`${API_BASE_URL}/api/auth/login`, {
    data: {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    },
  });

  expect(response.ok()).toBeTruthy();
  const json = await response.json();
  return json.token;
}

async function createClientViaApi(request, token, overrides = {}) {
  const unique = `Playwright ${Date.now()}`;
  const payload = {
    companyName: overrides.companyName || `${unique} Pvt Ltd`,
    contactPerson: overrides.contactPerson || 'QA Contact',
    primaryPhone: overrides.primaryPhone || '+91 99999 00001',
    email: overrides.email || `qa-${Date.now()}@example.com`,
    gstin: overrides.gstin || '09ABCDE1234F1Z8',
    pan: overrides.pan || 'ABCDE1234F',
    billingAddress: overrides.billingAddress || 'Plot 12, Test Sector, Noida',
    city: overrides.city || 'Noida',
    state: overrides.state || 'Uttar Pradesh',
    stateCode: overrides.stateCode || '09',
    pincode: overrides.pincode || '201301',
    notes: overrides.notes || 'Created by Playwright E2E smoke test',
  };

  const response = await request.post(`${API_BASE_URL}/api/clients`, {
    headers: authHeaders(token),
    data: payload,
  });

  expect(response.ok()).toBeTruthy();
  const json = await response.json();
  return { ...payload, ...json.data };
}

async function createInvoiceViaApi(request, token, clientId, overrides = {}) {
  const serviceResponse = await request.get(`${API_BASE_URL}/api/services?limit=20`, {
    headers: authHeaders(token),
  });
  expect(serviceResponse.ok()).toBeTruthy();
  const services = (await serviceResponse.json()).data || [];
  const firstService = services[0];
  expect(firstService).toBeTruthy();

  const payload = {
    clientId,
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    paymentTerms: 'Payment due within 15 days',
    notes: 'Playwright invoice regression scenario',
    items: [
      {
        serviceId: firstService.serviceId,
        description: firstService.name,
        unit: firstService.unit || 'Unit',
        quantity: overrides.quantity || 1,
        unitPrice: overrides.unitPrice || firstService.defaultUnitPrice,
        discountPercent: 0,
        taxRate: firstService.taxRate || 18,
      },
    ],
    documentDiscount: 0,
  };

  const response = await request.post(`${API_BASE_URL}/api/invoices`, {
    headers: authHeaders(token),
    data: payload,
  });

  expect(response.ok()).toBeTruthy();
  const json = await response.json();
  return json.data;
}

async function recordInvoicePaymentViaApi(request, token, invoiceId, amount = 2500) {
  const response = await request.post(`${API_BASE_URL}/api/invoices/${invoiceId}/payments`, {
    headers: authHeaders(token),
    data: {
      amount,
      paymentMethod: 'Bank Transfer',
      transactionReference: `UTR-${Date.now()}`,
      notes: 'Partial payment recorded by E2E test',
    },
  });

  expect(response.ok()).toBeTruthy();
  return response.json();
}

async function createAdvanceViaApi(request, token, clientId, amount = 5000) {
  const response = await request.post(`${API_BASE_URL}/api/advances`, {
    headers: authHeaders(token),
    data: {
      clientId,
      amount,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'Bank Transfer',
      transactionReference: `ADV-${Date.now()}`,
      bankDetails: 'HDFC Test Branch',
      notes: 'Playwright advance smoke test',
    },
  });

  expect(response.ok()).toBeTruthy();
  return (await response.json()).data;
}

async function allocateAdvanceViaApi(request, token, advanceId, invoiceId, amount = 2500) {
  const response = await request.post(`${API_BASE_URL}/api/advances/${advanceId}/allocate`, {
    headers: authHeaders(token),
    data: {
      invoiceId,
      amount,
      notes: 'Allocated during e2e smoke test',
    },
  });

  expect(response.ok()).toBeTruthy();
  return response.json();
}

async function createEmployeeViaApi(request, token, overrides = {}) {
  const unique = `Playwright ${Date.now()}`;
  const payload = {
    employeeId: overrides.employeeId || `INN-EMP-${Date.now()}`,
    fullName: overrides.fullName || `${unique} Engineer`,
    email: overrides.email || `qa-${Date.now()}@innomatrics.test`,
    phone: overrides.phone || '+91 98999 11111',
    department: overrides.department || 'Engineering',
    designation: overrides.designation || 'QA Automation Engineer',
    employmentStatus: overrides.employmentStatus || 'Active',
    employmentType: overrides.employmentType || 'Full-time',
    joiningDate: new Date().toISOString().split('T')[0],
    address: {
      street: 'Test Street 12',
      city: 'Noida',
      state: 'Uttar Pradesh',
      pincode: '201301',
    },
    emergencyContact: {
      name: 'Emergency Contact',
      relationship: 'Spouse',
      phone: '+91 98900 12345',
    },
    bankDetails: {
      bankName: 'HDFC',
      accountNumber: '123456789012',
      ifscCode: 'HDFC0001234',
      branch: 'Noida',
      panNumber: 'ABCDE1234F',
    },
    statutoryInfo: {
      uan: '100000000000',
      pfAccountNumber: 'UP/NOIDA/0000000',
      esiNumber: '1234567890',
      isPfEligible: true,
      pfWageLimitApplicable: true,
    },
    salaryStructure: {
      basicSalary: 30000,
      hra: 15000,
      conveyanceAllowance: 1600,
      medicalAllowance: 1250,
      specialAllowance: 5000,
      professionalTax: 200,
      tdsMonthly: 0,
    },
    notes: 'Created for e2e smoke test',
  };

  const response = await request.post(`${API_BASE_URL}/api/employees`, {
    headers: authHeaders(token),
    data: payload,
  });

  expect(response.ok()).toBeTruthy();
  const json = await response.json();
  expect(json.data).toBeTruthy();
  return json.data;
}

async function createDeliveryChallanViaApi(request, token, clientId, overrides = {}) {
  const payload = {
    clientId,
    projectOrWorkOrder: overrides.projectOrWorkOrder || 'Playwright dispatch test',
    deliveryAddress: overrides.deliveryAddress || 'Noida site office',
    deliveryType: 'Material Supply',
    transporterName: overrides.transporterName || 'FastTrack Logistics',
    vehicleNumber: overrides.vehicleNumber || 'UP14AB1234',
    driverName: overrides.driverName || 'Raj Singh',
    driverPhone: overrides.driverPhone || '+91 98999 00099',
    expectedDeliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    items: [
      {
        itemCode: 'ITEM-001',
        description: 'QA test material',
        quantityDispatched: 2,
        unit: 'Nos',
        remarks: 'For smoke test',
      },
    ],
    notes: 'Playwright delivery challan smoke test',
  };

  const response = await request.post(`${API_BASE_URL}/api/delivery-challans`, {
    headers: authHeaders(token),
    data: payload,
  });

  expect(response.ok()).toBeTruthy();
  const json = await response.json();
  expect(json.data).toBeTruthy();
  return json.data;
}

async function getUnusedPayrollMonthYear(request, token, preferredYear = new Date().getFullYear()) {
  const response = await request.get(`${API_BASE_URL}/api/payroll?year=${preferredYear}`, {
    headers: authHeaders(token),
  });

  expect(response.ok()).toBeTruthy();
  const runs = (await response.json()).data || [];
  const usedMonths = new Set(runs.map((run) => Number(run.month)));

  for (let month = 1; month <= 12; month++) {
    if (!usedMonths.has(month)) {
      return { month, year: preferredYear };
    }
  }

  return { month: 1, year: preferredYear + 1 };
}

async function createPayrollRunFromPreviewViaApi(request, token, month, year) {
  const target = month !== undefined && year !== undefined ? { month, year } : await getUnusedPayrollMonthYear(request, token);
  const previewResponse = await request.post(`${API_BASE_URL}/api/payroll/preview`, {
    headers: authHeaders(token),
    data: { month: target.month, year: target.year },
  });

  expect(previewResponse.ok()).toBeTruthy();
  const preview = await previewResponse.json();
  expect(preview.items?.length).toBeGreaterThan(0);

  const createResponse = await request.post(`${API_BASE_URL}/api/payroll/save`, {
    headers: authHeaders(token),
    data: {
      month: target.month,
      year: target.year,
      items: preview.items,
      status: 'Draft',
      remarks: 'Playwright payroll smoke test',
    },
  });

  expect(createResponse.ok()).toBeTruthy();

  const saved = await createResponse.json();
  const duplicateResponse = await request.post(`${API_BASE_URL}/api/payroll/save`, {
    headers: authHeaders(token),
    data: {
      month: target.month,
      year: target.year,
      items: preview.items,
      status: 'Draft',
      remarks: 'Playwright duplicate payroll save regression check',
    },
  });

  expect(duplicateResponse.ok()).toBeTruthy();

  const listResponse = await request.get(`${API_BASE_URL}/api/payroll?year=${target.year}`, {
    headers: authHeaders(token),
  });

  expect(listResponse.ok()).toBeTruthy();
  const runs = (await listResponse.json()).data || [];
  const sameMonthRuns = runs.filter((run) => Number(run.month) === target.month && Number(run.year) === target.year);
  expect(sameMonthRuns.length).toBe(1);

  return saved.data;
}

test.describe('Innomatrics E2E smoke suite', () => {
  test('invalid login, protected route redirect, and valid logout flow', async ({ page }) => {
    await page.goto('/login');

    await page.locator('input[type="email"]').fill('bad@example.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.getByRole('button', { name: /Sign In to Portal/i }).click();

    await expect(page.getByText(/Invalid (email or password|credentials)/i)).toBeVisible();

    await page.goto('/clients');
    await expect(page).toHaveURL(/\/login$/);

    await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
    await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /Sign In to Portal/i }).click();
    await expect(page).toHaveURL(/\/$/);

    await page.getByTitle('Sign Out').click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('creates a client via the browser and verifies invoice payment history through the UI', async ({ page, request }) => {
    await loginViaUi(page);

    const uniqueClientName = `UI Client ${Date.now()}`;
    await page.goto('/clients');
    await page.getByRole('button', { name: /^Add Client$/i }).click();

    const clientForm = page.locator('form').filter({
      has: page.getByRole('button', { name: /Create Client|Save Changes/i }),
    }).last();

    await clientForm.locator('input').nth(0).fill(uniqueClientName);
    await clientForm.locator('input').nth(1).fill('QA Contact');
    await clientForm.locator('input').nth(2).fill('+91 99999 00009');
    await clientForm.locator('input').nth(3).fill(`ui-${Date.now()}@example.com`);
    await clientForm.locator('input').nth(4).fill('09ABCDE1234F1Z8');
    await clientForm.locator('input').nth(5).fill('ABCDE1234F');
    await clientForm.locator('textarea').nth(0).fill('QA test address, Noida');
    await clientForm.locator('input').nth(6).fill('Noida');
    await clientForm.locator('input').nth(7).fill('Uttar Pradesh');
    await clientForm.locator('input').nth(8).fill('201301');
    await clientForm.getByRole('button', { name: /Create Client/i }).click();

    await expect(page.getByText('Client created successfully')).toBeVisible();

    const token = await getAdminToken(request);
    const client = await createClientViaApi(request, token, {
      companyName: `${uniqueClientName} API`,
      email: `api-${Date.now()}@example.com`,
    });
    const invoice = await createInvoiceViaApi(request, token, client._id, {
      quantity: 1,
      unitPrice: 15000,
    });
    await recordInvoicePaymentViaApi(request, token, invoice._id, 5000);

    await page.goto('/invoices');
    await expect(page.getByText(invoice.invoiceNumber)).toBeVisible();
    await expect(page.getByText(/Outstanding Balance|Balance/i).first()).toBeVisible();
  });

  test('verifies advance creation, allocation, and dashboard totals in the browser', async ({ page, request }) => {
    await loginViaUi(page);

    const token = await getAdminToken(request);
    const client = await createClientViaApi(request, token, {
      companyName: `Advance Client ${Date.now()}`,
      email: `advance-${Date.now()}@example.com`,
    });
    const invoice = await createInvoiceViaApi(request, token, client._id, {
      quantity: 1,
      unitPrice: 20000,
    });
    const advance = await createAdvanceViaApi(request, token, client._id, 12000);
    await allocateAdvanceViaApi(request, token, advance._id, invoice._id, 8000);

    await page.goto('/advances');
    await expect(page.getByText(advance.receiptNumber)).toBeVisible();
    await expect(page.getByText(/Allocated|Receipt|Verified/i).first()).toBeVisible();

    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Executive Overview/i })).toBeVisible();
    await expect(page.getByText(/Total Invoiced|Collected|Outstanding/i).first()).toBeVisible();
  });

  test('verifies employee, payroll, delivery challan, and report pages from persisted records', async ({ page, request }) => {
    await loginViaUi(page);

    const token = await getAdminToken(request);
    const client = await createClientViaApi(request, token, {
      companyName: `ERP Client ${Date.now()}`,
      email: `erp-${Date.now()}@example.com`,
    });
    const employee = await createEmployeeViaApi(request, token, {
      fullName: `ERP Employee ${Date.now()}`,
      email: `erpemployee-${Date.now()}@innomatrics.test`,
    });
    const challan = await createDeliveryChallanViaApi(request, token, client._id, {
      projectOrWorkOrder: `ERP dispatch ${Date.now()}`,
    });
    const payroll = await createPayrollRunFromPreviewViaApi(request, token, new Date().getMonth() + 1, new Date().getFullYear());

    await page.goto('/employees');
    await expect(page.getByText(employee.fullName)).toBeVisible();

    await page.goto('/delivery-challans');
    await expect(page.getByText(challan.challanNumber)).toBeVisible();

    await page.goto('/payroll');
    await expect(page.getByText(/Historical Payroll Batches|Salary & Monthly Payroll/i).first()).toBeVisible();
    await expect(page.getByText(new RegExp(`${payroll.month}\\s*${payroll.year}`))).toBeVisible();

    await page.goto('/reports');
    await expect(page.getByText(/Reports & Data Export|Material Invoices Register|Client Register/i).first()).toBeVisible();
  });
});

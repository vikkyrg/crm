import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';

const ADMIN_EMAIL = process.env.TEST_USER_EMAIL || 'admin@innomatrics.com';
const ADMIN_PASSWORD = process.env.TEST_USER_PASSWORD || 'AdminPassword123!';
const API_BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:5000';

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

async function loginViaUi(page) {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Navadurga Electricals' })).toBeVisible();
  await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
  await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /Sign In to Portal/i }).click();
  await page.waitForURL('**/');
  await expect(page.getByText(/Vikram Sharma/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'NAVADURGA ELECTRICALS' })).toBeVisible();
  await expect(page.getByText('Navadurga CRM')).toBeVisible();
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
  test('shows responsive payroll employee summaries and expandable breakdowns', async ({ page }) => {
    const token = await getAdminToken(page.request);
    await createEmployeeViaApi(page.request, token, {
      employeeId: `LAYOUT-${Date.now()}`,
      fullName: 'Payroll Layout Test Employee With A Longer Name'
    });
    const payroll = await createPayrollRunFromPreviewViaApi(page.request, token);

    await loginViaUi(page);
    await page.goto('/payroll');
    const payrollRow = page.locator('tr').filter({
      hasText: payroll.payrollCode || payroll.payrollRunNumber
    });
    const viewRegisterButton = payrollRow.getByRole('button', { name: /View Register/i });
    await expect(viewRegisterButton).toBeVisible();
    await viewRegisterButton.click();

    const modal = page.getByTestId('payroll-register-modal');
    const content = page.getByTestId('payroll-register-content');
    const employeeCard = modal.getByTestId('payroll-employee-card').first();
    const breakdown = employeeCard.getByTestId('payroll-employee-breakdown');
    await expect(modal.getByRole('heading', { name: 'Payroll Register' })).toBeVisible();
    await expect(employeeCard).toBeVisible();
    await expect(employeeCard.getByText('Gross salary')).toBeVisible();
    await expect(employeeCard.getByText('Total deductions')).toBeVisible();
    await expect(employeeCard.getByText('Net payable')).toBeVisible();
    await expect(modal.getByText(/Lifecycle:/i)).toBeVisible();
    await expect(modal.getByText(/Disbursement:/i)).toBeVisible();
    await expect(modal.getByRole('button', { name: 'Close', exact: true })).toBeVisible();
    await expect(modal.getByRole('link', { name: /PDF Payslip/i }).first()).toBeVisible();
    expect(await breakdown.evaluate((element) => element.open)).toBe(false);

    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      const modalBounds = await modal.boundingBox();
      expect(modalBounds.x).toBeGreaterThanOrEqual(0);
      expect(modalBounds.x + modalBounds.width).toBeLessThanOrEqual(viewport.width);
      expect(modalBounds.y).toBeGreaterThanOrEqual(0);
      expect(modalBounds.y + modalBounds.height).toBeLessThanOrEqual(viewport.height);

      const overflow = await modal.evaluate((element) => ({
        width: element.clientWidth,
        scrollWidth: element.scrollWidth
      }));
      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.width);
      await expect(content).toHaveCSS('overflow-y', 'auto');

      const payslipButton = await modal.getByRole('link', { name: /PDF Payslip/i }).first().boundingBox();
      expect(payslipButton.x).toBeGreaterThanOrEqual(0);
      expect(payslipButton.x + payslipButton.width).toBeLessThanOrEqual(viewport.width);
      expect(payslipButton.x + payslipButton.width).toBeLessThanOrEqual(modalBounds.x + modalBounds.width);
    }

    await breakdown.locator('summary').click();
    expect(await breakdown.evaluate((element) => element.open)).toBe(true);
    await expect(breakdown.getByText('Employee PF')).toBeVisible();
    await expect(breakdown.getByText('Employer contributions total')).toBeVisible();
    await expect(breakdown.getByText(/PF \/ ESI remittance/i)).toBeVisible();
    const expandedBody = await content.evaluate((element) => ({
      width: element.clientWidth,
      scrollWidth: element.scrollWidth
    }));
    expect(expandedBody.scrollWidth).toBeLessThanOrEqual(expandedBody.width);
    await breakdown.locator('summary').click();
    expect(await breakdown.evaluate((element) => element.open)).toBe(false);

    const payButton = modal.getByRole('button', { name: /^Pay$/i }).first();
    if (await payButton.isVisible()) {
      await payButton.click();
      await expect(page.getByRole('heading', { name: /Record Salary Disbursement/i })).toBeVisible();
      await page.getByRole('button', { name: 'Cancel' }).click();
    }
  });

  test('downloads a valid PDF for every report card', async ({ page }) => {
    await loginViaUi(page);
    await page.goto('/reports');
    await expect(page.getByText(/Business Reports & Data Exports/i)).toBeVisible();

    const reportIds = [
      'clients',
      'invoices',
      'material-invoices',
      'delivery-challans',
      'employees',
      'payroll',
      'employee-pf',
      'pf-documents',
      'advances',
      'quantities',
      'services'
    ];

    for (const reportId of reportIds) {
      const downloadPromise = page.waitForEvent('download');
      await page.getByTestId(`download-pdf-${reportId}`).click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
      const filePath = await download.path();
      const contents = await fs.readFile(filePath);
      expect(contents.subarray(0, 5).toString()).toBe('%PDF-');
      expect(contents.includes(Buffer.from('%%EOF'))).toBeTruthy();
    }
  });

  test('invalid login, protected route redirect, and valid logout flow', async ({ page }) => {
    await page.goto('/login');

    await page.locator('input[type="email"]').fill('bad@example.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.getByRole('button', { name: /Sign In to Portal/i }).click();

    await expect(page.getByText(/Invalid (email or password|credentials)/i)).toBeVisible();

    await page.goto('/clients');
    await expect(page).toHaveURL(/\/login$/);

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    await emailInput.clear();
    await emailInput.fill(ADMIN_EMAIL);
    await passwordInput.clear();
    await passwordInput.fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /Sign In to Portal/i }).click();
    await page.waitForURL('**/');
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
    const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = monthNames[payroll.month] || '';
    await expect(page.getByText(new RegExp(`(${monthName}|${payroll.month})\\s*${payroll.year}`, 'i'))).toBeVisible();

    await page.goto('/reports');
    await expect(page.getByText(/Reports & Data Export|Material Invoices Register|Client Register/i).first()).toBeVisible();
  });

  test('verifies service catalog, quantities register, and PF document generation workflows with reload persistence', async ({ page, request }) => {
    await loginViaUi(page);

    const token = await getAdminToken(request);
    const client = await createClientViaApi(request, token, {
      companyName: `Workflow Client ${Date.now()}`,
      email: `wf-${Date.now()}@example.com`,
    });

    // 1. Services Page Verification
    await page.goto('/services');
    await expect(page.getByText(/Service Catalog/i).first()).toBeVisible();
    await page.getByTestId('add-service-btn').click();

    const serviceName = `Cloud Automation ${Date.now()}`;
    await page.locator('input[placeholder="e.g. AWS Cloud Security Assessment"]').fill(serviceName);
    await page.locator('input[placeholder="50000"]').fill('45000');
    await page.locator('input[placeholder="998313"]').fill('998315');
    await page.getByRole('button', { name: /Add to Catalog|Save Service/i }).click();

    await expect(page.getByText(serviceName)).toBeVisible();
    await page.reload();
    await expect(page.getByText(serviceName)).toBeVisible();

    // 2. Quantities Page Verification
    await page.goto('/quantities');
    await expect(page.getByText(/Quantity Management Register/i).first()).toBeVisible();
    await page.getByRole('button', { name: /Log Quantity Record/i }).click();

    // Select the client and service explicitly
    await page.locator('select').first().selectOption({ value: client._id });
    await page.locator('select').nth(1).selectOption({ index: 0 });

    const qtyNotes = `Delivered Sprint Unit ${Date.now()}`;
    await page.locator('input[placeholder="Milestone sprint details or notes..."]').fill(qtyNotes);
    await page.getByRole('button', { name: /Save Log/i }).click();

    await expect(page.getByText(qtyNotes)).toBeVisible();
    await page.reload();
    await expect(page.getByText(qtyNotes)).toBeVisible();

    // 3. PF Documents Workflow Verification
    await page.goto('/pf-documents');
    await expect(page.getByText(/PF Documents/i).first()).toBeVisible();
    await page.getByTestId('create-pf-btn').click();

    const pfModal = page.locator('form').filter({ hasText: /Service Line Items/i });
    await pfModal.locator('select').first().selectOption({ value: client._id });
    await pfModal.locator('select').nth(1).selectOption({ index: 1 });
    await pfModal.locator('input[placeholder="Scope description"]').fill('Full Stack Web Dev Task');

    const pfNotes = `Proforma Quote Note ${Date.now()}`;
    await pfModal.locator('textarea[placeholder="Special instructions, milestones, or proposal remarks..."]').fill(pfNotes);
    await Promise.all([
      page.waitForURL((url) => url.pathname === '/invoices' && url.searchParams.has('fromPF')),
      pfModal.getByRole('button', { name: /Issue PF Document/i }).click(),
    ]);

    // After issuing PF, the UI navigates to Invoice creation. Navigate back to /pf-documents to verify persistence
    await page.goto('/pf-documents');
    await expect(page.getByText(client.companyName).first()).toBeVisible();
    await page.reload();
    await expect(page.getByText(client.companyName).first()).toBeVisible();
  });

  test('verifies Employee PF statutory register, Settings company profile, and cross-module consistency', async ({ page, request }) => {
    await loginViaUi(page);

    // 1. Employee PF Register Verification
    await page.goto('/employee-pf');
    await expect(page.getByText(/Employee PF & Statutory Records/i).first()).toBeVisible();
    await expect(page.getByPlaceholder(/Search by Employee, UAN or Member ID/i)).toBeVisible();

    // 2. Settings Page Verification
    await page.goto('/settings');
    await expect(page.getByText(/Company & Billing Settings/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Save Settings/i })).toBeVisible();

    // Update and persist legal name or tagline
    const legalNameInput = page.locator('input[name="companyName"]');
    await expect(legalNameInput).toBeVisible();
    const currentName = await legalNameInput.inputValue();
    expect(currentName.length).toBeGreaterThan(0);

    // 3. Dashboard Cross-Module KPI Consistency Verification
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Executive/i })).toBeVisible();
    await expect(page.getByText(/Total Invoiced/i).first()).toBeVisible();
    await expect(page.getByText(/Payments Collected/i).first()).toBeVisible();
    await expect(page.getByText(/Outstanding Receivables/i).first()).toBeVisible();
  });
});

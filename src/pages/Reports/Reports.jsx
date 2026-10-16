import React, { useState } from 'react';
import { getDownloadUrl } from '../../api/apiClient';
import {
  BarChart3,
  Download,
  Users,
  Receipt,
  FileSpreadsheet,
  WalletCards,
  Layers,
  Server,
  Briefcase,
  FileText,
  ShieldCheck,
  Truck,
  Package
} from 'lucide-react';

const reports = [
  {
    id: 'clients',
    name: 'Client Directory Register',
    description: 'Comprehensive directory of active and archived clients with contact info, locations, and GSTINs.',
    icon: Users,
    endpoint: '/api/reports/export/clients'
  },
  {
    id: 'invoices',
    name: 'Tax Invoices Master Register',
    description: 'Complete billing ledger of all issued invoices, GST breakdowns (CGST/SGST/IGST), and balances.',
    icon: Receipt,
    endpoint: '/api/reports/export/invoices'
  },
  {
    id: 'material-invoices',
    name: 'Material Invoices Register',
    description: 'Invoices issued against material supplies, equipment delivery, and site challans.',
    icon: Package,
    endpoint: '/api/reports/export/material-invoices'
  },
  {
    id: 'delivery-challans',
    name: 'Delivery Challans Register',
    description: 'Dispatch records, client delivery sites, transporter and vehicle logs, and receipt acknowledgments.',
    icon: Truck,
    endpoint: '/api/reports/export/delivery-challans'
  },
  {
    id: 'employees',
    name: 'Employee Directory & Salary Register',
    description: 'Staff directory, designations, departments, statutory status, and monthly salary structures.',
    icon: Briefcase,
    endpoint: '/api/reports/export/employees'
  },
  {
    id: 'payroll',
    name: 'Monthly Payroll Register',
    description: 'Gross earnings, statutory EPF and PT deductions, net disbursements, and transaction references.',
    icon: FileText,
    endpoint: '/api/reports/export/payroll'
  },
  {
    id: 'employee-pf',
    name: 'EPFO Statutory PF Register',
    description: 'Universal Account Numbers (UAN), wage bases, 12% employee/employer shares, and TRRN remittances.',
    icon: ShieldCheck,
    endpoint: '/api/reports/export/employee-pf'
  },
  {
    id: 'pf-documents',
    name: 'PF Documents & Quotations Register',
    description: 'Detailed log of all estimates, quotes, proformas, status changes, and conversion references.',
    icon: FileSpreadsheet,
    endpoint: '/api/reports/export/pf-documents'
  },
  {
    id: 'advances',
    name: 'Advance Receipts & Retainer Ledger',
    description: 'Record of all client advance payments, unallocated balances, and invoice settlement trails.',
    icon: WalletCards,
    endpoint: '/api/reports/export/advances'
  },
  {
    id: 'quantities',
    name: 'Quantity Deliverables Register',
    description: 'Log of delivered service quantities, deliverables, units of measurement, and client references.',
    icon: Layers,
    endpoint: '/api/reports/export/quantities'
  },
  {
    id: 'services',
    name: 'Services & Rate Catalog Report',
    description: 'Current service portfolio, default pricing tiers, SAC codes, and applicable tax rates.',
    icon: Server,
    endpoint: '/api/reports/export/services'
  }
];

const Reports = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const buildDownloadUrl = (endpoint, reportId) => {
    const params = new URLSearchParams();
    const token = localStorage.getItem('innomatrics_token');
    if (token) params.append('token', token);

    // Apply date filters only to date-relevant registers
    if (['invoices', 'material-invoices', 'delivery-challans', 'pf-documents', 'advances', 'quantities', 'payroll'].includes(reportId)) {
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
    }

    const qs = params.toString();
    const finalPath = qs ? `${endpoint}?${qs}` : endpoint;
    return getDownloadUrl(finalPath);
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Business Reports & Data Exports</h1>
        <p className="text-sm text-slate-500">Download Excel-compatible CSV registers for audit, tax filing, EPFO compliance, and accounting.</p>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Date Range Filter:</span>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div>
              <label className="block text-[10px] text-slate-400 font-medium">FROM</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-medium">TO</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        {(startDate || endDate) && (
          <button
            onClick={() => { setStartDate(''); setEndDate(''); }}
            className="text-xs font-semibold text-red-600 hover:text-red-700 self-end sm:self-center"
          >
            Clear Date Filters
          </button>
        )}
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {reports.map((report) => {
          const Icon = report.icon;
          const downloadUrl = buildDownloadUrl(report.endpoint, report.id);

          return (
            <div
              key={report.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    CSV FORMAT
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1.5">{report.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{report.description}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end">
                <a
                  href={downloadUrl}
                  download
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-blue-600 transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download CSV
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Reports;

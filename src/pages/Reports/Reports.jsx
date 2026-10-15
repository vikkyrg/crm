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
  FileCheck
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
    if (['invoices', 'pf-documents', 'advances', 'quantities'].includes(reportId)) {
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
        <p className="text-sm text-slate-500">Download Excel-compatible CSV registers for audit, tax filing, reconciliation, and accounting.</p>
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
            <span className="text-slate-400 text-xs mt-3">to</span>
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
            className="text-xs text-red-600 font-semibold hover:underline"
          >
            Clear Date Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => {
          const Icon = report.icon;
          const supportsDate = ['invoices', 'pf-documents', 'advances', 'quantities'].includes(report.id);

          return (
            <div
              key={report.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl w-fit mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1">{report.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{report.description}</p>
                {supportsDate && (startDate || endDate) && (
                  <div className="mt-2 text-[11px] font-mono text-blue-600 font-semibold bg-blue-50/70 p-1.5 rounded">
                    Filtered: {startDate || 'Earliest'} → {endDate || 'Latest'}
                  </div>
                )}
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Excel CSV Format</span>
                <a
                  href={buildDownloadUrl(report.endpoint, report.id)}
                  download
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
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

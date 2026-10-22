import React, { useState } from 'react';
import api from '../../api/apiClient';
import {
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
    icon: Users
  },
  {
    id: 'invoices',
    name: 'Tax Invoices Master Register',
    description: 'Complete billing ledger of all issued invoices, GST breakdowns (CGST/SGST/IGST), and balances.',
    icon: Receipt
  },
  {
    id: 'material-invoices',
    name: 'Material Invoices Register',
    description: 'Invoices issued against material supplies, equipment delivery, and site challans.',
    icon: Package
  },
  {
    id: 'delivery-challans',
    name: 'Delivery Challans Register',
    description: 'Dispatch records, client delivery sites, transporter and vehicle logs, and receipt acknowledgments.',
    icon: Truck
  },
  {
    id: 'employees',
    name: 'Employee Directory & Salary Register',
    description: 'Staff directory, designations, departments, statutory status, and monthly salary structures.',
    icon: Briefcase
  },
  {
    id: 'payroll',
    name: 'Monthly Payroll Register',
    description: 'Gross earnings, statutory EPF and PT deductions, net disbursements, and transaction references.',
    icon: FileText
  },
  {
    id: 'employee-pf',
    name: 'EPFO Statutory PF Register',
    description: 'Universal Account Numbers (UAN), wage bases, 12% employee/employer shares, and TRRN remittances.',
    icon: ShieldCheck
  },
  {
    id: 'pf-documents',
    name: 'PF Documents & Quotations Register',
    description: 'Detailed log of all estimates, quotes, proformas, status changes, and conversion references.',
    icon: FileSpreadsheet
  },
  {
    id: 'advances',
    name: 'Advance Receipts & Retainer Ledger',
    description: 'Record of all client advance payments, unallocated balances, and invoice settlement trails.',
    icon: WalletCards
  },
  {
    id: 'quantities',
    name: 'Quantity Deliverables Register',
    description: 'Log of delivered service quantities, deliverables, units of measurement, and client references.',
    icon: Layers
  },
  {
    id: 'services',
    name: 'Services & Rate Catalog Report',
    description: 'Current service portfolio, default pricing tiers, SAC codes, and applicable tax rates.',
    icon: Server
  }
];

const Reports = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [downloadingReport, setDownloadingReport] = useState('');
  const [downloadStatus, setDownloadStatus] = useState({});

  const downloadReport = async (report) => {
    setDownloadingReport(report.id);
    setDownloadStatus((current) => ({ ...current, [report.id]: null }));

    const params = { format: 'pdf' };
    if (['invoices', 'material-invoices', 'delivery-challans', 'pf-documents', 'advances', 'quantities', 'payroll'].includes(report.id)) {
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
    }

    try {
      const response = await api.get(`/reports/export/${report.id}`, {
        params,
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const disposition = response.headers['content-disposition'] || '';
      const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1]
        || `${report.id}-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);

      const empty = response.headers['x-report-empty'] === 'true';
      setDownloadStatus((current) => ({
        ...current,
        [report.id]: {
          type: empty ? 'info' : 'success',
          message: empty
            ? 'No records matched the selected filters. An empty PDF report was downloaded.'
            : 'PDF report downloaded successfully.'
        }
      }));
    } catch (error) {
      let message = error.response?.data?.message;
      if (!message && error.response?.data instanceof Blob) {
        try {
          const errorBody = JSON.parse(await error.response.data.text());
          message = errorBody.message;
        } catch {
          message = '';
        }
      }
      setDownloadStatus((current) => ({
        ...current,
        [report.id]: {
          type: 'error',
          message: message || 'Unable to generate this PDF report. Please try again.'
        }
      }));
    } finally {
      setDownloadingReport('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Business Reports & Data Exports</h1>
        <p className="text-sm text-slate-500">Download formatted PDF registers for audit, tax filing, EPFO compliance, and accounting.</p>
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
                    PDF REPORT
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1.5">{report.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{report.description}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  data-testid={`download-pdf-${report.id}`}
                  onClick={() => downloadReport(report)}
                  disabled={Boolean(downloadingReport)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-blue-600 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-wait"
                >
                  <Download className="w-3.5 h-3.5" />
                  {downloadingReport === report.id ? 'Generating PDF...' : 'Download PDF'}
                </button>
              </div>
              {downloadStatus[report.id] && (
                <p
                  role="status"
                  className={`mt-2 text-xs ${
                    downloadStatus[report.id].type === 'error'
                      ? 'text-red-600'
                      : downloadStatus[report.id].type === 'info'
                      ? 'text-amber-700'
                      : 'text-emerald-700'
                  }`}
                >
                  {downloadStatus[report.id].message}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Reports;

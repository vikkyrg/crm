import React, { useState, useEffect } from 'react';
import api, { getDownloadUrl } from '../../api/apiClient';
import { formatDate, formatINR } from '../../utils/formatters';
import {
  ShieldCheck,
  Search,
  Download,
  AlertCircle,
  CheckCircle,
  FileCheck2,
  Calendar,
  CreditCard,
  Building2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const currentYear = new Date().getFullYear();
const YEARS = [currentYear - 1, currentYear, currentYear + 1];

const EmployeePF = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Batch Remittance Modal State
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchPeriod, setBatchPeriod] = useState({ month: 'October', year: currentYear });
  const [periodSummary, setPeriodSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [batchForm, setBatchForm] = useState({
    remittanceDate: new Date().toISOString().split('T')[0],
    challanTrrn: '',
    bankReference: '',
    notes: 'EPFO Unified Portal ECR Remittance'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  const fetchRecords = async (targetPage = page) => {
    try {
      setLoading(true);
      const params = { page: targetPage, limit };
      if (search) params.search = search;
      if (monthFilter) params.periodMonth = monthFilter;
      if (yearFilter) params.periodYear = yearFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/employee-pf', { params });
      setRecords(res.data.records || res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalCount(res.data.totalCount || res.data.total || 0);
      setPage(res.data.currentPage || res.data.page || 1);
    } catch (err) {
      console.error('PF load error:', err);
      setError(err.response?.data?.message || 'Failed to load EPF statutory records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(1);
  }, [search, monthFilter, yearFilter, statusFilter]);

  const fetchPeriodSummary = async (month, year) => {
    try {
      setSummaryLoading(true);
      const res = await api.get('/employee-pf/pending-summary', {
        params: { periodMonth: month, periodYear: year }
      });
      setPeriodSummary(res.data);
    } catch (err) {
      console.error('Pending summary error:', err);
      setPeriodSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    if (showBatchModal) {
      fetchPeriodSummary(batchPeriod.month, batchPeriod.year);
    }
  }, [showBatchModal, batchPeriod.month, batchPeriod.year]);

  const handleBatchRemit = async (e) => {
    e.preventDefault();
    if (!batchForm.challanTrrn.trim()) {
      setError('EPFO Challan TRRN reference number is required to confirm remittance');
      return;
    }
    try {
      setIsSubmitting(true);
      setError('');
      const res = await api.post('/employee-pf/remit-period', {
        periodMonth: batchPeriod.month,
        periodYear: Number(batchPeriod.year),
        ...batchForm
      });
      setSuccess(res.data.message || 'Period EPF batch marked as remitted!');
      setShowBatchModal(false);
      setBatchForm({
        remittanceDate: new Date().toISOString().split('T')[0],
        challanTrrn: '',
        bankReference: '',
        notes: 'EPFO Unified Portal ECR Remittance'
      });
      fetchRecords(1);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Batch remit error:', err);
      setError(err.response?.data?.message || 'Failed to submit batch remittance');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            Statutory Compliance & EPFO
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Employee PF & Statutory Records</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Maintain payroll-derived PF contribution records, challan references, and manually recorded EPFO remittance status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={getDownloadUrl('/api/reports/export/employee-pf')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            Export PF Register
          </a>
          <button
            onClick={() => setShowBatchModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-500/20 transition-all"
          >
            <FileCheck2 className="w-4 h-4" />
            Remit Period Challan
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-800 text-lg leading-none">&times;</button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="text-emerald-500 hover:text-emerald-800 text-lg leading-none">&times;</button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Employee, UAN or Member ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Months</option>
            {MONTHS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Years</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Remittance Statuses</option>
            <option value="Remitted">Remitted to EPFO</option>
            <option value="Pending">Pending Remittance</option>
          </select>
        </div>
      </div>

      {/* PF Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 divide-y divide-slate-200">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th scope="col" className="py-3 px-4 w-[140px] whitespace-nowrap">Period</th>
                <th scope="col" className="py-3 px-4 min-w-[200px]">Employee & UAN</th>
                <th scope="col" className="py-3 px-4 w-[130px] whitespace-nowrap">PF Wage Base</th>
                <th scope="col" className="py-3 px-4 w-[150px] whitespace-nowrap">EE Contribution</th>
                <th scope="col" className="py-3 px-4 min-w-[180px]">Employer (EPS+EPF)</th>
                <th scope="col" className="py-3 px-4 w-[130px] whitespace-nowrap">Total Deposit</th>
                <th scope="col" className="py-3 px-4 min-w-[160px]">Challan / TRRN</th>
                <th scope="col" className="py-3 px-4 w-[140px] text-right whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading EPFO statutory records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No PF records found matching current query. Records are generated when finalizing monthly payroll.
                  </td>
                </tr>
              ) : (
                records.map((rec) => (
                  <tr key={rec._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap align-middle">
                      {rec.periodName || `${rec.periodMonth || rec.month} ${rec.periodYear || rec.year}`}
                    </td>
                    <td className="py-3.5 px-4 align-middle">
                      <div className="font-semibold text-slate-900">{rec.employeeName}</div>
                      <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                        <span>UAN: {rec.uan || 'N/A'}</span>
                        <span>•</span>
                        <span>{rec.employeeId}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800 whitespace-nowrap align-middle">
                      {formatINR(rec.pfWageBase)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-700 whitespace-nowrap align-middle">
                      {formatINR(rec.employeeContribution)}
                    </td>
                    <td className="py-3.5 px-4 align-middle">
                      <div className="font-medium text-slate-900">{formatINR(rec.employerContribution ?? rec.totalEmployerPf ?? 0)}</div>
                      <div className="text-[10px] text-slate-400 whitespace-nowrap">
                        EPS: {formatINR(rec.epsContribution ?? rec.employerEpsShare ?? 0)} | EPF: {formatINR(rec.epfDifference ?? rec.employerEpfShare ?? 0)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap align-middle">
                      {formatINR(rec.totalPfAmount ?? rec.totalPfDeposit ?? 0)}
                    </td>
                    <td className="py-3.5 px-4 align-middle">
                      {(rec.challanNumber || rec.challanTrrn) ? (
                        <div>
                          <span className="font-mono text-xs font-semibold text-slate-800">{rec.challanNumber || rec.challanTrrn}</span>
                          <span className="block text-[10px] text-slate-400">{formatDate(rec.remittanceDate)}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Unremitted</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right align-middle whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                        rec.remittanceStatus === 'Remitted'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {rec.remittanceStatus === 'Remitted' ? 'Remitted to EPFO' : 'Pending Remittance'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing {records.length} of {totalCount} statutory contributions
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => fetchRecords(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium text-slate-700">Page {page} of {totalPages}</span>
            <button
              onClick={() => fetchRecords(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* BATCH REMITTANCE MODAL */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-bold text-slate-900">Record EPFO Period Remittance</h3>
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Link ECR Challan TRRN reference to update all employee records for the chosen month
            </p>

            <form onSubmit={handleBatchRemit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Wage Month</label>
                  <select
                    value={batchPeriod.month}
                    onChange={(e) => setBatchPeriod({ ...batchPeriod, month: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white"
                  >
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Wage Year</label>
                  <select
                    value={batchPeriod.year}
                    onChange={(e) => setBatchPeriod({ ...batchPeriod, year: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white"
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Live Period Remittance Summary */}
              {summaryLoading ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                  Checking eligible records for {batchPeriod.month} {batchPeriod.year}...
                </div>
              ) : periodSummary ? (
                <div className="space-y-2">
                  <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-emerald-900">
                        Eligible Pending Records:
                      </span>
                      <span className="font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                        {periodSummary.pendingCount} Employees
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-emerald-800">
                      <div>
                        <span className="text-[11px] text-emerald-600 block">Total Pool Deposit</span>
                        <span className="font-bold text-sm text-emerald-950">
                          {formatINR(periodSummary.summary?.totalDeposit || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-emerald-600 block">EE + ER Breakdown</span>
                        <span className="text-xs font-semibold text-emerald-950">
                          {formatINR(periodSummary.summary?.totalEmployeeShare || 0)} + {formatINR(periodSummary.summary?.totalEmployerShare || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {periodSummary.pendingCount === 0 && periodSummary.alreadyRemittedCount > 0 && (
                    <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span>All {periodSummary.alreadyRemittedCount} record(s) for this period have already been remitted.</span>
                    </div>
                  )}

                  {periodSummary.pendingCount === 0 && periodSummary.alreadyRemittedCount === 0 && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>No PF records found for this period. Finalize monthly payroll first.</span>
                    </div>
                  )}
                </div>
              ) : null}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">EPFO Challan TRRN Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TRRN-202610-1234567"
                  value={batchForm.challanTrrn}
                  onChange={(e) => setBatchForm({ ...batchForm, challanTrrn: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 font-mono uppercase focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Remittance Date</label>
                <input
                  type="date"
                  required
                  value={batchForm.remittanceDate}
                  onChange={(e) => setBatchForm({ ...batchForm, remittanceDate: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Payment Reference</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC-CRN-987654"
                  value={batchForm.bankReference}
                  onChange={(e) => setBatchForm({ ...batchForm, bankReference: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="w-1/2 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || summaryLoading || (periodSummary && periodSummary.pendingCount === 0)}
                  className="w-1/2 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? 'Recording...' : 'Confirm Remittance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeePF;

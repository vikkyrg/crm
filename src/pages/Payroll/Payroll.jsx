import React, { useState, useEffect } from 'react';
import api, { getDownloadUrl } from '../../api/apiClient';
import { formatDate, formatINR } from '../../utils/formatters';
import {
  FileText,
  Calendar,
  Play,
  CheckCircle,
  Download,
  AlertCircle,
  Plus,
  Eye,
  CreditCard,
  Building2,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  ChevronLeft
} from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const currentYear = new Date().getFullYear();
const YEARS = [currentYear - 1, currentYear, currentYear + 1];

const Payroll = () => {
  const [payrollRuns, setPayrollRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Run Payroll Modal State
  const [showRunModal, setShowRunModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('October');
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Selected Run View Modal
  const [viewRun, setViewRun] = useState(null);

  // Payment Recording Modal State
  const [paymentModal, setPaymentModal] = useState({ open: false, runId: null, employeeId: null, name: '' });
  const [paymentForm, setPaymentForm] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Bank Transfer (NEFT/IMPS)',
    transactionReference: ''
  });

  const fetchPayrollRuns = async () => {
    try {
      setLoading(true);
      const res = await api.get('/payroll');
      setPayrollRuns(res.data.runs || []);
    } catch (err) {
      console.error('Failed to load payroll:', err);
      setError(err.response?.data?.message || 'Failed to load payroll records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollRuns();
  }, []);

  const handleOpenRunModal = () => {
    setSelectedMonth('October');
    setSelectedYear(currentYear);
    setPreviewData(null);
    setError('');
    setShowRunModal(true);
  };

  const handleGeneratePreview = async () => {
    try {
      setPreviewLoading(true);
      setError('');
      const res = await api.post('/payroll/preview', {
        month: selectedMonth,
        year: Number(selectedYear)
      });
      setPreviewData(res.data);
    } catch (err) {
      console.error('Preview error:', err);
      setError(err.response?.data?.message || 'Failed to generate payroll preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleFinalizePayroll = async () => {
    if (!previewData) return;
    try {
      setSubmitting(true);
      setError('');
      await api.post('/payroll', {
        month: selectedMonth,
        year: Number(selectedYear),
        items: previewData.items,
        notes: `Executed via ERP Payroll portal for ${selectedMonth} ${selectedYear}`
      });
      setSuccess(`Payroll for ${selectedMonth} ${selectedYear} finalized successfully!`);
      setShowRunModal(false);
      fetchPayrollRuns();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Finalize error:', err);
      setError(err.response?.data?.message || 'Could not finalize payroll run');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/payroll/${paymentModal.runId}/employees/${paymentModal.employeeId}/payment`, paymentForm);
      setSuccess(`Salary payment recorded for ${paymentModal.name}`);
      setPaymentModal({ open: false, runId: null, employeeId: null, name: '' });
      fetchPayrollRuns();
      if (viewRun) {
        // Refresh view run modal
        const refreshed = await api.get(`/payroll/${viewRun._id}`);
        setViewRun(refreshed.data);
      }
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Payment record error:', err);
      setError(err.response?.data?.message || 'Failed to record payment');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            Financial Operations
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Salary & Monthly Payroll</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Automated statutory calculations, EPF/PT deductions, payslip generation, and disbursement tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={getDownloadUrl('/api/reports/export/payroll')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            Export Payroll Register
          </a>
          <button
            onClick={handleOpenRunModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/20 transition-all"
          >
            <Play className="w-4 h-4" />
            Run Monthly Payroll
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

      {/* Payroll Runs List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 font-bold text-sm text-slate-900">
          Historical Payroll Batches
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Run Number</th>
                <th className="py-3 px-4">Payroll Period</th>
                <th className="py-3 px-4">Staff Count</th>
                <th className="py-3 px-4">Gross Earnings</th>
                <th className="py-3 px-4">Statutory PF (EE+ER)</th>
                <th className="py-3 px-4">Net Disbursement</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading payroll history...
                  </td>
                </tr>
              ) : payrollRuns.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No payroll runs found. Click "Run Monthly Payroll" to execute this month's calculations.
                  </td>
                </tr>
              ) : (
                payrollRuns.map((run) => (
                  <tr key={run._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                      {run.payrollRunNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {run.month} {run.year}
                    </td>
                    <td className="py-3.5 px-4">
                      {run.totalEmployees} Employees
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {formatINR(run.totalGrossEarnings)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs font-semibold text-slate-900">
                        {formatINR(run.totalEmployeePf + run.totalEmployerPf)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        EE: {formatINR(run.totalEmployeePf)} | ER: {formatINR(run.totalEmployerPf)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-blue-600">
                      {formatINR(run.totalNetPayable)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {run.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setViewRun(run)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Register
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RUN MONTHLY PAYROLL MODAL */}
      {showRunModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Run Monthly Payroll Engine</h3>
                <p className="text-xs text-slate-500">Calculate pro-rated attendance, statutory PF, PT, and net salary payable</p>
              </div>
              <button onClick={() => setShowRunModal(false)} className="text-slate-400 hover:text-slate-700 text-xl font-bold">&times;</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Period Selector */}
              <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payroll Month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payroll Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-5">
                  <button
                    type="button"
                    onClick={handleGeneratePreview}
                    disabled={previewLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50"
                  >
                    {previewLoading ? 'Computing Rules...' : 'Compute Calculations'}
                  </button>
                </div>
              </div>

              {/* Preview Table */}
              {previewData && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                      <div className="text-xs text-slate-500 uppercase font-semibold">Staff Count</div>
                      <div className="text-xl font-bold text-slate-900 mt-0.5">{previewData.totalEmployees}</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                      <div className="text-xs text-slate-500 uppercase font-semibold">Total Gross</div>
                      <div className="text-xl font-bold text-slate-900 mt-0.5">{formatINR(previewData.totalGrossEarnings)}</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                      <div className="text-xs text-slate-500 uppercase font-semibold">EPF Accruals</div>
                      <div className="text-xl font-bold text-emerald-600 mt-0.5">{formatINR(previewData.totalEmployeePf)}</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-center">
                      <div className="text-xs text-blue-700 uppercase font-semibold">Net Disbursement</div>
                      <div className="text-xl font-bold text-blue-700 mt-0.5">{formatINR(previewData.totalNetPayable)}</div>
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-100 font-semibold text-slate-700 sticky top-0">
                        <tr>
                          <th className="py-2.5 px-3">Employee</th>
                          <th className="py-2.5 px-3">Gross Earnings</th>
                          <th className="py-2.5 px-3">EPF (12%)</th>
                          <th className="py-2.5 px-3">PT / TDS</th>
                          <th className="py-2.5 px-3">Net Payable</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {previewData.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              {item.fullName}
                              <span className="block font-mono text-[10px] text-slate-400">{item.employeeId}</span>
                            </td>
                            <td className="py-2.5 px-3">{formatINR(item.earnings.grossSalary)}</td>
                            <td className="py-2.5 px-3 text-emerald-700 font-medium">{formatINR(item.deductions.employeePf)}</td>
                            <td className="py-2.5 px-3">{formatINR(item.deductions.professionalTax + item.deductions.tds)}</td>
                            <td className="py-2.5 px-3 font-bold text-blue-600">{formatINR(item.netSalaryPayable)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowRunModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFinalizePayroll}
                disabled={!previewData || submitting}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50"
              >
                {submitting ? 'Finalizing Run...' : 'Finalize & Post Payroll'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW REGISTER & DOWNLOAD PAYSLIPS MODAL */}
      {viewRun && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Payroll Register — {viewRun.month} {viewRun.year} ({viewRun.payrollRunNumber})
                </h3>
                <p className="text-xs text-slate-500">Breakdown of earnings, deductions, and payslip generation</p>
              </div>
              <button onClick={() => setViewRun(null)} className="text-slate-400 hover:text-slate-700 text-xl font-bold">&times;</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="overflow-x-auto max-h-[60vh] border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-100 font-semibold text-slate-700 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Employee</th>
                      <th className="py-2.5 px-3">Gross</th>
                      <th className="py-2.5 px-3">EPF (12%)</th>
                      <th className="py-2.5 px-3">PT / TDS</th>
                      <th className="py-2.5 px-3">Total Deductions</th>
                      <th className="py-2.5 px-3">Net Payable</th>
                      <th className="py-2.5 px-3">Payment Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewRun.items.map((emp) => (
                      <tr key={emp._id} className="hover:bg-slate-50">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{emp.fullName}</div>
                          <div className="text-[10px] text-slate-400">{emp.employeeId} &bull; {emp.designation}</div>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-900">{formatINR(emp.earnings.grossSalary)}</td>
                        <td className="py-3 px-3 text-emerald-700">{formatINR(emp.deductions.employeePf)}</td>
                        <td className="py-3 px-3">{formatINR(emp.deductions.professionalTax + emp.deductions.tds)}</td>
                        <td className="py-3 px-3 font-semibold text-rose-600">{formatINR(emp.deductions.totalDeductions)}</td>
                        <td className="py-3 px-3 font-bold text-blue-600">{formatINR(emp.netSalaryPayable)}</td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            emp.paymentStatus === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {emp.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right space-x-2">
                          <a
                            href={getDownloadUrl(`/api/payroll/${viewRun._id}/employees/${emp.employeeIdRef}/payslip`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                          >
                            <Download className="w-3 h-3" />
                            PDF Payslip
                          </a>
                          {emp.paymentStatus !== 'Paid' && (
                            <button
                              onClick={() => setPaymentModal({
                                open: true,
                                runId: viewRun._id,
                                employeeId: emp.employeeIdRef,
                                name: emp.fullName
                              })}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                            >
                              <CreditCard className="w-3 h-3" />
                              Pay
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setViewRun(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECORD SALARY PAYMENT MODAL */}
      {paymentModal.open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Record Salary Disbursement</h3>
            <p className="text-xs text-slate-500 mb-4">Confirm bank transaction details for {paymentModal.name}</p>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Disbursement Date</label>
                <input
                  type="date"
                  required
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white"
                >
                  <option value="Bank Transfer (NEFT/IMPS)">Bank Transfer (NEFT/IMPS)</option>
                  <option value="UPI / Direct Credit">UPI / Direct Credit</option>
                  <option value="Company Cheque">Company Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bank UTR / Transaction Ref</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UTR-20261016-987654"
                  value={paymentForm.transactionReference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transactionReference: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 font-mono uppercase"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setPaymentModal({ open: false, runId: null, employeeId: null, name: '' })}
                  className="w-1/2 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;

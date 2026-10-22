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
      const runs = res.data?.data || res.data?.runs || [];
      setPayrollRuns(Array.isArray(runs) ? runs : []);
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
        status: 'Finalized',
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
      const payRes = await api.post(`/payroll/${paymentModal.runId}/employees/${paymentModal.employeeId}/payment`, paymentForm);
      setSuccess(`Salary payment recorded for ${paymentModal.name}`);
      setPaymentModal({ open: false, runId: null, employeeId: null, name: '' });
      
      const updatedRun = payRes.data?.run;
      if (updatedRun) {
        setPayrollRuns(prevRuns => prevRuns.map(r => r._id === updatedRun._id ? { ...r, ...updatedRun } : r));
      }
      
      // Always re-fetch to ensure sync with MongoDB
      fetchPayrollRuns();
      if (viewRun) {
        const refreshed = await api.get(`/payroll/${viewRun._id}`);
        setViewRun(refreshed.data?.data || refreshed.data);
      }
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Payment record error:', err);
      setError(err.response?.data?.message || 'Failed to record payment');
    }
  };

  const handleFinalizeExistingBatch = async (batchId) => {
    try {
      setSubmitting(true);
      setError('');
      const res = await api.post(`/payroll/${batchId}/finalize`);
      setSuccess(res.data?.message || 'Payroll batch finalized and statutory PF records generated!');
      fetchPayrollRuns();
      if (viewRun && viewRun._id === batchId) {
        const refreshed = await api.get(`/payroll/${batchId}`);
        setViewRun(refreshed.data?.data || refreshed.data);
      }
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Batch finalize error:', err);
      setError(err.response?.data?.message || 'Failed to finalize payroll batch');
    } finally {
      setSubmitting(false);
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
            Configured statutory payroll estimates, payslips, salary disbursement tracking, and separate remittance statuses.
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
          <table className="w-full text-left text-sm text-slate-600 divide-y divide-slate-200">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th scope="col" className="py-3 px-4 w-[160px] whitespace-nowrap">Run Number</th>
                <th scope="col" className="py-3 px-4 min-w-[150px]">Payroll Period</th>
                <th scope="col" className="py-3 px-4 w-[120px] whitespace-nowrap">Staff Count</th>
                <th scope="col" className="py-3 px-4 w-[140px] whitespace-nowrap">Gross Earnings</th>
                <th scope="col" className="py-3 px-4 min-w-[180px]">Statutory PF (EE+ER)</th>
                <th scope="col" className="py-3 px-4 w-[150px] whitespace-nowrap">Net Disbursement</th>
                <th scope="col" className="py-3 px-4 w-[130px] whitespace-nowrap">Status</th>
                <th scope="col" className="py-3 px-4 w-[180px] text-right whitespace-nowrap">Actions</th>
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
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-900 whitespace-nowrap align-middle">
                      {run.payrollCode || run.payrollRunNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 align-middle">
                      {run.periodName || `${run.month} ${run.year}`}
                    </td>
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                      {run.totalEmployees || run.items?.length || 0} Employees
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800 whitespace-nowrap align-middle">
                      {formatINR(run.totalGrossEarnings || 0)}
                    </td>
                    <td className="py-3.5 px-4 align-middle">
                      <div className="text-xs font-semibold text-slate-900">
                        {formatINR((run.totalEmployeePf || 0) + (run.totalEmployerPf || 0))}
                      </div>
                      <div className="text-[10px] text-slate-400 whitespace-nowrap">
                        EE: {formatINR(run.totalEmployeePf || 0)} | ER: {formatINR(run.totalEmployerPf || 0)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-blue-600 whitespace-nowrap align-middle">
                      {formatINR(run.totalNetPayable || 0)}
                    </td>
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                      {(() => {
                        const payStatus = run.paymentStatus || (
                          (run.totalAmountPaid >= run.totalNetPayable && (run.totalNetPayable || 0) > 0)
                            ? 'Paid'
                            : ((run.totalAmountPaid || 0) > 0 ? 'Partially Paid' : 'Pending')
                        );
                        return (
                          <div className="flex flex-col gap-1 items-start">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border ${
                              payStatus === 'Paid'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : payStatus === 'Partially Paid'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {payStatus}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium capitalize">
                              Batch: {run.status || 'Draft'}
                            </span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-3.5 px-4 text-right align-middle whitespace-nowrap space-x-2">
                      {run.status === 'Draft' && (
                        <button
                          onClick={() => handleFinalizeExistingBatch(run._id)}
                          disabled={submitting}
                          title="Finalize batch to post statutory PF records"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200 disabled:opacity-50"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Finalize
                        </button>
                      )}
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
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    Configured estimate only. Review statutory eligibility, rate, ceiling, and effective-date settings before processing. Salary payment does not record EPFO or ESI remittance.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                      <div className="text-xs text-slate-500 uppercase font-semibold">Staff Count</div>
                      <div className="text-xl font-bold text-slate-900 mt-0.5">
                        {previewData.summary?.totalEmployees || previewData.totalEmployees || previewData.items?.length || 0}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                      <div className="text-xs text-slate-500 uppercase font-semibold">Total Gross</div>
                      <div className="text-xl font-bold text-slate-900 mt-0.5">
                        {formatINR(previewData.summary?.totalGrossEarnings || previewData.totalGrossEarnings || 0)}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                      <div className="text-xs text-slate-500 uppercase font-semibold">Employee PF / ESI</div>
                      <div className="text-sm font-bold text-emerald-600 mt-1">
                        PF: {formatINR(previewData.summary?.totalEmployeePf || 0)}
                      </div>
                      <div className="text-xs font-semibold text-emerald-700">
                        ESI: {formatINR(previewData.summary?.totalEmployeeEsi || 0)}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                      <div className="text-xs text-slate-500 uppercase font-semibold">Employer PF / ESI</div>
                      <div className="text-sm font-bold text-slate-900 mt-1">
                        PF: {formatINR(previewData.summary?.totalEmployerPf || 0)}
                      </div>
                      <div className="text-xs font-semibold text-slate-600">
                        ESI: {formatINR(previewData.summary?.totalEmployerEsi || 0)}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                      <div className="text-xs text-slate-500 uppercase font-semibold">Total Deductions</div>
                      <div className="text-xl font-bold text-rose-600 mt-0.5">
                        {formatINR(previewData.summary?.totalDeductions || 0)}
                      </div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-center">
                      <div className="text-xs text-blue-700 uppercase font-semibold">Net Disbursement</div>
                      <div className="text-xl font-bold text-blue-700 mt-0.5">
                        {formatINR(previewData.summary?.totalNetPayable || previewData.totalNetPayable || 0)}
                      </div>
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-100 font-semibold text-slate-700 sticky top-0">
                        <tr>
                          <th className="py-2.5 px-3">Employee</th>
                          <th className="py-2.5 px-3">Gross Earnings</th>
                          <th className="py-2.5 px-3">Employee PF</th>
                          <th className="py-2.5 px-3">Employee ESI</th>
                          <th className="py-2.5 px-3">Employer PF</th>
                          <th className="py-2.5 px-3">Employer ESI</th>
                          <th className="py-2.5 px-3">Other Deductions</th>
                          <th className="py-2.5 px-3">Net Pay</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {previewData.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              {item.employeeName || item.fullName}
                              <span className="block font-mono text-[10px] text-slate-400">{item.employeeId}</span>
                            </td>
                            <td className="py-2.5 px-3">{formatINR(item.grossEarnings || item.earnings?.grossSalary || 0)}</td>
                            <td className="py-2.5 px-3 text-emerald-700 font-medium">
                              <div>{formatINR(item.employeePfContribution || item.deductions?.employeePf || 0)}</div>
                              {item.employeePfContribution === 0 && item.statutoryCalculation?.pf?.reason && (
                                <div className="text-[10px] text-slate-400 font-normal">{item.statutoryCalculation.pf.reason}</div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-emerald-700">
                              <div>{formatINR(item.employeeEsiContribution || 0)}</div>
                              {item.employeeEsiContribution === 0 && item.statutoryCalculation?.esi?.reason && (
                                <div className="text-[10px] text-slate-400 font-normal">{item.statutoryCalculation.esi.reason}</div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700">
                              {formatINR(item.employerPfContribution || 0)}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700">
                              {formatINR(item.employerEsiContribution || 0)}
                            </td>
                            <td className="py-2.5 px-3">
                              {formatINR((item.professionalTax || 0) + (item.tdsDeduction || 0) + (item.otherDeductions || 0))}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-blue-600">{formatINR(item.netSalaryPayable || 0)}</td>
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4">
          <div data-testid="payroll-register-modal" className="mx-auto bg-white rounded-2xl w-full max-w-5xl max-h-[calc(100dvh-3rem)] shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-4 sm:px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4 bg-slate-50 flex-shrink-0">
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-slate-900">Payroll Register</h3>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                  <span className="font-semibold">{viewRun.periodName || `${viewRun.month} ${viewRun.year}`}</span>
                  <span>Batch: {viewRun.payrollCode || viewRun.payrollRunNumber}</span>
                  {(() => {
                    const payStatus = viewRun.paymentStatus || (
                      (viewRun.totalAmountPaid >= viewRun.totalNetPayable && (viewRun.totalNetPayable || 0) > 0)
                        ? 'Paid'
                        : ((viewRun.totalAmountPaid || 0) > 0 ? 'Partially Paid' : 'Pending')
                    );
                    return (
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border ${
                        payStatus === 'Paid'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : payStatus === 'Partially Paid'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        Disbursement: {payStatus}
                      </span>
                    );
                  })()}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Lifecycle: <span className="inline-flex px-2 py-0.5 ml-1 font-semibold text-slate-700 bg-slate-200 rounded-full capitalize">{viewRun.status || 'Draft'}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewRun(null)}
                aria-label="Close payroll register"
                className="flex-shrink-0 text-slate-400 hover:text-slate-700 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div data-testid="payroll-register-content" className="p-3 sm:p-5 space-y-3 min-h-0 flex-1 overflow-y-auto">
              {viewRun.items.map((emp) => {
                const totalDeductions = emp.totalEmployeeDeductions || emp.deductions?.totalDeductions || 0;
                const employerContributions = (emp.employerPfContribution || 0) + (emp.employerEsiContribution || 0);
                const professionalTax = emp.professionalTax || 0;
                const tds = emp.tdsDeduction || 0;

                return (
                  <section
                    key={emp._id}
                    data-testid="payroll-employee-card"
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">
                      <div className="col-span-2 min-w-0 sm:col-span-1">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Employee</div>
                        <div className="mt-0.5 break-words font-bold text-slate-900">{emp.employeeName || emp.fullName}</div>
                        <div className="break-words text-xs text-slate-500">{emp.employeeId} {emp.designation ? `• ${emp.designation}` : ''}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Gross salary</div>
                        <div className="mt-0.5 whitespace-nowrap font-medium text-slate-900">{formatINR(emp.grossEarnings || emp.earnings?.grossSalary || 0)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Total deductions</div>
                        <div className="mt-0.5 whitespace-nowrap font-semibold text-rose-600">{formatINR(totalDeductions)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Net payable</div>
                        <div className="mt-0.5 whitespace-nowrap font-bold text-blue-600">{formatINR(emp.netSalaryPayable || 0)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Payment status</div>
                        <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          emp.paymentStatus === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {emp.paymentStatus || 'Pending'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
                      <details data-testid="payroll-employee-breakdown" className="group min-w-0">
                        <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 [&::-webkit-details-marker]:hidden">
                          <ChevronRight className="h-4 w-4 flex-shrink-0 transition-transform group-open:rotate-90" />
                          View breakdown
                        </summary>
                        <div className="mt-3 grid grid-cols-1 gap-2 rounded-lg bg-slate-50 p-3 text-xs sm:grid-cols-2 xl:grid-cols-3">
                          <div className="flex justify-between gap-3"><span className="text-slate-500">Employee PF</span><span className="whitespace-nowrap font-medium text-slate-800">{formatINR(emp.employeePfContribution || 0)}</span></div>
                          <div className="flex justify-between gap-3"><span className="text-slate-500">Employer PF</span><span className="whitespace-nowrap font-medium text-slate-800">{formatINR(emp.employerPfContribution || 0)}</span></div>
                          <div className="flex justify-between gap-3"><span className="text-slate-500">Employee ESI</span><span className="whitespace-nowrap font-medium text-slate-800">{formatINR(emp.employeeEsiContribution || 0)}</span></div>
                          <div className="flex justify-between gap-3"><span className="text-slate-500">Employer ESI</span><span className="whitespace-nowrap font-medium text-slate-800">{formatINR(emp.employerEsiContribution || 0)}</span></div>
                          <div className="flex justify-between gap-3"><span className="text-slate-500">Professional tax</span><span className="whitespace-nowrap font-medium text-slate-800">{formatINR(professionalTax)}</span></div>
                          <div className="flex justify-between gap-3"><span className="text-slate-500">TDS</span><span className="whitespace-nowrap font-medium text-slate-800">{formatINR(tds)}</span></div>
                          <div className="flex justify-between gap-3"><span className="text-slate-500">Other deductions</span><span className="whitespace-nowrap font-medium text-slate-800">{formatINR(emp.otherDeductions || 0)}</span></div>
                          <div className="flex justify-between gap-3"><span className="text-slate-500">Employer contributions total</span><span className="whitespace-nowrap font-medium text-slate-800">{formatINR(employerContributions)}</span></div>
                          <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 sm:col-span-2 xl:col-span-1">
                            <span className="text-slate-500">PF / ESI remittance</span>
                            <span className="text-right font-medium text-slate-800">PF: {emp.pfRemittanceStatus || 'Pending'} · ESI: {emp.esiRemittanceStatus || 'Pending'}</span>
                          </div>
                          {(emp.statutoryCalculation?.esi?.reason || emp.statutoryCalculation?.pf?.reason) && (
                            <div className="text-[11px] text-slate-500 sm:col-span-2 xl:col-span-3 pt-1 border-t border-slate-200/60">
                              {emp.employeePfContribution === 0 && emp.statutoryCalculation?.pf?.reason && (
                                <div><span className="font-semibold text-slate-600">PF status:</span> {emp.statutoryCalculation.pf.reason}</div>
                              )}
                              {emp.employeeEsiContribution === 0 && emp.statutoryCalculation?.esi?.reason && (
                                <div><span className="font-semibold text-slate-600">ESI status:</span> {emp.statutoryCalculation.esi.reason}</div>
                              )}
                            </div>
                          )}
                        </div>
                      </details>

                      <div className="flex flex-wrap gap-2 sm:flex-shrink-0">
                        <a
                          href={getDownloadUrl(`/api/payroll/${viewRun._id}/payslip/${emp.employeeId || emp.employeeIdRef || emp.employee}/pdf`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                        >
                          <Download className="h-3.5 w-3.5" />
                          PDF Payslip
                        </a>
                        {emp.paymentStatus !== 'Paid' && (
                          <button
                            type="button"
                            onClick={() => setPaymentModal({
                              open: true,
                              runId: viewRun._id,
                              employeeId: emp.employeeId || emp.employeeIdRef || emp.employee,
                              name: emp.employeeName || emp.fullName
                            })}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                          >
                            <CreditCard className="h-3.5 w-3.5" />
                            Pay
                          </button>
                        )}
                      </div>
                    </div>
                  </section>
                );
              })}
              {viewRun.items.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                  No employee records are available in this payroll run.
                </div>
              )}
            </div>

            <div className="px-4 sm:px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
              <div className="min-w-0">
                {viewRun.status === 'Draft' ? (
                  <button
                    type="button"
                    onClick={() => handleFinalizeExistingBatch(viewRun._id)}
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {submitting ? 'Finalizing...' : 'Finalize Payroll & Create PF Records'}
                  </button>
                ) : (
                  <div className="flex items-start gap-1.5 text-xs font-semibold text-emerald-700">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>PF contribution records created internally; EPFO remittance remains separate and Pending until recorded.</span>
                  </div>
                )}
              </div>
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

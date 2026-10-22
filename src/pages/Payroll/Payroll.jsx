import React, { useState, useEffect } from 'react';
import api, { getDownloadUrl } from '../../api/apiClient';
import { formatDate, formatINR, maskAccountNumber, numberToWordsINR, round2 } from '../../utils/formatters';
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
  Search,
  UserCheck,
  Printer,
  Save,
  Lock,
  RefreshCw,
  Clock,
  Info
} from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const currentYear = new Date().getFullYear();
const currentMonthIndex = new Date().getMonth(); // 0-based
const defaultMonthName = MONTHS[currentMonthIndex];
const YEARS = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

const Payroll = () => {
  const activeTab = 'payslip';

  // Global feedback notifications
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // -------------------------------------------------------------
  // TAB 1: EMPLOYEE SALARY & PAYSLIP WORKFLOW STATE
  // -------------------------------------------------------------
  const [employeeSearchInput, setEmployeeSearchInput] = useState('');
  const [allEmployeesList, setAllEmployeesList] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loadingEmployeeProfile, setLoadingEmployeeProfile] = useState(false);

  // Period & Attendance State
  const [periodMonth, setPeriodMonth] = useState(defaultMonthName);
  const [periodYear, setPeriodYear] = useState(currentYear);
  const [totalWorkingDays, setTotalWorkingDays] = useState(30);
  const [paidDays, setPaidDays] = useState(30);
  const [lopDays, setLopDays] = useState(0);

  // Period Overrides & Variable Pay
  const [allowComponentEditing, setAllowComponentEditing] = useState(false);
  const [periodEarnings, setPeriodEarnings] = useState({
    basicSalary: 0,
    hra: 0,
    conveyanceAllowance: 0,
    specialAllowance: 0,
    medicalAllowance: 0,
    otherAllowances: 0,
    bonusOrIncentive: 0,
    overtimeAmount: 0
  });
  const [periodDeductions, setPeriodDeductions] = useState({
    professionalTax: 200,
    tdsDeduction: 0,
    otherDeductions: 0
  });
  const [periodRemarks, setPeriodRemarks] = useState('');

  // Computed Calculation Breakdown
  const [calculating, setCalculating] = useState(false);
  const [calculatedPayslip, setCalculatedPayslip] = useState(null);
  const [existingRecordStatus, setExistingRecordStatus] = useState(null); // { isFinalized, runCode, runId, item }
  const [savingPayslip, setSavingPayslip] = useState(false);

  // -------------------------------------------------------------
  // TAB 2: HISTORICAL BATCHES STATE
  // -------------------------------------------------------------
  const [payrollRuns, setPayrollRuns] = useState([]);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [showRunModal, setShowRunModal] = useState(false);
  const [selectedBatchMonth, setSelectedBatchMonth] = useState(defaultMonthName);
  const [selectedBatchYear, setSelectedBatchYear] = useState(currentYear);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [submittingBatch, setSubmittingBatch] = useState(false);
  const [viewRun, setViewRun] = useState(null);

  // Payment Recording Modal State
  const [paymentModal, setPaymentModal] = useState({ open: false, runId: null, employeeId: null, name: '' });
  const [paymentForm, setPaymentForm] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Bank Transfer (NEFT/IMPS)',
    transactionReference: ''
  });

  // -------------------------------------------------------------
  // INITIAL LIFECYCLE
  // -------------------------------------------------------------
  useEffect(() => {
    fetchActiveEmployees();
    fetchPayrollRuns();
  }, []);

  useEffect(() => {
    const query = employeeSearchInput.trim();
    if (!query) return undefined;

    const normalizedQuery = query.toLowerCase();
    const selectedValue = selectedEmployee
      ? `${selectedEmployee.employeeId} - ${selectedEmployee.fullName}`.toLowerCase()
      : '';
    if (
      selectedEmployee
      && (normalizedQuery === selectedEmployee.employeeId?.toLowerCase() || normalizedQuery === selectedValue)
    ) {
      return undefined;
    }

    const cachedMatch = allEmployeesList.find(
      (employee) => employee.employeeId?.toLowerCase() === normalizedQuery
        || `${employee.employeeId} - ${employee.fullName}`.toLowerCase() === normalizedQuery
    );
    if (cachedMatch) {
      handleSelectEmployee(cachedMatch);
      return undefined;
    }

    if (query.length < 3 || !/^[a-z0-9_-]+$/i.test(query)) return undefined;

    let active = true;
    const timeoutId = setTimeout(async () => {
      try {
        const response = await api.get(`/employees?search=${encodeURIComponent(query)}&limit=100`);
        if (!active) return;
        const results = response.data?.data || response.data?.employees || [];
        const exactMatch = results.find(
          (employee) => employee.employeeId?.toLowerCase() === normalizedQuery
        );
        if (exactMatch) handleSelectEmployee(exactMatch);
      } catch (err) {
        if (active) console.error('Failed to look up employee by ID:', err);
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [employeeSearchInput, allEmployeesList, selectedEmployee]);

  const fetchActiveEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const res = await api.get('/employees?limit=200');
      const list = res.data?.data || res.data?.employees || [];
      setAllEmployeesList(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load employee list:', err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const fetchPayrollRuns = async () => {
    try {
      setLoadingRuns(true);
      const res = await api.get('/payroll');
      const runs = res.data?.data || res.data?.runs || [];
      setPayrollRuns(Array.isArray(runs) ? runs : []);
    } catch (err) {
      console.error('Failed to load payroll batches:', err);
    } finally {
      setLoadingRuns(false);
    }
  };

  // -------------------------------------------------------------
  // EMPLOYEE SELECTION & PROFILE FILL
  // -------------------------------------------------------------
  const handleSelectEmployee = (emp) => {
    if (!emp) return;
    setError('');
    setSelectedEmployee(emp);
    setEmployeeSearchInput(`${emp.employeeId} - ${emp.fullName}`);

    // Populate default salary structure from saved employee record
    const s = emp.salaryStructure || {};
    setPeriodEarnings({
      basicSalary: Number(s.basicSalary) || 0,
      hra: Number(s.hra) || 0,
      conveyanceAllowance: Number(s.conveyanceAllowance) || 0,
      specialAllowance: Number(s.specialAllowance) || 0,
      medicalAllowance: Number(s.medicalAllowance) || 0,
      otherAllowances: Number(s.otherAllowances) || 0,
      bonusOrIncentive: 0,
      overtimeAmount: 0
    });

    setPeriodDeductions({
      professionalTax: Number(s.professionalTax) || 200,
      tdsDeduction: Number(s.tdsMonthly ?? s.tdsEstimate) || 0,
      otherDeductions: 0
    });

    setTotalWorkingDays(30);
    setPaidDays(30);
    setLopDays(0);
    setCalculatedPayslip(null);
    setExistingRecordStatus(null);
    setAllowComponentEditing(false);

    // Auto calculate initial preview for this employee and period
    triggerCalculate(emp, 30, 30, s);
  };

  const handleManualLoadEmployee = async () => {
    const query = employeeSearchInput.trim();
    if (!query) {
      setError('Please enter or select an Employee ID');
      return;
    }

    // Try finding in loaded list by exact ID or name substring
    const matched = allEmployeesList.find(
      e => e.employeeId?.toLowerCase() === query.toLowerCase() ||
           query.toLowerCase().includes(e.employeeId?.toLowerCase())
    );

    if (matched) {
      handleSelectEmployee(matched);
      return;
    }

    // Otherwise fetch directly from server API
    try {
      setLoadingEmployeeProfile(true);
      setError('');
      const res = await api.get(`/employees?search=${encodeURIComponent(query)}`);
      const results = res.data?.data || res.data?.employees || [];
      if (results.length > 0) {
        handleSelectEmployee(results[0]);
      } else {
        setError(`No employee found matching "${query}". Verify the Employee ID.`);
        setSelectedEmployee(null);
        setCalculatedPayslip(null);
      }
    } catch (err) {
      console.error('Error fetching employee:', err);
      setError(err.response?.data?.message || 'Failed to locate employee record');
    } finally {
      setLoadingEmployeeProfile(false);
    }
  };

  // -------------------------------------------------------------
  // ATTENDANCE & PRORATION LOGIC
  // -------------------------------------------------------------
  const handleWorkingDaysChange = (val) => {
    const total = Math.max(1, Math.min(31, Number(val) || 0));
    setTotalWorkingDays(total);
    // keep payable days in valid bounds
    const payable = Math.min(total, Math.max(0, paidDays));
    setPaidDays(payable);
    setLopDays(Math.max(0, total - payable));
  };

  const handlePaidDaysChange = (val) => {
    const payable = Math.max(0, Math.min(totalWorkingDays, Number(val) || 0));
    setPaidDays(payable);
    setLopDays(Math.max(0, totalWorkingDays - payable));
  };

  const handleLopDaysChange = (val) => {
    const lop = Math.max(0, Math.min(totalWorkingDays, Number(val) || 0));
    setLopDays(lop);
    setPaidDays(Math.max(0, totalWorkingDays - lop));
  };

  // -------------------------------------------------------------
  // SALARY CALCULATION DISPATCH
  // -------------------------------------------------------------
  const triggerCalculate = async (emp = selectedEmployee, wDays = totalWorkingDays, pDays = paidDays, sOverrides = null) => {
    const targetEmp = emp || selectedEmployee;
    if (!targetEmp) {
      setError('Please select an employee first');
      return;
    }

    if (targetEmp.employmentStatus === 'Inactive' || targetEmp.employmentStatus === 'Terminated') {
      setError(`Cannot calculate salary: ${targetEmp.fullName} is marked as ${targetEmp.employmentStatus}.`);
      return;
    }

    try {
      setCalculating(true);
      setError('');

      const overrides = sOverrides || (allowComponentEditing ? {
        basicSalary: periodEarnings.basicSalary,
        hra: periodEarnings.hra,
        conveyanceAllowance: periodEarnings.conveyanceAllowance,
        specialAllowance: periodEarnings.specialAllowance,
        medicalAllowance: periodEarnings.medicalAllowance,
        otherAllowances: periodEarnings.otherAllowances,
        professionalTax: periodDeductions.professionalTax
      } : null);

      const payload = {
        employeeId: targetEmp.employeeId,
        month: periodMonth,
        year: Number(periodYear),
        totalWorkingDays: Number(wDays),
        paidDays: Number(pDays),
        bonusOrIncentive: Number(periodEarnings.bonusOrIncentive) || 0,
        overtimeAmount: Number(periodEarnings.overtimeAmount) || 0,
        tdsDeduction: Number(periodDeductions.tdsDeduction) || 0,
        otherDeductions: Number(periodDeductions.otherDeductions) || 0,
        salaryOverrides: overrides
      };

      const res = await api.post('/payroll/calculate-employee', payload);
      setCalculatedPayslip(res.data.calculated);

      if (res.data.isAlreadyFinalized) {
        setExistingRecordStatus({
          isFinalized: true,
          runCode: res.data.existingRunCode,
          runId: res.data.existingRunId,
          item: res.data.existingItem
        });
      } else if (res.data.existingItem) {
        setExistingRecordStatus({
          isFinalized: false,
          runCode: res.data.existingRunCode,
          runId: res.data.existingRunId,
          item: res.data.existingItem
        });
      } else {
        setExistingRecordStatus(null);
      }
    } catch (err) {
      console.error('Calculation error:', err);
      setError(err.response?.data?.message || 'Failed to calculate salary breakdown');
      setCalculatedPayslip(null);
    } finally {
      setCalculating(false);
    }
  };

  // -------------------------------------------------------------
  // SAVE / FINALIZE PAYSLIP
  // -------------------------------------------------------------
  const handleSavePayslip = async (targetStatus = 'Draft') => {
    if (!selectedEmployee) {
      setError('Please select an employee');
      return;
    }
    if (!calculatedPayslip) {
      setError('Please calculate the salary before saving');
      return;
    }

    try {
      setSavingPayslip(true);
      setError('');

      const payload = {
        employeeId: selectedEmployee.employeeId,
        month: periodMonth,
        year: Number(periodYear),
        status: targetStatus,
        totalWorkingDays,
        paidDays,
        bonusOrIncentive: Number(periodEarnings.bonusOrIncentive) || 0,
        overtimeAmount: Number(periodEarnings.overtimeAmount) || 0,
        tdsDeduction: Number(periodDeductions.tdsDeduction) || 0,
        otherDeductions: Number(periodDeductions.otherDeductions) || 0,
        remarks: periodRemarks,
        salaryOverrides: allowComponentEditing ? {
          basicSalary: periodEarnings.basicSalary,
          hra: periodEarnings.hra,
          conveyanceAllowance: periodEarnings.conveyanceAllowance,
          specialAllowance: periodEarnings.specialAllowance,
          medicalAllowance: periodEarnings.medicalAllowance,
          otherAllowances: periodEarnings.otherAllowances,
          professionalTax: periodDeductions.professionalTax
        } : null
      };

      const res = await api.post('/payroll/employee-payslip', payload);
      setSuccess(res.data?.message || `Payslip for ${selectedEmployee.fullName} saved!`);

      // Update existing record snapshot state
      setExistingRecordStatus({
        isFinalized: targetStatus === 'Finalized',
        runCode: res.data.payrollCode,
        runId: res.data.runId,
        item: res.data.data
      });

      // Refresh runs list for Tab 2
      fetchPayrollRuns();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Save payslip error:', err);
      setError(err.response?.data?.message || 'Failed to save employee payslip');
    } finally {
      setSavingPayslip(false);
    }
  };

  // -------------------------------------------------------------
  // TAB 2 BATCH ACTIONS
  // -------------------------------------------------------------
  const handleGeneratePreview = async () => {
    try {
      setPreviewLoading(true);
      setError('');
      const res = await api.post('/payroll/preview', {
        month: selectedBatchMonth,
        year: Number(selectedBatchYear)
      });
      setPreviewData(res.data);
    } catch (err) {
      console.error('Preview error:', err);
      setError(err.response?.data?.message || 'Failed to generate payroll preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleFinalizePayrollBatch = async () => {
    if (!previewData) return;
    try {
      setSubmittingBatch(true);
      setError('');
      await api.post('/payroll', {
        month: selectedBatchMonth,
        year: Number(selectedBatchYear),
        items: previewData.items,
        status: 'Finalized',
        notes: `Executed via ERP Payroll portal for ${selectedBatchMonth} ${selectedBatchYear}`
      });
      setSuccess(`Payroll for ${selectedBatchMonth} ${selectedBatchYear} finalized successfully!`);
      setShowRunModal(false);
      fetchPayrollRuns();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Finalize error:', err);
      setError(err.response?.data?.message || 'Could not finalize payroll run');
    } finally {
      setSubmittingBatch(false);
    }
  };

  const handleFinalizeExistingBatch = async (batchId) => {
    try {
      setSubmittingBatch(true);
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
      setSubmittingBatch(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      const payRes = await api.post(`/payroll/${paymentModal.runId}/employees/${paymentModal.employeeId}/payment`, paymentForm);
      setSuccess(`Salary payment recorded for ${paymentModal.name}`);
      setPaymentModal({ open: false, runId: null, employeeId: null, name: '' });
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

  const employeeProfileRows = selectedEmployee ? [
    [
      ['Employee ID', selectedEmployee.employeeId],
      ['Employee Name', selectedEmployee.fullName]
    ],
    [
      ['Department', selectedEmployee.department || 'General'],
      ['Designation', selectedEmployee.designation || 'Staff']
    ],
    [
      ['Payment Mode', 'Bank Transfer'],
      ['Salary Month', `${periodMonth} ${periodYear}`]
    ],
    [
      ['Date Joined', formatDate(selectedEmployee.joiningDate)],
      ['Bank', selectedEmployee.bankDetails?.bankName || 'N/A']
    ],
    [
      ['Bank IFSC', selectedEmployee.bankDetails?.ifscCode || 'N/A'],
      ['Bank Account', maskAccountNumber(selectedEmployee.bankDetails?.accountNumber)]
    ],
    [
      ['PAN Number', selectedEmployee.statutoryInfo?.panNumber || 'N/A'],
      ['UAN (EPFO)', selectedEmployee.statutoryInfo?.uan || 'N/A']
    ],
    [
      ['PF Eligible', selectedEmployee.statutoryInfo?.isPfEligible !== false ? 'Yes (12%)' : 'No'],
      ['ESI Eligible', selectedEmployee.statutoryInfo?.esiApplicable ? 'Yes (0.75%)' : 'No']
    ],
    [
      ['Employment Status', selectedEmployee.employmentStatus || 'Active'],
      ['Saved Base Gross', formatINR(selectedEmployee.salaryStructure?.grossSalaryMonthly || selectedEmployee.salaryStructure?.grossSalary || 0)]
    ]
  ] : [];

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            Human Resources & Payroll
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Salary / Payslip Workflow</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Prepare individual employee monthly salaries, calculate statutory deductions & contributions, and generate official payslips.
          </p>
        </div>

      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200/80 rounded-xl text-rose-800 text-sm flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
            <span className="font-medium">{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-800 text-lg font-bold leading-none">&times;</button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200/80 rounded-xl text-emerald-800 text-sm flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600" />
            <span className="font-medium">{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="text-emerald-500 hover:text-emerald-800 text-lg font-bold leading-none">&times;</button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: EMPLOYEE SALARY & PAYSLIP PREPARATION WORKFLOW                    */}
      {/* ========================================================================= */}
      {activeTab === 'payslip' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Section 1: Employee Lookup & Autocomplete */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="flex-1 max-w-xl">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Employee (Search by ID or Name)
                </label>
                <div className="relative flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      list="employee-autocomplete-list"
                      placeholder="Type employee ID e.g. EMP-2026-0001 or Name..."
                      value={employeeSearchInput}
                      onChange={(e) => {
                        const value = e.target.value;
                        setEmployeeSearchInput(value);
                        // Auto-select if matches exact format "EMP-XXX - Name"
                        const match = allEmployeesList.find(
                          emp => value === `${emp.employeeId} - ${emp.fullName}` ||
                                 value.trim().toUpperCase() === emp.employeeId?.toUpperCase()
                        );
                        if (match) handleSelectEmployee(match);
                        else if (selectedEmployee && !value.trim().toLowerCase().startsWith(selectedEmployee.employeeId?.toLowerCase())) {
                          setSelectedEmployee(null);
                          setCalculatedPayslip(null);
                          setExistingRecordStatus(null);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleManualLoadEmployee();
                      }}
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-slate-900"
                    />
                    <datalist id="employee-autocomplete-list">
                      {allEmployeesList.map((emp) => (
                        <option
                          key={emp._id}
                          value={`${emp.employeeId} - ${emp.fullName}`}
                        >
                          {emp.department} • {emp.designation} • {emp.employmentStatus}
                        </option>
                      ))}
                    </datalist>
                  </div>

                  <button
                    type="button"
                    onClick={handleManualLoadEmployee}
                    disabled={loadingEmployeeProfile}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/20 disabled:opacity-50 transition-all"
                  >
                    {loadingEmployeeProfile ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserCheck className="w-4 h-4" />
                    )}
                    Load Employee
                  </button>
                </div>
              </div>

              {/* Status Indicator */}
              {selectedEmployee && (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-slate-400 font-medium">Record Status</div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        existingRecordStatus?.isFinalized
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : existingRecordStatus
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {existingRecordStatus?.isFinalized ? (
                          <>
                            <Lock className="w-3 h-3 text-emerald-600" />
                            Finalized ({existingRecordStatus.runCode})
                          </>
                        ) : existingRecordStatus ? (
                          <>
                            <Clock className="w-3 h-3 text-amber-600" />
                            Draft Saved ({existingRecordStatus.runCode})
                          </>
                        ) : (
                          'New Calculation'
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Read-only Employee Profile Fill Card */}
            {selectedEmployee ? (
              <div className="mt-5 overflow-hidden rounded-xl border border-slate-300">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] border-collapse text-left text-xs">
                    <tbody>
                      {employeeProfileRows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row.map(([label, value]) => (
                            <React.Fragment key={label}>
                              <th className="w-[18%] border border-slate-300 bg-slate-50 px-3 py-2.5 font-semibold text-slate-700">
                                {label}
                              </th>
                              <td className="w-[32%] border border-slate-300 bg-white px-3 py-2.5 font-medium text-slate-900">
                                {value}
                              </td>
                            </React.Fragment>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-slate-500 text-xs">
                Select or search for an active employee to populate their verified profile and salary structure.
              </div>
            )}
          </div>

          {/* Section 2: Period & Attendance Configuration */}
          {selectedEmployee && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Salary Period & Attendance Proration
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Payable salary is computed using standard monthly proration: <span className="font-mono text-slate-700">(Payable Days / Total Working Days) × Monthly Component</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => triggerCalculate()}
                  disabled={calculating}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${calculating ? 'animate-spin' : ''}`} />
                  Recalculate Breakdown
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Salary Month</label>
                  <select
                    value={periodMonth}
                    onChange={(e) => {
                      setPeriodMonth(e.target.value);
                      setCalculatedPayslip(null);
                    }}
                    className="w-full text-xs font-bold border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                  >
                    {MONTHS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Salary Year</label>
                  <select
                    value={periodYear}
                    onChange={(e) => {
                      setPeriodYear(Number(e.target.value));
                      setCalculatedPayslip(null);
                    }}
                    className="w-full text-xs font-bold border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                  >
                    {YEARS.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Total Working Days</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={totalWorkingDays}
                    onChange={(e) => handleWorkingDaysChange(e.target.value)}
                    className="w-full text-xs font-bold border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-emerald-800 mb-1">Payable Days</label>
                  <input
                    type="number"
                    min="0"
                    max={totalWorkingDays}
                    value={paidDays}
                    onChange={(e) => handlePaidDaysChange(e.target.value)}
                    className="w-full text-xs font-bold border border-emerald-300 bg-emerald-50/50 rounded-lg px-3 py-2 text-emerald-950 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-rose-800 mb-1">Loss of Pay (LOP) Days</label>
                  <input
                    type="number"
                    min="0"
                    max={totalWorkingDays}
                    value={lopDays}
                    onChange={(e) => handleLopDaysChange(e.target.value)}
                    className="w-full text-xs font-bold border border-rose-300 bg-rose-50/50 rounded-lg px-3 py-2 text-rose-950 focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Component Overrides Toggle */}
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={allowComponentEditing}
                    onChange={(e) => setAllowComponentEditing(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-semibold text-slate-700">Enable Period-Specific Salary Adjustments</span>
                  <span className="text-slate-400 font-normal">(Adjust for this month without altering employee master profile)</span>
                </label>

                {existingRecordStatus?.isFinalized && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                    <Lock className="w-3.5 h-3.5" />
                    Period is finalized under batch {existingRecordStatus.runCode}. Overwriting is blocked.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Section 3: Dual Column Payslip Layout (Reference Matching) */}
          {selectedEmployee && calculatedPayslip && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
              {/* Document Banner */}
              <div className="bg-slate-900 text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Official Payslip Statement</span>
                  <h2 className="text-xl font-black tracking-tight">{calculatedPayslip.employeeName}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Pay Period: <span className="text-white font-bold">{periodMonth} {periodYear}</span> • Payable Days: <span className="text-emerald-400 font-bold">{calculatedPayslip.paidDays} / {calculatedPayslip.totalWorkingDays}</span>
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Net Take-Home Salary</span>
                  <div className="text-2xl font-black text-emerald-400">
                    {formatINR(calculatedPayslip.netSalaryPayable)}
                  </div>
                  <div className="text-[11px] text-slate-400 italic">
                    {numberToWordsINR(calculatedPayslip.netSalaryPayable)}
                  </div>
                </div>
              </div>

              {/* Dual-Column Earnings & Deductions Tables */}
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                {/* Left Column: Earnings */}
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-blue-600" />
                      Earnings & Allowances
                    </h4>
                    <span className="text-[11px] font-bold text-slate-400">Amount (INR)</span>
                  </div>

                  <div className="space-y-2.5 text-xs text-slate-700">
                    <div className="flex items-center justify-between py-1">
                      <span className="font-semibold text-slate-800">Basic Salary</span>
                      {allowComponentEditing ? (
                        <input
                          type="number"
                          value={periodEarnings.basicSalary}
                          onChange={(e) => setPeriodEarnings({ ...periodEarnings, basicSalary: Number(e.target.value) || 0 })}
                          className="w-28 text-right font-mono font-bold text-slate-900 border border-slate-300 rounded px-2 py-0.5"
                        />
                      ) : (
                        <span className="font-mono font-bold text-slate-900">{formatINR(calculatedPayslip.basicSalary)}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-600">House Rent Allowance (HRA)</span>
                      {allowComponentEditing ? (
                        <input
                          type="number"
                          value={periodEarnings.hra}
                          onChange={(e) => setPeriodEarnings({ ...periodEarnings, hra: Number(e.target.value) || 0 })}
                          className="w-28 text-right font-mono font-medium text-slate-800 border border-slate-300 rounded px-2 py-0.5"
                        />
                      ) : (
                        <span className="font-mono font-medium text-slate-800">{formatINR(calculatedPayslip.hra)}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-600">Conveyance / Travel Allowance</span>
                      {allowComponentEditing ? (
                        <input
                          type="number"
                          value={periodEarnings.conveyanceAllowance}
                          onChange={(e) => setPeriodEarnings({ ...periodEarnings, conveyanceAllowance: Number(e.target.value) || 0 })}
                          className="w-28 text-right font-mono font-medium text-slate-800 border border-slate-300 rounded px-2 py-0.5"
                        />
                      ) : (
                        <span className="font-mono font-medium text-slate-800">{formatINR(calculatedPayslip.conveyanceAllowance)}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-600">Special Allowance</span>
                      {allowComponentEditing ? (
                        <input
                          type="number"
                          value={periodEarnings.specialAllowance}
                          onChange={(e) => setPeriodEarnings({ ...periodEarnings, specialAllowance: Number(e.target.value) || 0 })}
                          className="w-28 text-right font-mono font-medium text-slate-800 border border-slate-300 rounded px-2 py-0.5"
                        />
                      ) : (
                        <span className="font-mono font-medium text-slate-800">{formatINR(calculatedPayslip.specialAllowance)}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-600">Medical Allowance</span>
                      {allowComponentEditing ? (
                        <input
                          type="number"
                          value={periodEarnings.medicalAllowance}
                          onChange={(e) => setPeriodEarnings({ ...periodEarnings, medicalAllowance: Number(e.target.value) || 0 })}
                          className="w-28 text-right font-mono font-medium text-slate-800 border border-slate-300 rounded px-2 py-0.5"
                        />
                      ) : (
                        <span className="font-mono font-medium text-slate-800">{formatINR(calculatedPayslip.medicalAllowance)}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-600">Other Allowances</span>
                      {allowComponentEditing ? (
                        <input
                          type="number"
                          value={periodEarnings.otherAllowances}
                          onChange={(e) => setPeriodEarnings({ ...periodEarnings, otherAllowances: Number(e.target.value) || 0 })}
                          className="w-28 text-right font-mono font-medium text-slate-800 border border-slate-300 rounded px-2 py-0.5"
                        />
                      ) : (
                        <span className="font-mono font-medium text-slate-800">{formatINR(calculatedPayslip.otherAllowances)}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-600">Performance Bonus / Incentive</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0.00"
                        value={periodEarnings.bonusOrIncentive}
                        onChange={(e) => setPeriodEarnings({ ...periodEarnings, bonusOrIncentive: Number(e.target.value) || 0 })}
                        className="w-28 text-right font-mono font-medium text-slate-800 border border-slate-300 rounded px-2 py-0.5"
                      />
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-600">Overtime Pay</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0.00"
                        value={periodEarnings.overtimeAmount}
                        onChange={(e) => setPeriodEarnings({ ...periodEarnings, overtimeAmount: Number(e.target.value) || 0 })}
                        className="w-28 text-right font-mono font-medium text-slate-800 border border-slate-300 rounded px-2 py-0.5"
                      />
                    </div>
                  </div>

                  {/* Earnings Total */}
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between bg-blue-50/70 p-3 rounded-xl border border-blue-100">
                    <span className="text-xs font-black uppercase text-blue-900">Total Gross Earnings</span>
                    <span className="text-sm font-black text-blue-900 font-mono">
                      {formatINR(calculatedPayslip.grossEarnings)}
                    </span>
                  </div>
                </div>

                {/* Right Column: Taxes & Deductions */}
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-rose-100 pb-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-rose-600" />
                      Taxes & Statutory Deductions
                    </h4>
                    <span className="text-[11px] font-bold text-slate-400">Amount (INR)</span>
                  </div>

                  <div className="space-y-2.5 text-xs text-slate-700">
                    <div className="flex items-center justify-between py-1">
                      <div>
                        <span className="font-semibold text-slate-800">Employee PF (12%)</span>
                        <div className="text-[10px] text-slate-400">Wage base: {formatINR(calculatedPayslip.pfWageBase)}</div>
                      </div>
                      <span className="font-mono font-bold text-rose-700">
                        {formatINR(calculatedPayslip.employeePfContribution)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <div>
                        <span className="font-semibold text-slate-800">Employee ESI (0.75%)</span>
                        <div className="text-[10px] text-slate-400">Wage base: {formatINR(calculatedPayslip.esiWageBase)}</div>
                      </div>
                      <span className="font-mono font-bold text-rose-700">
                        {formatINR(calculatedPayslip.employeeEsiContribution)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-600">Professional Tax (PT)</span>
                      {allowComponentEditing ? (
                        <input
                          type="number"
                          value={periodDeductions.professionalTax}
                          onChange={(e) => setPeriodDeductions({ ...periodDeductions, professionalTax: Number(e.target.value) || 0 })}
                          className="w-28 text-right font-mono font-medium text-rose-700 border border-slate-300 rounded px-2 py-0.5"
                        />
                      ) : (
                        <span className="font-mono font-medium text-rose-700">{formatINR(calculatedPayslip.professionalTax)}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-600">TDS / Income Tax Withheld</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0.00"
                        value={periodDeductions.tdsDeduction}
                        onChange={(e) => setPeriodDeductions({ ...periodDeductions, tdsDeduction: Number(e.target.value) || 0 })}
                        className="w-28 text-right font-mono font-medium text-rose-700 border border-slate-300 rounded px-2 py-0.5"
                      />
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-600">Other Deductions / Advance Recovery</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0.00"
                        value={periodDeductions.otherDeductions}
                        onChange={(e) => setPeriodDeductions({ ...periodDeductions, otherDeductions: Number(e.target.value) || 0 })}
                        className="w-28 text-right font-mono font-medium text-rose-700 border border-slate-300 rounded px-2 py-0.5"
                      />
                    </div>

                    {calculatedPayslip.unpaidLeaveDays > 0 && (
                      <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-800">
                        <span className="font-bold">Loss of Pay:</span> {calculatedPayslip.unpaidLeaveDays} days unworked were prorated from gross earnings directly.
                      </div>
                    )}
                  </div>

                  {/* Deductions Total */}
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between bg-rose-50/70 p-3 rounded-xl border border-rose-100">
                    <span className="text-xs font-black uppercase text-rose-900">Total Deductions</span>
                    <span className="text-sm font-black text-rose-900 font-mono">
                      {formatINR(calculatedPayslip.totalEmployeeDeductions)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Employer Contribution Summary (Separate - NEVER deducted from Net) */}
              <div className="bg-slate-50 p-4 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      Employer Contributions & Total CTC Cost
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Company statutory contributions are kept separate and are <span className="font-semibold text-slate-700">never subtracted</span> from employee take-home pay.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-700">
                    <div>
                      <span className="text-slate-400">Employer PF (12%): </span>
                      <span className="font-bold font-mono text-slate-900">{formatINR(calculatedPayslip.employerPfContribution)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Employer ESI (3.25%): </span>
                      <span className="font-bold font-mono text-slate-900">{formatINR(calculatedPayslip.employerEsiContribution)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Total Employer Cost: </span>
                      <span className="font-bold font-mono text-blue-700">{formatINR(calculatedPayslip.employerCostTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* Statutory Calculation Notes */}
                {(calculatedPayslip.statutoryCalculation?.pf?.reason || calculatedPayslip.statutoryCalculation?.esi?.reason) && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 space-y-0.5">
                    {calculatedPayslip.statutoryCalculation?.pf?.reason && (
                      <div><span className="font-semibold text-slate-600">PF Note:</span> {calculatedPayslip.statutoryCalculation.pf.reason}</div>
                    )}
                    {calculatedPayslip.statutoryCalculation?.esi?.reason && (
                      <div><span className="font-semibold text-slate-600">ESI Note:</span> {calculatedPayslip.statutoryCalculation.esi.reason}</div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Bar: Save Draft, Finalize, Print/Download PDF */}
              <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 max-w-sm">
                  <input
                    type="text"
                    placeholder="Optional period remarks / payroll notes..."
                    value={periodRemarks}
                    onChange={(e) => setPeriodRemarks(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 text-slate-800"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2.5 justify-end">
                  {/* PDF Download Direct */}
                  <a
                    href={getDownloadUrl(`/api/payroll/payslip-pdf?employeeId=${selectedEmployee.employeeId}&month=${periodMonth}&year=${periodYear}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Download Official PDF Payslip"
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl shadow-sm transition-all"
                  >
                    <FileText className="w-4 h-4 text-red-600" />
                    Download PDF Payslip
                  </a>

                  {/* Save Draft */}
                  {!existingRecordStatus?.isFinalized && (
                    <button
                      type="button"
                      onClick={() => handleSavePayslip('Draft')}
                      disabled={savingPayslip}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-all disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {savingPayslip ? 'Saving...' : 'Save Draft'}
                    </button>
                  )}

                  {/* Finalize Payslip */}
                  {!existingRecordStatus?.isFinalized ? (
                    <button
                      type="button"
                      onClick={() => handleSavePayslip('Finalized')}
                      disabled={savingPayslip}
                      className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm shadow-emerald-600/20 transition-all disabled:opacity-50"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {savingPayslip ? 'Finalizing...' : 'Finalize Payslip'}
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      Finalized & Locked
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PAYROLL REGISTER & BATCHES (PRESERVED FUNCTIONALITY)              */}
      {/* ========================================================================= */}
      {activeTab === 'batches' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">Historical Payroll Batches & Statutory Register</h2>
              <p className="text-xs text-slate-500">Run enterprise multi-employee batches and record bank disbursement status.</p>
            </div>
            <div className="flex items-center gap-2.5">
              <a
                href={getDownloadUrl('/api/reports/export/payroll')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg shadow-sm transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Export Register
              </a>
              <button
                onClick={() => {
                  setSelectedBatchMonth(defaultMonthName);
                  setSelectedBatchYear(currentYear);
                  setPreviewData(null);
                  setShowRunModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/20 transition-all"
              >
                <Play className="w-3.5 h-3.5" />
                Run Monthly Batch
              </button>
            </div>
          </div>

          {/* Batches Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
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
                  {loadingRuns ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        Loading payroll history...
                      </td>
                    </tr>
                  ) : payrollRuns.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400">
                        No payroll runs found. Click "Run Monthly Batch" to execute calculations.
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
                              disabled={submittingBatch}
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RUN MONTHLY BATCH ENGINE                                          */}
      {/* ========================================================================= */}
      {showRunModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Run Monthly Payroll Engine</h3>
                <p className="text-xs text-slate-500">Calculate pro-rated attendance, statutory PF, PT, and net salary payable for all staff</p>
              </div>
              <button onClick={() => setShowRunModal(false)} className="text-slate-400 hover:text-slate-700 text-xl font-bold">&times;</button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payroll Month</label>
                  <select
                    value={selectedBatchMonth}
                    onChange={(e) => setSelectedBatchMonth(e.target.value)}
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
                    value={selectedBatchYear}
                    onChange={(e) => setSelectedBatchYear(Number(e.target.value))}
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
                    {previewLoading ? 'Computing Rules...' : 'Compute Batch Calculations'}
                  </button>
                </div>
              </div>

              {previewData && (
                <div className="space-y-4">
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    Configured estimate only. Review statutory eligibility, rate, ceiling, and effective-date settings before processing.
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
                        {previewData.items?.map((item) => (
                          <tr key={item.employee || item.employeeId}>
                            <td className="py-2 px-3 font-semibold text-slate-900">{item.employeeName}</td>
                            <td className="py-2 px-3">{formatINR(item.grossEarnings)}</td>
                            <td className="py-2 px-3 text-emerald-600">{formatINR(item.employeePfContribution)}</td>
                            <td className="py-2 px-3 text-emerald-600">{formatINR(item.employeeEsiContribution)}</td>
                            <td className="py-2 px-3">{formatINR(item.employerPfContribution)}</td>
                            <td className="py-2 px-3">{formatINR(item.employerEsiContribution)}</td>
                            <td className="py-2 px-3 text-rose-600">{formatINR(item.totalEmployeeDeductions - item.employeePfContribution - item.employeeEsiContribution)}</td>
                            <td className="py-2 px-3 font-bold text-blue-600">{formatINR(item.netSalaryPayable)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRunModal(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFinalizePayrollBatch}
                disabled={!previewData || submittingBatch}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50"
              >
                {submittingBatch ? 'Finalizing Run...' : 'Finalize & Post Batch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIEW BATCH REGISTER                                                */}
      {/* ========================================================================= */}
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
              {viewRun.items?.map((emp) => {
                const totalDeductions = emp.totalEmployeeDeductions || emp.deductions?.totalDeductions || 0;
                const employerContributions = (emp.employerPfContribution || 0) + (emp.employerEsiContribution || 0);

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
                        <div className="mt-0.5 whitespace-nowrap font-medium text-slate-900">{formatINR(emp.grossEarnings || 0)}</div>
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
                      <div className="text-xs text-slate-500">
                        Paid Days: <span className="font-bold text-slate-800">{emp.paidDays}</span> / {emp.totalWorkingDays} • Unpaid LOP: <span className="font-bold text-rose-700">{emp.unpaidLeaveDays || 0}</span>
                      </div>

                      <div className="flex flex-wrap gap-2 sm:flex-shrink-0">
                        <a
                          href={getDownloadUrl(`/api/payroll/${viewRun._id}/payslip/${emp.employeeId || emp.employeeIdRef || emp.employee}/pdf`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Download Employee Payslip PDF"
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 transition-colors shadow-sm"
                        >
                          <FileText className="h-3.5 w-3.5 text-red-600" />
                          <span>PDF Payslip</span>
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
                            Record Payment
                          </button>
                        )}
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>

            <div className="px-4 sm:px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
              <div>
                {viewRun.status === 'Draft' && (
                  <button
                    type="button"
                    onClick={() => handleFinalizeExistingBatch(viewRun._id)}
                    disabled={submittingBatch}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {submittingBatch ? 'Finalizing...' : 'Finalize Payroll & Create PF Records'}
                  </button>
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

      {/* ========================================================================= */}
      {/* MODAL: RECORD SALARY PAYMENT                                             */}
      {/* ========================================================================= */}
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

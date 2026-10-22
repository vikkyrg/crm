import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api, { getDownloadUrl } from '../../api/apiClient';
import { formatDate, formatINR } from '../../utils/formatters';
import {
  Users,
  ArrowLeft,
  Briefcase,
  CreditCard,
  ShieldCheck,
  Calendar,
  Building2,
  Mail,
  Phone,
  FileText,
  AlertCircle,
  CheckCircle,
  Download
} from 'lucide-react';

const EmployeeProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [pfHistory, setPfHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      try {
        setLoading(true);
        const [empRes, payrollRes, pfRes] = await Promise.all([
          api.get(`/employees/${id}`),
          api.get('/payroll', { params: { employeeId: id, limit: 12 } }).catch(() => ({ data: { runs: [] } })),
          api.get('/employee-pf', { params: { employeeId: id, limit: 12 } }).catch(() => ({ data: { records: [] } }))
        ]);

        setEmployee(empRes.data?.data || empRes.data);
        setPayrollHistory(empRes.data?.payrollHistory || payrollRes.data?.runs || []);
        setPfHistory(empRes.data?.pfRecords || pfRes.data?.records || []);
      } catch (err) {
        console.error('Failed to fetch employee profile:', err);
        setError(err.response?.data?.message || 'Employee profile not found');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchEmployeeDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm font-medium">Loading comprehensive employee profile...</p>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-xl flex items-center gap-3">
        <AlertCircle className="w-6 h-6 flex-shrink-0" />
        <div>
          <h4 className="font-bold text-base">Error Loading Employee</h4>
          <p className="text-sm">{error || 'Record does not exist or has been removed.'}</p>
          <button
            onClick={() => navigate('/employees')}
            className="mt-3 text-xs font-semibold text-rose-800 underline"
          >
            &larr; Back to Employee Directory
          </button>
        </div>
      </div>
    );
  }

  const { salaryStructure, statutoryInfo, bankDetails, emergencyContact } = employee;

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/employees"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Employee Directory
        </Link>
        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
          employee.employmentStatus === 'Active'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}>
          Status: {employee.employmentStatus}
        </span>
      </div>

      {/* Header Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-bold text-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            {employee.fullName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{employee.fullName}</h1>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                {employee.employeeId}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500 mt-0.5">
              {employee.designation} &bull; <span className="text-slate-800">{employee.department}</span>
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> {employee.email}</span>
              <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {employee.phone}</span>
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> Joined: {formatDate(employee.joiningDate)}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-right w-full md:w-auto">
          <div className="text-xs uppercase font-semibold text-slate-400">Monthly Compensation</div>
          <div className="text-2xl font-black text-slate-900 mt-0.5">
            {formatINR(salaryStructure?.grossSalaryMonthly || 0)}
          </div>
          <div className="text-[11px] text-slate-500">Gross Earnings / Month</div>
        </div>
      </div>

      {/* Grid: Salary, Bank, PF, Emergency */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Salary Structure */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider pb-2 border-b border-slate-100">
            <Briefcase className="w-4 h-4" />
            Salary Breakdown
          </div>
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Basic Salary:</span>
              <span className="font-semibold text-slate-900">{formatINR(salaryStructure?.basicSalary)}</span>
            </div>
            <div className="flex justify-between">
              <span>HRA:</span>
              <span className="font-semibold text-slate-900">{formatINR(salaryStructure?.hra)}</span>
            </div>
            <div className="flex justify-between">
              <span>Conveyance:</span>
              <span className="font-semibold text-slate-900">{formatINR(salaryStructure?.conveyanceAllowance)}</span>
            </div>
            <div className="flex justify-between">
              <span>Medical Allowance:</span>
              <span className="font-semibold text-slate-900">{formatINR(salaryStructure?.medicalAllowance)}</span>
            </div>
            <div className="flex justify-between">
              <span>Special Allowance:</span>
              <span className="font-semibold text-slate-900">{formatINR(salaryStructure?.specialAllowance)}</span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-slate-900">
              <span>Gross Total:</span>
              <span className="text-blue-600">{formatINR(salaryStructure?.grossSalaryMonthly)}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Statutory & PF */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider pb-2 border-b border-slate-100">
            <ShieldCheck className="w-4 h-4" />
            EPF & Statutory
          </div>
          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>PF Applicable / Eligible:</span>
              <span className={`font-semibold ${statutoryInfo?.pfApplicable || statutoryInfo?.isPfEligible ? 'text-emerald-600' : 'text-slate-400'}`}>
                {statutoryInfo?.pfApplicable || statutoryInfo?.isPfEligible ? 'YES' : 'NO'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>PF wage basis:</span>
              <span className="font-semibold text-slate-900">{statutoryInfo?.pfWageBasis || 'Basic'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Universal Account No (UAN):</span>
              <span className="font-mono font-semibold text-slate-900">{statutoryInfo?.uan || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">PF Member ID:</span>
              <span className="font-mono font-semibold text-slate-900">{statutoryInfo?.pfAccountNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>Wage Ceiling Applied:</span>
              <span className="font-semibold text-slate-900">
                {statutoryInfo?.restrictPfWageLimit ? 'Configured ceiling' : 'No employee cap enabled'}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-100">
              <span>ESI Applicable / Eligible:</span>
              <span className={`font-semibold ${statutoryInfo?.esiApplicable && statutoryInfo?.esiEligibilityConfirmed ? 'text-emerald-600' : 'text-slate-400'}`}>
                {statutoryInfo?.esiApplicable && statutoryInfo?.esiEligibilityConfirmed ? 'YES' : 'NO'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">ESI Insurance / IP No:</span>
              <span className="font-mono font-semibold text-slate-900">{statutoryInfo?.esiInsuranceNumber || statutoryInfo?.esiNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>ESI wage basis:</span>
              <span className="font-semibold text-slate-900">{statutoryInfo?.esiWageBasis || 'Gross'}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Bank Details */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-violet-600 uppercase tracking-wider pb-2 border-b border-slate-100">
            <CreditCard className="w-4 h-4" />
            Bank & Remittance
          </div>
          <div className="space-y-2 text-xs text-slate-600">
            <div>
              <span className="text-slate-400 block text-[11px]">Bank Name:</span>
              <span className="font-semibold text-slate-900">{bankDetails?.bankName || 'Not Provided'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Account Number:</span>
              <span className="font-mono font-semibold text-slate-900">{bankDetails?.accountNumber || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">IFSC Code:</span>
              <span className="font-mono font-semibold text-slate-900">{bankDetails?.ifscCode || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">PAN Number:</span>
              <span className="font-mono font-semibold text-slate-900">{bankDetails?.panNumber || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Emergency Contact */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider pb-2 border-b border-slate-100">
            <Users className="w-4 h-4" />
            Emergency Contact
          </div>
          <div className="space-y-2 text-xs text-slate-600">
            <div>
              <span className="text-slate-400 block text-[11px]">Contact Person:</span>
              <span className="font-semibold text-slate-900">{emergencyContact?.name || 'Not Provided'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Relationship:</span>
              <span className="font-semibold text-slate-900">{emergencyContact?.relationship || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Emergency Phone:</span>
              <span className="font-semibold text-slate-900">{emergencyContact?.phone || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Payroll & PF Records */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payroll Runs */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Payroll History
            </h3>
            <Link to="/payroll" className="text-xs font-semibold text-blue-600 hover:underline">
              View All Payrolls &rarr;
            </Link>
          </div>
          <div className="p-4">
            {payrollHistory.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No payroll disbursements recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {payrollHistory.map((run) => (
                  <div key={run._id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{run.periodName || `${run.month} ${run.year}`}</div>
                      <div className="text-[11px] text-slate-500">Run ID: {run.payrollCode || run.payrollRunNumber}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">{formatINR(run.item?.netPayable ?? run.totalNetPayable ?? 0)}</div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        {run.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* PF Statutory Records */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              EPF Contribution Records
            </h3>
          </div>
          <div className="p-4">
            {pfHistory.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No EPF contributions logged.</p>
            ) : (
              <div className="space-y-3">
                {pfHistory.map((rec) => (
                  <div key={rec._id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{rec.periodName || `${rec.periodMonth || rec.month} ${rec.periodYear || rec.year}`}</div>
                      <div className="text-[11px] text-slate-500">Wage Base: {formatINR(rec.pfWageBase)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">Total PF: {formatINR(rec.totalPfAmount ?? rec.totalPfDeposit ?? 0)}</div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        rec.remittanceStatus === 'Remitted'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {rec.remittanceStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;

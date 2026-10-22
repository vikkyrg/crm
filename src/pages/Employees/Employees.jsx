import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { getDownloadUrl } from '../../api/apiClient';
import { formatDate, formatINR } from '../../utils/formatters';
import {
  Users,
  Search,
  Plus,
  Download,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Building2,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Briefcase
} from 'lucide-react';

const DEPARTMENTS = [
  'Engineering',
  'Operations',
  'Sales & Marketing',
  'Finance & Accounting',
  'Human Resources',
  'Executive & Management'
];

const INITIAL_FORM = {
  employeeId: '',
  fullName: '',
  email: '',
  phone: '',
  department: 'Engineering',
  designation: '',
  employmentStatus: 'Active',
  employmentType: 'Full-time',
  joiningDate: new Date().toISOString().split('T')[0],
  address: {
    street: '',
    city: '',
    state: '',
    pincode: ''
  },
  emergencyContact: {
    name: '',
    relationship: '',
    phone: ''
  },
  bankDetails: {
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: '',
    panNumber: ''
  },
  statutoryInfo: {
    uan: '',
    pfAccountNumber: '',
    esiNumber: '',
    pfApplicable: false,
    isPfEligible: false,
    pfWageBasis: 'Basic',
    restrictPfWageLimit: false,
    esiApplicable: false,
    isEsiEligible: false,
    esiWageBasis: 'Gross',
    esiEligibilityConfirmed: false
  },
  salaryStructure: {
    basicSalary: '',
    hra: 0,
    conveyanceAllowance: 0,
    medicalAllowance: 0,
    specialAllowance: 0,
    otherAllowances: 0,
    professionalTax: 0,
    tdsMonthly: 0
  },
  notes: ''
};

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [activeTab, setActiveTab] = useState('basic'); // 'basic' | 'salary' | 'bank' | 'statutory'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  const fetchEmployees = async (targetPage = page) => {
    try {
      setLoading(true);
      const params = { page: targetPage, limit };
      if (search) params.search = search;
      if (departmentFilter) params.department = departmentFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/employees', { params });
      setEmployees(res.data.employees || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalCount(res.data.totalCount || 0);
      setPage(res.data.currentPage || 1);
    } catch (err) {
      console.error('Failed to load employees:', err);
      setError(err.response?.data?.message || 'Failed to retrieve employees directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees(1);
  }, [search, departmentFilter, statusFilter]);

  const handleOpenAddModal = () => {
    setEditEmployee(null);
    setFormData(INITIAL_FORM);
    setActiveTab('basic');
    setError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (emp) => {
    setEditEmployee(emp);
    setFormData({
      employeeId: emp.employeeId || '',
      fullName: emp.fullName || '',
      email: emp.email || '',
      phone: emp.phone || '',
      department: emp.department || 'Engineering',
      designation: emp.designation || '',
      employmentStatus: emp.employmentStatus || 'Active',
      employmentType: emp.employmentType || 'Full-time',
      joiningDate: emp.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : '',
      address: {
        street: emp.address?.street || '',
        city: emp.address?.city || '',
        state: emp.address?.state || '',
        pincode: emp.address?.pincode || ''
      },
      emergencyContact: {
        name: emp.emergencyContact?.name || '',
        relationship: emp.emergencyContact?.relationship || '',
        phone: emp.emergencyContact?.phone || ''
      },
      bankDetails: {
        bankName: emp.bankDetails?.bankName || '',
        accountNumber: emp.bankDetails?.accountNumber || '',
        ifscCode: emp.bankDetails?.ifscCode || '',
        branchName: emp.bankDetails?.branchName || '',
        panNumber: emp.bankDetails?.panNumber || ''
      },
      statutoryInfo: {
        uan: emp.statutoryInfo?.uan || '',
        pfAccountNumber: emp.statutoryInfo?.pfAccountNumber || '',
        esiNumber: emp.statutoryInfo?.esiNumber || '',
        pfApplicable: emp.statutoryInfo?.pfApplicable ?? emp.statutoryInfo?.isPfEligible ?? false,
        isPfEligible: emp.statutoryInfo?.isPfEligible ?? emp.statutoryInfo?.pfApplicable ?? false,
        pfWageBasis: emp.statutoryInfo?.pfWageBasis || 'Basic',
        restrictPfWageLimit: emp.statutoryInfo?.restrictPfWageLimit ?? emp.statutoryInfo?.pfWageLimitApplicable ?? false,
        esiApplicable: emp.statutoryInfo?.esiApplicable ?? false,
        isEsiEligible: emp.statutoryInfo?.isEsiEligible ?? false,
        esiWageBasis: emp.statutoryInfo?.esiWageBasis || 'Gross',
        esiEligibilityConfirmed: emp.statutoryInfo?.esiEligibilityConfirmed ?? false
      },
      salaryStructure: {
        basicSalary: emp.salaryStructure?.basicSalary ?? 0,
        hra: emp.salaryStructure?.hra ?? 0,
        conveyanceAllowance: emp.salaryStructure?.conveyanceAllowance ?? 0,
        medicalAllowance: emp.salaryStructure?.medicalAllowance ?? 0,
        specialAllowance: emp.salaryStructure?.specialAllowance ?? 0,
        otherAllowances: emp.salaryStructure?.otherAllowances ?? 0,
        professionalTax: emp.salaryStructure?.professionalTax ?? 0,
        tdsMonthly: emp.salaryStructure?.tdsMonthly ?? 0
      },
      notes: emp.notes || ''
    });
    setActiveTab('basic');
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.statutoryInfo.uan && !/^\d{12}$/.test(formData.statutoryInfo.uan)) {
      setError('UAN must contain exactly 12 digits');
      setActiveTab('statutory');
      return;
    }
    if (formData.statutoryInfo.pfApplicable && !formData.statutoryInfo.isPfEligible) {
      setError('Confirm that PF applies to this employee or switch PF off');
      setActiveTab('statutory');
      return;
    }
    if (formData.statutoryInfo.esiApplicable && !formData.statutoryInfo.esiEligibilityConfirmed) {
      setError('Confirm ESI eligibility or switch ESI off');
      setActiveTab('statutory');
      return;
    }
    const submission = {
      ...formData,
      statutoryInfo: {
        ...formData.statutoryInfo,
        restrictPfWageLimit: Boolean(formData.statutoryInfo.restrictPfWageLimit),
        pfWageLimitApplicable: Boolean(formData.statutoryInfo.restrictPfWageLimit),
        isPfEligible: formData.statutoryInfo.pfApplicable && formData.statutoryInfo.isPfEligible,
        isEsiEligible: formData.statutoryInfo.esiApplicable && formData.statutoryInfo.esiEligibilityConfirmed
      }
    };
    try {
      if (editEmployee) {
        await api.put(`/employees/${editEmployee._id}`, submission);
        setSuccess(`Employee ${formData.fullName} updated successfully`);
      } else {
        await api.post('/employees', submission);
        setSuccess(`Employee ${formData.fullName} created successfully`);
      }
      setShowModal(false);
      fetchEmployees(editEmployee ? page : 1);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Save employee error:', err);
      setError(err.response?.data?.message || 'Failed to save employee profile');
    }
  };

  const handleDelete = async (forceDeactivate = false) => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setError('');
    try {
      const url = forceDeactivate ? `/employees/${deleteTarget._id}?action=deactivate` : `/employees/${deleteTarget._id}`;
      const res = await api.delete(url);
      setSuccess(res.data?.message || `Employee ${deleteTarget.fullName} processed successfully`);
      setDeleteTarget(null);
      fetchEmployees(1);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Delete error:', err);
      // If server returned that employee has payroll/PF and offers deactivation
      if (err.response?.data?.canDeactivate) {
        setError(`${err.response.data.message} Click "Deactivate / Archive" to safely terminate their profile.`);
      } else {
        setError(err.response?.data?.message || 'Could not delete employee');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Salary gross calculation in modal
  const basic = Number(formData.salaryStructure.basicSalary) || 0;
  const hra = Number(formData.salaryStructure.hra) || 0;
  const conveyance = Number(formData.salaryStructure.conveyanceAllowance) || 0;
  const medical = Number(formData.salaryStructure.medicalAllowance) || 0;
  const special = Number(formData.salaryStructure.specialAllowance) || 0;
  const other = Number(formData.salaryStructure.otherAllowances) || 0;
  const grossMonthly = basic + hra + conveyance + medical + special + other;

  return (
    <div className="space-y-6">
      {/* Top Banner / Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            Human Resources & Payroll
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Employee Directory</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage employee profiles, designations, statutory PF enrollment, and verified salary structures.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={getDownloadUrl('/api/reports/export/employees')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </a>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Employee
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

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
          </input>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
            <option value="Terminated">Terminated</option>
            <option value="Resigned">Resigned</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 divide-y divide-slate-200">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th scope="col" className="py-3 px-4 w-[160px] whitespace-nowrap">Employee ID</th>
                <th scope="col" className="py-3 px-4 min-w-[220px]">Name & Contact</th>
                <th scope="col" className="py-3 px-4 min-w-[180px]">Department & Role</th>
                <th scope="col" className="py-3 px-4 min-w-[140px]">Monthly CTC</th>
                <th scope="col" className="py-3 px-4 w-[130px] whitespace-nowrap">PF Status</th>
                <th scope="col" className="py-3 px-4 w-[120px] whitespace-nowrap">Employment</th>
                <th scope="col" className="py-3 px-4 w-[120px] text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading employees directory...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No employees matching current criteria. Click "Add Employee" to register staff.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-900 whitespace-nowrap align-middle">
                      {emp.employeeId}
                    </td>
                    <td className="py-3.5 px-4 align-middle">
                      <div className="font-semibold text-slate-900">{emp.fullName}</div>
                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                        <span className="truncate max-w-[200px]" title={emp.email}>{emp.email}</span>
                        {emp.phone && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="whitespace-nowrap">{emp.phone}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 align-middle">
                      <div className="text-slate-800 font-medium">{emp.designation}</div>
                      <div className="text-xs text-slate-500">{emp.department}</div>
                    </td>
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                      <div className="font-semibold text-slate-900">
                        {formatINR(emp.salaryStructure?.grossSalaryMonthly || 0)}
                      </div>
                      <div className="text-[11px] text-slate-400">Monthly Gross</div>
                    </td>
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                      {emp.statutoryInfo?.isPfEligible ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          PF Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600">
                          Exempt / No PF
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${
                        emp.employmentStatus === 'Active'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {emp.employmentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right align-middle whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1">
                        <Link
                          to={`/employees/${emp._id}`}
                          title="View Full Profile"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleOpenEditModal(emp)}
                          title="Edit Details"
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(emp)}
                          title="Deactivate / Delete"
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
            Showing {employees.length} of {totalCount} registered employees
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => fetchEmployees(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium text-slate-700">Page {page} of {totalPages}</span>
            <button
              onClick={() => fetchEmployees(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ADD / EDIT EMPLOYEE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editEmployee ? `Edit Employee — ${editEmployee.employeeId}` : 'Register New Employee'}
                </h3>
                <p className="text-xs text-slate-500">Complete personal, designation, statutory, and salary configuration</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold p-1"
              >
                &times;
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-200 bg-white px-6">
              {[
                { id: 'basic', label: '1. Personal & Role', icon: Users },
                { id: 'salary', label: '2. Salary Structure', icon: Briefcase },
                { id: 'bank', label: '3. Bank Details', icon: CreditCard },
                { id: 'statutory', label: '4. PF & Statutory', icon: ShieldCheck }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 max-h-[65vh] overflow-y-auto space-y-4">
                {/* TAB 1: BASIC & ROLE */}
                {activeTab === 'basic' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Employee ID (Optional/Auto)</label>
                      <input
                        type="text"
                        placeholder="e.g. INN-EMP-0010"
                        value={formData.employeeId}
                        onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Full Legal Name"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email *</label>
                      <input
                        type="email"
                        required
                        placeholder="employee@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone *</label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 9876543210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
                      <select
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        {DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Designation *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Lead Software Engineer"
                        value={formData.designation}
                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Joining Date</label>
                      <input
                        type="date"
                        value={formData.joiningDate}
                        onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Employment Status</label>
                      <select
                        value={formData.employmentStatus}
                        onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value })}
                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="Active">Active</option>
                        <option value="On Leave">On Leave</option>
                        <option value="Terminated">Terminated</option>
                        <option value="Resigned">Resigned</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* TAB 2: SALARY STRUCTURE */}
                {activeTab === 'salary' && (
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-xs text-blue-800 flex items-center justify-between">
                      <span>Configurable Monthly Salary Structure (Subject to Attendance & Working Days)</span>
                      <span className="font-bold text-sm text-blue-900">Computed Gross: {formatINR(grossMonthly)}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Basic Salary (₹ / month) *</label>
                        <input
                          type="number"
                          min="0"
                          required
                          value={formData.salaryStructure.basicSalary}
                          onChange={(e) => setFormData({
                            ...formData,
                            salaryStructure: { ...formData.salaryStructure, basicSalary: Number(e.target.value) }
                          })}
                          className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">House Rent Allowance (HRA)</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.salaryStructure.hra}
                          onChange={(e) => setFormData({
                            ...formData,
                            salaryStructure: { ...formData.salaryStructure, hra: Number(e.target.value) }
                          })}
                          className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Conveyance Allowance</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.salaryStructure.conveyanceAllowance}
                          onChange={(e) => setFormData({
                            ...formData,
                            salaryStructure: { ...formData.salaryStructure, conveyanceAllowance: Number(e.target.value) }
                          })}
                          className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Medical Allowance</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.salaryStructure.medicalAllowance}
                          onChange={(e) => setFormData({
                            ...formData,
                            salaryStructure: { ...formData.salaryStructure, medicalAllowance: Number(e.target.value) }
                          })}
                          className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Special / Other Allowances</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.salaryStructure.specialAllowance}
                          onChange={(e) => setFormData({
                            ...formData,
                            salaryStructure: { ...formData.salaryStructure, specialAllowance: Number(e.target.value) }
                          })}
                          className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Professional Tax (PT ₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.salaryStructure.professionalTax}
                          onChange={(e) => setFormData({
                            ...formData,
                            salaryStructure: { ...formData.salaryStructure, professionalTax: Number(e.target.value) }
                          })}
                          className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated TDS / Tax Deduction (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.salaryStructure.tdsMonthly}
                          onChange={(e) => setFormData({
                            ...formData,
                            salaryStructure: { ...formData.salaryStructure, tdsMonthly: Number(e.target.value) }
                          })}
                          className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: BANK DETAILS */}
                {activeTab === 'bank' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name</label>
                      <input
                        type="text"
                        placeholder="e.g. HDFC Bank, ICICI Bank"
                        value={formData.bankDetails.bankName}
                        onChange={(e) => setFormData({
                          ...formData,
                          bankDetails: { ...formData.bankDetails, bankName: e.target.value }
                        })}
                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Account Number</label>
                      <input
                        type="text"
                        placeholder="Bank Account Number"
                        value={formData.bankDetails.accountNumber}
                        onChange={(e) => setFormData({
                          ...formData,
                          bankDetails: { ...formData.bankDetails, accountNumber: e.target.value }
                        })}
                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">IFSC Code</label>
                      <input
                        type="text"
                        placeholder="e.g. HDFC0001234"
                        value={formData.bankDetails.ifscCode}
                        onChange={(e) => setFormData({
                          ...formData,
                          bankDetails: { ...formData.bankDetails, ifscCode: e.target.value.toUpperCase() }
                        })}
                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">PAN Card Number</label>
                      <input
                        type="text"
                        placeholder="e.g. ABCDE1234F"
                        value={formData.bankDetails.panNumber}
                        onChange={(e) => setFormData({
                          ...formData,
                          bankDetails: { ...formData.bankDetails, panNumber: e.target.value.toUpperCase() }
                        })}
                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 font-mono uppercase"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 4: STATUTORY INFO */}
                {activeTab === 'statutory' && (
                  <div className="space-y-4">
                    <p className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                      Payroll uses configured statutory rules as an estimate. Confirm eligibility and applicable rates, wage ceilings, and effective dates with your payroll adviser before processing real payroll. No filing or remittance is implied.
                    </p>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-sm font-semibold text-slate-800">Provident Fund (EPFO)</div>
                          <p className="text-xs text-slate-500">Only enabled and eligible employees are calculated.</p>
                        </div>
                        <select
                          value={formData.statutoryInfo.pfApplicable ? 'yes' : 'no'}
                          onChange={(e) => {
                            const enabled = e.target.value === 'yes';
                            setFormData({
                              ...formData,
                              statutoryInfo: {
                                ...formData.statutoryInfo,
                                pfApplicable: enabled,
                                isPfEligible: enabled && formData.statutoryInfo.isPfEligible
                              }
                            });
                          }}
                          className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                        >
                          <option value="no">Not Applicable</option>
                          <option value="yes">Applicable</option>
                        </select>
                      </div>
                      {formData.statutoryInfo.pfApplicable && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">PF eligibility confirmed</label>
                          <select
                            value={formData.statutoryInfo.isPfEligible ? 'yes' : 'no'}
                            onChange={(e) => setFormData({
                              ...formData,
                              statutoryInfo: { ...formData.statutoryInfo, isPfEligible: e.target.value === 'yes' }
                            })}
                            className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white"
                          >
                            <option value="no">No / Not yet confirmed</option>
                            <option value="yes">Yes</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Universal Account Number (UAN)</label>
                          <input
                            type="text"
                            maxLength="12"
                            placeholder="12-digit UAN"
                            value={formData.statutoryInfo.uan}
                            onChange={(e) => setFormData({
                              ...formData,
                              statutoryInfo: { ...formData.statutoryInfo, uan: e.target.value }
                            })}
                            className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">PF Member ID / Account</label>
                          <input
                            type="text"
                            placeholder="e.g. DL/CPM/0012345/000/0001"
                            value={formData.statutoryInfo.pfAccountNumber}
                            onChange={(e) => setFormData({
                              ...formData,
                              statutoryInfo: { ...formData.statutoryInfo, pfAccountNumber: e.target.value }
                            })}
                            className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">PF wage basis</label>
                          <select
                            value={formData.statutoryInfo.pfWageBasis}
                            onChange={(e) => setFormData({
                              ...formData,
                              statutoryInfo: { ...formData.statutoryInfo, pfWageBasis: e.target.value }
                            })}
                            className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white"
                          >
                            <option value="Basic">Basic salary</option>
                            <option value="Gross">Gross earnings</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.statutoryInfo.restrictPfWageLimit}
                              onChange={(e) => setFormData({
                                ...formData,
                                statutoryInfo: { ...formData.statutoryInfo, restrictPfWageLimit: e.target.checked }
                              })}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-xs font-medium text-slate-700">
                              Apply the configured PF wage ceiling
                            </span>
                          </label>
                        </div>
                      </div>
                    )}
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-sm font-semibold text-slate-800">Employee State Insurance (ESI)</div>
                          <p className="text-xs text-slate-500">Requires confirmed eligibility and configured current rules.</p>
                        </div>
                        <select
                          value={formData.statutoryInfo.esiApplicable ? 'yes' : 'no'}
                          onChange={(e) => {
                            const enabled = e.target.value === 'yes';
                            setFormData({
                              ...formData,
                              statutoryInfo: {
                                ...formData.statutoryInfo,
                                esiApplicable: enabled,
                                isEsiEligible: enabled && formData.statutoryInfo.isEsiEligible
                              }
                            });
                          }}
                          className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                        >
                          <option value="no">Not Applicable</option>
                          <option value="yes">Applicable</option>
                        </select>
                      </div>
                      {formData.statutoryInfo.esiApplicable && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">ESI eligibility confirmed</label>
                            <select
                              value={formData.statutoryInfo.esiEligibilityConfirmed ? 'yes' : 'no'}
                              onChange={(e) => setFormData({
                                ...formData,
                                statutoryInfo: {
                                  ...formData.statutoryInfo,
                                  esiEligibilityConfirmed: e.target.value === 'yes',
                                  isEsiEligible: e.target.value === 'yes'
                                }
                              })}
                              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white"
                            >
                              <option value="no">No / Not yet confirmed</option>
                              <option value="yes">Yes</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Insurance / IP number</label>
                            <input
                              type="text"
                              value={formData.statutoryInfo.esiNumber}
                              onChange={(e) => setFormData({
                                ...formData,
                                statutoryInfo: { ...formData.statutoryInfo, esiNumber: e.target.value.trim() }
                              })}
                              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">ESI wage basis</label>
                            <select
                              value={formData.statutoryInfo.esiWageBasis}
                              onChange={(e) => setFormData({
                                ...formData,
                                statutoryInfo: { ...formData.statutoryInfo, esiWageBasis: e.target.value }
                              })}
                              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white"
                            >
                              <option value="Gross">Gross earnings</option>
                              <option value="Basic">Basic salary</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-2">
                  {activeTab !== 'statutory' && (
                    <button
                      type="button"
                      onClick={() => {
                        const tabs = ['basic', 'salary', 'bank', 'statutory'];
                        const nextIndex = tabs.indexOf(activeTab) + 1;
                        if (nextIndex < tabs.length) setActiveTab(tabs[nextIndex]);
                      }}
                      className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                    >
                      Next Step &rarr;
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/20"
                  >
                    {editEmployee ? 'Update Profile' : 'Save Employee'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE / DEACTIVATE MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-center text-slate-900 mb-1">
              Deactivate / Remove Employee?
            </h3>
            <p className="text-xs text-center text-slate-500 mb-4">
              Employee: <span className="font-semibold text-slate-800">{deleteTarget.fullName}</span> ({deleteTarget.employeeId})
            </p>
            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 mb-6">
              Employees with finalized payroll runs or statutory PF contributions cannot be hard-deleted to preserve accounting and statutory audit integrity. You can safely mark them as <strong>Terminated / Inactive</strong>.
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => handleDelete(true)}
                disabled={isDeleting}
                className="w-full py-2.5 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-all disabled:opacity-50"
              >
                {isDeleting ? 'Processing...' : 'Mark as Terminated / Archived (Recommended)'}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(false)}
                disabled={isDeleting}
                className="w-full py-2 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-all disabled:opacity-50"
              >
                Attempt Permanent Deletion (Only if no payroll/PF records)
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="w-full py-2 text-xs font-medium text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg mt-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;

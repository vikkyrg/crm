import React, { useState, useEffect } from 'react';
import api from '../../api/apiClient';
import {
  Settings as SettingsIcon,
  Building2,
  CreditCard,
  Hash,
  Save,
  CheckCircle2,
  AlertCircle,
  Users,
  Plus,
  Trash2,
  Shield
} from 'lucide-react';

const Settings = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    displayName: '',
    tagline: '',
    address: '',
    city: '',
    state: '',
    stateCode: '',
    pincode: '',
    phone: '',
    email: '',
    website: '',
    gstin: '',
    pan: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branch: '',
    upiId: '',
    invoicePrefix: 'INV-2026-',
    pfPrefix: 'PF-2026-',
    advancePrefix: 'ADV-2026-',
    defaultPaymentTerms: '',
    defaultNotes: '',
    companyLogo: ''
  });

  // Employee / Account Manager State
  const [employees, setEmployees] = useState([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [newEmp, setNewEmp] = useState({
    name: '',
    email: '',
    role: 'Staff',
    employeeId: '',
    phone: '',
    password: ''
  });
  const [empSuccess, setEmpSuccess] = useState('');
  const [empError, setEmpError] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo file size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        companyLogo: reader.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({
      ...prev,
      companyLogo: ''
    }));
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      if (res.data.data) {
        setFormData(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load company profile settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      setEmpLoading(true);
      const res = await api.get('/auth/users');
      setEmployees(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setEmpLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchEmployees();
  }, []);

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setEmpError('');
    setEmpSuccess('');

    try {
      const res = await api.post('/auth/users', newEmp);
      setEmpSuccess(`Employee ${res.data.data.name} added successfully! Now available in Client Project Assignments.`);
      setShowAddEmpModal(false);
      setNewEmp({
        name: '',
        email: '',
        role: 'Staff',
        employeeId: '',
        phone: '',
        password: ''
      });
      fetchEmployees();
      setTimeout(() => setEmpSuccess(''), 5000);
    } catch (err) {
      setEmpError(err.response?.data?.message || 'Failed to add employee');
    }
  };

  const handleDeleteEmployee = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove employee "${name}"?`)) return;
    try {
      await api.delete(`/auth/users/${id}`);
      setEmpSuccess(`Employee ${name} removed.`);
      fetchEmployees();
      setTimeout(() => setEmpSuccess(''), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot remove employee');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.put('/settings', formData);
      setSuccess('Company profile and billing configurations saved successfully');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating settings (Requires Administrator)');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-slate-500 font-medium text-sm">Loading company settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Company & Billing Settings</h1>
        <p className="text-sm text-slate-500">Configure legal entity details, banking instructions, GST defaults, and document prefixes.</p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Legal Identity & Address */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-blue-600" />
            <span>Corporate Identity & GST Registration</span>
          </div>

          {/* Company Logo Section */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center gap-6">
            <div className="h-20 w-44 bg-white border border-slate-300 rounded-lg flex items-center justify-center overflow-hidden p-2 shadow-inner">
              {formData.companyLogo ? (
                <img src={formData.companyLogo} alt="Company Logo" className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="text-xs text-slate-400 font-medium text-center">No Logo Uploaded</span>
              )}
            </div>
            <div className="flex-1 space-y-1.5 text-center sm:text-left">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">Company Logo (For Invoices & Proposals)</div>
              <p className="text-xs text-slate-500">Upload high-resolution PNG or JPG logo (Max 2MB). Appears on official PDF documents.</p>
              <div className="flex items-center justify-center sm:justify-start gap-3 pt-1">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-sm transition-colors">
                  <span>Choose Logo File</span>
                  <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={handleLogoUpload} className="hidden" />
                </label>
                {formData.companyLogo && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Remove Logo
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Legal Company Name *</label>
              <input
                type="text"
                name="companyName"
                required
                value={formData.companyName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Display / Trade Name</label>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Company GSTIN</label>
              <input
                type="text"
                name="gstin"
                value={formData.gstin}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Company PAN</label>
              <input
                type="text"
                name="pan"
                value={formData.pan}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none font-mono uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Registered Office Address</label>
            <textarea
              rows="2"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">State Code (GST)</label>
              <input
                type="text"
                name="stateCode"
                value={formData.stateCode}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">PIN Code</label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
              />
            </div>
          </div>
        </div>

        {/* Banking Instructions */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <span>Bank Account Details & Payment Instructions</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Bank Name</label>
              <input
                type="text"
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Account Number</label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">IFSC Code</label>
              <input
                type="text"
                name="ifscCode"
                value={formData.ifscCode}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">UPI ID / VPA</label>
              <input
                type="text"
                name="upiId"
                value={formData.upiId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Numbering Prefixes */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
            <Hash className="w-5 h-5 text-blue-600" />
            <span>Sequential Document Numbering Prefixes</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Invoice Prefix</label>
              <input
                type="text"
                name="invoicePrefix"
                value={formData.invoicePrefix}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">PF Document Prefix</label>
              <input
                type="text"
                name="pfPrefix"
                value={formData.pfPrefix}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Advance Receipt Prefix</label>
              <input
                type="text"
                name="advancePrefix"
                value={formData.advancePrefix}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-md shadow-blue-500/20 disabled:opacity-60 transition-all"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving Changes...' : 'Save Settings'}
          </button>
        </div>
      </form>

      {/* Staff & Project Account Managers Management Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Employees & Project Account Managers</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Add team members here. Registered employees automatically populate in the Client Management project assigning dropdown.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddEmpModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </button>
        </div>

        {empSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-medium">
            {empSuccess}
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Employee ID</th>
                <th className="py-2.5 px-4">Full Name</th>
                <th className="py-2.5 px-4">Role</th>
                <th className="py-2.5 px-4">Email</th>
                <th className="py-2.5 px-4">Phone</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {empLoading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">Loading employees...</td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">No employees registered yet.</td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{emp.employeeId || 'EMP-N/A'}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{emp.name}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        emp.role === 'Administrator' ? 'bg-purple-50 text-purple-700' :
                        emp.role === 'Finance' ? 'bg-emerald-50 text-emerald-700' :
                        'bg-blue-50 text-blue-700'
                      }`}>
                        {emp.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{emp.email}</td>
                    <td className="py-3 px-4">{emp.phone || '-'}</td>
                    <td className="py-3 px-4 text-right">
                      {emp.role !== 'Administrator' && (
                        <button
                          type="button"
                          onClick={() => handleDeleteEmployee(emp._id, emp.name)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Remove employee"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddEmpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Add Team Member / Account Manager</h2>
            <p className="text-xs text-slate-500 mb-4">
              Registered members will automatically appear in the Client Profile project assignment selector.
            </p>

            {empError && (
              <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                {empError}
              </div>
            )}

            <form onSubmit={handleCreateEmployee} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Verma"
                  value={newEmp.name}
                  onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rahul@innomatrics.com"
                  value={newEmp.email}
                  onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Role</label>
                  <select
                    value={newEmp.role}
                    onChange={(e) => setNewEmp({ ...newEmp, role: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none"
                  >
                    <option value="Staff">Staff / Account Manager</option>
                    <option value="Finance">Finance</option>
                    <option value="Administrator">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Employee ID</label>
                  <input
                    type="text"
                    placeholder="e.g. EMP-003"
                    value={newEmp.employeeId}
                    onChange={(e) => setNewEmp({ ...newEmp, employeeId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={newEmp.phone}
                  onChange={(e) => setNewEmp({ ...newEmp, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Default Password</label>
                <input
                  type="text"
                  placeholder="Defaults to Innomatrics123!"
                  value={newEmp.password}
                  onChange={(e) => setNewEmp({ ...newEmp, password: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddEmpModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-sm"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;

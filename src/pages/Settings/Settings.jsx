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
    companyLogo: '',
    statutoryPayrollRules: {
      pf: { employeeRate: '', employerRate: '', wageCeiling: '', epsRate: '', effectiveFrom: '', effectiveTo: '' },
      esi: { employeeRate: '', employerRate: '', wageCeiling: '', effectiveFrom: '', effectiveTo: '' }
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Administrator Password Change State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New password and confirm password do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    try {
      setPasswordSaving(true);
      const res = await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordSuccess(res.data.message || 'Administrator password updated successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordSuccess(''), 5000);
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to update administrator password');
    } finally {
      setPasswordSaving(false);
    }
  };

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
        const current = res.data.data;
        const defaults = {
          pf: { employeeRate: '', employerRate: '', wageCeiling: '', epsRate: '', effectiveFrom: '', effectiveTo: '' },
          esi: { employeeRate: '', employerRate: '', wageCeiling: '', effectiveFrom: '', effectiveTo: '' }
        };
        const statutoryPayrollRules = {};
        ['pf', 'esi'].forEach((scheme) => {
          statutoryPayrollRules[scheme] = { ...defaults[scheme] };
          Object.entries(current.statutoryPayrollRules?.[scheme] || {}).forEach(([key, value]) => {
            statutoryPayrollRules[scheme][key] = value instanceof Date
              ? value.toISOString().slice(0, 10)
              : (value ? String(value).slice(0, 10) : '');
          });
        });
        setFormData({ ...formData, ...current, statutoryPayrollRules });
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load company profile settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

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
      const statutoryPayrollRules = {};
      ['pf', 'esi'].forEach((scheme) => {
        statutoryPayrollRules[scheme] = {};
        Object.entries(formData.statutoryPayrollRules?.[scheme] || {}).forEach(([key, value]) => {
          statutoryPayrollRules[scheme][key] = ['effectiveFrom', 'effectiveTo'].includes(key)
            ? (value || null)
            : (value === '' || value === null ? null : Number(value));
        });
      });
      await api.put('/settings', { ...formData, statutoryPayrollRules });
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

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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

        {/* Payroll Statutory Rule Configuration */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
            <Shield className="w-5 h-5 text-blue-600" />
            <span>Payroll Statutory Estimate Configuration</span>
          </div>
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
            These are organization-configured estimate inputs, not verified legal advice. Enter rates, ceilings, and effective dates approved for your payroll; rules with no effective start date are not applied. Verify current Indian statutory requirements before processing payroll.
          </p>
          {['pf', 'esi'].map((scheme) => {
            const rules = formData.statutoryPayrollRules?.[scheme] || {};
            const updateRule = (field, value) => setFormData({
              ...formData,
              statutoryPayrollRules: {
                ...formData.statutoryPayrollRules,
                [scheme]: { ...rules, [field]: value }
              }
            });
            return (
              <div key={scheme} className="border border-slate-200 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-sm text-slate-800">{scheme.toUpperCase()} rates and eligibility ceiling</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <label className="text-xs font-medium text-slate-600">
                    Employee rate (%)
                    <input type="number" min="0" max="100" step="0.01" value={rules.employeeRate ?? ''} onChange={(e) => updateRule('employeeRate', e.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                  </label>
                  <label className="text-xs font-medium text-slate-600">
                    Employer rate (%)
                    <input type="number" min="0" max="100" step="0.01" value={rules.employerRate ?? ''} onChange={(e) => updateRule('employerRate', e.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                  </label>
                  <label className="text-xs font-medium text-slate-600">
                    Wage ceiling (₹ / month)
                    <input type="number" min="0" step="0.01" required={scheme === 'esi' && Boolean(rules.employeeRate || rules.employerRate)} value={rules.wageCeiling ?? ''} onChange={(e) => updateRule('wageCeiling', e.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                  </label>
                  {scheme === 'pf' && (
                    <label className="text-xs font-medium text-slate-600">
                      EPS rate (%)
                      <input type="number" min="0" max="100" step="0.01" value={rules.epsRate ?? ''} onChange={(e) => updateRule('epsRate', e.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                    </label>
                  )}
                  <label className="text-xs font-medium text-slate-600">
                    Effective from *
                    <input type="date" required={Boolean(rules.employeeRate || rules.employerRate)} value={rules.effectiveFrom || ''} onChange={(e) => updateRule('effectiveFrom', e.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                  </label>
                  <label className="text-xs font-medium text-slate-600">
                    Effective to
                    <input type="date" value={rules.effectiveTo || ''} onChange={(e) => updateRule('effectiveTo', e.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                  </label>
                </div>
              </div>
            );
          })}
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

      {/* Administrator Security & Password Change */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
          <Shield className="w-5 h-5 text-blue-600" />
          <span>Administrator Security & Password</span>
        </div>
        <p className="text-xs text-slate-500">
          Update the master administrator credentials. Always use a strong password with letters, numbers, and symbols.
        </p>

        {passwordSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Current Password</label>
            <input
              type="password"
              required
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              placeholder="Enter current administrator password"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">New Password</label>
              <input
                type="password"
                required
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="At least 6 characters"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Re-type new password"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={passwordSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 shadow-sm disabled:opacity-60 transition-all"
            >
              <Shield className="w-4 h-4" />
              {passwordSaving ? 'Updating Password...' : 'Update Admin Password'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};

export default Settings;

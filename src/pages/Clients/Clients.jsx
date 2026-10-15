import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/apiClient';
import { formatDate } from '../../utils/formatters';
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
  ChevronRight
} from 'lucide-react';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    primaryPhone: '',
    alternatePhone: '',
    email: '',
    gstin: '',
    pan: '',
    billingAddress: '',
    shippingAddress: '',
    city: '',
    state: '',
    stateCode: '',
    pincode: '',
    assignedEmployee: '',
    notes: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Permanent Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletionSummary, setDeletionSummary] = useState(null);
  const [deleteSummaryLoading, setDeleteSummaryLoading] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [confirmAcknowledged, setConfirmAcknowledged] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  const fetchClients = async (targetPage = page) => {
    try {
      setLoading(true);
      const params = { page: targetPage, limit };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/clients', { params });
      setClients(res.data.data);
      setTotalPages(res.data.totalPages || 1);
      setTotalCount(res.data.total || 0);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/auth/users');
      setEmployees(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchClients(1);
  }, [search, statusFilter]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const openAddModal = () => {
    setEditClient(null);
    setFormData({
      companyName: '',
      contactPerson: '',
      primaryPhone: '',
      alternatePhone: '',
      email: '',
      gstin: '',
      pan: '',
      billingAddress: '',
      shippingAddress: '',
      city: '',
      state: '',
      stateCode: '',
      pincode: '',
      assignedEmployee: '',
      notes: ''
    });
    setShowModal(true);
    setError('');
  };

  const openEditModal = (client) => {
    setEditClient(client);
    setFormData({
      companyName: client.companyName || '',
      contactPerson: client.contactPerson || '',
      primaryPhone: client.primaryPhone || '',
      alternatePhone: client.alternatePhone || '',
      email: client.email || '',
      gstin: client.gstin || '',
      pan: client.pan || '',
      billingAddress: client.billingAddress || '',
      shippingAddress: client.shippingAddress || '',
      city: client.city || '',
      state: client.state || '',
      stateCode: client.stateCode || '',
      pincode: client.pincode || '',
      assignedEmployee: client.assignedEmployee?._id || client.assignedEmployee || '',
      notes: client.notes || ''
    });
    setShowModal(true);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...formData };
      if (!payload.assignedEmployee) {
        delete payload.assignedEmployee;
      }
      if (!payload.stateCode) {
        delete payload.stateCode;
      }

      if (editClient) {
        await api.put(`/clients/${editClient._id}`, payload);
        setSuccess('Client updated successfully');
      } else {
        await api.post('/clients', payload);
        setSuccess('Client created successfully');
      }
      setShowModal(false);
      fetchClients();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving client');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await api.patch(`/clients/${id}/toggle-status`);
      fetchClients();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update client status');
    }
  };

  const openDeleteModal = async (client) => {
    setDeleteTarget(client);
    setDeletionSummary(null);
    setConfirmInput('');
    setConfirmAcknowledged(false);
    setDeleteSummaryLoading(true);
    try {
      const res = await api.get(`/clients/${client._id}/deletion-summary`);
      setDeletionSummary(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to retrieve client dependency summary');
      setDeleteTarget(null);
    } finally {
      setDeleteSummaryLoading(false);
    }
  };

  const handleExecutePermanentDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const res = await api.delete(`/clients/${deleteTarget._id}/permanent`);
      setDeleteTarget(null);
      setDeletionSummary(null);
      fetchClients();
      setSuccess(res.data.message || 'Client and all related records permanently deleted.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      alert(err.response?.data?.message || 'Permanent deletion failed');
    } finally {
      setIsDeleting(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Client Management</h1>
          <p className="text-sm text-slate-500">Manage client accounts, billing records, GSTINs, and representative profiles.</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`/api/reports/export/clients${localStorage.getItem('innomatrics_token') ? `?token=${localStorage.getItem('innomatrics_token')}` : ''}`}
            download
            className="inline-flex items-center gap-2 px-3 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-all"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </a>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Client
          </button>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm font-medium">
          {success}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by client name, Client ID, phone, email, or GSTIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Archived / Inactive</option>
          </select>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Client ID</th>
                <th className="py-3 px-4">Company Name</th>
                <th className="py-3 px-4">Contact Person</th>
                <th className="py-3 px-4">Contact Details</th>
                <th className="py-3 px-4">Assigned Manager</th>
                <th className="py-3 px-4">Location & GST</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading clients...
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    No clients found matching the search criteria.
                  </td>
                </tr>
              ) : (
                clients.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-blue-600">
                      <Link to={`/clients/${c._id}`} className="hover:underline">
                        {c.clientId}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      <Link to={`/clients/${c._id}`} className="hover:text-blue-600">
                        {c.companyName}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{c.contactPerson}</td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{c.primaryPhone}</div>
                      <div className="text-xs text-slate-400">{c.email}</div>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {c.assignedEmployee ? (
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          <div>
                            <span className="font-semibold text-slate-900">{c.assignedEmployee.name}</span>
                            <div className="text-[10px] text-slate-400 font-mono">{c.assignedEmployee.employeeId || c.assignedEmployee.role}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{c.city}, {c.state}</div>
                      <div className="text-xs font-mono text-slate-400">{c.gstin || 'No GSTIN'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleStatus(c._id)}
                        title="Click to toggle status"
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer ${
                          c.isActive
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {c.isActive ? 'Active' : 'Archived'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/clients/${c._id}`}
                          title="View Profile"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => openEditModal(c)}
                          title="Edit Client"
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(c)}
                          title="Permanently Delete Client"
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
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

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-700">{clients.length}</span> of <span className="font-semibold text-slate-700">{totalCount}</span> clients (Page {page} of {totalPages})
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (page > 1) {
                  const newPage = page - 1;
                  setPage(newPage);
                  fetchClients(newPage);
                }
              }}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <span className="px-2 py-1 font-semibold text-slate-700 bg-white border border-slate-200 rounded-md">
              {page}
            </span>
            <button
              onClick={() => {
                if (page < totalPages) {
                  const newPage = page + 1;
                  setPage(newPage);
                  fetchClients(newPage);
                }
              }}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Client Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              {editClient ? 'Edit Client Record' : 'Register New Client'}
            </h2>

            {error && (
              <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                    placeholder="e.g. Apex Healthtech Solutions"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Contact Person *</label>
                  <input
                    type="text"
                    required
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                    placeholder="e.g. Dr. Rajesh Verma"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Primary Phone *</label>
                  <input
                    type="text"
                    required
                    value={formData.primaryPhone}
                    onChange={(e) => setFormData({ ...formData, primaryPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                    placeholder="client@company.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none uppercase font-mono"
                    placeholder="09ABCDE1234F1Z8"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">PAN</label>
                  <input
                    type="text"
                    value={formData.pan}
                    onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none uppercase font-mono"
                    placeholder="ABCDE1234F"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Billing Address *</label>
                <textarea
                  required
                  rows="2"
                  value={formData.billingAddress}
                  onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                  placeholder="Street address, building, suite..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
                    placeholder="Noida"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
                    placeholder="Uttar Pradesh"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">PIN Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
                    placeholder="201301"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm"
                >
                  {editClient ? 'Save Changes' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Dedicated Permanent Deletion Confirmation Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-red-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-xl flex-shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Permanently Delete Client</h3>
                <p className="text-xs text-red-600 font-semibold mt-0.5">
                  This operation permanently deletes this client and all records that belong exclusively to this client. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-4">
              <div className="text-xs font-semibold text-slate-500 uppercase">Target Client</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">{deleteTarget.companyName}</div>
              <div className="text-xs font-mono text-blue-600 font-semibold">{deleteTarget.clientId}</div>
            </div>

            {/* Dependency Breakdown */}
            <div className="mb-4">
              <div className="text-xs font-semibold text-slate-700 uppercase mb-2">Exclusively Owned Data Breakdown</div>
              {deleteSummaryLoading ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
                  Analyzing database dependencies...
                </div>
              ) : deletionSummary ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-100 rounded-lg flex justify-between items-center">
                    <span className="text-slate-600">PF Documents:</span>
                    <span className="font-bold text-slate-900">{deletionSummary.counts.pfDocuments}</span>
                  </div>
                  <div className="p-2.5 bg-slate-100 rounded-lg flex justify-between items-center">
                    <span className="text-slate-600">Invoices:</span>
                    <span className="font-bold text-slate-900">{deletionSummary.counts.invoices}</span>
                  </div>
                  <div className="p-2.5 bg-slate-100 rounded-lg flex justify-between items-center">
                    <span className="text-slate-600">Advance Receipts:</span>
                    <span className="font-bold text-slate-900">{deletionSummary.counts.advancePayments}</span>
                  </div>
                  <div className="p-2.5 bg-slate-100 rounded-lg flex justify-between items-center">
                    <span className="text-slate-600">Quantity Records:</span>
                    <span className="font-bold text-slate-900">{deletionSummary.counts.quantityRecords}</span>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Verification Inputs */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Type <span className="font-mono text-red-600 font-bold select-all">{deleteTarget.clientId}</span> or <span className="font-semibold text-red-600 select-all">{deleteTarget.companyName}</span> to confirm:
                </label>
                <input
                  type="text"
                  placeholder="Enter Client ID or Company Name"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={confirmAcknowledged}
                  onChange={(e) => setConfirmAcknowledged(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-xs text-slate-600">
                  I understand that this action is irreversible and all linked documents, invoices, advances, and logs will be permanently expunged.
                </span>
              </label>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-5 mt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  isDeleting ||
                  !confirmAcknowledged ||
                  (confirmInput.trim().toLowerCase() !== deleteTarget.clientId.toLowerCase() &&
                   confirmInput.trim().toLowerCase() !== deleteTarget.companyName.toLowerCase())
                }
                onClick={handleExecutePermanentDelete}
                className="inline-flex items-center gap-2 px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-colors"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;

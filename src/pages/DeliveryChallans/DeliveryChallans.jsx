import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getDownloadUrl } from '../../api/apiClient';
import { formatDate } from '../../utils/formatters';
import {
  Truck,
  Search,
  Plus,
  Download,
  Filter,
  Eye,
  CheckCircle,
  AlertCircle,
  XCircle,
  Building2,
  Calendar,
  FileText,
  Clock,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  Receipt,
  Trash2
} from 'lucide-react';

const INITIAL_ITEM = {
  itemCode: '',
  description: '',
  quantityDispatched: 1,
  unit: 'Nos',
  remarks: ''
};

const INITIAL_CHALLAN_FORM = {
  clientId: '',
  projectOrWorkOrder: '',
  deliveryAddress: '',
  deliveryType: 'Material Supply',
  transporterName: '',
  vehicleNumber: '',
  driverName: '',
  driverPhone: '',
  expectedDeliveryDate: '',
  items: [{ ...INITIAL_ITEM }],
  notes: 'Goods once supplied under this challan are subject to standard delivery terms.'
};

const DeliveryChallans = () => {
  const navigate = useNavigate();
  const [challans, setChallans] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');
  const [success, setSuccess] = useState('');

  // Issue Challan Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(INITIAL_CHALLAN_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Status / Delivery Log Modal
  const [deliveryModal, setDeliveryModal] = useState({ open: false, challan: null });
  const [deliveryForm, setDeliveryForm] = useState({
    status: 'Delivered',
    receiverName: '',
    receiverPhone: '',
    deliveryNotes: ''
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  const fetchChallans = async (targetPage = page) => {
    try {
      setLoading(true);
      const params = { page: targetPage, limit };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/delivery-challans', { params });
      setChallans(res.data.challans || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalCount(res.data.totalCount || 0);
      setPage(res.data.currentPage || 1);
    } catch (err) {
      console.error('Challans fetch error:', err);
      setError(err.response?.data?.message || 'Failed to fetch delivery challans');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await api.get('/clients?limit=100');
      setClients(res.data.data || res.data.clients || []);
    } catch (err) {
      console.error('Failed to load clients list:', err);
    }
  };

  useEffect(() => {
    fetchChallans(1);
    fetchClients();
  }, [search, statusFilter]);

  const handleOpenAddModal = () => {
    setFormData(INITIAL_CHALLAN_FORM);
    setError('');
    setModalError('');
    setShowModal(true);
  };

  const handleClientChange = (clientId) => {
    const selected = clients.find((c) => c._id === clientId);
    setFormData({
      ...formData,
      clientId,
      deliveryAddress: selected?.shippingAddress || selected?.billingAddress || ''
    });
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { ...INITIAL_ITEM }]
    });
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length <= 1) return;
    const updated = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: updated });
  };

  const handleItemChange = (index, field, val) => {
    const updated = [...formData.items];
    updated[index][field] = val;
    setFormData({ ...formData, items: updated });
  };

  const handleSubmitChallan = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      setModalError('');

      // Basic client-side validation
      if (!formData.clientId) {
        setModalError('Please select a client.');
        setSubmitting(false);
        return;
      }
      if (!formData.deliveryAddress.trim()) {
        setModalError('Site delivery address is required.');
        setSubmitting(false);
        return;
      }
      const invalidItem = formData.items.find(
        (it) => !it.description.trim() || Number(it.quantityDispatched) <= 0
      );
      if (invalidItem) {
        setModalError('All line items must have a valid description and quantity greater than 0.');
        setSubmitting(false);
        return;
      }

      await api.post('/delivery-challans', formData);
      setSuccess('Delivery Challan created and issued successfully!');
      setShowModal(false);
      setFormData(INITIAL_CHALLAN_FORM);
      fetchChallans(1);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Challan submission error:', err);
      const errMsg = err.response?.data?.message || 'Failed to issue delivery challan';
      setModalError(errMsg);
      setError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!deliveryModal.challan) return;
    try {
      await api.put(`/delivery-challans/${deliveryModal.challan._id}/status`, deliveryForm);
      setSuccess(`Challan ${deliveryModal.challan.challanNumber} marked as ${deliveryForm.status}`);
      setDeliveryModal({ open: false, challan: null });
      fetchChallans(page);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Status update error:', err);
      setError(err.response?.data?.message || 'Could not update delivery status');
    }
  };

  const handleDeleteChallan = async (ch) => {
    if (!window.confirm(`Are you sure you want to delete Delivery Challan ${ch.challanNumber}? This action cannot be undone.`)) {
      return;
    }
    try {
      setError('');
      await api.delete(`/delivery-challans/${ch._id}`);
      setSuccess(`Delivery Challan ${ch.challanNumber} deleted successfully.`);
      fetchChallans(page);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Challan delete error:', err);
      setError(err.response?.data?.message || 'Failed to delete delivery challan');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <Truck className="w-4 h-4" />
            Logistics & Site Dispatch
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Delivery Challan Register</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Issue site delivery notes, track material dispatches, log vehicle numbers, and verify receiver acknowledgments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={getDownloadUrl('/api/reports/export/delivery-challans')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            Export Challan CSV
          </a>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Issue Delivery Challan
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
            placeholder="Search Challan #, Client, or Vehicle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Delivery Statuses</option>
            <option value="Issued">Issued</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Delivered">Delivered</option>
            <option value="Invoiced">Invoiced to Client</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Challans Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 divide-y divide-slate-200">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th scope="col" className="py-3 px-4 w-[160px] whitespace-nowrap">Challan Number</th>
                <th scope="col" className="py-3 px-4 w-[120px] whitespace-nowrap">Date</th>
                <th scope="col" className="py-3 px-4 min-w-[200px]">Client / Destination</th>
                <th scope="col" className="py-3 px-4 w-[130px] whitespace-nowrap">Items / Qty</th>
                <th scope="col" className="py-3 px-4 min-w-[150px]">Vehicle Details</th>
                <th scope="col" className="py-3 px-4 w-[120px] whitespace-nowrap">Status</th>
                <th scope="col" className="py-3 px-4 w-[210px] text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading delivery challans...
                  </td>
                </tr>
              ) : challans.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No challans found. Click "Issue Delivery Challan" to dispatch equipment or materials.
                  </td>
                </tr>
              ) : (
                challans.map((ch) => (
                  <tr key={ch._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap align-middle">
                      {ch.challanNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap align-middle">
                      {formatDate(ch.challanDate)}
                    </td>
                    <td className="py-3.5 px-4 align-middle">
                      <div className="font-semibold text-slate-900">{ch.client?.companyName || ch.clientSnapshot?.companyName || 'N/A'}</div>
                      <div className="text-xs text-slate-400 truncate max-w-xs">{ch.deliveryAddress}</div>
                    </td>
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                      <div className="font-medium text-slate-900">
                        {ch.items?.length || 0} item line(s)
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Total {ch.items?.reduce((acc, i) => acc + (i.quantityDispatched || 0), 0)} units
                      </div>
                    </td>
                    <td className="py-3.5 px-4 align-middle">
                      <div className="font-mono text-xs font-semibold text-slate-800">
                        {ch.vehicleNumber || 'No vehicle'}
                      </div>
                      <div className="text-[11px] text-slate-400">{ch.transporterName || 'Self Transport'}</div>
                    </td>
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                        ch.status === 'Delivered'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : ch.status === 'Invoiced'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : ch.status === 'Dispatched'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {ch.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right align-middle whitespace-nowrap space-x-1.5">
                      <a
                        href={getDownloadUrl(`/api/delivery-challans/${ch._id}/pdf`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Download Delivery Challan PDF"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg shadow-sm transition-all"
                      >
                        <FileText className="w-3.5 h-3.5 text-red-600" />
                        <span>PDF</span>
                      </a>
                      {ch.status !== 'Invoiced' && ch.status !== 'Cancelled' && (
                        <>
                          <button
                            onClick={() => {
                              setDeliveryModal({ open: true, challan: ch });
                              setDeliveryForm({
                                status: ch.status === 'Issued' ? 'Dispatched' : 'Delivered',
                                receiverName: ch.receiverName || '',
                                receiverPhone: ch.receiverPhone || '',
                                deliveryNotes: ch.notes || ''
                              });
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            Update
                          </button>
                          <button
                            onClick={() => navigate(`/material-invoices?fromChallan=${ch._id}`)}
                            title="Generate Material Invoice from this Delivery Challan"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            Invoice
                          </button>
                        </>
                      )}
                      {(!ch.invoices || ch.invoices.length === 0) && (
                        <button
                          onClick={() => handleDeleteChallan(ch)}
                          title="Delete Delivery Challan"
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
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

        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing {challans.length} of {totalCount} delivery notes
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => fetchChallans(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium text-slate-700">Page {page} of {totalPages}</span>
            <button
              onClick={() => fetchChallans(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ISSUE CHALLAN MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Issue Site Delivery Challan</h3>
                <p className="text-xs text-slate-500">Dispatch materials or equipment to client site</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 text-xl font-bold">&times;</button>
            </div>

            <form onSubmit={handleSubmitChallan}>
              <div className="p-6 max-h-[65vh] overflow-y-auto space-y-4">
                {modalError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                      <span>{modalError}</span>
                    </div>
                    <button type="button" onClick={() => setModalError('')} className="text-rose-500 hover:text-rose-800 text-base leading-none">&times;</button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Select Client *</label>
                    <select
                      required
                      value={formData.clientId}
                      onChange={(e) => handleClientChange(e.target.value)}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Choose Client --</option>
                      {clients.map((c) => (
                        <option key={c._id} value={c._id}>{c.companyName} ({c.contactPerson})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Delivery Type *</label>
                    <select
                      required
                      value={formData.deliveryType}
                      onChange={(e) => setFormData({ ...formData, deliveryType: e.target.value })}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Material Supply">Material Supply</option>
                      <option value="Project Site Delivery">Project Site Delivery</option>
                      <option value="Supply on Approval">Supply on Approval</option>
                      <option value="Job Work">Job Work</option>
                      <option value="Inter-Branch Transfer">Inter-Branch Transfer</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Project / Work Order</label>
                    <input
                      type="text"
                      placeholder="e.g. Server Migration Phase 2"
                      value={formData.projectOrWorkOrder}
                      onChange={(e) => setFormData({ ...formData, projectOrWorkOrder: e.target.value })}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Site Delivery Address *</label>
                    <textarea
                      required
                      rows="2"
                      value={formData.deliveryAddress}
                      onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Transporter Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Blue Dart Logistics"
                      value={formData.transporterName}
                      onChange={(e) => setFormData({ ...formData, transporterName: e.target.value })}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Registration Number</label>
                    <input
                      type="text"
                      placeholder="e.g. DL-01-AB-1234"
                      value={formData.vehicleNumber}
                      onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 font-mono uppercase focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Line Items */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Material / Hardware Line Items
                    </label>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Item Row
                    </button>
                  </div>

                  <div className="space-y-2">
                    {formData.items.map((item, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <div className="w-full sm:w-1/4">
                          <input
                            type="text"
                            placeholder="Item Code"
                            value={item.itemCode}
                            onChange={(e) => handleItemChange(idx, 'itemCode', e.target.value)}
                            className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 bg-white"
                          />
                        </div>
                        <div className="w-full sm:w-1/2">
                          <input
                            type="text"
                            required
                            placeholder="Item Description *"
                            value={item.description}
                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                            className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 bg-white"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20">
                            <input
                              type="number"
                              min="0.01"
                              step="any"
                              required
                              placeholder="Qty"
                              value={item.quantityDispatched}
                              onChange={(e) => handleItemChange(idx, 'quantityDispatched', Number(e.target.value))}
                              className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 bg-white"
                            />
                          </div>
                          <div className="w-24">
                            <select
                              value={item.unit}
                              onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                              className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 bg-white"
                            >
                              <option value="Nos">Nos</option>
                              <option value="Units">Units</option>
                              <option value="Boxes">Boxes</option>
                              <option value="Meters">Meters</option>
                              <option value="Sets">Sets</option>
                              <option value="Kg">Kg</option>
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            disabled={formData.items.length <= 1}
                            className="text-rose-500 hover:text-rose-700 disabled:opacity-30 p-1 text-sm font-bold ml-auto"
                            title="Remove row"
                          >
                            &times;
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Issuing...' : 'Generate & Issue Challan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE STATUS MODAL */}
      {deliveryModal.open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Update Challan Status</h3>
            <p className="text-xs text-slate-500 mb-4">
              Challan: <span className="font-mono font-semibold">{deliveryModal.challan?.challanNumber}</span>
            </p>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Delivery Status</label>
                <select
                  value={deliveryForm.status}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, status: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white"
                >
                  <option value="Dispatched">Dispatched</option>
                  <option value="Delivered">Delivered (Site Acknowledged)</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {deliveryForm.status === 'Delivered' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Receiver Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Name of site engineer / manager"
                      value={deliveryForm.receiverName}
                      onChange={(e) => setDeliveryForm({ ...deliveryForm, receiverName: e.target.value })}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Receiver Phone</label>
                    <input
                      type="tel"
                      placeholder="Contact number"
                      value={deliveryForm.receiverPhone}
                      onChange={(e) => setDeliveryForm({ ...deliveryForm, receiverPhone: e.target.value })}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setDeliveryModal({ open: false, challan: null })}
                  className="w-1/2 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryChallans;

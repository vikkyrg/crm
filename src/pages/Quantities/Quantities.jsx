import React, { useState, useEffect } from 'react';
import api from '../../api/apiClient';
import { formatDate, formatINR } from '../../utils/formatters';
import {
  Layers,
  Plus,
  Search,
  Download,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Quantities = () => {
  const [quantities, setQuantities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('Units');
  const [priceSnapshot, setPriceSnapshot] = useState('');
  const [relatedPF, setRelatedPF] = useState('');
  const [relatedInvoice, setRelatedInvoice] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const openAddModal = async () => {
    setEditRecord(null);
    let currentClients = clients;
    let currentServices = services;

    if (currentClients.length === 0 || currentServices.length === 0) {
      try {
        const [cRes, sRes] = await Promise.all([
          api.get('/clients?limit=100'),
          api.get('/services?limit=100')
        ]);
        currentClients = cRes.data.data || [];
        currentServices = sRes.data.data || [];
        setClients(currentClients);
        setServices(currentServices);
      } catch (err) {
        console.error('Failed to load dependencies', err);
      }
    }

    const initialClientId = selectedClientId || currentClients[0]?._id || '';
    const initialService = currentServices.find(s => s._id === selectedServiceId) || currentServices[0];
    
    setSelectedClientId(initialClientId);
    if (initialService) {
      setSelectedServiceId(initialService._id);
      setUnit(initialService.unit || 'Units');
      setPriceSnapshot(initialService.defaultUnitPrice !== undefined ? initialService.defaultUnitPrice : '');
    }
    setQuantity('1');
    setRelatedPF('');
    setRelatedInvoice('');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setError('');
    setShowModal(true);
  };

  const openEditModal = (rec) => {
    setEditRecord(rec);
    setSelectedClientId(rec.client?._id || rec.client);
    setSelectedServiceId(rec.service?._id || rec.service);
    setQuantity(String(rec.quantity));
    setUnit(rec.unit || 'Units');
    setPriceSnapshot(String(rec.unitPriceSnapshot || 0));
    setRelatedPF(rec.relatedPFNumber || '');
    setRelatedInvoice(rec.relatedInvoiceNumber || '');
    setDate(rec.date ? new Date(rec.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setNotes(rec.notes || '');
    setShowModal(true);
  };

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  const fetchQuantities = async (targetPage = page) => {
    try {
      setLoading(true);
      const params = { page: targetPage, limit };
      if (search) params.search = search;
      const res = await api.get('/quantities', { params });
      setQuantities(res.data.data);
      setTotalPages(res.data.totalPages || 1);
      setTotalCount(res.data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [cRes, sRes] = await Promise.all([
        api.get('/clients?limit=100'),
        api.get('/services?limit=100')
      ]);
      const fetchedClients = cRes.data.data || [];
      const fetchedServices = sRes.data.data || [];
      setClients(fetchedClients);
      setServices(fetchedServices);

      if (fetchedClients.length > 0 && !selectedClientId) {
        setSelectedClientId(fetchedClients[0]._id);
      }
      if (fetchedServices.length > 0 && !selectedServiceId) {
        setSelectedServiceId(fetchedServices[0]._id);
        setUnit(fetchedServices[0].unit || 'Units');
        setPriceSnapshot(fetchedServices[0].defaultUnitPrice !== undefined ? fetchedServices[0].defaultUnitPrice : '');
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchQuantities(1);
  }, [search]);

  useEffect(() => {
    fetchDependencies();
  }, []);

  const handleSaveQuantity = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editRecord) {
        await api.put(`/quantities/${editRecord._id}`, {
          quantity: Number(quantity),
          unit,
          unitPriceSnapshot: priceSnapshot ? Number(priceSnapshot) : undefined,
          relatedPFNumber: relatedPF,
          relatedInvoiceNumber: relatedInvoice,
          date,
          notes
        });
        setSuccess('Quantity record updated successfully');
      } else {
        await api.post('/quantities', {
          clientId: selectedClientId,
          serviceId: selectedServiceId,
          quantity: Number(quantity),
          unit,
          unitPriceSnapshot: priceSnapshot ? Number(priceSnapshot) : undefined,
          relatedPFNumber: relatedPF,
          relatedInvoiceNumber: relatedInvoice,
          date,
          notes
        });
        setSuccess('Quantity logged successfully in register');
      }

      setShowModal(false);
      fetchQuantities();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving quantity record');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this quantity log record?')) return;
    try {
      await api.delete(`/quantities/${id}`);
      fetchQuantities();
      setSuccess('Quantity record deleted');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      alert('Failed to delete quantity record');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quantity Management Register</h1>
          <p className="text-sm text-slate-500">Track delivered client deliverables, service volume metrics, and production quantity counts.</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`/api/reports/export/quantities${localStorage.getItem('innomatrics_token') ? `?token=${localStorage.getItem('innomatrics_token')}` : ''}`}
            download
            className="inline-flex items-center gap-2 px-3 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-all"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </a>
          <button
            onClick={openAddModal}
            data-testid="add-quantity-btn"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Log Quantity Record
          </button>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm font-medium">
          {success}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by Record ID, client name, or service name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Quantity Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left border-collapse text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-[140px] whitespace-nowrap">Record ID</th>
                <th className="py-3.5 px-4 w-[110px] whitespace-nowrap">Date</th>
                <th className="py-3.5 px-4 min-w-[160px]">Client</th>
                <th className="py-3.5 px-4 min-w-[180px]">Service</th>
                <th className="py-3.5 px-4 w-[130px] whitespace-nowrap">Quantity / Unit</th>
                <th className="py-3.5 px-4 w-[120px] whitespace-nowrap">Price Snapshot</th>
                <th className="py-3.5 px-4 w-[130px] whitespace-nowrap">Reference Docs</th>
                <th className="py-3.5 px-4 w-[100px] text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500 align-middle">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading quantity logs...
                  </td>
                </tr>
              ) : quantities.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500 align-middle">
                    No quantity records logged.
                  </td>
                </tr>
              ) : (
                quantities.map((q) => (
                  <tr key={q._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 align-middle whitespace-nowrap">{q.recordId}</td>
                    <td className="py-3 px-4 text-slate-600 align-middle whitespace-nowrap">{formatDate(q.date)}</td>
                    <td className="py-3 px-4 font-medium text-slate-900 align-middle">{q.clientSnapshot?.companyName}</td>
                    <td className="py-3 px-4 text-slate-700 align-middle">
                      <div className="font-medium text-slate-800">{q.serviceName}</div>
                      <div className="text-xs font-mono text-slate-400">{q.serviceId}</div>
                      {q.notes && <div className="text-xs text-slate-500 italic mt-0.5">{q.notes}</div>}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 align-middle whitespace-nowrap">{q.quantity} {q.unit}</td>
                    <td className="py-3 px-4 text-slate-700 align-middle whitespace-nowrap">{formatINR(q.unitPriceSnapshot)}</td>
                    <td className="py-3 px-4 text-xs font-mono text-slate-500 align-middle whitespace-nowrap">
                      {q.relatedPFNumber && <div>PF: {q.relatedPFNumber}</div>}
                      {q.relatedInvoiceNumber && <div>INV: {q.relatedInvoiceNumber}</div>}
                      {!q.relatedPFNumber && !q.relatedInvoiceNumber && <span>-</span>}
                    </td>
                    <td className="py-3 px-4 text-right align-middle whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(q)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded"
                          title="Edit quantity log"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(q._id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete log"
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
            Showing <span className="font-semibold text-slate-700">{quantities.length}</span> of <span className="font-semibold text-slate-700">{totalCount}</span> logs (Page {page} of {totalPages})
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (page > 1) {
                  const newPage = page - 1;
                  setPage(newPage);
                  fetchQuantities(newPage);
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
                  fetchQuantities(newPage);
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              {editRecord ? `Edit Quantity Record (${editRecord.recordId})` : 'Log Production / Service Quantity'}
            </h2>

            {error && (
              <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveQuantity} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Client *</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none"
                  required
                >
                  {clients.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.companyName} ({c.clientId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Service *</label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => {
                    setSelectedServiceId(e.target.value);
                    const s = services.find((srv) => srv._id === e.target.value);
                    if (s) {
                      setUnit(s.unit || 'Units');
                      setPriceSnapshot(s.defaultUnitPrice);
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none"
                  required
                >
                  {services.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.serviceId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Quantity Logged *</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Unit Price Snapshot (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={priceSnapshot}
                    onChange={(e) => setPriceSnapshot(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Date Logged *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Related PF Number</label>
                  <input
                    type="text"
                    value={relatedPF}
                    onChange={(e) => setRelatedPF(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none font-mono"
                    placeholder="PF-2026-XXXXX"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Related Invoice Number</label>
                  <input
                    type="text"
                    value={relatedInvoice}
                    onChange={(e) => setRelatedInvoice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none font-mono"
                    placeholder="INV-2026-XXXXX"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
                  placeholder="Milestone sprint details or notes..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="save-quantity-btn"
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm"
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quantities;

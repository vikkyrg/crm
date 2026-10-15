import React, { useState, useEffect } from 'react';
import api from '../../api/apiClient';
import { formatINR, formatDate } from '../../utils/formatters';
import {
  WalletCards,
  Plus,
  Search,
  Download,
  FileText,
  CheckCircle,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

const AdvancePayments = () => {
  const [advances, setAdvances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [clients, setClients] = useState([]);

  // Create/Edit Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [editAdvance, setEditAdvance] = useState(null);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [transactionRef, setTransactionRef] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [associatedProject, setAssociatedProject] = useState('');
  const [notes, setNotes] = useState('');
  const [advanceStatus, setAdvanceStatus] = useState('Verified');

  const openAddModal = () => {
    setEditAdvance(null);
    setSelectedClientId(clients[0]?._id || '');
    setAmount('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('Bank Transfer');
    setTransactionRef('');
    setBankDetails('');
    setAssociatedProject('');
    setNotes('');
    setAdvanceStatus('Verified');
    setShowAddModal(true);
  };

  const openEditModal = (adv) => {
    setEditAdvance(adv);
    setSelectedClientId(adv.client?._id || adv.client);
    setAmount(String(adv.amount));
    setPaymentDate(adv.paymentDate ? new Date(adv.paymentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setPaymentMethod(adv.paymentMethod || 'Bank Transfer');
    setTransactionRef(adv.transactionReference || '');
    setBankDetails(adv.bankDetails || '');
    setAssociatedProject(adv.associatedProject || '');
    setNotes(adv.notes || '');
    setAdvanceStatus(adv.status || 'Verified');
    setShowAddModal(true);
  };

  // Allocation Modal
  const [allocatingAdvance, setAllocatingAdvance] = useState(null);
  const [clientInvoices, setClientInvoices] = useState([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [allocAmount, setAllocAmount] = useState('');
  const [allocNotes, setAllocNotes] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  const fetchAdvances = async (targetPage = page) => {
    try {
      setLoading(true);
      const params = { page: targetPage, limit };
      if (search) params.search = search;
      const res = await api.get('/advances', { params });
      setAdvances(res.data.data);
      setTotalPages(res.data.totalPages || 1);
      setTotalCount(res.data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await api.get('/clients?limit=100');
      setClients(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchAdvances(1);
  }, [search]);

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSaveAdvance = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editAdvance) {
        await api.put(`/advances/${editAdvance._id}`, {
          amount: Number(amount),
          paymentDate,
          paymentMethod,
          transactionReference: transactionRef,
          bankDetails,
          associatedProject,
          notes,
          status: advanceStatus
        });
        setSuccess('Advance payment record updated successfully');
      } else {
        await api.post('/advances', {
          clientId: selectedClientId,
          amount: Number(amount),
          paymentDate,
          paymentMethod,
          transactionReference: transactionRef,
          bankDetails,
          associatedProject,
          notes
        });
        setSuccess('Advance payment recorded and receipt generated');
      }

      setShowAddModal(false);
      fetchAdvances();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving advance payment');
    }
  };

  const openAllocationModal = async (advance) => {
    setError('');
    setAllocatingAdvance(advance);
    setAllocNotes('');

    // Fetch this client's open invoices
    try {
      const res = await api.get(`/invoices?client=${advance.client?._id || advance.client}`);
      const openInvoices = res.data.data.filter((inv) => inv.outstandingBalance > 0);
      setClientInvoices(openInvoices);

      if (openInvoices.length > 0) {
        setSelectedInvoiceId(openInvoices[0]._id);
        const maxAlloc = Math.min(advance.unallocatedAmount, openInvoices[0].outstandingBalance);
        setAllocAmount(maxAlloc);
      } else {
        setSelectedInvoiceId('');
        setAllocAmount('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAllocate = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await api.post(`/advances/${allocatingAdvance._id}/allocate`, {
        invoiceId: selectedInvoiceId,
        amount: Number(allocAmount),
        notes: allocNotes
      });

      setSuccess(`Allocated ₹${allocAmount} from ${allocatingAdvance.receiptNumber} to target invoice`);
      setAllocatingAdvance(null);
      fetchAdvances();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to allocate advance');
    }
  };

  // Delete Confirmation Modal State
  const [deleteConfirmAdvance, setDeleteConfirmAdvance] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // View Allocations / History Modal State
  const [viewHistoryAdvance, setViewHistoryAdvance] = useState(null);

  const handleDeleteAdvance = async () => {
    if (!deleteConfirmAdvance) return;
    setIsDeleting(true);
    setError('');

    try {
      const res = await api.delete(`/advances/${deleteConfirmAdvance._id}`);
      setSuccess(res.data.message || 'Advance payment deleted successfully');
      setDeleteConfirmAdvance(null);
      fetchAdvances();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete advance payment');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeallocate = async (advanceId, allocationId) => {
    if (!window.confirm('Are you sure you want to deallocate this advance from the invoice? This will restore the advance available balance and adjust the invoice outstanding balance.')) {
      return;
    }

    try {
      const res = await api.post(`/advances/${advanceId}/deallocate`, { allocationId });
      setSuccess(res.data.message);
      fetchAdvances();
      if (viewHistoryAdvance && viewHistoryAdvance._id === advanceId) {
        // Refresh currently viewed history
        const refreshed = await api.get(`/advances/${advanceId}`);
        setViewHistoryAdvance(refreshed.data.data);
      }
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to deallocate advance');
    }
  };

  const handleReverseAdvance = async (id) => {
    if (!window.confirm('Are you sure you want to reverse this advance payment? This will mark it as Reversed with an audit trail.')) return;
    try {
      await api.post(`/advances/${id}/reverse`);
      fetchAdvances();
      setSuccess('Advance payment reversed successfully');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot reverse advance');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Advance Payments & Retainers</h1>
          <p className="text-sm text-slate-500">Record advance deposits, track unallocated balances, and allocate safely against invoices.</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`/api/reports/export/advances${localStorage.getItem('innomatrics_token') ? `?token=${localStorage.getItem('innomatrics_token')}` : ''}`}
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
            Record Advance
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
            placeholder="Search by receipt number, client name, or transaction UTR..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Receipt No</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Amount Received</th>
                <th className="py-3 px-4">Allocated</th>
                <th className="py-3 px-4">Unallocated Remaining</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading advances...
                  </td>
                </tr>
              ) : advances.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    No advance payments recorded.
                  </td>
                </tr>
              ) : (
                advances.map((adv) => (
                  <tr key={adv._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-purple-700">{adv.receiptNumber}</td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(adv.paymentDate)}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{adv.clientSnapshot?.companyName}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{formatINR(adv.amount)}</td>
                    <td className="py-3 px-4 text-emerald-600 font-semibold">{formatINR(adv.allocatedAmount)}</td>
                    <td className="py-3 px-4 font-bold text-purple-700">{formatINR(adv.unallocatedAmount)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        adv.status === 'Verified'
                          ? 'bg-purple-50 text-purple-700'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {adv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Download Receipt */}
                        <a
                          href={`/api/advances/${adv._id}/pdf${localStorage.getItem('innomatrics_token') ? `?token=${localStorage.getItem('innomatrics_token')}` : ''}`}
                          download
                          title="Download Receipt PDF"
                          className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <FileText className="w-4 h-4" />
                        </a>

                        {/* Edit Action */}
                        <button
                          onClick={() => openEditModal(adv)}
                          title="Edit Advance Payment"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Allocate Action */}
                        {adv.status !== 'Reversed' && adv.unallocatedAmount > 0 && (
                          <button
                            onClick={() => openAllocationModal(adv)}
                            title="Allocate to Invoice"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 transition-colors"
                          >
                            Allocate
                          </button>
                        )}

                        {/* View Allocations History */}
                        {adv.allocatedAmount > 0 && (
                          <button
                            onClick={async () => {
                              try {
                                const res = await api.get(`/advances/${adv._id}`);
                                setViewHistoryAdvance(res.data.data);
                              } catch (e) {
                                console.error(e);
                              }
                            }}
                            title="View / Manage Allocations"
                            className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}

                        {/* Reverse Action */}
                        {adv.status !== 'Reversed' && adv.allocatedAmount === 0 && (
                          <button
                            onClick={() => handleReverseAdvance(adv._id)}
                            title="Reverse Advance"
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete Action (Controlled Safeguards) */}
                        <button
                          onClick={() => setDeleteConfirmAdvance(adv)}
                          title={adv.allocatedAmount > 0 ? "Allocated advance cannot be deleted" : "Delete Advance Payment"}
                          className={`p-1.5 rounded transition-colors ${
                            adv.allocatedAmount > 0
                              ? 'text-slate-300 hover:text-red-400 hover:bg-red-50/50 cursor-pointer'
                              : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                          }`}
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
            Showing <span className="font-semibold text-slate-700">{advances.length}</span> of <span className="font-semibold text-slate-700">{totalCount}</span> advances (Page {page} of {totalPages})
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (page > 1) {
                  const newPage = page - 1;
                  setPage(newPage);
                  fetchAdvances(newPage);
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
                  fetchAdvances(newPage);
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

      {/* Allocate Advance Modal */}
      {allocatingAdvance && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Allocate Advance to Invoice</h2>
            <p className="text-xs text-slate-500 mb-4">
              Receipt: <span className="font-semibold text-purple-700">{allocatingAdvance.receiptNumber}</span> | Available Unallocated: <span className="font-semibold text-slate-800">{formatINR(allocatingAdvance.unallocatedAmount)}</span>
            </p>

            {error && (
              <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {clientInvoices.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs mb-4">
                This client has no outstanding invoices requiring settlement. Create or issue an invoice first.
              </div>
            ) : (
              <form onSubmit={handleAllocate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Target Invoice *</label>
                  <select
                    value={selectedInvoiceId}
                    onChange={(e) => {
                      setSelectedInvoiceId(e.target.value);
                      const target = clientInvoices.find((i) => i._id === e.target.value);
                      if (target) {
                        setAllocAmount(Math.min(allocatingAdvance.unallocatedAmount, target.outstandingBalance));
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none"
                    required
                  >
                    {clientInvoices.map((inv) => (
                      <option key={inv._id} value={inv._id}>
                        {inv.invoiceNumber} - Balance: {formatINR(inv.outstandingBalance)} (Total: {formatINR(inv.grandTotal)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Allocation Amount (₹) *</label>
                  <input
                    type="number"
                    min="0.01"
                    max={allocatingAdvance.unallocatedAmount}
                    step="0.01"
                    required
                    value={allocAmount}
                    onChange={(e) => setAllocAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Cannot exceed either the unallocated advance or invoice balance.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Notes</label>
                  <input
                    type="text"
                    value={allocNotes}
                    onChange={(e) => setAllocNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
                    placeholder="e.g. Milestone 2 settlement from retainer"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setAllocatingAdvance(null)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm"
                  >
                    Confirm Allocation
                  </button>
                </div>
              </form>
            )}

            {clientInvoices.length === 0 && (
              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setAllocatingAdvance(null)}
                  className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-semibold text-slate-700"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Advance Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              {editAdvance ? `Edit Advance Payment (${editAdvance.receiptNumber})` : 'Record Advance Deposit Receipt'}
            </h2>

            {error && (
              <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveAdvance} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Select Client *</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  disabled={!!editAdvance}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none disabled:bg-slate-100 disabled:text-slate-500"
                  required
                >
                  {clients.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.companyName} ({c.clientId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Advance Amount (₹) *</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold outline-none"
                    placeholder="100000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Payment Method *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none"
                  >
                    <option value="Bank Transfer">Bank Transfer / NEFT / RTGS</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Transaction Ref / UTR</label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none font-mono"
                    placeholder="UTR-XXXX"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Associated Project / Retainer Scope</label>
                <input
                  type="text"
                  value={associatedProject}
                  onChange={(e) => setAssociatedProject(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
                  placeholder="e.g. AI Pipeline Development"
                />
              </div>

              {editAdvance && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Payment Status</label>
                  <select
                    value={advanceStatus}
                    onChange={(e) => setAdvanceStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none font-semibold text-slate-800"
                  >
                    <option value="Verified">Verified (Active / Allocatable)</option>
                    <option value="Reversed">Reversed (Cancelled / Inactive)</option>
                  </select>
                  {advanceStatus === 'Reversed' && (
                    <p className="text-[11px] text-amber-600 mt-1">
                      Note: Setting to 'Verified' restores this advance to available balance for invoice allocation.
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Notes</label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
                  placeholder="Deposit notes or instructions..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm"
                >
                  {editAdvance ? 'Update Advance Record' : 'Generate Advance Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal with Financial Safeguards */}
      {deleteConfirmAdvance && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Delete Advance Payment</h3>
                <p className="text-xs text-slate-500 font-mono">{deleteConfirmAdvance.receiptNumber}</p>
              </div>
            </div>

            {deleteConfirmAdvance.allocatedAmount > 0 ? (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Deletion Safeguard: Advance Allocated to Invoice(s)</span>
                  </div>
                  <p>
                    This advance payment of <strong>{formatINR(deleteConfirmAdvance.amount)}</strong> has already been partially or fully allocated (Allocated: <strong>{formatINR(deleteConfirmAdvance.allocatedAmount)}</strong>).
                  </p>
                  <p className="text-slate-600">
                    Direct permanent deletion is blocked to prevent breaking invoice payment history and financial reconciliation. If needed, first deallocate the advance from the associated invoice.
                  </p>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmAdvance(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Are you sure you want to permanently delete advance receipt{' '}
                  <strong className="text-slate-900">{deleteConfirmAdvance.receiptNumber}</strong> for{' '}
                  <strong className="text-slate-900">{formatINR(deleteConfirmAdvance.amount)}</strong>?
                </p>
                <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-500 space-y-1">
                  <div>• Client: {deleteConfirmAdvance.clientSnapshot?.companyName || 'N/A'}</div>
                  <div>• Payment Method: {deleteConfirmAdvance.paymentMethod}</div>
                  <div>• Unallocated Balance: {formatINR(deleteConfirmAdvance.unallocatedAmount)}</div>
                </div>
                <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmAdvance(null)}
                    disabled={isDeleting}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAdvance}
                    disabled={isDeleting}
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold shadow-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View Allocations & Deallocate History Modal */}
      {viewHistoryAdvance && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Advance Allocations History</h3>
                <p className="text-xs text-slate-500 font-mono">
                  {viewHistoryAdvance.receiptNumber} • Total: {formatINR(viewHistoryAdvance.amount)}
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700">
                Unallocated: {formatINR(viewHistoryAdvance.unallocatedAmount)}
              </span>
            </div>

            {(!viewHistoryAdvance.allocations || viewHistoryAdvance.allocations.length === 0) ? (
              <p className="text-xs text-slate-500 py-4 text-center">No invoice allocations recorded for this advance.</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {viewHistoryAdvance.allocations.map((alloc) => (
                  <div key={alloc._id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-900 font-mono">Invoice #{alloc.invoiceNumber}</div>
                      <div className="text-slate-500 mt-0.5">
                        Allocated: <span className="font-bold text-emerald-700">{formatINR(alloc.allocatedAmount)}</span> on {formatDate(alloc.allocatedAt)}
                      </div>
                      {alloc.notes && <div className="text-[11px] text-slate-400 mt-0.5">{alloc.notes}</div>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeallocate(viewHistoryAdvance._id, alloc._id)}
                      className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded text-xs font-semibold transition-colors"
                      title="Reverse allocation and restore advance balance"
                    >
                      Deallocate
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewHistoryAdvance(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancePayments;

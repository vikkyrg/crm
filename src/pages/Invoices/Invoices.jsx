import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import api, { getDownloadUrl } from '../../api/apiClient';
import { formatINR, formatDate, calculateClientLine } from '../../utils/formatters';
import {
  Receipt,
  Plus,
  Search,
  Download,
  FileText,
  FileCode,
  DollarSign,
  AlertCircle,
  Trash2,
  CheckCircle,
  Eye,
  Filter,
  Edit2,
  ChevronLeft,
  ChevronRight,
  WalletCards
} from 'lucide-react';

const Invoices = () => {
  const location = useLocation();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);

  // Create/Edit Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editInvoice, setEditInvoice] = useState(null);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Payment due within 15 days');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [items, setItems] = useState([
    { serviceId: '', description: '', unitPrice: 0, quantity: 1, discountPercent: 0, taxRate: 18, unit: 'Units' }
  ]);
  const [documentDiscount, setDocumentDiscount] = useState(0);
  const [relatedPFDoc, setRelatedPFDoc] = useState(null);

  // Advance Amount in Invoice Creation
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [advanceInputError, setAdvanceInputError] = useState('');

  // Payment Recording Modal
  const [paymentModalInvoice, setPaymentModalInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const openCreateModal = () => {
    setEditInvoice(null);
    setRelatedPFDoc(null);
    const defaultClientId = clients[0]?._id || '';
    setSelectedClientId(defaultClientId);
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    const d = new Date();
    d.setDate(d.getDate() + 15);
    setDueDate(d.toISOString().split('T')[0]);
    setPaymentTerms('Payment due within 15 days');
    setInvoiceNotes('');
    setItems([
      { serviceId: '', description: '', unitPrice: 0, quantity: 1, discountPercent: 0, taxRate: 18, unit: 'Units' }
    ]);
    setDocumentDiscount(0);
    setAdvanceAmount(0);
    setAdvanceInputError('');
    setShowCreateModal(true);
  };

  const openEditModal = (inv) => {
    setEditInvoice(inv);
    setRelatedPFDoc(inv.relatedPFDocument || null);
    setSelectedClientId(inv.client?._id || inv.client);
    setInvoiceDate(inv.invoiceDate ? new Date(inv.invoiceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setDueDate(inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '');
    setPaymentTerms(inv.paymentTerms || 'Payment due within 15 days');
    setInvoiceNotes(inv.notes || '');
    if (inv.items && inv.items.length > 0) {
      setItems(inv.items.map(it => ({
        serviceId: it.serviceId || '',
        description: it.description || '',
        unitPrice: it.unitPrice || 0,
        quantity: it.quantity || 1,
        discountPercent: it.discountPercent || 0,
        taxRate: it.taxRate || 18,
        unit: it.unit || 'Units'
      })));
    } else {
      setItems([{ serviceId: '', description: '', unitPrice: 0, quantity: 1, discountPercent: 0, taxRate: 18, unit: 'Units' }]);
    }
    setDocumentDiscount(inv.documentDiscount || 0);
    setAdvanceAmount(inv.advanceAmount || inv.amountPaid || 0);
    setAdvanceInputError('');
    setShowCreateModal(true);
  };

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  const fetchInvoices = async (targetPage = page) => {
    try {
      setLoading(true);
      const params = { page: targetPage, limit };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (overdueOnly) params.overdueOnly = 'true';

      const res = await api.get('/invoices', { params });
      setInvoices(res.data.data);
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
      setClients(cRes.data.data);
      setServices(sRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchInvoices(1);
  }, [search, statusFilter, overdueOnly]);

  useEffect(() => {
    fetchDependencies();
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingPFSource, setLoadingPFSource] = useState(false);

  // Handle conversion from PF Document if routed from PFDocuments page or URL query ?fromPF=ID
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const fromPFId = searchParams.get('fromPF');

    if (fromPFId) {
      const loadPFData = async () => {
        try {
          setLoadingPFSource(true);
          setError('');
          const res = await api.get(`/pf-documents/${fromPFId}`);
          const pf = res.data.data;

          if (pf.convertedToInvoiceId) {
            setError(`PF Document ${pf.pfNumber} has already been converted to Invoice ${pf.convertedToInvoiceNumber}.`);
            setRelatedPFDoc(null);
            setShowCreateModal(false);
            return;
          }

          setEditInvoice(null);
          setRelatedPFDoc(pf);
          const cId = pf.client?._id || pf.client;
          setSelectedClientId(cId);
          setInvoiceDate(new Date().toISOString().split('T')[0]);
          const d = new Date();
          d.setDate(d.getDate() + 15);
          setDueDate(d.toISOString().split('T')[0]);
          setPaymentTerms(pf.termsAndConditions || 'Payment due within 15 days');
          setInvoiceNotes(pf.notes || `Generated from Proforma Document ${pf.pfNumber}`);

          if (pf.items && pf.items.length > 0) {
            setItems(pf.items.map(it => ({
              serviceId: it.serviceId || '',
              description: it.description || '',
              unitPrice: it.unitPrice || 0,
              quantity: it.quantity || 1,
              discountPercent: it.discountPercent || 0,
              taxRate: it.taxRate || 18,
              unit: it.unit || 'Units'
            })));
          }

          setDocumentDiscount(pf.documentDiscount || 0);
          setAdvanceAmount(0);
          setAdvanceInputError('');
          setShowCreateModal(true);
        } catch (err) {
          setError(err.response?.data?.message || `Failed to fetch PF document (${fromPFId})`);
        } finally {
          setLoadingPFSource(false);
        }
      };

      loadPFData();
    } else if (location.state?.convertFromPF) {
      const pf = location.state.convertFromPF;
      setEditInvoice(null);
      setRelatedPFDoc(pf);
      const cId = pf.client?._id || pf.client;
      setSelectedClientId(cId);
      setInvoiceDate(new Date().toISOString().split('T')[0]);
      const d = new Date();
      d.setDate(d.getDate() + 15);
      setDueDate(d.toISOString().split('T')[0]);
      setPaymentTerms(pf.termsAndConditions || 'Payment due within 15 days');
      setInvoiceNotes(pf.notes || `Generated from Proforma Document ${pf.pfNumber}`);
      if (pf.items && pf.items.length > 0) {
        setItems(pf.items.map(it => ({
          serviceId: it.serviceId || '',
          description: it.description || '',
          unitPrice: it.unitPrice || 0,
          quantity: it.quantity || 1,
          discountPercent: it.discountPercent || 0,
          taxRate: it.taxRate || 18,
          unit: it.unit || 'Units'
        })));
      }
      setDocumentDiscount(pf.documentDiscount || 0);
      setAdvanceAmount(0);
      setAdvanceInputError('');
      setShowCreateModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.search, location.state]);

  const handleAddItemRow = () => {
    setItems([
      ...items,
      { serviceId: '', description: '', unitPrice: 0, quantity: 1, discountPercent: 0, taxRate: 18, unit: 'Units' }
    ]);
  };

  const handleRemoveItemRow = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;

    if (field === 'serviceId') {
      const srv = services.find((s) => s.serviceId === value);
      if (srv) {
        updated[index].description = srv.name;
        updated[index].unitPrice = srv.defaultUnitPrice;
        updated[index].taxRate = srv.taxRate;
        updated[index].unit = srv.unit || 'Units';
      }
    }

    setItems(updated);
  };

  const selectedClientObj = clients.find((c) => c._id === selectedClientId);
  const isInterState = Boolean(selectedClientObj?.stateCode && selectedClientObj?.stateCode !== '09');

  const calculatedLines = items.map((it) => calculateClientLine(it, isInterState));
  const previewSubtotal = calculatedLines.reduce((acc, curr) => acc + (curr.unitPrice * curr.quantity), 0);
  const previewTaxable = calculatedLines.reduce((acc, curr) => acc + curr.taxableAmount, 0) - Number(documentDiscount || 0);
  const previewTax = calculatedLines.reduce((acc, curr) => acc + curr.totalTax, 0);
  const previewGrandTotal = Math.round(previewTaxable + previewTax);

  // Advance Calculation Breakdown
  const numericAdvanceAmount = Number(advanceAmount) || 0;
  const remainingPayable = Math.max(0, previewGrandTotal - numericAdvanceAmount);

  const handleAdvanceAmountChange = (enteredVal) => {
    // If empty string, let the user clear the input
    if (enteredVal === '') {
      setAdvanceAmount('');
      setAdvanceInputError('');
      return;
    }

    const val = Number(enteredVal);
    if (isNaN(val)) {
      setAdvanceInputError('Please enter a valid number');
      return;
    }

    if (val < 0) {
      setAdvanceInputError('Advance amount cannot be negative');
      return;
    }

    if (val > previewGrandTotal) {
      setAdvanceInputError(`Advance amount cannot exceed Invoice Grand Total (${formatINR(previewGrandTotal)})`);
      setAdvanceAmount(val);
      return;
    }

    setAdvanceInputError('');
    setAdvanceAmount(val);
  };

  const handleSaveInvoice = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const finalAdvance = Number(advanceAmount) || 0;
    if (finalAdvance < 0) {
      setError('Advance amount cannot be negative');
      return;
    }
    if (finalAdvance > previewGrandTotal) {
      setError(`Advance amount (${formatINR(finalAdvance)}) cannot exceed Invoice Grand Total (${formatINR(previewGrandTotal)})`);
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      if (editInvoice) {
        await api.put(`/invoices/${editInvoice._id}`, {
          invoiceDate,
          dueDate: dueDate || null,
          items,
          documentDiscount: Number(documentDiscount) || 0,
          notes: invoiceNotes,
          paymentTerms
        });
        setSuccess('Invoice updated successfully');
      } else {
        await api.post('/invoices', {
          clientId: selectedClientId,
          invoiceDate,
          dueDate: dueDate || null,
          items,
          documentDiscount: Number(documentDiscount) || 0,
          advanceAmount: finalAdvance,
          notes: invoiceNotes,
          paymentTerms,
          relatedPFDocument: relatedPFDoc ? (relatedPFDoc._id || relatedPFDoc) : undefined
        });
        setSuccess(relatedPFDoc 
          ? `Invoice successfully generated and linked to PF ${relatedPFDoc.pfNumber || ''}!` 
          : 'Invoice created successfully');
      }

      setShowCreateModal(false);
      setRelatedPFDoc(null);
      setAdvanceAmount(0);
      setAdvanceInputError('');
      // Clean query parameter if URL had ?fromPF=...
      if (window.location.search) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      fetchInvoices();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await api.post(`/invoices/${paymentModalInvoice._id}/payments`, {
        amount: Number(paymentAmount),
        paymentMethod,
        reference: paymentRef,
        notes: paymentNotes
      });

      setSuccess(`Payment of ₹${paymentAmount} recorded successfully`);
      setPaymentModalInvoice(null);
      fetchInvoices();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record payment');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tax Invoices & Billing Management</h1>
          <p className="text-sm text-slate-500">Official GST compliant invoices, payment tracking, balance reconciliation, and document exports.</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={getDownloadUrl(`/api/reports/export/invoices${localStorage.getItem('innomatrics_token') ? `?token=${localStorage.getItem('innomatrics_token')}` : ''}`)}
            download
            className="inline-flex items-center gap-2 px-3 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-all"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </a>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Invoice
          </button>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm font-medium">
          {success}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by Invoice Number or client name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div className="w-full sm:w-44">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Issued">Issued</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={(e) => setOverdueOnly(e.target.checked)}
              className="rounded text-red-600 focus:ring-red-500 h-4 w-4"
            />
            <span className="text-red-700">Overdue Only</span>
          </label>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Invoice No</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Grand Total</th>
                <th className="py-3 px-4">Paid</th>
                <th className="py-3 px-4">Outstanding</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading tax invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    No invoices found matching criteria.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{inv.invoiceNumber}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      <div>Date: {formatDate(inv.invoiceDate)}</div>
                      <div className="text-slate-400">Due: {formatDate(inv.dueDate)}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      <div>{inv.clientSnapshot?.companyName}</div>
                      {inv.relatedPFNumber && (
                        <div className="text-xs font-mono text-purple-600">PF: {inv.relatedPFNumber}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{formatINR(inv.grandTotal)}</td>
                    <td className="py-3 px-4 font-semibold text-emerald-600">{formatINR(inv.amountPaid)}</td>
                    <td className="py-3 px-4 font-bold text-amber-700">{formatINR(inv.outstandingBalance)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        inv.status === 'Paid'
                          ? 'bg-emerald-50 text-emerald-700'
                          : inv.status === 'Partially Paid'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit Action */}
                        <button
                          onClick={() => openEditModal(inv)}
                          title="Edit Invoice"
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {/* Download PDF */}
                        <a
                          href={getDownloadUrl(`/api/invoices/${inv._id}/pdf${localStorage.getItem('innomatrics_token') ? `?token=${localStorage.getItem('innomatrics_token')}` : ''}`)}
                          download
                          title="Download PDF"
                          className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <FileText className="w-4 h-4" />
                        </a>
                        {/* Download Word Docx */}
                        <a
                          href={getDownloadUrl(`/api/invoices/${inv._id}/docx${localStorage.getItem('innomatrics_token') ? `?token=${localStorage.getItem('innomatrics_token')}` : ''}`)}
                          download
                          title="Download Word .docx"
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <FileCode className="w-4 h-4" />
                        </a>
                        {/* Record Payment Button */}
                        {inv.outstandingBalance > 0 && (
                          <button
                            onClick={() => {
                              setPaymentModalInvoice(inv);
                              setPaymentAmount(inv.outstandingBalance);
                            }}
                            title="Record Payment"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-700 transition-colors ml-1"
                          >
                            <DollarSign className="w-3.5 h-3.5" /> Pay
                          </button>
                        )}
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
            Showing <span className="font-semibold text-slate-700">{invoices.length}</span> of <span className="font-semibold text-slate-700">{totalCount}</span> invoices (Page {page} of {totalPages})
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (page > 1) {
                  const newPage = page - 1;
                  setPage(newPage);
                  fetchInvoices(newPage);
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
                  fetchInvoices(newPage);
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

      {/* Record Payment Modal */}
      {paymentModalInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Record Direct Payment</h2>
            <p className="text-xs text-slate-500 mb-4">
              Post received amount against <span className="font-semibold text-slate-800">{paymentModalInvoice.invoiceNumber}</span>
            </p>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Invoice Total:</span>
                  <span className="font-semibold">{formatINR(paymentModalInvoice.grandTotal)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Already Paid:</span>
                  <span className="font-semibold text-emerald-600">{formatINR(paymentModalInvoice.amountPaid)}</span>
                </div>
                <div className="flex justify-between py-1 border-t border-slate-200 text-amber-700 font-bold">
                  <span>Outstanding Balance:</span>
                  <span>{formatINR(paymentModalInvoice.outstandingBalance)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Amount Received (₹) *</label>
                <input
                  type="number"
                  min="0.01"
                  max={paymentModalInvoice.outstandingBalance}
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

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
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Transaction Ref / UTR / Cheque No</label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none font-mono"
                  placeholder="e.g. UTR12345678"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPaymentModalInvoice(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 shadow-sm"
                >
                  Post Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>{editInvoice ? `Edit Tax Invoice (${editInvoice.invoiceNumber})` : 'Generate Official GST Tax Invoice'}</span>
              <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-50 text-blue-700">
                {isInterState ? 'Inter-State Supply (IGST)' : 'Intra-State Supply (CGST + SGST)'}
              </span>
            </h2>

            {editInvoice && (editInvoice.amountPaid > 0 || editInvoice.status === 'Paid') && (
              <div className="p-3 mb-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  <strong>Financial Safeguard:</strong> This invoice has recorded payments (Paid: {formatINR(editInvoice.amountPaid)}). Line item amounts are locked to preserve audit & financial integrity; you may update due dates, notes, and payment terms.
                </span>
              </div>
            )}

            {relatedPFDoc && !editInvoice && (
              <div className="p-3.5 mb-4 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-blue-950 flex items-center gap-1.5">
                      <span>Creating Invoice from Proforma:</span>
                      <span className="font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">{relatedPFDoc.pfNumber}</span>
                    </div>
                    <p className="text-[11px] text-blue-700 mt-0.5">
                      Client, line items, and totals prefilled from verified PF document. Review and confirm to generate official Tax Invoice.
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 font-semibold text-blue-900">
                  <div className="text-[10px] text-blue-600 uppercase">PF Total</div>
                  <div className="text-sm font-bold">{formatINR(relatedPFDoc.grandTotal)}</div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveInvoice} className="space-y-6">
              {/* Header Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Select Client *</label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    disabled={!!editInvoice}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none disabled:bg-slate-100 disabled:text-slate-500"
                    required
                  >
                    {clients.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.companyName} ({c.clientId}) - {c.state}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Invoice Date *</label>
                  <input
                    type="date"
                    required
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none"
                  />
                </div>
              </div>

              {/* Service Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Services Billed</h3>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Service Line
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div key={idx} className="p-3 border border-slate-200 rounded-xl bg-white grid grid-cols-12 gap-2 items-center text-xs">
                      <div className="col-span-12 sm:col-span-4">
                        <label className="text-[10px] text-slate-500 font-semibold uppercase">Catalog Item</label>
                        <select
                          value={item.serviceId}
                          onChange={(e) => handleItemChange(idx, 'serviceId', e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded text-xs outline-none"
                        >
                          <option value="">-- Choose Catalog Service --</option>
                          {services.map((s) => (
                            <option key={s._id} value={s.serviceId}>
                              {s.name} (₹{s.defaultUnitPrice})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-12 sm:col-span-3">
                        <label className="text-[10px] text-slate-500 font-semibold uppercase">Description</label>
                        <input
                          type="text"
                          required
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded text-xs outline-none"
                        />
                      </div>

                      <div className="col-span-4 sm:col-span-2">
                        <label className="text-[10px] text-slate-500 font-semibold uppercase">Price (₹)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded text-xs outline-none"
                        />
                      </div>

                      <div className="col-span-3 sm:col-span-1">
                        <label className="text-[10px] text-slate-500 font-semibold uppercase">Qty</label>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          required
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded text-xs outline-none"
                        />
                      </div>

                      <div className="col-span-3 sm:col-span-1">
                        <label className="text-[10px] text-slate-500 font-semibold uppercase">Disc %</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discountPercent}
                          onChange={(e) => handleItemChange(idx, 'discountPercent', e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded text-xs outline-none"
                        />
                      </div>

                      <div className="col-span-2 sm:col-span-1 flex justify-end pt-3">
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Preview */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase">Document Discount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={documentDiscount}
                    onChange={(e) => setDocumentDiscount(e.target.value)}
                    className="w-48 px-3 py-1.5 border border-slate-300 rounded text-sm bg-white"
                  />
                  <p className="text-[11px] text-slate-500">Recalculated authoritatively on server upon submission</p>
                </div>

                <div className="w-72 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-slate-900">{formatINR(previewSubtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxable Value:</span>
                    <span className="font-semibold text-slate-900">{formatINR(previewTaxable)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (18%):</span>
                    <span className="font-semibold text-slate-900">{formatINR(previewTax)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold text-blue-700">
                    <span>Grand Total:</span>
                    <span>{formatINR(previewGrandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Terms and Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Payment Terms</label>
                  <input
                    type="text"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none"
                    placeholder="e.g. Payment due within 15 days"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Invoice Notes / Remarks</label>
                  <input
                    type="text"
                    value={invoiceNotes}
                    onChange={(e) => setInvoiceNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none"
                    placeholder="e.g. Subject to Delhi jurisdiction"
                  />
                </div>
              </div>

              {/* Advance Amount Section */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <WalletCards className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Advance Payment / Settle on Creation (Optional)
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Advance Amount (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400 font-semibold text-sm">₹</span>
                      <input
                        type="number"
                        min="0"
                        max={previewGrandTotal}
                        step="0.01"
                        placeholder="Enter advance amount"
                        value={advanceAmount}
                        onChange={(e) => handleAdvanceAmountChange(e.target.value)}
                        disabled={!!editInvoice && (editInvoice.amountPaid > 0 || editInvoice.status === 'Paid')}
                        className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-600 bg-white disabled:bg-slate-100 disabled:text-slate-500"
                      />
                    </div>
                    {advanceInputError ? (
                      <p className="text-[11px] text-red-600 font-medium mt-1">{advanceInputError}</p>
                    ) : (
                      <p className="text-[11px] text-slate-500 mt-1">
                        Deducts from available client advance or records receipt upon creation.
                      </p>
                    )}
                  </div>

                  {/* Financial Summary Breakdown */}
                  <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Invoice Grand Total:</span>
                      <span className="font-bold text-slate-900 font-mono">{formatINR(previewGrandTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-blue-700">
                      <span>Advance Amount:</span>
                      <span className="font-bold font-mono">
                        - {formatINR(Number(advanceAmount) || 0)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-emerald-700 font-bold text-sm">
                      <span>Remaining Balance Payable:</span>
                      <span className="font-mono">{formatINR(remainingPayable)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : editInvoice ? (
                    'Update Tax Invoice'
                  ) : relatedPFDoc ? (
                    'Create Invoice from PF'
                  ) : (
                    'Generate Tax Invoice'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;

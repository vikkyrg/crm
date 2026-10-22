import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getDownloadUrl } from '../../api/apiClient';
import { formatINR, formatDate, calculateClientLine } from '../../utils/formatters';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Download,
  FileText,
  ArrowRight,
  Eye,
  Trash2,
  CheckCircle,
  Receipt,
  Edit2,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

const PFDocuments = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [roundingPolicy, setRoundingPolicy] = useState('round_to_nearest');
  const [companyStateCode, setCompanyStateCode] = useState('09');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editPF, setEditPF] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Form State
  const [selectedClientId, setSelectedClientId] = useState('');
  const [documentDate, setDocumentDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState([
    { serviceId: '', description: '', unitPrice: 0, quantity: 1, discountPercent: 0, taxRate: 18, unit: 'Units' }
  ]);
  const [documentDiscount, setDocumentDiscount] = useState(0);
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const openCreatePFModal = () => {
    setEditPF(null);
    setSelectedClientId(clients[0]?._id || '');
    setDocumentDate(new Date().toISOString().split('T')[0]);
    setItems([
      { serviceId: '', description: '', unitPrice: 0, quantity: 1, discountPercent: 0, taxRate: 18, unit: 'Units' }
    ]);
    setDocumentDiscount(0);
    setAdvanceAmount(0);
    setNotes('');
    setTerms('');
    setShowCreateModal(true);
  };

  const openEditPFModal = (doc) => {
    setEditPF(doc);
    setSelectedClientId(doc.client?._id || doc.client);
    setDocumentDate(doc.documentDate ? new Date(doc.documentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setDocumentDiscount(doc.documentDiscount || 0);
    setAdvanceAmount(doc.advanceAmount || 0);
    setNotes(doc.notes || '');
    setTerms(doc.termsAndConditions || '');
    if (doc.items && doc.items.length > 0) {
      setItems(doc.items.map(it => ({
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
    setShowCreateModal(true);
  };

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  const fetchDocuments = async (targetPage = page, filters = {}) => {
    try {
      setLoading(true);
      const params = { page: targetPage, limit };
      const searchValue = filters.search !== undefined ? filters.search : search;
      const statusValue = filters.statusFilter !== undefined ? filters.statusFilter : statusFilter;
      if (searchValue) params.search = searchValue;
      if (statusValue) params.status = statusValue;

      const res = await api.get('/pf-documents', { params });
      setDocuments(res.data.data);
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
      const [cRes, sRes, settingsRes] = await Promise.all([
        api.get('/clients?limit=100'),
        api.get('/services?limit=100'),
        api.get('/settings')
      ]);
      setClients(cRes.data.data);
      setServices(sRes.data.data);
      setRoundingPolicy(settingsRes.data.data?.roundingPolicy || 'round_to_nearest');
      setCompanyStateCode(settingsRes.data.data?.stateCode || '09');
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchDocuments(1);
  }, [search, statusFilter]);

  useEffect(() => {
    fetchDependencies();
  }, []);

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
  const isInterState = Boolean(selectedClientObj?.stateCode && selectedClientObj?.stateCode !== companyStateCode);

  // Realtime totals
  const calculatedLines = items.map((it) => calculateClientLine(it, isInterState));
  const previewSubtotal = calculatedLines.reduce((acc, curr) => acc + (curr.unitPrice * curr.quantity), 0);
  const previewItemDiscounts = calculatedLines.reduce((acc, curr) => acc + curr.discountAmount, 0);
  const rawPreviewTaxable = calculatedLines.reduce((acc, curr) => acc + curr.taxableAmount, 0);
  const previewDocumentDiscount = Math.min(rawPreviewTaxable, Math.max(0, Number(documentDiscount) || 0));
  const previewTaxable = Math.max(0, rawPreviewTaxable - previewDocumentDiscount);
  const previewTax = calculatedLines.reduce((acc, curr) => acc + curr.totalTax, 0);
  const rawPreviewGrandTotal = Math.round((previewTaxable + previewTax + Number.EPSILON) * 100) / 100;
  const previewGrandTotal = roundingPolicy === 'none' ? rawPreviewGrandTotal : Math.round(rawPreviewGrandTotal);
  const previewCgst = calculatedLines.reduce((acc, curr) => acc + curr.cgstAmount, 0);
  const previewSgst = calculatedLines.reduce((acc, curr) => acc + curr.sgstAmount, 0);
  const previewIgst = calculatedLines.reduce((acc, curr) => acc + curr.igstAmount, 0);
  const parsedAdvanceAmount = Number(advanceAmount);
  const advanceInputError = advanceAmount === ''
    ? ''
    : !Number.isFinite(parsedAdvanceAmount) || parsedAdvanceAmount < 0
      ? 'Advance amount must be a valid non-negative amount'
      : Math.abs(parsedAdvanceAmount * 100 - Math.round(parsedAdvanceAmount * 100)) > 1e-7
        ? 'Enter a currency amount with up to two decimal places'
        : parsedAdvanceAmount > previewGrandTotal
          ? `Advance amount cannot exceed PF Grand Total (${formatINR(previewGrandTotal)})`
          : '';
  const numericAdvanceAmount = Math.max(0, Number(advanceAmount) || 0);
  const previewBalancePayable = Math.max(0, previewGrandTotal - numericAdvanceAmount);

  const [isSaving, setIsSaving] = useState(false);

  const handleAdvanceAmountChange = (value) => {
    setAdvanceAmount(value);
  };

  const handleSavePF = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    setError('');
    setIsSaving(true);

    try {
      if (!selectedClientId) {
        setError('Select a client before issuing the PF document');
        return;
      }
      if (!items.length || items.some((item) => (
        !item.description?.trim()
        || !Number.isFinite(Number(item.unitPrice))
        || Number(item.unitPrice) < 0
        || !Number.isFinite(Number(item.quantity))
        || Number(item.quantity) <= 0
      ))) {
        setError('Add at least one valid line item with a description, non-negative price, and positive quantity');
        return;
      }
      const finalAdvanceAmount = Number(advanceAmount);
      if (
        !Number.isFinite(finalAdvanceAmount)
        || finalAdvanceAmount < 0
        || Math.abs(finalAdvanceAmount * 100 - Math.round(finalAdvanceAmount * 100)) > 1e-7
      ) {
        setError('Advance amount must be a valid non-negative currency amount with up to two decimal places');
        return;
      }
      if (finalAdvanceAmount > previewGrandTotal) {
        setError(`Advance amount cannot exceed PF Grand Total (${formatINR(previewGrandTotal)})`);
        return;
      }

      if (editPF) {
        await api.put(`/pf-documents/${editPF._id}`, {
          documentDate,
          items,
          documentDiscount: Number(documentDiscount) || 0,
          advanceAmount: finalAdvanceAmount,
          notes,
          termsAndConditions: terms
        });
        setSuccess('PF Document updated successfully');
        setShowCreateModal(false);
        fetchDocuments();
        setTimeout(() => setSuccess(''), 4000);
      } else {
        await api.post('/pf-documents', {
          clientId: selectedClientId,
          documentDate,
          items,
          documentDiscount: Number(documentDiscount) || 0,
          advanceAmount: finalAdvanceAmount,
          notes,
          termsAndConditions: terms
        });
        setShowCreateModal(false);
        setSuccess('PF Document issued successfully');
        setSearch('');
        setStatusFilter('');
        setPage(1);
        fetchDocuments(1, { search: '', statusFilter: '' });
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving PF document');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConvertToInvoice = (pfDoc) => {
    navigate(`/invoices?fromPF=${pfDoc._id}`);
  };

  const handleDeletePF = async (doc) => {
    if (!window.confirm(`Are you sure you want to delete Proforma Document ${doc.pfNumber}? This action cannot be undone.`)) {
      return;
    }
    try {
      setError('');
      await api.delete(`/pf-documents/${doc._id}`);
      setSuccess(`PF Document ${doc.pfNumber} deleted successfully.`);
      fetchDocuments(page);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete PF document');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">PF Documents (Proforma / Proposals)</h1>
          <p className="text-sm text-slate-500">Manage estimates, quotations, and official proforma contracts before invoicing.</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={getDownloadUrl(`/api/reports/export/pf-documents${localStorage.getItem('innomatrics_token') ? `?token=${localStorage.getItem('innomatrics_token')}` : ''}`)}
            download
            className="inline-flex items-center gap-2 px-3 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-all"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </a>
          <button
            onClick={openCreatePFModal}
            data-testid="create-pf-btn"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create PF Document
          </button>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm font-medium">
          {success}
        </div>
      )}

      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{selectedDoc.pfNumber}</h2>
                <p className="text-sm text-slate-500">{selectedDoc.clientSnapshot?.companyName || 'Client'} · {formatDate(selectedDoc.documentDate)}</p>
              </div>
              <button onClick={() => setSelectedDoc(null)} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Close</button>
            </div>
            <div className="mb-4 space-y-2">
              {(selectedDoc.items || []).map((item, index) => (
                <div key={`${selectedDoc._id}-${index}`} className="flex justify-between gap-4 border-b border-slate-100 py-2 text-sm">
                  <span>{item.description} · {item.quantity} × {formatINR(item.unitPrice)}</span>
                  <span className="font-semibold">{formatINR(item.lineTotal)}</span>
                </div>
              ))}
            </div>
            <div className="ml-auto max-w-sm space-y-2 rounded-lg bg-slate-50 p-4 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(selectedDoc.subtotal)}</span></div>
              <div className="flex justify-between"><span>Document Discount</span><span>- {formatINR(selectedDoc.documentDiscount || 0)}</span></div>
              <div className="flex justify-between"><span>Taxable Value</span><span>{formatINR(selectedDoc.totalTaxableAmount)}</span></div>
              <div className="flex justify-between"><span>GST Total</span><span>{formatINR(selectedDoc.totalTax)}</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold"><span>Grand Total</span><span>{formatINR(selectedDoc.grandTotal)}</span></div>
              <div className="flex justify-between text-blue-700"><span>Advance Received (as entered)</span><span>{formatINR(selectedDoc.advanceAmount || 0)}</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-emerald-700"><span>Balance Payable</span><span>{formatINR(selectedDoc.balancePayable ?? Math.max(0, selectedDoc.grandTotal - (selectedDoc.advanceAmount || 0)))}</span></div>
            </div>
            <p className="mt-3 text-right text-xs text-slate-500">Advance is an entered amount; receipt via cash or bank has not been verified here.</p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by PF Number or client name..."
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
            <option value="Draft">Draft</option>
            <option value="Issued">Issued</option>
            <option value="Accepted">Accepted</option>
            <option value="Converted to Invoice">Converted to Invoice</option>
          </select>
        </div>
      </div>

      {/* Document List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm divide-y divide-slate-200">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th scope="col" className="py-3 px-4 w-[150px] whitespace-nowrap">PF Number</th>
                <th scope="col" className="py-3 px-4 w-[130px] whitespace-nowrap">Date</th>
                <th scope="col" className="py-3 px-4 min-w-[200px]">Client</th>
                <th scope="col" className="py-3 px-4 w-[110px] whitespace-nowrap">Items</th>
                <th scope="col" className="py-3 px-4 w-[140px] whitespace-nowrap">Grand Total</th>
                <th scope="col" className="py-3 px-4 w-[160px] whitespace-nowrap">Status</th>
                <th scope="col" className="py-3 px-4 w-[230px] text-right whitespace-nowrap">Downloads & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading PF documents...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    No PF documents found. Click "Create PF Document" to issue a proposal.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600 whitespace-nowrap align-middle">
                      {doc.pfNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap align-middle">
                      {formatDate(doc.documentDate)}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900 align-middle">
                      {doc.clientSnapshot?.companyName || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap align-middle">
                      {doc.items?.length || 0} line(s)
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap align-middle">
                      {formatINR(doc.grandTotal)}
                    </td>
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        doc.status === 'Converted to Invoice'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : doc.status === 'Accepted'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right align-middle whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedDoc(doc)}
                          title="View PF Document"
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {/* Edit Action */}
                        <button
                          onClick={() => openEditPFModal(doc)}
                          title="Edit PF Document"
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {/* Download PDF */}
                        <a
                          href={getDownloadUrl(`/api/pf-documents/${doc._id}/pdf${localStorage.getItem('innomatrics_token') ? `?token=${localStorage.getItem('innomatrics_token')}` : ''}`)}
                          download
                          title="Download PDF Document"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg shadow-sm transition-all"
                        >
                          <FileText className="w-3.5 h-3.5 text-red-600" />
                          <span>PDF</span>
                        </a>
                        {!doc.convertedToInvoiceId ? (
                          <>
                            <button
                              onClick={() => handleConvertToInvoice(doc)}
                              title="Create Official Invoice from this PF"
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-700 transition-colors ml-1"
                            >
                              <Receipt className="w-3.5 h-3.5" /> Create Invoice
                            </button>
                            <button
                              onClick={() => handleDeletePF(doc)}
                              title="Delete PF Document"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => navigate('/invoices', { state: { search: doc.convertedToInvoiceNumber } })}
                            title={`View linked Tax Invoice ${doc.convertedToInvoiceNumber}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded text-xs font-mono font-semibold transition-colors"
                          >
                            <Receipt className="w-3 h-3 text-purple-600" />
                            <span>{doc.convertedToInvoiceNumber}</span>
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
            Showing <span className="font-semibold text-slate-700">{documents.length}</span> of <span className="font-semibold text-slate-700">{totalCount}</span> documents (Page {page} of {totalPages})
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (page > 1) {
                  const newPage = page - 1;
                  setPage(newPage);
                  fetchDocuments(newPage);
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
                  fetchDocuments(newPage);
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

      {/* Create PF Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>{editPF ? `Edit PF Document (${editPF.pfNumber})` : 'Create Proforma (PF) Document'}</span>
              <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-50 text-blue-700">
                {isInterState ? 'Inter-State (IGST 18%)' : 'Intra-State (CGST 9% + SGST 9%)'}
              </span>
            </h2>

            {editPF && editPF.convertedToInvoiceId && (
              <div className="p-3 mb-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  <strong>Document Safeguard:</strong> This PF Document was converted to Tax Invoice <strong>{editPF.convertedToInvoiceNumber}</strong>. You may update remarks, validity, and notes; line items are locked to maintain agreement with the linked invoice.
                </span>
              </div>
            )}

            {error && (
              <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSavePF} className="space-y-6">
              {/* Header Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Select Client *</label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    disabled={!!editPF}
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
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Document Date *</label>
                  <input
                    type="date"
                    required
                    value={documentDate}
                    onChange={(e) => setDocumentDate(e.target.value)}
                    disabled={editPF?.status === 'Converted to Invoice'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none"
                  />
                </div>
              </div>

              {/* Service Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Service Line Items</h3>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    disabled={editPF?.status === 'Converted to Invoice'}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Service Line
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div key={idx} className="p-3 border border-slate-200 rounded-xl bg-white grid grid-cols-12 gap-2 items-center text-xs">
                      {/* Catalog Select */}
                      <div className="col-span-12 sm:col-span-4">
                        <label className="text-[10px] text-slate-500 font-semibold uppercase">Catalog Item</label>
                        <select
                          value={item.serviceId}
                          onChange={(e) => handleItemChange(idx, 'serviceId', e.target.value)}
                          disabled={editPF?.status === 'Converted to Invoice'}
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

                      {/* Description */}
                      <div className="col-span-12 sm:col-span-3">
                        <label className="text-[10px] text-slate-500 font-semibold uppercase">Description</label>
                        <input
                          type="text"
                          required
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          disabled={editPF?.status === 'Converted to Invoice'}
                          className="w-full p-2 border border-slate-300 rounded text-xs outline-none"
                          placeholder="Scope description"
                        />
                      </div>

                      {/* Unit Price */}
                      <div className="col-span-4 sm:col-span-3">
                        <label className="text-[10px] text-slate-500 font-semibold uppercase">Price (₹)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                          disabled={editPF?.status === 'Converted to Invoice'}
                          className="w-full p-2 border border-slate-300 rounded text-xs outline-none"
                        />
                      </div>

                      {/* Quantity */}
                      <div className="col-span-4 sm:col-span-1">
                        <label className="text-[10px] text-slate-500 font-semibold uppercase">Qty</label>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          required
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          disabled={editPF?.status === 'Converted to Invoice'}
                          className="w-full p-2 border border-slate-300 rounded text-xs outline-none"
                        />
                      </div>

                      {/* Delete Action */}
                      <div className="col-span-4 sm:col-span-1 flex justify-end pt-3">
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          disabled={editPF?.status === 'Converted to Invoice'}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Realtime Summary Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700 uppercase">Document Discount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={documentDiscount}
                      onChange={(e) => setDocumentDiscount(e.target.value)}
                      disabled={editPF?.status === 'Converted to Invoice'}
                      className="w-48 px-3 py-1.5 border border-slate-300 rounded text-sm bg-white"
                    />
                    <p className="text-[11px] text-slate-500">Discount applied before final GST assessment</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Advance Amount (₹)</label>
                    <div className="relative max-w-sm">
                      <span className="absolute left-3 top-2 text-slate-400 font-semibold text-sm">₹</span>
                      <input
                        type="number"
                        min="0"
                        max={previewGrandTotal}
                        step="0.01"
                        value={advanceAmount}
                        onChange={(e) => handleAdvanceAmountChange(e.target.value)}
                        disabled={editPF?.status === 'Converted to Invoice'}
                        className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-600 bg-white disabled:bg-slate-100"
                      />
                    </div>
                    {advanceInputError ? (
                      <p className="mt-1 text-[11px] font-medium text-red-600">{advanceInputError}</p>
                    ) : (
                      <p className="mt-1 text-[11px] text-slate-500">Amount entered for this PF; this does not verify a cash or bank receipt.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-slate-900">{formatINR(previewSubtotal)}</span>
                  </div>
                  {previewItemDiscounts > 0 && (
                    <div className="flex justify-between">
                      <span>Item Discount:</span>
                      <span className="font-semibold text-slate-900">- {formatINR(previewItemDiscounts)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Document Discount:</span>
                    <span className="font-semibold text-slate-900">- {formatINR(previewDocumentDiscount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxable Value:</span>
                    <span className="font-semibold text-slate-900">{formatINR(previewTaxable)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{isInterState ? 'IGST:' : 'CGST:'}</span>
                    <span className="font-semibold text-slate-900">{formatINR(isInterState ? previewIgst : previewCgst)}</span>
                  </div>
                  {!isInterState && (
                    <div className="flex justify-between">
                      <span>SGST:</span>
                      <span className="font-semibold text-slate-900">{formatINR(previewSgst)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>GST Total:</span>
                    <span className="font-semibold text-slate-900">{formatINR(previewTax)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-blue-700">
                    <span>Grand Total:</span>
                    <span>{formatINR(previewGrandTotal)}</span>
                  </div>
                  <div className="flex justify-between text-blue-700">
                    <span>Advance Received (as entered):</span>
                    <span className="font-semibold">{formatINR(numericAdvanceAmount)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-emerald-700">
                    <span>Balance Payable:</span>
                    <span>{formatINR(previewBalancePayable)}</span>
                  </div>
                </div>
              </div>

              {/* Notes & Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Notes / Remarks</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Special instructions, milestones, or proposal remarks..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Terms & Conditions</label>
                  <textarea
                    rows={2}
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    placeholder="Commercial and delivery terms..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Action Buttons */}
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
                  disabled={isSaving}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSaving ? 'Processing...' : (editPF ? 'Update PF Document' : 'Issue PF Document')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PFDocuments;

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/apiClient';
import { formatINR, formatDate } from '../../utils/formatters';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  FileSpreadsheet,
  Receipt,
  WalletCards,
  Layers,
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertTriangle,
  Trash2,
  UserCheck,
  FileText
} from 'lucide-react';

const ClientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('invoices');

  // Deletion modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletionSummary, setDeletionSummary] = useState(null);
  const [deleteSummaryLoading, setDeleteSummaryLoading] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [confirmAcknowledged, setConfirmAcknowledged] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchClientProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/clients/${id}`);
      setClientData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-slate-500 font-medium text-sm">Loading client account statement and records...</p>
      </div>
    );
  }

  if (!clientData || !clientData.data) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <p className="text-slate-700 font-semibold">Client not found.</p>
        <Link to="/clients" className="mt-4 inline-block text-blue-600 text-sm">
          Return to Client List
        </Link>
      </div>
    );
  }

  const { data: client, summary, pfDocuments, invoices, advancePayments, quantityRecords } = clientData;

  const openDeleteModal = async () => {
    setShowDeleteModal(true);
    setDeletionSummary(null);
    setConfirmInput('');
    setConfirmAcknowledged(false);
    setDeleteSummaryLoading(true);
    try {
      const res = await api.get(`/clients/${id}/deletion-summary`);
      setDeletionSummary(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to retrieve client dependency summary');
      setShowDeleteModal(false);
    } finally {
      setDeleteSummaryLoading(false);
    }
  };

  const handleExecutePermanentDelete = async () => {
    try {
      setIsDeleting(true);
      await api.delete(`/clients/${id}/permanent`);
      navigate('/clients');
    } catch (err) {
      alert(err.response?.data?.message || 'Permanent deletion failed');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <Link to="/clients" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600">
          <ArrowLeft className="w-4 h-4" /> Back to Clients
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={openDeleteModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Permanently Delete Client
          </button>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${client.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
            {client.isActive ? 'Active Account' : 'Archived'}
          </span>
        </div>
      </div>

      {/* Client Overview Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{client.companyName}</h1>
                <span className="font-mono text-xs font-semibold text-blue-600">{client.clientId}</span>
              </div>
            </div>
            <p className="text-sm text-slate-600 flex items-center gap-2">
              <span className="font-medium text-slate-900">Contact:</span> {client.contactPerson}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400" />
              <span>{client.primaryPhone} {client.alternatePhone ? `/ ${client.alternatePhone}` : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{client.email}</span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="font-semibold text-slate-700">GSTIN:</span>
              <span>{client.gstin || 'Unregistered'}</span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="font-semibold text-slate-700">PAN:</span>
              <span>{client.pan || 'N/A'}</span>
            </div>
            <div className="col-span-2 flex items-start gap-2 pt-1 border-t border-slate-200/60">
              <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <span>{client.billingAddress}, {client.city}, {client.state} - {client.pincode}</span>
            </div>
          </div>
        </div>

        {/* Financial Balance Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Invoiced</div>
            <div className="text-lg font-bold text-slate-900">{formatINR(summary.totalInvoiced)}</div>
          </div>
          <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-100">
            <div className="text-[11px] font-semibold text-emerald-700 uppercase">Collected against Invoices</div>
            <div className="text-lg font-bold text-emerald-700">{formatINR(summary.totalInvoicePaid)}</div>
          </div>
          <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-100">
            <div className="text-[11px] font-semibold text-amber-700 uppercase">Outstanding Receivables</div>
            <div className="text-lg font-bold text-amber-700">{formatINR(summary.totalOutstanding)}</div>
          </div>
          <div className="bg-purple-50 p-3.5 rounded-xl border border-purple-100">
            <div className="text-[11px] font-semibold text-purple-700 uppercase">Unallocated Advance</div>
            <div className="text-lg font-bold text-purple-700">{formatINR(summary.totalAdvanceUnallocated)}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'invoices'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Invoices ({invoices.length})
          </button>

          <button
            onClick={() => setActiveTab('pfDocuments')}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'pfDocuments'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            PF Documents ({pfDocuments.length})
          </button>

          <button
            onClick={() => setActiveTab('advances')}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'advances'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <WalletCards className="w-4 h-4" />
            Advance Payments ({advancePayments.length})
          </button>

          <button
            onClick={() => setActiveTab('quantities')}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'quantities'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            Quantity Records ({quantityRecords.length})
          </button>
        </nav>
      </div>

      {/* Tab Panels */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {activeTab === 'invoices' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase">
                <tr>
                  <th className="py-3 px-4">Invoice No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Grand Total</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4">Outstanding</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">No invoices recorded for this client.</td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-semibold text-blue-600">{inv.invoiceNumber}</td>
                      <td className="py-3 px-4 text-slate-600">{formatDate(inv.invoiceDate)}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{formatINR(inv.grandTotal)}</td>
                      <td className="py-3 px-4 text-emerald-600">{formatINR(inv.amountPaid)}</td>
                      <td className="py-3 px-4 font-semibold text-amber-600">{formatINR(inv.outstandingBalance)}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <a
                          href={`/api/invoices/${inv._id}/pdf`}
                          download
                          title="Download Invoice PDF"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg shadow-sm transition-all"
                        >
                          <FileText className="w-3.5 h-3.5 text-red-600" />
                          <span>PDF</span>
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'pfDocuments' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase">
                <tr>
                  <th className="py-3 px-4">PF Number</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Grand Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Converted Invoice</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pfDocuments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">No PF documents recorded for this client.</td>
                  </tr>
                ) : (
                  pfDocuments.map((pf) => (
                    <tr key={pf._id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-semibold text-blue-600">{pf.pfNumber}</td>
                      <td className="py-3 px-4 text-slate-600">{formatDate(pf.documentDate)}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{formatINR(pf.grandTotal)}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                          {pf.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{pf.convertedToInvoiceNumber || '-'}</td>
                      <td className="py-3 px-4 text-right">
                        <a
                          href={`/api/pf-documents/${pf._id}/pdf`}
                          download
                          title="Download PF PDF"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg shadow-sm transition-all"
                        >
                          <FileText className="w-3.5 h-3.5 text-red-600" />
                          <span>PDF</span>
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'advances' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase">
                <tr>
                  <th className="py-3 px-4">Receipt No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Amount Received</th>
                  <th className="py-3 px-4">Allocated</th>
                  <th className="py-3 px-4">Unallocated Remaining</th>
                  <th className="py-3 px-4">Method / Ref</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {advancePayments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">No advance payments recorded for this client.</td>
                  </tr>
                ) : (
                  advancePayments.map((adv) => (
                    <tr key={adv._id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-semibold text-purple-600">{adv.receiptNumber}</td>
                      <td className="py-3 px-4 text-slate-600">{formatDate(adv.paymentDate)}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{formatINR(adv.amount)}</td>
                      <td className="py-3 px-4 text-emerald-600">{formatINR(adv.allocatedAmount)}</td>
                      <td className="py-3 px-4 font-bold text-purple-700">{formatINR(adv.unallocatedAmount)}</td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>{adv.paymentMethod}</div>
                        <div className="text-xs font-mono text-slate-400">{adv.transactionReference || '-'}</div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <a
                          href={`/api/advances/${adv._id}/pdf`}
                          download
                          title="Download Receipt PDF"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg shadow-sm transition-all"
                        >
                          <FileText className="w-3.5 h-3.5 text-red-600" />
                          <span>PDF</span>
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'quantities' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase">
                <tr>
                  <th className="py-3 px-4">Record ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Logged Volume</th>
                  <th className="py-3 px-4">Unit Price</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quantityRecords.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">No quantity logs recorded for this client.</td>
                  </tr>
                ) : (
                  quantityRecords.map((qty) => (
                    <tr key={qty._id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-semibold text-blue-600">{qty.recordId}</td>
                      <td className="py-3 px-4 text-slate-600">{formatDate(qty.date)}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{qty.serviceName}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{qty.quantity} {qty.unit}</td>
                      <td className="py-3 px-4 text-slate-600">{formatINR(qty.unitPriceSnapshot)}</td>
                      <td className="py-3 px-4 text-xs text-slate-500">{qty.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Dedicated Permanent Deletion Confirmation Dialog */}
      {showDeleteModal && (
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
              <div className="text-sm font-bold text-slate-900 mt-0.5">{client.companyName}</div>
              <div className="text-xs font-mono text-blue-600 font-semibold">{client.clientId}</div>
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
                  Type <span className="font-mono text-red-600 font-bold select-all">{client.clientId}</span> or <span className="font-semibold text-red-600 select-all">{client.companyName}</span> to confirm:
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
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  isDeleting ||
                  !confirmAcknowledged ||
                  (confirmInput.trim().toLowerCase() !== client.clientId.toLowerCase() &&
                   confirmInput.trim().toLowerCase() !== client.companyName.toLowerCase())
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

export default ClientProfile;

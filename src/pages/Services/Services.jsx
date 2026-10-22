import React, { useState, useEffect } from 'react';
import api, { getDownloadUrl } from '../../api/apiClient';
import { formatINR } from '../../utils/formatters';
import {
  Server,
  Plus,
  Search,
  Download,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Filter
} from 'lucide-react';

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editService, setEditService] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'General',
    unit: 'Units',
    defaultUnitPrice: '',
    taxRate: 18,
    sacCode: '998313'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchServices = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;

      const res = await api.get('/services', { params });
      setServices(res.data.data);
      if (res.data.categories) setCategories(res.data.categories);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [search, categoryFilter]);

  const openAddModal = () => {
    setEditService(null);
    setFormData({
      name: '',
      description: '',
      category: 'Software Engineering',
      unit: 'Units',
      defaultUnitPrice: '',
      taxRate: 18,
      sacCode: '998313'
    });
    setShowModal(true);
    setError('');
  };

  const openEditModal = (service) => {
    setEditService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      category: service.category || 'General',
      unit: service.unit || 'Units',
      defaultUnitPrice: service.defaultUnitPrice,
      taxRate: service.taxRate,
      sacCode: service.sacCode || '998313'
    });
    setShowModal(true);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editService) {
        await api.put(`/services/${editService._id}`, formData);
        setSuccess('Service updated successfully');
      } else {
        await api.post('/services', formData);
        setSuccess('Service created successfully');
      }
      setShowModal(false);
      fetchServices();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving service');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await api.patch(`/services/${id}/toggle-status`);
      fetchServices();
    } catch (err) {
      alert('Error updating service status');
    }
  };

  const handleDeleteService = async (service) => {
    if (!window.confirm(`Are you sure you want to delete service "${service.name}" (${service.serviceId})? This action cannot be undone.`)) {
      return;
    }
    try {
      setError('');
      await api.delete(`/services/${service._id}`);
      setSuccess(`Service "${service.name}" deleted successfully.`);
      fetchServices();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete service');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Service Catalog</h1>
          <p className="text-sm text-slate-500">Manage billing rates, SAC codes, GST rates, and standard service definitions.</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={getDownloadUrl('/api/reports/export/services')}
            download
            className="inline-flex items-center gap-2 px-3 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-all"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </a>
          <button
            onClick={openAddModal}
            data-testid="add-service-btn"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Service
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
            placeholder="Search by Service Name, Category or Service ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm divide-y divide-slate-200">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th scope="col" className="py-3 px-4 w-[160px] whitespace-nowrap">Service ID</th>
                <th scope="col" className="py-3 px-4 min-w-[220px]">Name & Scope</th>
                <th scope="col" className="py-3 px-4 w-[140px] whitespace-nowrap">Category</th>
                <th scope="col" className="py-3 px-4 w-[160px] whitespace-nowrap">Default Unit Price</th>
                <th scope="col" className="py-3 px-4 w-[130px] whitespace-nowrap">Tax / SAC</th>
                <th scope="col" className="py-3 px-4 w-[110px] whitespace-nowrap">Status</th>
                <th scope="col" className="py-3 px-4 w-[110px] text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading services catalog...
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    No services found.
                  </td>
                </tr>
              ) : (
                services.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600 whitespace-nowrap align-middle">{s.serviceId}</td>
                    <td className="py-3.5 px-4 align-middle">
                      <div className="font-semibold text-slate-900">{s.name}</div>
                      <div className="text-xs text-slate-500 line-clamp-1">{s.description || '-'}</div>
                    </td>
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        {s.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap align-middle">
                      {formatINR(s.defaultUnitPrice)} <span className="text-xs font-normal text-slate-400">/ {s.unit}</span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 font-mono align-middle whitespace-nowrap">
                      <div>GST: {s.taxRate}%</div>
                      <div className="text-slate-400">SAC: {s.sacCode}</div>
                    </td>
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(s._id)}
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          s.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {s.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right align-middle whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(s)}
                          title="Edit Service"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteService(s)}
                          title="Delete Service"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              {editService ? 'Edit Catalog Service' : 'Add New Service to Catalog'}
            </h2>

            {error && (
              <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Service Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
                  placeholder="e.g. AWS Cloud Security Assessment"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
                  placeholder="e.g. Cloud Services / AI / Consulting"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Default Unit Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.defaultUnitPrice}
                    onChange={(e) => setFormData({ ...formData, defaultUnitPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none font-semibold"
                    placeholder="50000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
                    placeholder="Hours / Sprint / Project"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">GST Tax Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
                    placeholder="18"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">SAC Code</label>
                  <input
                    type="text"
                    value={formData.sacCode}
                    onChange={(e) => setFormData({ ...formData, sacCode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none font-mono"
                    placeholder="998313"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Scope Description</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
                  placeholder="Detailed deliverables, technical stack and prerequisites..."
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
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm"
                >
                  {editService ? 'Save Service' : 'Add to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;

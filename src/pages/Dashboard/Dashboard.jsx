import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/apiClient';
import { formatINR, formatDate } from '../../utils/formatters';
import {
  Users,
  FileSpreadsheet,
  Receipt,
  WalletCards,
  Clock,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Server,
  Briefcase,
  FileText,
  ShieldCheck,
  Truck,
  Package
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard');
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError('Unable to connect to dashboard metrics service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium text-sm">Aggregating live ERP business metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-xl border border-red-200 text-center">
        <p className="text-red-700 font-medium">{error}</p>
        <button
          onClick={fetchMetrics}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const {
    kpis,
    monthlyTrends,
    invoicesByStatus,
    recentInvoices,
    recentPFs,
    recentAdvances,
    totalEmployees,
    activeEmployees,
    materialInvoiceStats,
    challanStats,
    pfRemittanceStats,
    latestPayroll
  } = data;

  const STATUS_COLORS = {
    Issued: '#3b82f6',
    'Partially Paid': '#f59e0b',
    Paid: '#10b981',
    Overdue: '#ef4444',
    Draft: '#94a3b8'
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive ERP Dashboard</h1>
          <p className="text-sm text-slate-500">
            Real-time financial status, GST billing, payroll disbursements, delivery challans, and EPFO compliance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/payroll"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 shadow-sm transition-all"
          >
            <FileText className="w-4 h-4" />
            Payroll Register
          </Link>
          <Link
            to="/delivery-challans"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-all"
          >
            <Truck className="w-4 h-4" />
            + New Challan
          </Link>
          <Link
            to="/invoices"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all"
          >
            <Receipt className="w-4 h-4" />
            + New Invoice
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid - Financial Core */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Invoiced */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Invoiced</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{formatINR(kpis.totalInvoiced)}</div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{kpis.invoiceCount}</span> total tax invoices generated
          </div>
        </div>

        {/* Payments Collected */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Payments Collected</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600">{formatINR(kpis.totalPaymentsCollected)}</div>
          <div className="mt-2 text-xs text-slate-500">
            Across direct payments & advance allocations
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Outstanding Receivables</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600">{formatINR(kpis.outstandingBalance)}</div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Overdue: {formatINR(kpis.overdueAmount)} ({kpis.overdueCount})</span>
          </div>
        </div>

        {/* Unallocated Advances */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Unallocated Advances</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <WalletCards className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-600">{formatINR(kpis.totalUnallocatedAdvances)}</div>
          <div className="mt-2 text-xs text-slate-500">
            Total Received: {formatINR(kpis.totalAdvanceReceived)}
          </div>
        </div>
      </div>

      {/* ERP Operational KPI Grid (Employees, Payroll, Delivery Challans, Material Invoices) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Employees */}
        <Link to="/employees" className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:border-blue-400 transition-colors shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Workforce & Staff</div>
              <div className="text-xl font-bold text-slate-900">
                {activeEmployees || 0} <span className="text-xs font-normal text-slate-400">/ {totalEmployees || 0}</span>
              </div>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-blue-600">Directory &rarr;</span>
        </Link>

        {/* Latest Payroll */}
        <Link to="/payroll" className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:border-emerald-400 transition-colors shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">
                {latestPayroll ? `Payroll (${latestPayroll.month})` : 'Payroll Runs'}
              </div>
              <div className="text-xl font-bold text-emerald-600">
                {latestPayroll ? formatINR(latestPayroll.totalNetPayable) : '₹0'}
              </div>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-emerald-600">Disburse &rarr;</span>
        </Link>

        {/* Delivery Challans */}
        <Link to="/delivery-challans" className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:border-amber-400 transition-colors shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Delivery Challans</div>
              <div className="text-xl font-bold text-slate-900">
                {challanStats?.totalIssued || 0} <span className="text-xs font-normal text-slate-400">issued</span>
              </div>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-amber-600">Logistics &rarr;</span>
        </Link>

        {/* EPFO Statutory PF */}
        <Link to="/employee-pf" className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:border-violet-400 transition-colors shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-violet-50 text-violet-600 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">EPFO Remittances</div>
              <div className="text-xl font-bold text-slate-900">
                {pfRemittanceStats?.pendingCount || 0} <span className="text-xs font-normal text-slate-400">pending</span>
              </div>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-violet-600">Remit &rarr;</span>
        </Link>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Revenue & Billing Trajectory</h2>
              <p className="text-xs text-slate-500">6-Month historical comparison of Invoices vs Collections vs Advances</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => [formatINR(value), '']} />
                <Legend />
                <Bar dataKey="invoiced" name="Invoiced" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="collected" name="Collected" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="advance" name="Advance" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Invoice Status Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Invoices by Status</h2>
            <p className="text-xs text-slate-500 mb-4">Volume breakdown across current lifecycle stages</p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={invoicesByStatus}
                    dataKey="count"
                    nameKey="_id"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {invoicesByStatus.map((entry) => (
                      <Cell key={entry._id} fill={STATUS_COLORS[entry._id] || '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} Invoices`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            {invoicesByStatus.map((item) => (
              <div key={item._id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[item._id] || '#64748b' }}></span>
                  <span className="font-medium text-slate-700">{item._id}</span>
                </div>
                <div className="font-semibold text-slate-900">{item.count} ({formatINR(item.amount)})</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Records Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Recent Invoices (Service & Material)</h3>
            <Link to="/invoices" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentInvoices.map((inv) => (
              <div key={inv._id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm">{inv.invoiceNumber}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      inv.invoiceType === 'Material' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {inv.invoiceType || 'Service'}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700">
                      {inv.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{inv.clientSnapshot?.companyName} • {formatDate(inv.invoiceDate)}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900 text-sm">{formatINR(inv.grandTotal)}</div>
                  <div className="text-xs text-slate-500">Bal: {formatINR(inv.outstandingBalance)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Advance Payments */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Recent Advance Payments</h3>
            <Link to="/advances" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentAdvances.map((adv) => (
              <div key={adv._id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm">{adv.receiptNumber}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-50 text-purple-700">
                      {adv.paymentMethod}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{adv.clientSnapshot?.companyName} • {formatDate(adv.paymentDate)}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-purple-700 text-sm">{formatINR(adv.amount)}</div>
                  <div className="text-xs text-slate-500">Unallocated: {formatINR(adv.unallocatedAmount)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

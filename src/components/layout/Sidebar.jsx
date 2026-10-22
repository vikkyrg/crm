import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  Receipt,
  Layers,
  Server,
  BarChart3,
  Settings,
  ChevronRight,
  Briefcase,
  FileText,
  ShieldCheck,
  Truck,
  X
} from 'lucide-react';
import logo from '../../Logo.png';

const coreNavItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Clients', path: '/clients', icon: Users },
  { name: 'PF Documents', path: '/pf-documents', icon: FileSpreadsheet },
  { name: 'Invoices', path: '/invoices', icon: Receipt },
  { name: 'Material Invoice', path: '/material-invoices', icon: Receipt },
  { name: 'Quantity Management', path: '/quantities', icon: Layers },
  { name: 'Services', path: '/services', icon: Server }
];

const erpNavItems = [
  { name: 'Employees', path: '/employees', icon: Briefcase },
  { name: 'Salary & Payroll', path: '/payroll', icon: FileText },
  { name: 'Employee PF (EPFO)', path: '/employee-pf', icon: ShieldCheck },
  { name: 'Delivery Challans', path: '/delivery-challans', icon: Truck }
];

const adminNavItems = [
  { name: 'Reports', path: '/reports', icon: BarChart3 },
  { name: 'Settings', path: '/settings', icon: Settings }
];

const Sidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800 select-none transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950/60">
          <img src={logo} alt="Navadurga Electricals" className="h-auto max-h-12 w-[170px] object-contain" />
          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 py-3 px-3 space-y-4 overflow-y-auto">
          {/* Core CRM & Billing */}
          <div>
            <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Billing & Sales
            </div>
            <div className="space-y-1">
              {coreNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    end={item.path === '/'}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{item.name}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-slate-400" />
                  </NavLink>
                );
              })}
            </div>
          </div>

          {/* ERP Operations & HR */}
          <div>
            <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-blue-400">
              HR & Supply Chain
            </div>
            <div className="space-y-1">
              {erpNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{item.name}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-slate-400" />
                  </NavLink>
                );
              })}
            </div>
          </div>

          {/* Administration */}
          <div>
            <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Analytics & Config
            </div>
            <div className="space-y-1">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{item.name}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-slate-400" />
                  </NavLink>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Footer System Info */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-950/30 text-[11px] text-slate-400">
          <div className="flex items-center justify-between">
            <span>Navadurga ERP</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Online
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

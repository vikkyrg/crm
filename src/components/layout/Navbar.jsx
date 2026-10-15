import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, UserCircle, Bell, Search } from 'lucide-react';

const Navbar = ({ title, breadcrumb }) => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between z-10">
      {/* Title & Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span>Innomatrics CRM</span>
          <span>/</span>
          <span className="text-slate-800">{breadcrumb || title}</span>
        </div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-4">
        {/* User Pill */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-sm font-semibold text-slate-900 leading-tight">{user?.name}</div>
            <div className="text-xs text-slate-500 font-medium capitalize">{user?.role}</div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          title="Sign Out"
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;

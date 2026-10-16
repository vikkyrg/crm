import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Menu } from 'lucide-react';

const Navbar = ({ title, breadcrumb, onToggleSidebar }) => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between z-10">
      {/* Left: Mobile Toggle & Title / Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <span className="hidden sm:inline">Innomatrics CRM</span>
            <span className="hidden sm:inline">/</span>
            <span className="text-slate-800 font-semibold">{breadcrumb || title}</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-none mt-0.5">
            {title}
          </h2>
        </div>
      </div>

      {/* Right: User Profile & Actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* User Pill */}
        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-slate-200">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs sm:text-sm">
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
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;

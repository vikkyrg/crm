import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';

// Loading Fallback Component
const RouteLoadingFallback = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-slate-500">
    <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
    <span className="text-xs font-semibold tracking-wide uppercase">Loading Page View...</span>
  </div>
);

// Lazy Loaded Pages
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const Clients = lazy(() => import('./pages/Clients/Clients'));
const ClientProfile = lazy(() => import('./pages/Clients/ClientProfile'));
const PFDocuments = lazy(() => import('./pages/PFDocuments/PFDocuments'));
const Invoices = lazy(() => import('./pages/Invoices/Invoices'));
const Quantities = lazy(() => import('./pages/Quantities/Quantities'));
const AdvancePayments = lazy(() => import('./pages/Advances/AdvancePayments'));
const Services = lazy(() => import('./pages/Services/Services'));
const Reports = lazy(() => import('./pages/Reports/Reports'));
const Settings = lazy(() => import('./pages/Settings/Settings'));

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />

          {/* Protected Application Routes */}
          <Route element={<AppLayout title="Executive Overview" breadcrumb="Dashboard" />}>
            <Route path="/" element={<Dashboard />} />
          </Route>

          <Route element={<AppLayout title="Client Directory" breadcrumb="Clients" />}>
            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/:id" element={<ClientProfile />} />
          </Route>

          <Route element={<AppLayout title="PF Documents & Quotes" breadcrumb="PF Documents" />}>
            <Route path="/pf-documents" element={<PFDocuments />} />
          </Route>

          <Route element={<AppLayout title="Tax Invoices & Billing" breadcrumb="Invoices" />}>
            <Route path="/invoices" element={<Invoices />} />
          </Route>

          <Route element={<AppLayout title="Quantity Deliverables Register" breadcrumb="Quantities" />}>
            <Route path="/quantities" element={<Quantities />} />
          </Route>

          <Route element={<AppLayout title="Advance Payments & Retainers" breadcrumb="Advance Payments" />}>
            <Route path="/advances" element={<AdvancePayments />} />
          </Route>

          <Route element={<AppLayout title="Service Catalog & Rates" breadcrumb="Services" />}>
            <Route path="/services" element={<Services />} />
          </Route>

          <Route element={<AppLayout title="Reports & Data Export" breadcrumb="Reports" />}>
            <Route path="/reports" element={<Reports />} />
          </Route>

          <Route element={<AppLayout title="System & Company Settings" breadcrumb="Settings" />}>
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

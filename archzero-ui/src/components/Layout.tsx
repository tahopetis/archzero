/**
 * Page Layout with Navigation
 */

import { type ReactNode } from 'react';
import { Navigation } from '@/components/Navigation';
import { useAuthStore } from '@/stores/useAuthStore';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />

      {/* User info bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-end items-center gap-4">
          <span className="text-sm text-slate-700">
            {user?.fullName || user?.email}
          </span>
          <button
            onClick={logout}
            className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {children}
    </div>
  );
}

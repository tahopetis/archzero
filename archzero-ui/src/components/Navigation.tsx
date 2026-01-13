/**
 * Main Navigation Component
 */

import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, LayoutDashboard, Layers, Brain, Scale, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Navigation() {
  const [isGovernanceOpen, setIsGovernanceOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const NavItems = () => (
    <>
      <Link
        to="/dashboard"
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          isActive('/dashboard')
            ? 'bg-indigo-50 text-indigo-700 font-medium'
            : 'text-slate-600 hover:bg-slate-50'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        Dashboard
      </Link>

      <Link
        to="/cards"
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          isActive('/cards')
            ? 'bg-indigo-50 text-indigo-700 font-medium'
            : 'text-slate-600 hover:bg-slate-50'
        }`}
      >
        <Layers className="w-5 h-5" />
        Cards
      </Link>

      <Link
        to="/cards/intelligence"
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          isActive('/cards/intelligence')
            ? 'bg-indigo-50 text-indigo-700 font-medium'
            : 'text-slate-600 hover:bg-slate-50'
        }`}
      >
        <Brain className="w-5 h-5" />
        Intelligence
      </Link>

      {/* Governance Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsGovernanceOpen(!isGovernanceOpen)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors w-full ${
            isActive('/governance')
              ? 'bg-indigo-50 text-indigo-700 font-medium'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Scale className="w-5 h-5" />
          Governance
          <ChevronDown className={`w-4 h-4 transition-transform ${isGovernanceOpen ? 'rotate-180' : ''}`} />
        </button>

        {isGovernanceOpen && (
          <div className="ml-4 mt-2 space-y-1">
            <Link
              to="/governance/principles"
              className="block px-4 py-2 text-sm text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              Principles
            </Link>
            <Link
              to="/governance/standards"
              className="block px-4 py-2 text-sm text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              Technology Standards
            </Link>
            <Link
              to="/governance/policies"
              className="block px-4 py-2 text-sm text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              Policies
            </Link>
            <Link
              to="/governance/exceptions"
              className="block px-4 py-2 text-sm text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              Exceptions
            </Link>
            <Link
              to="/governance/initiatives"
              className="block px-4 py-2 text-sm text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              Initiatives
            </Link>
            <Link
              to="/governance/risks"
              className="block px-4 py-2 text-sm text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              Risks
            </Link>
            <Link
              to="/governance/compliance"
              className="block px-4 py-2 text-sm text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              Compliance
            </Link>
            <Link
              to="/governance/arb"
              className="block px-4 py-2 text-sm text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              ARB Portal
            </Link>
          </div>
        )}
      </div>
    </>
  );

  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/cards" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AZ</span>
              </div>
              <span className="text-xl font-bold text-slate-900">Arc Zero</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <NavItems />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-slate-600 hover:bg-slate-50"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200">
          <div className="px-4 py-4 space-y-2">
            <NavItems />
          </div>
        </div>
      )}
    </nav>
  );
}

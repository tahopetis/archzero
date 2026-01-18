/**
 * Strategic Initiatives Page
 */

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { InitiativeDashboard, InitiativeDetail, type Initiative } from '@/components/governance/initiatives';
import { InitiativeForm } from '@/components/governance/initiatives/InitiativeForm';

type ViewMode = 'dashboard' | 'kanban';

export function InitiativesPage() {
  const { id } = useParams();
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedInitiative, setSelectedInitiative] = useState<Initiative | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  if (id) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <InitiativeDetail initiativeId={id} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Strategic Initiatives</h1>
            <p className="text-slate-600 mt-1">Track and manage strategic transformation initiatives</p>
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            data-testid="add-initiative-btn"
          >
            Add Initiative
          </button>
        </div>

        {/* View Mode Tabs */}
        <div className="mb-6 border-b border-slate-200">
          <nav className="flex -mb-px space-x-8">
            <button
              onClick={() => setViewMode('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                viewMode === 'dashboard'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                viewMode === 'kanban'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Kanban Board
            </button>
          </nav>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <select
            className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            data-testid="initiative-type-filter"
          >
            <option value="">All Types</option>
            <option value="Strategic">Strategic</option>
            <option value="Modernization">Modernization</option>
            <option value="Customer">Customer</option>
            <option value="Infrastructure">Infrastructure</option>
            <option value="Compliance">Compliance</option>
          </select>

          <select
            className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            data-testid="initiative-status-filter"
          >
            <option value="">All Statuses</option>
            <option value="Proposed">Proposed</option>
            <option value="Approved">Approved</option>
            <option value="InProgress">In Progress</option>
            <option value="OnHold">On Hold</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {isFormOpen && (
          <div className="mb-6">
            <InitiativeForm
              initiative={selectedInitiative || undefined}
              onSuccess={() => {
                setIsFormOpen(false);
                setSelectedInitiative(null);
              }}
              onCancel={() => {
                setIsFormOpen(false);
                setSelectedInitiative(null);
              }}
            />
          </div>
        )}

        <InitiativeDashboard />
      </div>
    </div>
  );
}

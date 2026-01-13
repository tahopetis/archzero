/**
 * Technology Standards Page
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { StandardsList, TechnologyRadarPage, TechnologyDebtReport, type TechnologyStandard } from '@/components/governance/standards';
import { StandardForm } from '@/components/governance/standards/StandardForm';
import { useStandards } from '@/lib/governance-hooks';

type ViewMode = 'list' | 'radar' | 'debt';

export function StandardsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedStandard, setSelectedStandard] = useState<TechnologyStandard | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Technology Standards</h1>
            <p className="text-slate-600 mt-1">Manage technology standards and view the technology radar</p>
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            New Standard
          </button>
        </div>

        {/* View Mode Tabs */}
        <div className="mb-6 border-b border-slate-200">
          <nav className="flex -mb-px space-x-8">
            <button
              onClick={() => setViewMode('list')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                viewMode === 'list'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Standards List
            </button>
            <button
              onClick={() => setViewMode('radar')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                viewMode === 'radar'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Technology Radar
            </button>
            <button
              onClick={() => setViewMode('debt')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                viewMode === 'debt'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Debt Report
            </button>
          </nav>
        </div>

        {isFormOpen && (
          <div className="mb-6">
            <StandardForm
              standard={selectedStandard || undefined}
              onSuccess={() => {
                setIsFormOpen(false);
                setSelectedStandard(null);
              }}
              onCancel={() => {
                setIsFormOpen(false);
                setSelectedStandard(null);
              }}
            />
          </div>
        )}

        {viewMode === 'list' && (
          <StandardsList
            onEdit={(standard) => {
              setSelectedStandard(standard);
              setIsFormOpen(true);
            }}
          />
        )}

        {viewMode === 'radar' && <TechnologyRadarPage />}

        {viewMode === 'debt' && <TechnologyDebtReport />}
      </div>
    </div>
  );
}

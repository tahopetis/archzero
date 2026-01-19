/**
 * Risk Management Page
 */

import { useState } from 'react';
import { RiskDashboard, RiskHeatMap, RisksList, type Risk } from '@/components/governance/risks';
import { RiskForm } from '@/components/governance/risks/RiskForm';

type ViewMode = 'dashboard' | 'heatmap' | 'list';

export function RisksPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50" data-testid="risk-register">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Risk Management</h1>
            <p className="text-slate-600 mt-1">Monitor and mitigate technical and operational risks</p>
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            data-testid="add-risk-btn"
          >
            New Risk
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
              onClick={() => setViewMode('heatmap')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                viewMode === 'heatmap'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Heat Map
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                viewMode === 'list'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              All Risks
            </button>
          </nav>
        </div>

        {isFormOpen && (
          <div className="mb-6">
            <RiskForm
              risk={selectedRisk || undefined}
              onSuccess={() => {
                setIsFormOpen(false);
                setSelectedRisk(null);
              }}
              onCancel={() => {
                setIsFormOpen(false);
                setSelectedRisk(null);
              }}
            />
          </div>
        )}

        {viewMode === 'dashboard' && <RiskDashboard />}

        {viewMode === 'heatmap' && (
          <div className="space-y-6">
            <RiskHeatMap />
          </div>
        )}

        {viewMode === 'list' && (
          <div className="space-y-6">
            <RisksList
              onEdit={(risk) => {
                setSelectedRisk(risk);
                setIsFormOpen(true);
              }}
              onDelete={(id) => {
                console.log('Delete risk:', id);
                // TODO: Implement delete
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

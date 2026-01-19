/**
 * Risk Management Page
 */

import { useState } from 'react';
import { Download } from 'lucide-react';
import { RiskDashboard, RiskHeatMap, RisksList, type Risk } from '@/components/governance/risks';
import { RiskForm } from '@/components/governance/risks/RiskForm';
import { RiskType, RiskStatus } from '@/types/governance';

type ViewMode = 'dashboard' | 'heatmap' | 'list';

export function RisksPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Filter states
  const [selectedRiskType, setSelectedRiskType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const handleExport = async (format: 'csv' | 'pdf' | 'xlsx') => {
    try {
      // Fetch all risks from backend
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/v1/risks', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch risks');
      }

      const data = await response.json();
      const risks = data.data || data;

      if (!Array.isArray(risks)) {
        throw new Error('Invalid response format');
      }

      // Generate CSV content
      const headers = ['ID', 'Title', 'Type', 'Status', 'Probability', 'Impact', 'Risk Score', 'Owner', 'Description'];
      const csvRows = [
        headers.join(','),
        ...risks.map(risk => [
          risk.id,
          `"${risk.name.replace(/"/g, '""')}"`,
          risk.type || '',
          risk.status || '',
          risk.probability || '',
          risk.impact || '',
          risk.riskScore || '',
          risk.owner || '',
          `"${(risk.description || '').replace(/"/g, '""')}"`,
        ].join(',')),
      ];

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `risk-register-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="risk-register">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Risk Management</h1>
            <p className="text-slate-600 mt-1">Monitor and mitigate technical and operational risks</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
              data-testid="export-risks-btn"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => setIsFormOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              data-testid="add-risk-btn"
            >
              Add Risk
            </button>
          </div>
        </div>

        {/* Risk Type and Status Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Risk Type</label>
            <select
              value={selectedRiskType}
              onChange={(e) => setSelectedRiskType(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              data-testid="risk-type-filter"
            >
              <option value="all">All Types</option>
              {Object.values(RiskType).map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              data-testid="risk-status-filter"
            >
              <option value="all">All Statuses</option>
              {Object.values(RiskStatus).map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
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
              riskType={selectedRiskType !== 'all' ? selectedRiskType as RiskType : undefined}
              status={selectedStatus !== 'all' ? selectedStatus as RiskStatus : undefined}
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

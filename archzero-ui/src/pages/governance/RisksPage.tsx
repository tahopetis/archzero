/**
 * Risk Management Page
 */

import { useState, memo, useCallback } from 'react';
import { Download } from 'lucide-react';
import { RiskDashboard, RiskHeatMap, RisksList, type Risk } from '@/components/governance/risks';
import { RiskForm } from '@/components/governance/risks/RiskForm';
import { RiskType, RiskStatus } from '@/types/governance';

type ViewMode = 'dashboard' | 'heatmap' | 'list';

// Memoized header to prevent re-renders when data fetching occurs in dashboard
interface RiskPageHeaderProps {
  onExport: (format: 'csv' | 'pdf' | 'xlsx') => void;
  onAddRisk: () => void;
}

const RiskPageHeader = memo(({ onExport, onAddRisk }: RiskPageHeaderProps) => (
  <div className="flex items-center justify-between mb-6">
    <div>
      <h1 className="text-3xl font-bold text-slate-900">Risk Management</h1>
      <p className="text-slate-600 mt-1">Monitor and mitigate technical and operational risks</p>
    </div>
    <div className="flex items-center gap-3">
      <button
        onClick={() => onExport('csv')}
        className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
        data-testid="export-risks-btn"
      >
        <Download className="w-4 h-4" />
        Export
      </button>
      <button
        onClick={onAddRisk}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        data-testid="add-risk-btn"
      >
        Add Risk
      </button>
    </div>
  </div>
));
RiskPageHeader.displayName = 'RiskPageHeader';

export function RisksPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isEscalationModalOpen, setIsEscalationModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter states
  const [selectedRiskType, setSelectedRiskType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Memoize handlers to prevent re-renders of memoized header
  const handleExport = useCallback(async (format: 'csv' | 'pdf' | 'xlsx') => {
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
  }, []);

  const handleAddRisk = useCallback(() => {
    setIsFormOpen(true);
  }, []);

  const handleApprove = useCallback((risk: Risk) => {
    setSelectedRisk(risk);
    setIsApprovalModalOpen(true);
  }, []);

  const handleEscalate = useCallback((risk: Risk) => {
    setSelectedRisk(risk);
    setIsEscalationModalOpen(true);
  }, []);

  const handleApprovalSubmit = async (comments: string) => {
    try {
      if (!selectedRisk) return;

      const token = localStorage.getItem('auth_token');
      await fetch(`/api/v1/risks/${selectedRisk.id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comments }),
      });

      setSuccessMessage('Risk approved');
      setTimeout(() => setSuccessMessage(null), 3000);
      setIsApprovalModalOpen(false);
      setSelectedRisk(null);
    } catch (error) {
      console.error('Approval failed:', error);
    }
  };

  const handleEscalationSubmit = async (level: string, reason: string) => {
    try {
      if (!selectedRisk) return;

      const token = localStorage.getItem('auth_token');
      await fetch(`/api/v1/risks/${selectedRisk.id}/escalate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ level, reason }),
      });

      setSuccessMessage('Risk escalated');
      setTimeout(() => setSuccessMessage(null), 3000);
      setIsEscalationModalOpen(false);
      setSelectedRisk(null);
    } catch (error) {
      console.error('Escalation failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="risk-register">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">{successMessage}</p>
          </div>
        )}

        <RiskPageHeader key="risk-header" onExport={handleExport} onAddRisk={handleAddRisk} />

        {/* Risk Type and Status Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Risk Type</label>
            <select
              value={selectedRiskType}
              onChange={(e) => setSelectedRiskType(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              data-testid="risk-category-filter"
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

        {/* Dashboard and List Views */}
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
              onEdit={useCallback((risk: Risk) => {
                setSelectedRisk(risk);
                setIsFormOpen(true);
              }, [])}
              onDelete={useCallback((id: string) => {
                console.log('Delete risk:', id);
                // TODO: Implement delete
              }, [])}
              onApprove={handleApprove}
              onEscalate={handleEscalate}
            />
          </div>
        )}

        {/* Approval Modal */}
        {isApprovalModalOpen && selectedRisk && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-slate-900">Approve Risk</h2>
                  <button
                    onClick={() => setIsApprovalModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ×
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-slate-600 mb-2">
                    Risk: <span className="font-semibold text-slate-900">{selectedRisk.name}</span>
                  </p>
                  <p className="text-sm text-slate-600">
                    Score: <span className="font-semibold text-slate-900">{selectedRisk.riskScore}</span>
                  </p>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const comments = formData.get('comments') as string;
                  handleApprovalSubmit(comments);
                }}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Approval Comments
                    </label>
                    <textarea
                      id="approval-comments"
                      data-testid="approval-comments"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      rows={3}
                      placeholder="Add comments about this risk approval..."
                      required
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Confirm Approval
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsApprovalModalOpen(false)}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Escalation Modal */}
        {isEscalationModalOpen && selectedRisk && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-slate-900">Escalate Risk</h2>
                  <button
                    onClick={() => setIsEscalationModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ×
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-slate-600 mb-2">
                    Risk: <span className="font-semibold text-slate-900">{selectedRisk.name}</span>
                  </p>
                  <p className="text-sm text-slate-600">
                    Status: <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">Overdue</span>
                  </p>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const level = formData.get('escalation-level') as string;
                  const reason = formData.get('escalation-reason') as string;
                  handleEscalationSubmit(level, reason);
                }}>
                  <div className="space-y-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Escalation Level
                      </label>
                      <select
                        id="escalation-level"
                        data-testid="escalation-level"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      >
                        <option value="">Select level</option>
                        <option value="management">Management</option>
                        <option value="executive">Executive</option>
                        <option value="board">Board</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Reason for Escalation
                      </label>
                      <textarea
                        id="escalation-reason"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        rows={3}
                        placeholder="Explain why this risk needs escalation..."
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                    >
                      Escalate
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEscalationModalOpen(false)}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

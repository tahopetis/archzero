import { useState } from 'react';
import { Plus, Eye, Trash2, AlertTriangle, CheckCircle, XCircle, Clock, TrendingUp, TrendingDown } from 'lucide-react';

interface GapItem {
  id: string;
  area: string;
  currentState: string;
  targetState: string;
  gap: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  estimatedEffort: string;
  priority: number;
  status: 'identified' | 'in-progress' | 'resolved';
}

interface GapReport {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  baselineId: string;
  targetId: string;
  gaps: GapItem[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export function GapAnalysisPage() {
  const [reports, setReports] = useState<GapReport[]>([
    {
      id: '1',
      name: 'Cloud Migration Gap Analysis',
      description: 'Comparison between Q4 2025 baseline and Q1 2026 target architecture',
      createdAt: '2026-01-10',
      baselineId: '1',
      targetId: '1',
      gaps: [
        {
          id: 'g1',
          area: 'Authentication',
          currentState: 'Legacy LDAP with basic auth',
          targetState: 'OAuth2/OIDC with MFA',
          gap: 'No modern identity provider integration',
          severity: 'critical',
          estimatedEffort: '8 weeks',
          priority: 1,
          status: 'in-progress',
        },
        {
          id: 'g2',
          area: 'API Gateway',
          currentState: 'Direct service-to-service calls',
          targetState: 'Centralized API gateway with rate limiting',
          gap: 'No API management layer',
          severity: 'high',
          estimatedEffort: '6 weeks',
          priority: 2,
          status: 'in-progress',
        },
        {
          id: 'g3',
          area: 'Monitoring',
          currentState: 'Basic logging',
          targetState: 'Comprehensive observability with metrics and tracing',
          gap: 'Limited visibility into system performance',
          severity: 'high',
          estimatedEffort: '4 weeks',
          priority: 3,
          status: 'identified',
        },
        {
          id: 'g4',
          area: 'Data Storage',
          currentState: 'On-premise SQL Server',
          targetState: 'Cloud-native database with read replicas',
          gap: 'No horizontal scaling capability',
          severity: 'medium',
          estimatedEffort: '6 weeks',
          priority: 4,
          status: 'identified',
        },
        {
          id: 'g5',
          area: 'CI/CD Pipeline',
          currentState: 'Manual deployments',
          targetState: 'Automated pipeline with staging environments',
          gap: 'No automated testing or deployment',
          severity: 'medium',
          estimatedEffort: '3 weeks',
          priority: 5,
          status: 'resolved',
        },
      ],
      summary: {
        critical: 1,
        high: 2,
        medium: 2,
        low: 0,
      },
    },
    {
      id: '2',
      name: 'Security Posture Gap Analysis',
      description: 'Security capabilities assessment against industry standards',
      createdAt: '2026-01-12',
      baselineId: '1',
      targetId: '2',
      gaps: [
        {
          id: 'g6',
          area: 'Encryption at Rest',
          currentState: 'Partial encryption',
          targetState: 'Full encryption for all data',
          gap: 'Some legacy data unencrypted',
          severity: 'critical',
          estimatedEffort: '4 weeks',
          priority: 1,
          status: 'identified',
        },
        {
          id: 'g7',
          area: 'Secrets Management',
          currentState: 'Environment variables',
          targetState: 'Dedicated secrets manager',
          gap: 'No centralized secrets rotation',
          severity: 'high',
          estimatedEffort: '2 weeks',
          priority: 2,
          status: 'identified',
        },
      ],
      summary: {
        critical: 1,
        high: 1,
        medium: 0,
        low: 0,
      },
    },
  ]);
  const [selectedReport, setSelectedReport] = useState<GapReport | null>(reports[0] || null);
  const [isCreating, setIsCreating] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'identified' | 'in-progress' | 'resolved'>('all');

  const getSeverityColor = (severity: GapItem['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300 dark:border-red-700';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-300 dark:border-orange-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700';
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700';
    }
  };

  const getSeverityIcon = (severity: GapItem['severity']) => {
    switch (severity) {
      case 'critical':
        return AlertTriangle;
      case 'high':
        return TrendingUp;
      case 'medium':
        return Clock;
      case 'low':
        return CheckCircle;
    }
  };

  const getStatusColor = (status: GapItem['status']) => {
    switch (status) {
      case 'identified':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
  };

  const filteredGaps = selectedReport?.gaps.filter((gap) => {
    const matchesSeverity = filterSeverity === 'all' || gap.severity === filterSeverity;
    const matchesStatus = filterStatus === 'all' || gap.status === filterStatus;
    return matchesSeverity && matchesStatus;
  }) || [];

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold" data-testid="gap-analysis">
          Gap Analysis
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const selectedReportData = selectedReport ? {
                name: selectedReport.name,
                description: selectedReport.description,
                gaps: selectedReport.gaps,
                summary: selectedReport.summary
              } : null;
              const dataStr = JSON.stringify(selectedReportData, null, 2);
              const dataBlob = new Blob([dataStr], { type: 'application/json' });
              const url = URL.createObjectURL(dataBlob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `gap-analysis-${selectedReport?.id || 'report'}.json`;
              link.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            data-testid="export-gap-btn"
          >
            Export Report
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            data-testid="add-report-btn"
          >
            <Plus size={20} />
            New Analysis
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Reports List */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-4" data-testid="reports-list-title">
              Analysis Reports
            </h2>
            <div className="space-y-2">
              {reports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedReport?.id === report.id
                      ? 'bg-blue-100 dark:bg-blue-900/20 border-2 border-blue-600'
                      : 'bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  data-testid={`report-item-${report.id}`}
                >
                  <div className="font-medium mb-1" data-testid={`report-name-${report.id}`}>
                    {report.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2" data-testid={`report-date-${report.id}`}>
                    {report.createdAt}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {report.summary.critical > 0 && (
                      <span className="text-xs px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full">
                        {report.summary.critical} Critical
                      </span>
                    )}
                    {report.summary.high > 0 && (
                      <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded-full">
                        {report.summary.high} High
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Gap Details */}
        <div className="lg:col-span-3">
          {selectedReport ? (
            <div className="space-y-6">
              {/* Report Header */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-2" data-testid={`selected-report-name-${selectedReport.id}`}>
                      {selectedReport.name}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400" data-testid={`selected-report-description-${selectedReport.id}`}>
                      {selectedReport.description}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this report?')) {
                        setReports(reports.filter((r) => r.id !== selectedReport.id));
                        setSelectedReport(reports[0] || null);
                      }
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-red-600"
                    data-testid={`delete-report-${selectedReport.id}`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600" data-testid={`summary-critical-${selectedReport.id}`}>
                      {selectedReport.summary.critical}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Critical</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600" data-testid={`summary-high-${selectedReport.id}`}>
                      {selectedReport.summary.high}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">High</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600" data-testid={`summary-medium-${selectedReport.id}`}>
                      {selectedReport.summary.medium}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Medium</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600" data-testid={`summary-low-${selectedReport.id}`}>
                      {selectedReport.summary.low}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Low</div>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Severity</label>
                    <select
                      value={filterSeverity}
                      onChange={(e) => setFilterSeverity(e.target.value as typeof filterSeverity)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      data-testid="severity-filter"
                    >
                      <option value="all">All Severities</option>
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      data-testid="status-filter"
                    >
                      <option value="all">All Statuses</option>
                      <option value="identified">Identified</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Gap Items */}
              <div className="space-y-4" data-testid="gap-details">
                {filteredGaps.map((gap) => {
                  const SeverityIcon = getSeverityIcon(gap.severity);
                  return (
                    <div
                      key={gap.id}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 hover:shadow-lg transition-shadow cursor-pointer"
                      style={{
                        borderLeftColor:
                          gap.severity === 'critical' ? '#dc2626' :
                          gap.severity === 'high' ? '#f97316' :
                          gap.severity === 'medium' ? '#eab308' : '#3b82f6'
                      }}
                      data-testid="architecture-gap"
                      data-severity={gap.severity === 'critical' ? 'high' : gap.severity}
                      onClick={() => {
                        // Gap click handler - could show expanded details
                      }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <SeverityIcon size={20} className={
                              gap.severity === 'critical' ? 'text-red-600' :
                              gap.severity === 'high' ? 'text-orange-600' :
                              gap.severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                            } />
                            <h3 className="text-xl font-semibold" data-testid={`gap-area-${gap.id}`}>
                              {gap.area}
                            </h3>
                            <span
                              className={`text-xs px-3 py-1 rounded-full ${getSeverityColor(gap.severity)}`}
                              data-testid={`gap-severity-${gap.id}`}
                            >
                              {gap.severity}
                            </span>
                            <span
                              className={`text-xs px-3 py-1 rounded-full ${getStatusColor(gap.status)}`}
                              data-testid={`gap-status-${gap.id}`}
                            >
                              {gap.status}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mb-3" data-testid={`gap-effort-${gap.id}`}>
                            Estimated Effort: {gap.estimatedEffort}
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-gray-400" data-testid={`gap-priority-${gap.id}`}>
                          #{gap.priority}
                        </div>
                      </div>

                      {/* Comparison View */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                          <div className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Current State</div>
                          <div className="text-sm text-gray-700 dark:text-gray-300" data-testid={`gap-current-${gap.id}`}>
                            {gap.currentState}
                          </div>
                        </div>
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">Target State</div>
                          <div className="text-sm text-gray-700 dark:text-gray-300" data-testid={`gap-target-${gap.id}`}>
                            {gap.targetState}
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle size={16} className="text-yellow-600" />
                          <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Gap Description</div>
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300" data-testid={`gap-description-${gap.id}`}>
                          {gap.gap}
                        </div>
                      </div>

                      {/* Recommendations Section */}
                      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800" data-testid="gap-recommendations">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp size={16} className="text-blue-600" />
                          <div className="text-sm font-medium text-blue-800 dark:text-blue-200">Recommendations</div>
                        </div>
                        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                          <li>• Address {gap.area} gap as {gap.severity === 'critical' ? 'highest priority' : 'part of transformation plan'}</li>
                          <li>• Allocate {gap.estimatedEffort} for implementation</li>
                          <li>• Include in {gap.severity === 'critical' ? 'immediate' : 'upcoming'} sprint planning</li>
                        </ul>
                      </div>
                    </div>
                  );
                })}

                {filteredGaps.length === 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
                    <CheckCircle size={64} className="mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500 dark:text-gray-400" data-testid="no-gaps-found">
                      No gaps match the current filters
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
              <AlertTriangle size={64} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400" data-testid="no-report-selected">
                Select a gap analysis report to view details
              </p>
            </div>
          )}
        </div>
      </div>

      {isCreating && (
        <ReportForm
          onClose={() => setIsCreating(false)}
          onSave={(newReport) => {
            setReports([...reports, {
              ...newReport,
              id: Date.now().toString(),
              createdAt: new Date().toISOString().split('T')[0],
              baselineId: '',
              targetId: '',
            }]);
            setIsCreating(false);
          }}
        />
      )}
    </div>
  );
}

interface ReportFormProps {
  onClose: () => void;
  onSave: (report: { name: string; description: string; gaps: GapItem[]; summary: GapReport['summary'] }) => void;
}

function ReportForm({ onClose, onSave }: ReportFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      description,
      gaps: [],
      summary: { critical: 0, high: 0, medium: 0, low: 0 },
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="report-form-modal">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Create Gap Analysis</h2>
        <form onSubmit={handleSubmit} data-testid="report-form">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Report Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              data-testid="report-name-input"
              placeholder="e.g., Cloud Migration Gap Analysis"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              data-testid="report-description-input"
              rows={3}
              required
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              data-testid="cancel-report-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              data-testid="save-report-btn"
            >
              Create Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

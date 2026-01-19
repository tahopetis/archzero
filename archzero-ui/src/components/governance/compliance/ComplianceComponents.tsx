/**
 * Compliance Tracking Components
 * Including compliance dashboard and assessment results
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  FileText,
  Edit3,
  Trash2,
  Plus,
  Award,
  Activity
} from 'lucide-react';
import {
  ComplianceFramework,
  RequirementComplianceStatus,
  type ComplianceRequirement,
  type ComplianceDashboard,
  type ComplianceAssessment
} from '@/types/governance';
import { useComplianceRequirements, useComplianceDashboard } from '@/lib/governance-hooks';
import {
  Card,
  StatusBadge,
  IconBadge,
  MetadataItem,
  ComplianceIndicator,
  cn
} from '../shared';

// ============================================================================
// COMPLIANCE REQUIREMENT CARD
// ============================================================================

interface RequirementCardProps {
  requirement: ComplianceRequirement;
  onEdit?: (requirement: ComplianceRequirement) => void;
  onDelete?: (id: string) => void;
}

export function RequirementCard({ requirement, onEdit, onDelete }: RequirementCardProps) {
  return (
    <Card variant="bordered" className="group hover:shadow-lg transition-all" data-testid="requirement-item">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="text-lg font-bold text-slate-900">{requirement.name}</h3>
            <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-md text-xs font-semibold border border-indigo-200">
              {requirement.framework}
            </span>
          </div>
          <p className="text-sm text-slate-600 line-clamp-2">{requirement.description}</p>
        </div>
      </div>

      <div className="mb-3">
        <MetadataItem
          label="Audit Frequency"
          value={requirement.auditFrequency}
          icon={Activity}
        />
      </div>

      <div className="mb-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
          Required Controls ({requirement.requiredControls.length})
        </p>
        <div className="flex flex-wrap gap-1">
          {requirement.requiredControls.slice(0, 3).map((control) => (
            <span
              key={control}
              className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium"
            >
              {control}
            </span>
          ))}
          {requirement.requiredControls.length > 3 && (
            <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium">
              +{requirement.requiredControls.length - 3} more
            </span>
          )}
        </div>
      </div>

      <div className="mb-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
          Applicable Card Types ({requirement.applicableCardTypes.length})
        </p>
        <div className="flex flex-wrap gap-1">
          {requirement.applicableCardTypes.map((type) => (
            <span
              key={type}
              className="px-2 py-1 bg-teal-50 text-teal-700 rounded-md text-xs font-medium"
            >
              {type}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
        {onEdit && (
          <button
            onClick={() => onEdit(requirement)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Edit
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(requirement.id)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        )}
      </div>
    </Card>
  );
}

// ============================================================================
// REQUIREMENTS LIST
// ============================================================================

interface RequirementsListProps {
  framework?: ComplianceFramework;
  onEdit?: (requirement: ComplianceRequirement) => void;
  onDelete?: (id: string) => void;
}

export function RequirementsList({ framework, onEdit, onDelete }: RequirementsListProps) {
  const { data: requirements, isLoading } = useComplianceRequirements({ framework });

  if (isLoading) {
    return <div className="animate-pulse bg-slate-100 h-64 rounded-xl" />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="compliance-list">
      {requirements?.data.map((requirement) => (
        <RequirementCard
          key={requirement.id}
          requirement={requirement}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

// ============================================================================
// COMPLIANCE DASHBOARD
// ============================================================================

interface ComplianceDashboardProps {
  complianceId: string;
}

export function ComplianceDashboard({ complianceId }: ComplianceDashboardProps) {
  const { data: dashboard, isLoading } = useComplianceDashboard(complianceId);

  if (isLoading) {
    return <div className="animate-pulse bg-slate-100 h-96 rounded-xl" />;
  }

  if (!dashboard) {
    return null;
  }

  return (
    <Card className="p-6" data-testid="compliance-dashboard">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900">{dashboard.framework} Compliance Dashboard</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            Last assessed: {new Date(dashboard.lastAssessed).toLocaleDateString()}
          </span>
          <button
            onClick={() => console.log('Generate compliance report')}
            className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
            data-testid="generate-report-btn"
          >
            Generate Report
          </button>
          <button
            onClick={() => console.log('Export compliance data')}
            className="px-3 py-1.5 bg-slate-600 text-white text-sm rounded-lg hover:bg-slate-700 transition-colors"
            data-testid="export-compliance-btn"
          >
            Export
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200" data-testid="compliance-score">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-indigo-900">Overall Compliance Score</p>
            <p className="text-xs text-indigo-700 mt-1">Based on all frameworks</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-indigo-700">{dashboard.summary.complianceRate.toFixed(0)}%</p>
            <p className="text-xs text-indigo-600">Compliance Rate</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-slate-50 rounded-lg">
          <p className="text-2xl font-bold text-slate-900">{dashboard.summary.totalApplicableCards}</p>
          <p className="text-xs text-slate-500 uppercase tracking-wide">Total Cards</p>
        </div>
        <div className="text-center p-4 bg-emerald-50 rounded-lg">
          <p className="text-2xl font-bold text-emerald-700">{dashboard.summary.compliant}</p>
          <p className="text-xs text-slate-500 uppercase tracking-wide">Compliant</p>
        </div>
        <div className="text-center p-4 bg-rose-50 rounded-lg">
          <p className="text-2xl font-bold text-rose-700">{dashboard.summary.nonCompliant}</p>
          <p className="text-xs text-slate-500 uppercase tracking-wide">Non-Compliant</p>
        </div>
        <div className="text-center p-4 bg-slate-50 rounded-lg">
          <p className="text-2xl font-bold text-slate-700">
            {dashboard.summary.complianceRate.toFixed(0)}%
          </p>
          <p className="text-xs text-slate-500 uppercase tracking-wide">Compliance Rate</p>
        </div>
      </div>

      {/* Overall Compliance Rate */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-700">Overall Compliance</span>
          <span className="text-sm font-bold text-slate-900">
            {dashboard.summary.complianceRate.toFixed(1)}%
          </span>
        </div>
        <ComplianceIndicator rate={dashboard.summary.complianceRate} size="lg" showLabel />
      </div>

      {/* By Card Type */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Breakdown by Card Type
        </p>
        <div className="space-y-3">
          {Object.entries(dashboard.byCardType).map(([type, breakdown]) => (
            <div key={type} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">{type}</p>
                <p className="text-xs text-slate-500">
                  {breakdown.compliant} / {breakdown.total} compliant
                </p>
              </div>
              <ComplianceIndicator
                rate={(breakdown.compliant / breakdown.total) * 100}
                size="sm"
                showLabel
              />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// ASSESSMENT RESULTS
// ============================================================================

interface AssessmentResultsProps {
  assessment: ComplianceAssessment;
}

export function AssessmentResults({ assessment }: AssessmentResultsProps) {
  const getStatusBadge = (status: RequirementComplianceStatus) => {
    switch (status) {
      case 'Compliant': return 'compliant';
      case 'NonCompliant': return 'nonCompliant';
      case 'Exempt': return 'exempt';
      case 'Partial': return 'partial';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900">
            {assessment.framework} Assessment Results
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-xl font-bold text-emerald-600">{assessment.compliant}</p>
            <p className="text-xs text-slate-500">Compliant</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-rose-600">{assessment.nonCompliant}</p>
            <p className="text-xs text-slate-500">Violations</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {assessment.results.map((result, idx) => (
          <div
            key={idx}
            className={cn(
              'flex items-start gap-3 p-4 rounded-lg',
              result.status === 'Compliant'
                ? 'bg-emerald-50'
                : result.status === 'NonCompliant'
                ? 'bg-rose-50'
                : 'bg-amber-50'
            )}
          >
            <div className="flex-shrink-0 mt-0.5">
              {result.status === 'Compliant' ? (
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              ) : result.status === 'NonCompliant' ? (
                <XCircle className="w-5 h-5 text-rose-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <Link
                    to={`/cards/${result.cardId}`}
                    className="font-medium text-slate-900 hover:text-indigo-600"
                  >
                    {result.cardName}
                  </Link>
                  <StatusBadge variant={getStatusBadge(result.status) as any} className="ml-2">
                    {result.status}
                  </StatusBadge>
                </div>
              </div>

              {/* Controls Implemented */}
              {result.controlsImplemented.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">
                    ✓ Controls Implemented
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {result.controlsImplemented.map((control) => (
                      <span
                        key={control}
                        className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-xs font-medium"
                      >
                        {control}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Controls */}
              {result.missingControls.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-rose-700 uppercase tracking-wide mb-1">
                    ✗ Missing Controls
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {result.missingControls.map((control) => (
                      <span
                        key={control}
                        className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded text-xs font-medium"
                      >
                        {control}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ============================================================================
// COMPLIANCE FRAMEWORK OVERVIEW
// ============================================================================

interface FrameworkOverviewProps {
  onEdit?: (requirement: ComplianceRequirement) => void;
}

export function FrameworkOverview({ onEdit }: FrameworkOverviewProps) {
  const { data: requirements, isLoading } = useComplianceRequirements();

  if (isLoading) {
    return <div className="animate-pulse bg-slate-100 h-64 rounded-xl" />;
  }

  if (!requirements?.data.length) {
    return (
      <div className="text-center py-12">
        <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">No compliance requirements found</p>
      </div>
    );
  }

  // Group by framework
  const byFramework = requirements.data.reduce((acc, req) => {
    if (!acc[req.framework]) {
      acc[req.framework] = [];
    }
    acc[req.framework].push(req);
    return acc;
  }, {} as Record<ComplianceFramework, ComplianceRequirement[]>);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Object.entries(byFramework).map(([framework, reqs]) => (
        <Card key={framework} className="p-6 hover:shadow-lg transition-shadow cursor-pointer" data-testid="framework-item">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-slate-900">{framework}</h3>
            </div>
            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md text-xs font-semibold">
              {reqs.length} requirements
            </span>
          </div>

          <div className="space-y-2">
            {reqs.slice(0, 3).map((req) => (
              <Link
                key={req.id}
                to={`/governance/compliance/${req.id}`}
                className="block p-2 bg-slate-50 rounded hover:bg-slate-100 transition-colors"
              >
                <p className="text-sm font-medium text-slate-900 line-clamp-1">{req.name}</p>
                <p className="text-xs text-slate-500 line-clamp-1">{req.description}</p>
              </Link>
            ))}
            {reqs.length > 3 && (
              <Link
                to={`/governance/compliance?framework=${framework}`}
                className="block text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                View all {reqs.length} →
              </Link>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

// ============================================================================
// REPORT GENERATION MODAL
// ============================================================================

interface ReportGenerationModalProps {
  onClose: () => void;
}

export function ReportGenerationModal({ onClose }: ReportGenerationModalProps) {
  const [framework, setFramework] = useState('GDPR');
  const [dateRange, setDateRange] = useState('last-quarter');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGenerating(false);
    // In real implementation, this would generate and display the report
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="report-modal">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Generate Compliance Report</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
              data-testid="close-modal-btn"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Compliance Framework
              </label>
              <select
                value={framework}
                onChange={(e) => setFramework(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                data-testid="report-framework"
              >
                <option value="GDPR">GDPR</option>
                <option value="SOX">SOX</option>
                <option value="HIPAA">HIPAA</option>
                <option value="ISO 27001">ISO 27001</option>
                <option value="PCI DSS">PCI DSS</option>
                <option value="SOC 2">SOC 2</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Report Period
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                data-testid="report-date-range"
              >
                <option value="last-month">Last Month</option>
                <option value="last-quarter">Last Quarter</option>
                <option value="last-year">Last Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg" data-testid="report-preview">
              <p className="text-sm text-slate-600 mb-2">Report Preview</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Framework:</span>
                  <span className="font-medium text-slate-900">{framework}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Period:</span>
                  <span className="font-medium text-slate-900">{dateRange}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Requirements:</span>
                  <span className="font-medium text-slate-900">Loading...</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-end pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                disabled={isGenerating}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
              >
                {isGenerating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// COMPLIANCE HUB
// ============================================================================

export function ComplianceHub() {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <button
          onClick={() => setIsReportModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          data-testid="generate-report-btn"
        >
          Generate Report
        </button>
      </div>

      {isReportModalOpen && (
        <ReportGenerationModal
          onClose={() => setIsReportModalOpen(false)}
        />
      )}

      <Card className="p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Frameworks Overview</h2>
        <FrameworkOverview />
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">All Requirements</h2>
        <RequirementsList />
      </Card>
    </div>
  );
}

/**
 * Compliance Reports Dashboard Page
 * View and generate compliance reports across frameworks
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Download,
  Eye,
  Calendar,
  Filter,
  TrendingUp,
  TrendingDown,
  MinusCircle,
  Award,
  AlertCircle,
  CheckCircle,
  BarChart3,
  PieChart,
  Plus,
  RefreshCw
} from 'lucide-react';
import { ComplianceFramework, RequirementComplianceStatus } from '@/types/governance';
import { Card, cn } from '@/components/governance/shared';

interface ComplianceReport {
  id: string;
  title: string;
  framework: ComplianceFramework;
  reportType: 'Assessment' | 'Audit' | 'Executive' | 'Detailed';
  generatedAt: string;
  generatedBy: string;
  period: string;
  status: 'Completed' | 'InProgress' | 'Failed';
  fileUrl?: string;
  fileSize?: number;
}

interface FrameworkSummary {
  framework: ComplianceFramework;
  totalRequirements: number;
  compliantRequirements: number;
  complianceRate: number;
  lastAssessment: string;
  trend: 'up' | 'down' | 'stable';
}

interface AuditFinding {
  id: string;
  framework: ComplianceFramework;
  requirement: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  status: 'Open' | 'InRemediation' | 'Closed';
  discoveredAt: string;
  targetDate: string;
}

// Mock reports
const mockReports: ComplianceReport[] = [
  {
    id: 'report-1',
    title: 'SOC2 Type II Assessment - Q4 2025',
    framework: ComplianceFramework.SOC2,
    reportType: 'Assessment',
    generatedAt: '2026-01-10T10:00:00Z',
    generatedBy: 'Compliance Team',
    period: 'Q4 2025',
    status: 'Completed',
    fileUrl: '/reports/soc2-q4-2025.pdf',
    fileSize: 2458624
  },
  {
    id: 'report-2',
    title: 'GDPR Compliance Audit',
    framework: ComplianceFramework.GDPR,
    reportType: 'Audit',
    generatedAt: '2026-01-08T14:30:00Z',
    generatedBy: 'External Auditor',
    period: '2025',
    status: 'Completed',
    fileUrl: '/reports/gdpr-2025.pdf',
    fileSize: 3456789
  },
  {
    id: 'report-3',
    title: 'ISO 27001 Executive Summary',
    framework: ComplianceFramework.ISO27001,
    reportType: 'Executive',
    generatedAt: '2026-01-05T09:00:00Z',
    generatedBy: 'Compliance Team',
    period: 'December 2025',
    status: 'Completed',
    fileUrl: '/reports/iso27001-exec-dec-2025.pdf',
    fileSize: 890123
  },
  {
    id: 'report-4',
    title: 'PCI-DSS Assessment - Q1 2026',
    framework: ComplianceFramework.PCIDSS,
    reportType: 'Assessment',
    generatedAt: '2026-01-14T11:00:00Z',
    generatedBy: 'Security Team',
    period: 'Q1 2026',
    status: 'InProgress'
  }
];

// Mock framework summaries
const mockFrameworkSummaries: FrameworkSummary[] = [
  {
    framework: ComplianceFramework.SOC2,
    totalRequirements: 45,
    compliantRequirements: 42,
    complianceRate: 93.3,
    lastAssessment: '2026-01-10T10:00:00Z',
    trend: 'up'
  },
  {
    framework: ComplianceFramework.ISO27001,
    totalRequirements: 114,
    compliantRequirements: 108,
    complianceRate: 94.7,
    lastAssessment: '2026-01-05T09:00:00Z',
    trend: 'up'
  },
  {
    framework: ComplianceFramework.GDPR,
    totalRequirements: 28,
    compliantRequirements: 26,
    complianceRate: 92.9,
    lastAssessment: '2026-01-08T14:30:00Z',
    trend: 'stable'
  },
  {
    framework: ComplianceFramework.PCIDSS,
    totalRequirements: 67,
    compliantRequirements: 59,
    complianceRate: 88.1,
    lastAssessment: '2026-01-14T11:00:00Z',
    trend: 'down'
  }
];

// Mock audit findings
const mockFindings: AuditFinding[] = [
  {
    id: 'finding-1',
    framework: ComplianceFramework.PCIDSS,
    requirement: 'Requirement 8.2.3',
    severity: 'High',
    description: 'Multi-factor authentication not implemented for all remote access',
    status: 'InRemediation',
    discoveredAt: '2026-01-10T00:00:00Z',
    targetDate: '2026-02-28T00:00:00Z'
  },
  {
    id: 'finding-2',
    framework: ComplianceFramework.SOC2,
    requirement: 'CC6.1',
    severity: 'Medium',
    description: 'Logical and physical access controls need documentation updates',
    status: 'Open',
    discoveredAt: '2026-01-08T00:00:00Z',
    targetDate: '2026-02-15T00:00:00Z'
  },
  {
    id: 'finding-3',
    framework: ComplianceFramework.ISO27001,
    requirement: 'A.12.3.1',
    severity: 'Low',
    description: 'Backup procedure documentation incomplete',
    status: 'InRemediation',
    discoveredAt: '2026-01-05T00:00:00Z',
    targetDate: '2026-01-31T00:00:00Z'
  }
];

export function ComplianceReportsPage() {
  const [reports, setReports] = useState<ComplianceReport[]>(mockReports);
  const [frameworks, setFrameworks] = useState<FrameworkSummary[]>(mockFrameworkSummaries);
  const [findings, setFindings] = useState<AuditFinding[]>(mockFindings);
  const [selectedFramework, setSelectedFramework] = useState<string>('All');
  const [selectedReportType, setSelectedReportType] = useState<string>('All');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const getFrameworkBadge = (framework: ComplianceFramework) => {
    const colors: Record<ComplianceFramework, string> = {
      [ComplianceFramework.SOC2]: 'bg-blue-100 text-blue-700 border-blue-200',
      [ComplianceFramework.ISO27001]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      [ComplianceFramework.GDPR]: 'bg-purple-100 text-purple-700 border-purple-200',
      [ComplianceFramework.PCIDSS]: 'bg-amber-100 text-amber-700 border-amber-200',
      [ComplianceFramework.HIPAA]: 'bg-rose-100 text-rose-700 border-rose-200',
      [ComplianceFramework.NIST]: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      [ComplianceFramework.SOX]: 'bg-orange-100 text-orange-700 border-orange-200',
      [ComplianceFramework.CCPA]: 'bg-teal-100 text-teal-700 border-teal-200',
      [ComplianceFramework.Other]: 'bg-slate-100 text-slate-700 border-slate-200'
    };
    return colors[framework];
  };

  const getReportTypeBadge = (type: ComplianceReport['reportType']) => {
    const styles = {
      Assessment: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      Audit: 'bg-rose-100 text-rose-700 border-rose-200',
      Executive: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      Detailed: 'bg-slate-100 text-slate-700 border-slate-200'
    };
    return styles[type];
  };

  const getSeverityBadge = (severity: AuditFinding['severity']) => {
    const styles = {
      Critical: 'bg-rose-100 text-rose-700 border-rose-200',
      High: 'bg-orange-100 text-orange-700 border-orange-200',
      Medium: 'bg-amber-100 text-amber-700 border-amber-200',
      Low: 'bg-slate-100 text-slate-700 border-slate-200'
    };
    return styles[severity];
  };

  const getFindingStatusBadge = (status: AuditFinding['status']) => {
    const styles = {
      Open: 'bg-rose-100 text-rose-700 border-rose-200',
      InRemediation: 'bg-blue-100 text-blue-700 border-blue-200',
      Closed: 'bg-emerald-100 text-emerald-700 border-emerald-200'
    };
    return styles[status];
  };

  const getTrendIcon = (trend: FrameworkSummary['trend']) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-emerald-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-rose-600" />;
      default:
        return <MinusCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const filteredReports = reports.filter(report => {
    const matchesFramework = selectedFramework === 'All' || report.framework === selectedFramework;
    const matchesType = selectedReportType === 'All' || report.reportType === selectedReportType;
    return matchesFramework && matchesType;
  });

  const openFindings = findings.filter(f => f.status !== 'Closed').length;
  const avgComplianceRate = frameworks.reduce((sum, f) => sum + f.complianceRate, 0) / frameworks.length;

  return (
    <div className="min-h-screen bg-slate-50" data-testid="reports-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
            <Link to="/governance/compliance" className="hover:text-indigo-600">
              Compliance
            </Link>
            <span>/</span>
            <span className="text-slate-900">Reports</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Compliance Reports</h1>
              <p className="text-slate-600 mt-1">
                View and generate compliance reports across all frameworks
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium text-slate-700"
                data-testid="refresh-button"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={() => setIsGeneratingReport(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                data-testid="generate-report-button"
              >
                <Plus className="w-4 h-4" />
                Generate Report
              </button>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4" data-testid="stat-frameworks">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Award className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{frameworks.length}</p>
                <p className="text-xs text-slate-500">Frameworks</p>
              </div>
            </div>
          </Card>

          <Card className="p-4" data-testid="stat-compliance">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700">{avgComplianceRate.toFixed(1)}%</p>
                <p className="text-xs text-slate-500">Avg. Compliance</p>
              </div>
            </div>
          </Card>

          <Card className="p-4" data-testid="stat-findings">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-rose-700">{openFindings}</p>
                <p className="text-xs text-slate-500">Open Findings</p>
              </div>
            </div>
          </Card>

          <Card className="p-4" data-testid="stat-reports">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{reports.length}</p>
                <p className="text-xs text-slate-500">Reports</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Framework Summaries */}
          <div className="lg:col-span-2">
            <Card className="p-6 mb-6" data-testid="frameworks-section">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Framework Compliance</h2>
              <div className="space-y-3">
                {frameworks.map(fw => (
                  <div
                    key={fw.framework}
                    className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    data-testid={`framework-${fw.framework}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          'px-3 py-1 rounded-md text-sm font-semibold border',
                          getFrameworkBadge(fw.framework)
                        )}>
                          {fw.framework}
                        </span>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(fw.trend)}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-slate-900">{fw.complianceRate.toFixed(1)}%</p>
                        <p className="text-xs text-slate-500">
                          {fw.compliantRequirements} / {fw.totalRequirements} compliant
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-2">
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className={cn(
                            'h-2 rounded-full transition-all',
                            fw.complianceRate >= 90 ? 'bg-emerald-600' :
                            fw.complianceRate >= 75 ? 'bg-blue-600' :
                            fw.complianceRate >= 60 ? 'bg-amber-600' :
                            'bg-rose-600'
                          )}
                          style={{ width: `${fw.complianceRate}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Last assessed: {new Date(fw.lastAssessment).toLocaleDateString()}</span>
                      <Link
                        to={`/governance/compliance/${fw.framework.toLowerCase()}`}
                        className="text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Reports List */}
            <Card className="p-6" data-testid="reports-section">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">Recent Reports</h2>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select
                    value={selectedFramework}
                    onChange={(e) => setSelectedFramework(e.target.value)}
                    className="text-sm border border-slate-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500"
                    data-testid="framework-filter"
                  >
                    <option value="All">All Frameworks</option>
                    {Object.values(ComplianceFramework).map(fw => (
                      <option key={fw} value={fw}>{fw}</option>
                    ))}
                  </select>
                  <select
                    value={selectedReportType}
                    onChange={(e) => setSelectedReportType(e.target.value)}
                    className="text-sm border border-slate-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500"
                    data-testid="type-filter"
                  >
                    <option value="All">All Types</option>
                    <option value="Assessment">Assessment</option>
                    <option value="Audit">Audit</option>
                    <option value="Executive">Executive</option>
                    <option value="Detailed">Detailed</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {filteredReports.map(report => (
                  <div
                    key={report.id}
                    className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    data-testid={`report-${report.id}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-semibold text-slate-900">{report.title}</h3>
                          <span className={cn(
                            'px-2 py-0.5 rounded-md text-xs font-semibold border',
                            getFrameworkBadge(report.framework)
                          )}>
                            {report.framework}
                          </span>
                          <span className={cn(
                            'px-2 py-0.5 rounded-md text-xs font-semibold border',
                            getReportTypeBadge(report.reportType)
                          )}>
                            {report.reportType}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(report.generatedAt).toLocaleDateString()}
                          </span>
                          <span>by {report.generatedBy}</span>
                          {report.fileSize && (
                            <span>• {formatFileSize(report.fileSize)}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {report.status === 'Completed' ? (
                          <>
                            <button
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              data-testid={`view-report-${report.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              data-testid={`download-report-${report.id}`}
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                            In Progress
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredReports.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    No reports found matching your filters
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            {/* Audit Findings */}
            <Card className="p-6 mb-6" data-testid="findings-section">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">Audit Findings</h2>
                <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded text-xs font-semibold">
                  {openFindings} Open
                </span>
              </div>

              <div className="space-y-3">
                {findings.map(finding => (
                  <div
                    key={finding.id}
                    className="border border-slate-200 rounded-lg p-3"
                    data-testid={`finding-${finding.id}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={cn(
                        'px-2 py-0.5 rounded text-xs font-semibold border',
                        getSeverityBadge(finding.severity)
                      )}>
                        {finding.severity}
                      </span>
                      <span className={cn(
                        'px-2 py-0.5 rounded text-xs font-semibold border',
                        getFindingStatusBadge(finding.status)
                      )}>
                        {finding.status.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-indigo-600 mb-1">{finding.requirement}</p>
                    <p className="text-sm text-slate-700 mb-2">{finding.description}</p>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{finding.framework}</span>
                      <span>Due: {new Date(finding.targetDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="w-full mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                data-testid="view-all-findings"
              >
                View All Findings →
              </button>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6" data-testid="quick-actions">
              <h2 className="text-sm font-bold text-slate-900 mb-3">Quick Actions</h2>
              <div className="space-y-2">
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                  data-testid="action-assessment"
                >
                  <PieChart className="w-4 h-4 text-indigo-600" />
                  Generate Assessment Report
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                  data-testid="action-executive"
                >
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  Generate Executive Summary
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                  data-testid="action-audit"
                >
                  <FileText className="w-4 h-4 text-rose-600" />
                  Schedule Audit
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

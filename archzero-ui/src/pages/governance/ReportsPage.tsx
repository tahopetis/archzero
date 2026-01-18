/**
 * Reports Page - Cross-Workspace Report Generation
 */

import { useState } from 'react';

interface ReportOptions {
  includeInitiatives: boolean;
  includeRisks: boolean;
  includeGovernance: boolean;
}

interface ReportData {
  summary: {
    totalWorkspaces: number;
    generatedAt: string;
  };
  initiatives?: {
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    topInitiatives: Array<{
      name: string;
      status: string;
      budget: number;
      progress: number;
    }>;
  };
  risks?: {
    total: number;
    bySeverity: Record<string, number>;
    byCategory: Record<string, number>;
    topRisks: Array<{
      title: string;
      severity: string;
      category: string;
      likelihood: number;
      impact: number;
    }>;
  };
  governance?: {
    totalPolicies: number;
    totalStandards: number;
    totalPrinciples: number;
    complianceRate: number;
    pendingExceptions: number;
  };
}

// Mock data generators
const mockInitiatives = [
  { name: 'Cloud Migration Initiative', status: 'In Progress', budget: 1500000, progress: 65 },
  { name: 'API Modernization', status: 'On Track', budget: 750000, progress: 80 },
  { name: 'Security Enhancement', status: 'At Risk', budget: 500000, progress: 40 },
  { name: 'Data Lake Implementation', status: 'In Progress', budget: 1200000, progress: 55 },
  { name: 'Legacy System Refactoring', status: 'Behind Schedule', budget: 800000, progress: 30 },
];

const mockRisks = [
  { title: 'Data Privacy Compliance', severity: 'High', category: 'Compliance', likelihood: 4, impact: 5 },
  { title: 'Single Point of Failure', severity: 'Critical', category: 'Infrastructure', likelihood: 3, impact: 5 },
  { title: 'Skills Gap in Cloud Technologies', severity: 'Medium', category: 'People', likelihood: 4, impact: 3 },
  { title: 'Vendor Lock-in Risk', severity: 'Medium', category: 'Strategic', likelihood: 3, impact: 4 },
  { title: 'Integration Complexity', severity: 'High', category: 'Technical', likelihood: 4, impact: 4 },
];

export function ReportsPage() {
  const [reportOptions, setReportOptions] = useState<ReportOptions>({
    includeInitiatives: false,
    includeRisks: false,
    includeGovernance: false,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const handleGenerateReport = async () => {
    setIsGenerating(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate mock report data based on selections
    const data: ReportData = {
      summary: {
        totalWorkspaces: 5,
        generatedAt: new Date().toISOString(),
      },
    };

    if (reportOptions.includeInitiatives) {
      data.initiatives = {
        total: mockInitiatives.length,
        byStatus: {
          'In Progress': 3,
          'On Track': 1,
          'At Risk': 2,
          'Behind Schedule': 1,
        },
        byType: {
          'Modernization': 2,
          'Infrastructure': 2,
          'Security': 1,
        },
        topInitiatives: mockInitiatives,
      };
    }

    if (reportOptions.includeRisks) {
      data.risks = {
        total: mockRisks.length,
        bySeverity: {
          'Critical': 1,
          'High': 2,
          'Medium': 2,
          'Low': 0,
        },
        byCategory: {
          'Compliance': 1,
          'Infrastructure': 1,
          'People': 1,
          'Strategic': 1,
          'Technical': 1,
        },
        topRisks: mockRisks,
      };
    }

    if (reportOptions.includeGovernance) {
      data.governance = {
        totalPolicies: 24,
        totalStandards: 18,
        totalPrinciples: 12,
        complianceRate: 87,
        pendingExceptions: 3,
      };
    }

    setReportData(data);
    setIsGenerating(false);
  };

  const handleExportReport = () => {
    // Mock export functionality
    alert('Report exported as PDF');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-600 mt-1">Generate cross-workspace reports and analytics</p>
        </div>

        {/* Report Generation Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Generate Cross-Workspace Report</h2>

          {/* Report Options */}
          <div className="space-y-3 mb-6">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={reportOptions.includeInitiatives}
                onChange={(e) => setReportOptions({ ...reportOptions, includeInitiatives: e.target.checked })}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                data-testid="include-initiatives"
              />
              <span className="text-slate-700 font-medium">Include Strategic Initiatives</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={reportOptions.includeRisks}
                onChange={(e) => setReportOptions({ ...reportOptions, includeRisks: e.target.checked })}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                data-testid="include-risks"
              />
              <span className="text-slate-700 font-medium">Include Risk Management</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={reportOptions.includeGovernance}
                onChange={(e) => setReportOptions({ ...reportOptions, includeGovernance: e.target.checked })}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                data-testid="include-governance"
              />
              <span className="text-slate-700 font-medium">Include Governance Metrics</span>
            </label>
          </div>

          {/* Generate Button */}
          <div className="flex gap-3">
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating || !reportOptions.includeInitiatives && !reportOptions.includeRisks && !reportOptions.includeGovernance}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:bg-slate-300 disabled:cursor-not-allowed"
              data-testid="cross-workspace-report-btn"
            >
              {isGenerating ? 'Generating...' : 'Generate Report'}
            </button>

            {reportData && (
              <button
                onClick={handleExportReport}
                className="px-6 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Export PDF
              </button>
            )}
          </div>
        </div>

        {/* Report Preview */}
        {reportData && (
          <div className="bg-white rounded-lg shadow-sm p-6" data-testid="report-preview">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Report Preview</h2>
              <span className="text-sm text-slate-500">
                Generated: {new Date(reportData.summary.generatedAt).toLocaleString()}
              </span>
            </div>

            {/* Summary */}
            <div className="mb-6 p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-slate-900 mb-2">Summary</h3>
              <p className="text-slate-600">
                This report aggregates data from <strong>{reportData.summary.totalWorkspaces} workspaces</strong>.
              </p>
            </div>

            {/* Initiatives Section */}
            {reportData.initiatives && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Strategic Initiatives</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="p-4 bg-indigo-50 rounded-lg">
                    <p className="text-sm text-indigo-600 font-medium">Total Initiatives</p>
                    <p className="text-2xl font-bold text-indigo-900">{reportData.initiatives.total}</p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">On Track</p>
                    <p className="text-2xl font-bold text-green-900">{reportData.initiatives.byStatus['On Track'] || 0}</p>
                  </div>

                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-600 font-medium">At Risk</p>
                    <p className="text-2xl font-bold text-red-900">{reportData.initiatives.byStatus['At Risk'] || 0}</p>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Initiative</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Budget</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Progress</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {reportData.initiatives.topInitiatives.map((initiative, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{initiative.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{initiative.status}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">${initiative.budget.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{initiative.progress}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Risks Section */}
            {reportData.risks && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Risk Management</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-600 font-medium">Critical Risks</p>
                    <p className="text-2xl font-bold text-red-900">{reportData.risks.bySeverity['Critical'] || 0}</p>
                  </div>

                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-orange-600 font-medium">High Risks</p>
                    <p className="text-2xl font-bold text-orange-900">{reportData.risks.bySeverity['High'] || 0}</p>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">Total Risks</p>
                    <p className="text-2xl font-bold text-blue-900">{reportData.risks.total}</p>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Risk</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Severity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Risk Score</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {reportData.risks.topRisks.map((risk, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{risk.title}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              risk.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                              risk.severity === 'High' ? 'bg-orange-100 text-orange-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {risk.severity}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{risk.category}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{risk.likelihood * risk.impact}/25</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Governance Section */}
            {reportData.governance && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Governance Metrics</h3>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600 font-medium">Policies</p>
                    <p className="text-2xl font-bold text-slate-900">{reportData.governance.totalPolicies}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600 font-medium">Standards</p>
                    <p className="text-2xl font-bold text-slate-900">{reportData.governance.totalStandards}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600 font-medium">Principles</p>
                    <p className="text-2xl font-bold text-slate-900">{reportData.governance.totalPrinciples}</p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">Compliance</p>
                    <p className="text-2xl font-bold text-green-900">{reportData.governance.complianceRate}%</p>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-600 font-medium">Exceptions</p>
                    <p className="text-2xl font-bold text-yellow-900">{reportData.governance.pendingExceptions}</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Overall Compliance Rate</span>
                    <span className="text-sm font-bold text-slate-900">{reportData.governance.complianceRate}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${reportData.governance.complianceRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!reportData && !isGenerating && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-slate-900">No report generated</h3>
            <p className="mt-1 text-sm text-slate-500">
              Select the data you want to include and click Generate Report to create a cross-workspace report.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

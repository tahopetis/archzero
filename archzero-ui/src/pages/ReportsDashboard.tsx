import { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  FileDown,
  TrendingUp,
  Shield,
  DollarSign,
  AlertTriangle,
  Download,
  Filter,
  CalendarClock,
} from 'lucide-react';

// Mock data for charts
const riskTrendData = [
  { month: 'Jan', critical: 5, high: 12, medium: 25, low: 40 },
  { month: 'Feb', critical: 4, high: 10, medium: 22, low: 38 },
  { month: 'Mar', critical: 3, high: 8, medium: 20, low: 35 },
  { month: 'Apr', critical: 4, high: 11, medium: 23, low: 37 },
  { month: 'May', critical: 2, high: 7, medium: 18, low: 32 },
  { month: 'Jun', critical: 3, high: 9, medium: 19, low: 34 },
];

const complianceData = [
  { category: 'Principles', compliant: 45, nonCompliant: 5 },
  { category: 'Standards', compliant: 78, nonCompliant: 12 },
  { category: 'Policies', compliant: 32, nonCompliant: 8 },
  { category: 'Initiatives', compliant: 15, nonCompliant: 3 },
];

const tcoBreakdownData = [
  { name: 'Hardware', value: 450000, color: '#3b82f6' },
  { name: 'Software Licenses', value: 320000, color: '#8b5cf6' },
  { name: 'Maintenance', value: 180000, color: '#06b6d4' },
  { name: 'Support', value: 120000, color: '#10b981' },
  { name: 'Operations', value: 95000, color: '#f59e0b' },
];

const complianceHeatmapData = [
  { domain: 'Security', q1: 85, q2: 88, q3: 92, q4: 95 },
  { domain: 'Data Privacy', q1: 78, q2: 82, q3: 85, q4: 90 },
  { domain: 'Business Continuity', q1: 70, q2: 75, q3: 80, q4: 82 },
  { domain: 'Accessibility', q1: 65, q2: 68, q3: 72, q4: 75 },
  { domain: 'Performance', q1: 80, q2: 83, q3: 86, q4: 89 },
];

const applicationHealthData = [
  { name: 'Critical', value: 8, color: '#ef4444' },
  { name: 'High', value: 15, color: '#f97316' },
  { name: 'Medium', value: 32, color: '#eab308' },
  { name: 'Low', value: 45, color: '#22c55e' },
];

type ExportFormat = 'pdf' | 'csv' | 'json';
type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

export function ReportsDashboard() {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('30d');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState<'weekly' | 'monthly' | 'quarterly'>('monthly');
  const [scheduleEmail, setScheduleEmail] = useState('');

  const handleExport = (format: ExportFormat) => {
    console.log(`Exporting report as ${format}`);
    // In a real implementation, this would trigger the actual export
    setShowExportModal(false);
  };

  const handleScheduleReport = () => {
    console.log(`Scheduling report: ${scheduleFrequency} to ${scheduleEmail}`);
    // In a real implementation, this would save the schedule
    setShowScheduleModal(false);
    setScheduleEmail('');
  };

  const getHeatmapColor = (value: number) => {
    if (value >= 90) return '#22c55e';
    if (value >= 80) return '#84cc16';
    if (value >= 70) return '#eab308';
    if (value >= 60) return '#f97316';
    return '#ef4444';
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="reports-dashboard">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports Dashboard</h1>
              <p className="text-gray-600 mt-1">Analytics and insights for your enterprise architecture</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowScheduleModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                data-testid="schedule-report-btn"
              >
                <CalendarClock className="w-4 h-4" />
                Schedule Report
              </button>
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                data-testid="export-report-btn"
              >
                <FileDown className="w-4 h-4" />
                Export Report
              </button>
            </div>
          </div>

          {/* Time Range Filter */}
          <div className="mt-6 flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Time Range:</span>
            <div className="flex gap-2">
              {(['7d', '30d', '90d', '1y', 'all'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setSelectedTimeRange(range)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    selectedTimeRange === range
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  data-testid={`time-range-${range}`}
                >
                  {range === '7d' && '7 Days'}
                  {range === '30d' && '30 Days'}
                  {range === '90d' && '90 Days'}
                  {range === '1y' && '1 Year'}
                  {range === 'all' && 'All Time'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6" data-testid="kpi-total-cards">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Applications</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">127</p>
                <p className="text-sm text-green-600 mt-1">+12 from last month</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6" data-testid="kpi-compliance">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Compliance Score</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">87%</p>
                <p className="text-sm text-green-600 mt-1">+3% from last quarter</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6" data-testid="kpi-risks">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Risks</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">24</p>
                <p className="text-sm text-red-600 mt-1">5 critical</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6" data-testid="kpi-tco">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total TCO</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">$1.17M</p>
                <p className="text-sm text-gray-600 mt-1">Annual cost</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Risk Trends Chart */}
          <div className="bg-white rounded-lg shadow p-6" data-testid="chart-risk-trends">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Trends (6 Months)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={riskTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={2} name="Critical" />
                <Line type="monotone" dataKey="high" stroke="#f97316" strokeWidth={2} name="High" />
                <Line type="monotone" dataKey="medium" stroke="#eab308" strokeWidth={2} name="Medium" />
                <Line type="monotone" dataKey="low" stroke="#22c55e" strokeWidth={2} name="Low" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Compliance by Category */}
          <div className="bg-white rounded-lg shadow p-6" data-testid="chart-compliance">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={complianceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="compliant" fill="#22c55e" name="Compliant" />
                <Bar dataKey="nonCompliant" fill="#ef4444" name="Non-Compliant" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* TCO Breakdown */}
          <div className="bg-white rounded-lg shadow p-6" data-testid="chart-tco">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">TCO Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tcoBreakdownData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {tcoBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${(Number(value) / 1000).toFixed(0)}K`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Application Health Distribution */}
          <div className="bg-white rounded-lg shadow p-6" data-testid="chart-app-health">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Health Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={applicationHealthData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {applicationHealthData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Compliance Heatmap */}
        <div className="bg-white rounded-lg shadow p-6 mb-8" data-testid="compliance-heatmap">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Heatmap by Domain</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Domain</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Q1</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Q2</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Q3</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Q4</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Trend</th>
                </tr>
              </thead>
              <tbody>
                {complianceHeatmapData.map((row) => (
                  <tr key={row.domain} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{row.domain}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className="inline-block px-3 py-1 rounded-full text-sm font-medium text-white"
                        style={{ backgroundColor: getHeatmapColor(row.q1) }}
                      >
                        {row.q1}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className="inline-block px-3 py-1 rounded-full text-sm font-medium text-white"
                        style={{ backgroundColor: getHeatmapColor(row.q2) }}
                      >
                        {row.q2}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className="inline-block px-3 py-1 rounded-full text-sm font-medium text-white"
                        style={{ backgroundColor: getHeatmapColor(row.q3) }}
                      >
                        {row.q3}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className="inline-block px-3 py-1 rounded-full text-sm font-medium text-white"
                        style={{ backgroundColor: getHeatmapColor(row.q4) }}
                      >
                        {row.q4}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {row.q4 > row.q1 ? (
                        <TrendingUp className="w-5 h-5 text-green-600 inline-block" />
                      ) : (
                        <TrendingUp className="w-5 h-5 text-red-600 inline-block rotate-180" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Table */}
        <div className="bg-white rounded-lg shadow p-6" data-testid="summary-table">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Detailed Metrics Summary</h3>
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Download className="w-4 h-4" />
              Download CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Metric</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Current</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Previous</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Change</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-sm text-gray-900">Total Applications</td>
                  <td className="py-3 px-4 text-sm text-right text-gray-900">127</td>
                  <td className="py-3 px-4 text-sm text-right text-gray-600">115</td>
                  <td className="py-3 px-4 text-sm text-right text-green-600">+10.4%</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      On Track
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-sm text-gray-900">Compliance Rate</td>
                  <td className="py-3 px-4 text-sm text-right text-gray-900">87%</td>
                  <td className="py-3 px-4 text-sm text-right text-gray-600">84%</td>
                  <td className="py-3 px-4 text-sm text-right text-green-600">+3.6%</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Excellent
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-sm text-gray-900">Critical Risks</td>
                  <td className="py-3 px-4 text-sm text-right text-gray-900">5</td>
                  <td className="py-3 px-4 text-sm text-right text-gray-600">8</td>
                  <td className="py-3 px-4 text-sm text-right text-green-600">-37.5%</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Improving
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-sm text-gray-900">Annual TCO</td>
                  <td className="py-3 px-4 text-sm text-right text-gray-900">$1.17M</td>
                  <td className="py-3 px-4 text-sm text-right text-gray-600">$1.25M</td>
                  <td className="py-3 px-4 text-sm text-right text-green-600">-6.4%</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Optimized
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="export-modal">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Export Report</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Format</label>
                <div className="space-y-2">
                  {(['pdf', 'csv', 'json'] as ExportFormat[]).map((format) => (
                    <label
                      key={format}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        exportFormat === format
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="exportFormat"
                        value={format}
                        checked={exportFormat === format}
                        onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                        className="mr-3"
                      />
                      <span className="font-medium text-gray-900 uppercase">{format}</span>
                      <span className="ml-2 text-sm text-gray-600">
                        {format === 'pdf' && '- Best for printing and sharing'}
                        {format === 'csv' && '- Best for spreadsheet analysis'}
                        {format === 'json' && '- Best for data integration'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleExport(exportFormat)}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  data-testid="confirm-export-btn"
                >
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Report Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="schedule-modal">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Schedule Report</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                <select
                  value={scheduleFrequency}
                  onChange={(e) => setScheduleFrequency(e.target.value as 'weekly' | 'monthly' | 'quarterly')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  data-testid="schedule-frequency"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Recipients</label>
                <input
                  type="email"
                  value={scheduleEmail}
                  onChange={(e) => setScheduleEmail(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  data-testid="schedule-email"
                />
                <p className="text-xs text-gray-500 mt-1">Comma-separated for multiple recipients</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScheduleReport}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  data-testid="confirm-schedule-btn"
                >
                  Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

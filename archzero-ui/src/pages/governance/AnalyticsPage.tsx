/**
 * Strategic Planning Analytics Dashboard Page
 */

import { useState } from 'react';
import { Download, TrendingUp, DollarSign, Activity, Target } from 'lucide-react';

interface PortfolioStats {
  totalInitiatives: number;
  totalBudget: number;
  spentBudget: number;
  activeInitiatives: number;
  completedInitiatives: number;
  averageProgress: number;
}

interface BudgetData {
  initiative: string;
  allocated: number;
  spent: number;
  remaining: number;
}

interface StatusData {
  status: string;
  count: number;
  color: string;
}

interface RoadmapMilestone {
  id: string;
  name: string;
  start: string;
  end: string;
  progress: number;
  status: 'completed' | 'in-progress' | 'pending';
}

export function AnalyticsPage() {
  const [isExporting, setIsExporting] = useState(false);

  // Mock portfolio statistics
  const portfolioStats: PortfolioStats = {
    totalInitiatives: 24,
    totalBudget: 15000000,
    spentBudget: 8500000,
    activeInitiatives: 18,
    completedInitiatives: 6,
    averageProgress: 58,
  };

  // Mock budget utilization data
  const budgetData: BudgetData[] = [
    { initiative: 'Cloud Migration', allocated: 5000000, spent: 3200000, remaining: 1800000 },
    { initiative: 'Security Enhancement', allocated: 3000000, spent: 2100000, remaining: 900000 },
    { initiative: 'Cost Optimization', allocated: 2500000, spent: 1200000, remaining: 1300000 },
    { initiative: 'Digital Transformation', allocated: 2000000, spent: 800000, remaining: 1200000 },
    { initiative: 'Infrastructure Upgrade', allocated: 2500000, spent: 1200000, remaining: 1300000 },
  ];

  // Mock initiative status distribution
  const statusData: StatusData[] = [
    { status: 'On Track', count: 14, color: '#10b981' },
    { status: 'At Risk', count: 6, color: '#f59e0b' },
    { status: 'Behind Schedule', count: 4, color: '#ef4444' },
  ];

  // Mock roadmap timeline data
  const roadmapMilestones: RoadmapMilestone[] = [
    {
      id: '1',
      name: 'Phase 1: Assessment Complete',
      start: '2026-01-01',
      end: '2026-03-31',
      progress: 100,
      status: 'completed',
    },
    {
      id: '2',
      name: 'Phase 2: Planning & Design',
      start: '2026-04-01',
      end: '2026-06-30',
      progress: 75,
      status: 'in-progress',
    },
    {
      id: '3',
      name: 'Phase 3: Implementation',
      start: '2026-07-01',
      end: '2026-12-31',
      progress: 30,
      status: 'in-progress',
    },
    {
      id: '4',
      name: 'Phase 4: Testing & QA',
      start: '2027-01-01',
      end: '2027-03-31',
      progress: 0,
      status: 'pending',
    },
    {
      id: '5',
      name: 'Phase 5: Deployment',
      start: '2027-04-01',
      end: '2027-06-30',
      progress: 0,
      status: 'pending',
    },
  ];

  const handleExportReport = async () => {
    setIsExporting(true);
    // Mock export functionality - in real app, this would trigger a download
    setTimeout(() => {
      const blob = new Blob(['Strategic Planning Analytics Report'], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'strategic-planning-analytics-report.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsExporting(false);
    }, 1000);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Strategic Planning Analytics</h1>
            <p className="text-slate-600 mt-1">Comprehensive overview of strategic initiatives and performance</p>
          </div>
          <button
            onClick={handleExportReport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="export-report-btn"
          >
            <Download size={20} />
            {isExporting ? 'Exporting...' : 'Export Report'}
          </button>
        </div>

        {/* Portfolio Overview */}
        <div
          className="bg-white rounded-lg shadow-md p-6 mb-6"
          data-testid="portfolio-overview"
        >
          <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="text-indigo-600" size={24} />
            Initiative Portfolio Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Initiatives</p>
                  <p className="text-3xl font-bold text-blue-900">{portfolioStats.totalInitiatives}</p>
                </div>
                <Target className="text-blue-600" size={32} />
              </div>
              <div className="mt-2 text-sm text-blue-700">
                <span className="font-medium">{portfolioStats.activeInitiatives}</span> active,{' '}
                <span className="font-medium">{portfolioStats.completedInitiatives}</span> completed
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Total Budget</p>
                  <p className="text-2xl font-bold text-green-900">{formatCurrency(portfolioStats.totalBudget)}</p>
                </div>
                <DollarSign className="text-green-600" size={32} />
              </div>
              <div className="mt-2 text-sm text-green-700">
                <span className="font-medium">{formatCurrency(portfolioStats.spentBudget)}</span> spent ({Math.round((portfolioStats.spentBudget / portfolioStats.totalBudget) * 100)}%)
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Average Progress</p>
                  <p className="text-3xl font-bold text-purple-900">{portfolioStats.averageProgress}%</p>
                </div>
                <Activity className="text-purple-600" size={32} />
              </div>
              <div className="mt-2 w-full bg-purple-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{ width: `${portfolioStats.averageProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Budget Utilization Chart */}
          <div
            className="bg-white rounded-lg shadow-md p-6"
            data-testid="budget-utilization-chart"
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Budget Utilization by Initiative</h3>
            <div className="space-y-4">
              {budgetData.map((item, index) => {
                const utilizationPercent = (item.spent / item.allocated) * 100;
                return (
                  <div key={index} className="border-b border-slate-100 pb-3 last:border-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-slate-700">{item.initiative}</span>
                      <span className="text-sm text-slate-500">
                        {formatCurrency(item.spent)} / {formatCurrency(item.allocated)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 mb-1">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          utilizationPercent > 90 ? 'bg-red-500' : utilizationPercent > 70 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${utilizationPercent}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>{utilizationPercent.toFixed(0)}% utilized</span>
                      <span>{formatCurrency(item.remaining)} remaining</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Initiative Status Distribution Chart */}
          <div
            className="bg-white rounded-lg shadow-md p-6"
            data-testid="initiative-status-chart"
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Initiative Status Distribution</h3>
            <div className="flex items-center justify-center mb-6">
              {/* Pie Chart Visualization */}
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
                  {statusData.reduce((acc, item, index) => {
                    const percentage = (item.count / portfolioStats.totalInitiatives) * 100;
                    const circumference = 2 * Math.PI * 40;
                    const dashArray = (percentage / 100) * circumference;
                    const offset = acc.previousPercentage;
                    return {
                      elements: (
                        <>
                          {acc.elements}
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="transparent"
                            stroke={item.color}
                            strokeWidth="20"
                            strokeDasharray={`${dashArray} ${circumference}`}
                            strokeDashoffset={-((offset / 100) * circumference)}
                          />
                        </>
                      ),
                      previousPercentage: offset + percentage,
                    };
                  }, { elements: <></>, previousPercentage: 0 }).elements}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-slate-900">{portfolioStats.totalInitiatives}</p>
                    <p className="text-xs text-slate-500">Total</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {statusData.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm text-slate-700">{item.status}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-900">{item.count}</span>
                    <span className="text-xs text-slate-500">
                      {Math.round((item.count / portfolioStats.totalInitiatives) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Roadmap Timeline Chart */}
        <div
          className="bg-white rounded-lg shadow-md p-6"
          data-testid="roadmap-timeline-chart"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Transformation Roadmap Timeline</h3>
          <div className="space-y-4">
            {roadmapMilestones.map((milestone, index) => (
              <div key={milestone.id} className="relative">
                {/* Timeline line */}
                {index < roadmapMilestones.length - 1 && (
                  <div className="absolute left-4 top-12 w-0.5 h-8 bg-slate-200"></div>
                )}
                <div className="flex gap-4">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium z-10 ${
                      milestone.status === 'completed' ? 'bg-green-500' : milestone.status === 'in-progress' ? 'bg-blue-500' : 'bg-slate-300'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 bg-slate-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-slate-900">{milestone.name}</h4>
                        <p className="text-sm text-slate-500">
                          {new Date(milestone.start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - {new Date(milestone.end).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          milestone.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : milestone.status === 'in-progress'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {milestone.status === 'completed' ? 'Completed' : milestone.status === 'in-progress' ? 'In Progress' : 'Pending'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          milestone.status === 'completed' ? 'bg-green-500' : milestone.status === 'in-progress' ? 'bg-blue-500' : 'bg-slate-300'
                        }`}
                        style={{ width: `${milestone.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{milestone.progress}% complete</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

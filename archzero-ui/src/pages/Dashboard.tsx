import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { Navigation } from '@/components/Navigation';

export function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [colorBy, setColorBy] = useState('lifecycle_phase');
  const [showHeatmapDetail, setShowHeatmapDetail] = useState(false);
  const [cards, setCards] = useState(0);
  const [applications, setApplications] = useState(0);
  const [relationships, setRelationships] = useState(0);

  useEffect(() => {
    // Simulate fetching metrics
    setCards(31);
    setApplications(12);
    setRelationships(4);
  }, []);

  const heatmapData = [
    { name: 'Adopt', items: ['Kubernetes', 'React', 'TypeScript'] },
    { name: 'Trial', items: ['GraphQL', 'Next.js'] },
    { name: 'Assess', items: ['Rust', 'WebAssembly'] },
    { name: 'Hold', items: ['Legacy Systems', 'Monolith'] },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* User info bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-end items-center space-x-4">
          <span className="text-sm text-gray-700">
            {user?.fullName || user?.email}
          </span>
          <button
            onClick={logout}
            className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 mt-1">Welcome to Arc Zero Enterprise Architecture Platform</p>
        </div>

        {/* Summary Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 widget dashboard-widget" data-testid="widget">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Cards</h3>
            <p className="text-3xl font-bold text-blue-600" data-testid="health-score">{cards}</p>
            <p className="text-sm text-gray-600 mt-1">Total entities</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 widget dashboard-widget" data-testid="widget">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Applications</h3>
            <p className="text-3xl font-bold text-green-600" data-testid="quality-score">{applications}</p>
            <p className="text-sm text-gray-600 mt-1">Application portfolio</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 widget dashboard-widget" data-testid="widget">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Relationships</h3>
            <p className="text-3xl font-bold text-purple-600">{relationships}</p>
            <p className="text-sm text-gray-600 mt-1">Dependencies</p>
          </div>
        </div>

        {/* Landscape Heatmap */}
        <div className="bg-white rounded-lg shadow p-6 mb-8" data-testid="landscape-heatmap-container">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Technology Landscape Heatmap</h3>
            <select
              value={colorBy}
              onChange={(e) => setColorBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="color-by-select"
              name="colorBy"
            >
              <option value="lifecycle_phase">Lifecycle Phase</option>
              <option value="criticality">Criticality</option>
              <option value="risk">Risk Level</option>
              <option value="cost">Cost</option>
            </select>
          </div>

          <div
            className="heat-map bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-8 min-h-[400px] relative cursor-pointer"
            data-testid="landscape-heatmap"
            onClick={() => setShowHeatmapDetail(!showHeatmapDetail)}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {heatmapData.map((quadrant, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                  data-testid="quadrant"
                >
                  <h4 className="font-semibold text-sm mb-2 text-gray-900">{quadrant.name}</h4>
                  <div className="space-y-1">
                    {quadrant.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="text-xs text-gray-600">{item}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Heatmap Detail Panel */}
          {showHeatmapDetail && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg" data-testid="heatmap-detail">
              <h4 className="font-medium mb-2">Heatmap Details</h4>
              <p className="text-sm text-gray-600">
                Color by: <span className="font-medium">{colorBy.replace('_', ' ')}</span>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Showing {heatmapData.reduce((sum, q) => sum + q.items.length, 0)} technologies across {heatmapData.length} quadrants
              </p>
            </div>
          )}
        </div>

        {/* Charts and Graphs */}
        <div className="bg-white rounded-lg shadow p-6 mb-8" data-testid="chart-container">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Architecture Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <div className="border border-gray-200 rounded-lg p-4" data-testid="chart">
              <h4 className="text-sm font-medium mb-3">Cards by Lifecycle Phase</h4>
              <div className="space-y-2">
                {[
                  { label: 'Strategic', value: 8, color: 'bg-green-500' },
                  { label: 'Investment', value: 12, color: 'bg-blue-500' },
                  { label: 'Tactical', value: 7, color: 'bg-yellow-500' },
                  { label: 'Retire', value: 4, color: 'bg-red-500' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs w-20">{item.label}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-4">
                      <div
                        className={`${item.color} h-4 rounded-full`}
                        style={{ width: `${(item.value / 12) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs w-8 text-right">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pie Chart */}
            <div className="border border-gray-200 rounded-lg p-4" data-testid="chart">
              <h4 className="text-sm font-medium mb-3">Application Distribution</h4>
              <div className="flex items-center justify-center">
                <div className="relative w-48 h-48">
                  <svg viewBox="0 0 100 100" className="transform -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="20" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="20"
                      strokeDasharray={`${0.4 * 251.2} 251.2`} />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="20"
                      strokeDasharray={`${0.3 * 251.2} 251.2`}
                      strokeDashoffset={`-${0.4 * 251.2}`} />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="20"
                      strokeDasharray={`${0.2 * 251.2} 251.2`}
                      strokeDashoffset={`-${0.7 * 251.2}`} />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#8b5cf6" strokeWidth="20"
                      strokeDasharray={`${0.1 * 251.2} 251.2`}
                      strokeDashoffset={`-${0.9 * 251.2}`} />
                  </svg>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500"></span>Cloud (40%)</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500"></span>On-Prem (30%)</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-500"></span>Hybrid (20%)</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-purple-500"></span>SaaS (10%)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
              Create New Card
            </button>
            <button className="px-4 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition">
              View Architecture Graph
            </button>
            <button className="px-4 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition">
              Run BIA Analysis
            </button>
            <button className="px-4 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition">
              Generate Reports
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

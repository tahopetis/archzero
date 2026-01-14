import { useAuthStore } from '@/stores/useAuthStore';
import { Navigation } from '@/components/Navigation';

export function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6" data-testid="widget-portfolio-health">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Cards</h3>
            <p className="text-3xl font-bold text-blue-600" data-testid="health-score">0</p>
            <p className="text-sm text-gray-600 mt-1">Total entities</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6" data-testid="widget-data-quality">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Applications</h3>
            <p className="text-3xl font-bold text-green-600" data-testid="quality-score">0</p>
            <p className="text-sm text-gray-600 mt-1">Application portfolio</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6" data-testid="widget-criticality-watch">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Relationships</h3>
            <p className="text-3xl font-bold text-purple-600">0</p>
            <p className="text-sm text-gray-600 mt-1">Dependencies</p>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
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

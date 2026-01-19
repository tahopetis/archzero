import { useState } from 'react';
import { DollarSign, TrendingUp, PieChart } from 'lucide-react';

export function TCOCalculatorPage() {
  const [duration, setDuration] = useState<number>(3);
  const [annualCost, setAnnualCost] = useState<number>(100000);
  const [migrationCost, setMigrationCost] = useState<number>(50000);
  const [maintenanceCost, setMaintenanceCost] = useState<number>(20000);

  const calculateTCO = () => {
    return (annualCost * duration) + migrationCost + (maintenanceCost * duration);
  };

  const calculateBreakdown = () => {
    const total = calculateTCO();
    const ops = annualCost * duration;
    const migration = migrationCost;
    const maintenance = maintenanceCost * duration;

    return {
      operations: { value: ops, percentage: (ops / total) * 100 },
      migration: { value: migration, percentage: (migration / total) * 100 },
      maintenance: { value: maintenance, percentage: (maintenance / total) * 100 },
    };
  };

  const breakdown = calculateBreakdown();
  const totalTCO = calculateTCO();

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="tco-page">
          <DollarSign className="w-8 h-8 text-green-600" />
          TCO Calculator
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Calculate Total Cost of Ownership for cloud migration and operations
        </p>
      </div>

      {/* Cost Parameters Input */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Cost Parameters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Duration (years)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              data-testid="tco-param"
              min="1"
              max="10"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Annual Operations Cost ($)</label>
            <input
              type="number"
              value={annualCost}
              onChange={(e) => setAnnualCost(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              data-testid="tco-param"
              min="0"
              step="1000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Migration Cost ($)</label>
            <input
              type="number"
              value={migrationCost}
              onChange={(e) => setMigrationCost(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              data-testid="tco-param"
              min="0"
              step="5000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Annual Maintenance Cost ($)</label>
            <input
              type="number"
              value={maintenanceCost}
              onChange={(e) => setMaintenanceCost(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              data-testid="tco-param"
              min="0"
              step="1000"
            />
          </div>
        </div>
      </div>

      {/* Cost Summary / Roll-up */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6" data-testid="tco-rollup">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-90">Operations</div>
              <div className="text-2xl font-bold mt-1">
                ${breakdown.operations.value.toLocaleString()}
              </div>
            </div>
            <TrendingUp className="w-8 h-8 opacity-75" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-90">Migration</div>
              <div className="text-2xl font-bold mt-1">
                ${breakdown.migration.value.toLocaleString()}
              </div>
            </div>
            <PieChart className="w-8 h-8 opacity-75" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-90">Maintenance</div>
              <div className="text-2xl font-bold mt-1">
                ${breakdown.maintenance.value.toLocaleString()}
              </div>
            </div>
            <DollarSign className="w-8 h-8 opacity-75" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-90">Total TCO</div>
              <div className="text-3xl font-bold mt-1" data-testid="tco-total">
                ${totalTCO.toLocaleString()}
              </div>
            </div>
            <DollarSign className="w-10 h-10 opacity-75" />
          </div>
        </div>
      </div>

      {/* Cost Breakdown Visualization */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6" data-testid="cost-breakdown">
        <h2 className="text-xl font-semibold mb-4">Cost Breakdown</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Operations</span>
              <span>${breakdown.operations.value.toLocaleString()} ({breakdown.operations.percentage.toFixed(1)}%)</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
              <div
                className="bg-blue-500 h-4 rounded-full transition-all"
                style={{ width: `${breakdown.operations.percentage}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Migration</span>
              <span>${breakdown.migration.value.toLocaleString()} ({breakdown.migration.percentage.toFixed(1)}%)</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
              <div
                className="bg-purple-500 h-4 rounded-full transition-all"
                style={{ width: `${breakdown.migration.percentage}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Maintenance</span>
              <span>${breakdown.maintenance.value.toLocaleString()} ({breakdown.maintenance.percentage.toFixed(1)}%)</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
              <div
                className="bg-green-500 h-4 rounded-full transition-all"
                style={{ width: `${breakdown.maintenance.percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="mt-6 flex items-center justify-center">
          <div className="relative w-64 h-64">
            <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
              {/* Operations */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="20"
                strokeDasharray={`${breakdown.operations.percentage * 2.51} 251`}
              />
              {/* Migration */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="20"
                strokeDasharray={`${breakdown.migration.percentage * 2.51} 251`}
                strokeDashoffset={`-${breakdown.operations.percentage * 2.51}`}
              />
              {/* Maintenance */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#10b981"
                strokeWidth="20"
                strokeDasharray={`${breakdown.maintenance.percentage * 2.51} 251`}
                strokeDashoffset={`-${(breakdown.operations.percentage + breakdown.migration.percentage) * 2.51}`}
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

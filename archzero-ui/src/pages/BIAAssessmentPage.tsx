import { useState } from 'react';
import { AlertTriangle, Clock, TrendingUp, Activity } from 'lucide-react';

interface BIAData {
  impactScore: number;
  rto: number; // Recovery Time Objective in hours
  rpo: number; // Recovery Point Objective in minutes
  criticality: 'critical' | 'high' | 'medium' | 'low';
}

export function BIAAssessmentPage() {
  const [selectedCard, setSelectedCard] = useState<string>('app-1');
  const [biaData, setBiaData] = useState<BIAData>({
    impactScore: 85,
    rto: 4,
    rpo: 15,
    criticality: 'high',
  });

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-red-600 bg-red-50';
    if (score >= 70) return 'text-orange-600 bg-orange-50';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getCriticalityColor = (criticality: string) => {
    switch (criticality) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold" data-testid="bia-page">Business Impact Analysis</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Assess criticality and business impact for enterprise applications
        </p>
      </div>

      {/* Impact Score Visualization */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Impact Score
          </h2>
          <div className="flex items-center justify-center py-8">
            <div className="relative">
              {/* Circular Score Visualization */}
              <div className={`score-visualization w-40 h-40 rounded-full flex items-center justify-center ${getScoreColor(biaData.impactScore)}`}>
                <div className="text-center">
                  <div className="text-4xl font-bold" data-testid="impact-score">{biaData.impactScore}</div>
                  <div className="text-sm font-medium">out of 100</div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Criticality Level</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCriticalityColor(biaData.criticality)}`}>
                {biaData.criticality.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* RTO/RPO Metrics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6" data-testid="rto-rpo">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recovery Objectives
          </h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">RTO (Recovery Time Objective)</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">{biaData.rto} hours</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full transition-all"
                  style={{ width: `${(biaData.rto / 24) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Max 24 hours</p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">RPO (Recovery Point Objective)</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">{biaData.rpo} minutes</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all"
                  style={{ width: `${(biaData.rpo / 60) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Max 60 minutes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Path Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6" data-testid="critical-path">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Critical Path Analysis
        </h2>
        <div className="dependency-chain space-y-3">
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div className="flex-1">
              <div className="font-medium">Customer Database</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Blocks 5 downstream services</div>
            </div>
            <div className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full text-xs font-medium">
              Critical
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800 ml-8">
            <div className="w-5 h-5 border-l-4 border-orange-500"></div>
            <div className="flex-1">
              <div className="font-medium">Payment Processing</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Blocks 3 downstream services</div>
            </div>
            <div className="px-3 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded-full text-xs font-medium">
              High
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 ml-16">
            <div className="w-5 h-5 border-l-4 border-yellow-500"></div>
            <div className="flex-1">
              <div className="font-medium">User Authentication</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Blocks 2 downstream services</div>
            </div>
            <div className="px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full text-xs font-medium">
              Medium
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 ml-24">
            <div className="w-5 h-5 border-l-4 border-green-500"></div>
            <div className="flex-1">
              <div className="font-medium">Reporting Service</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">No downstream dependencies</div>
            </div>
            <div className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-xs font-medium">
              Low
            </div>
          </div>
        </div>
      </div>

      {/* Impact Factors */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Impact Factors</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Revenue Impact</div>
            <div className="text-2xl font-bold text-red-600">$2.5M/day</div>
          </div>
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Users Affected</div>
            <div className="text-2xl font-bold text-orange-600">50,000</div>
          </div>
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Compliance Risk</div>
            <div className="text-2xl font-bold text-yellow-600">Medium</div>
          </div>
        </div>
      </div>
    </div>
  );
}

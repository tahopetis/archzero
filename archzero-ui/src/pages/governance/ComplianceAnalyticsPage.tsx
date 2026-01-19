/**
 * Compliance Analytics Page
 * Displays compliance score trends and framework comparisons
 */

import { Shield, Award } from 'lucide-react';

export function ComplianceAnalyticsPage() {
  return (
    <div className="min-h-screen bg-slate-50" data-testid="compliance-analytics-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Compliance Analytics</h1>
          <p className="text-slate-600 mt-1">Track compliance scores and framework performance</p>
        </div>

        {/* Compliance Score Trends */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Shield className="text-green-600" />
            Compliance Score Trends
          </h2>
          <div
            className="h-64 flex items-center justify-center bg-slate-50 rounded-lg"
            data-testid="compliance-score-chart"
          >
            <div className="text-center score-trends">
              <p className="text-slate-600 mb-4">Compliance Score Over Time</p>
              <div className="flex items-end justify-center gap-6 h-40">
                <div className="flex flex-col items-center">
                  <div className="w-12 bg-green-500 rounded-t" style={{ height: '85%' }} title="GDPR: 85%"></div>
                  <span className="text-xs text-slate-600 mt-2">GDPR</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 bg-green-500 rounded-t" style={{ height: '78%' }} title="SOX: 78%"></div>
                  <span className="text-xs text-slate-600 mt-2">SOX</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 bg-green-500 rounded-t" style={{ height: '92%' }} title="ISO 27001: 92%"></div>
                  <span className="text-xs text-slate-600 mt-2">ISO</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 bg-yellow-500 rounded-t" style={{ height: '65%' }} title="HIPAA: 65%"></div>
                  <span className="text-xs text-slate-600 mt-2">HIPAA</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 bg-green-500 rounded-t" style={{ height: '88%' }} title="PCI DSS: 88%"></div>
                  <span className="text-xs text-slate-600 mt-2">PCI</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-4">Average Compliance Score: 81.8%</p>
            </div>
          </div>
        </div>

        {/* Framework Comparison */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Award className="text-indigo-600" />
            Framework Comparison
          </h2>
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            data-testid="framework-comparison"
          >
            {/* GDPR Card */}
            <div className="border rounded-lg p-4 framework-compare">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-slate-900">GDPR</h3>
                <span className="text-2xl font-bold text-green-600">85%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
              <p className="text-xs text-slate-600">24/28 requirements met</p>
            </div>

            {/* SOX Card */}
            <div className="border rounded-lg p-4 framework-compare">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-slate-900">SOX</h3>
                <span className="text-2xl font-bold text-green-600">78%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '78%' }}></div>
              </div>
              <p className="text-xs text-slate-600">18/23 requirements met</p>
            </div>

            {/* HIPAA Card */}
            <div className="border rounded-lg p-4 framework-compare">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-slate-900">HIPAA</h3>
                <span className="text-2xl font-bold text-yellow-600">65%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
              <p className="text-xs text-slate-600">13/20 requirements met</p>
            </div>

            {/* ISO 27001 Card */}
            <div className="border rounded-lg p-4 framework-compare">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-slate-900">ISO 27001</h3>
                <span className="text-2xl font-bold text-green-600">92%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '92%' }}></div>
              </div>
              <p className="text-xs text-slate-600">35/38 requirements met</p>
            </div>

            {/* PCI DSS Card */}
            <div className="border rounded-lg p-4 framework-compare">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-slate-900">PCI DSS</h3>
                <span className="text-2xl font-bold text-green-600">88%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '88%' }}></div>
              </div>
              <p className="text-xs text-slate-600">43/49 requirements met</p>
            </div>

            {/* SOC 2 Card */}
            <div className="border rounded-lg p-4 framework-compare">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-slate-900">SOC 2</h3>
                <span className="text-2xl font-bold text-green-600">82%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '82%' }}></div>
              </div>
              <p className="text-xs text-slate-600">28/34 requirements met</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

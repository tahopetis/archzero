/**
 * Compliance Score Card Component
 * Displays overall compliance score and metrics
 */

import { Shield, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useComplianceDashboard } from '@/lib/governance-hooks';
import { Card } from '../shared';

interface ComplianceScoreCardProps {
  framework?: string;
}

export function ComplianceScoreCard({ framework = 'all' }: ComplianceScoreCardProps) {
  // For now, use mock data. In production, this would fetch from API
  const complianceScore = framework === 'all' ? 78 : 85;
  const totalRequirements = 150;
  const compliantCount = Math.round(totalRequirements * (complianceScore / 100));
  const nonCompliantCount = totalRequirements - compliantCount;
  const pendingCount = Math.round(totalRequirements * 0.1);

  return (
    <Card className="p-6" data-testid="compliance-dashboard">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900">Compliance Overview</h2>
        </div>
        <span className="text-xs text-slate-500">
          Last updated: {new Date().toLocaleDateString()}
        </span>
      </div>

      {/* Main Score */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {/* Overall Score */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold opacity-90">Compliance Score</h3>
            <Shield className="w-5 h-5 opacity-75" />
          </div>
          <div className="text-4xl font-bold mb-2">{complianceScore}%</div>
          <p className="text-xs opacity-75">Overall compliance rate</p>
        </div>

        {/* Compliant */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-emerald-800">Compliant</h3>
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold text-emerald-700 mb-2">{compliantCount}</div>
          <p className="text-xs text-emerald-600">Requirements met</p>
        </div>

        {/* Non-Compliant */}
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-rose-800">Non-Compliant</h3>
            <XCircle className="w-5 h-5 text-rose-600" />
          </div>
          <div className="text-3xl font-bold text-rose-700 mb-2">{nonCompliantCount}</div>
          <p className="text-xs text-rose-600">Requires attention</p>
        </div>

        {/* Pending */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-amber-800">Pending</h3>
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-3xl font-bold text-amber-700 mb-2">{pendingCount}</div>
          <p className="text-xs text-amber-600">Awaiting assessment</p>
        </div>
      </div>

      {/* Framework Breakdown */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Framework Breakdown</h3>
        <div className="space-y-3">
          {[
            { name: 'GDPR', score: 85, color: 'bg-indigo-500' },
            { name: 'SOX', score: 72, color: 'bg-blue-500' },
            { name: 'ISO 27001', score: 78, color: 'bg-teal-500' },
            { name: 'HIPAA', score: 81, color: 'bg-purple-500' },
          ].map((fw) => (
            <div key={fw.name} className="flex items-center gap-3">
              <div className="w-24 text-sm font-medium text-slate-700">{fw.name}</div>
              <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full ${fw.color} transition-all duration-300`}
                  style={{ width: `${fw.score}%` }}
                />
              </div>
              <div className="w-12 text-sm font-semibold text-slate-700 text-right">{fw.score}%</div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

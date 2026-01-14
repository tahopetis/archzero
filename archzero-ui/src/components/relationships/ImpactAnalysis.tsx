/**
 * Impact Analysis Component
 */

import { useImpactAnalysis } from '@/lib/relationship-hooks';
import { cn } from '@/components/governance/shared';
import { AlertTriangle, ArrowUp, ArrowDown, Shield, Activity } from 'lucide-react';

interface ImpactAnalysisProps {
  cardId: string;
}

export function ImpactAnalysis({ cardId }: ImpactAnalysisProps) {
  const { data: impact, isLoading } = useImpactAnalysis(cardId);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-slate-200 rounded"></div>
            <div className="h-20 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!impact) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-slate-500">No impact data available</p>
      </div>
    );
  }

  const riskColors = {
    low: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    medium: 'bg-amber-100 text-amber-800 border-amber-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    critical: 'bg-rose-100 text-rose-800 border-rose-200',
  };

  const riskIcons = {
    low: Shield,
    medium: Activity,
    high: AlertTriangle,
    critical: AlertTriangle,
  };

  const RiskIcon = riskIcons[impact.risk_level];

  return (
    <div className="bg-white rounded-lg shadow p-6" data-testid="impact-analyze-button">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Impact Analysis</h3>
        <p className="text-sm text-slate-500">
          Assess the potential impact of changes to this card
        </p>
      </div>

      <div className={cn(
        'flex items-center gap-3 p-4 rounded-lg border mb-6',
        riskColors[impact.risk_level]
      )}
        data-testid="impact-score-summary">
        <RiskIcon className="w-6 h-6" />
        <div>
          <div className="font-semibold text-lg capitalize">{impact.risk_level} Risk</div>
          <div className="text-sm opacity-90">Criticality Score: {impact.criticality}/100</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ArrowUp className="w-5 h-5 text-slate-600" />
            <h4 className="font-semibold text-slate-900">Upstream Dependencies</h4>
            <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-700 rounded-full">
              {impact.upstream.length}
            </span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto" data-testid="impact-upstream-list">
            {impact.upstream.length === 0 ? (
              <p className="text-sm text-slate-500">No upstream dependencies</p>
            ) : (
              impact.upstream.map((id) => (
                <div
                  key={id}
                  data-testid={`impact-item-${id}`}
                  className="p-2 bg-slate-50 rounded text-sm text-slate-700 font-mono"
                >
                  {id.slice(0, 8)}...
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <ArrowDown className="w-5 h-5 text-slate-600" />
            <h4 className="font-semibold text-slate-900">Downstream Dependencies</h4>
            <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-700 rounded-full">
              {impact.downstream.length}
            </span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto" data-testid="impact-downstream-list">
            {impact.downstream.length === 0 ? (
              <p className="text-sm text-slate-500">No downstream dependencies</p>
            ) : (
              impact.downstream.map((id) => (
                <div
                  key={id}
                  data-testid={`impact-item-${id}`}
                  className="p-2 bg-slate-50 rounded text-sm text-slate-700 font-mono"
                >
                  {id.slice(0, 8)}...
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t">
        <h4 className="font-semibold text-slate-900 mb-3">Recommendations</h4>
        <div className="space-y-2">
          {impact.risk_level === 'critical' && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800">
              ⚠️ Changes to this card will have critical impact. Consult with architecture review board before making changes.
            </div>
          )}
          {impact.risk_level === 'high' && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
              🔥 This card has high impact. Review dependencies carefully before making changes.
            </div>
          )}
          {impact.downstream.length > 5 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              📢 This card has many downstream dependencies. Consider breaking it into smaller components.
            </div>
          )}
          {impact.upstream.length === 0 && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
              ✅ This card has no upstream dependencies. It is a good candidate for refactoring.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

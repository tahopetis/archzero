/**
 * Risk Management Components
 * Including Risk Heat Map visualization
 */

import { useMemo, memo } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  AlertTriangle,
  TrendingDown,
  Edit3,
  Trash2,
  Plus,
  Flame
} from 'lucide-react';
import { RiskType, RiskStatus, type Risk } from '@/types/governance';
import { useRisks, useRiskHeatMap, useTopRisks } from '@/lib/governance-hooks';
import {
  Card,
  StatusBadge,
  CategoryBadge,
  PriorityBadge,
  IconBadge,
  MetadataItem,
  cn
} from '../shared';

// ============================================================================
// RISK CARD
// ============================================================================

interface RiskCardProps {
  risk: Risk;
  onEdit?: (risk: Risk) => void;
  onDelete?: (id: string) => void;
  onApprove?: (risk: Risk) => void;
  onEscalate?: (risk: Risk) => void;
}

export function RiskCard({ risk, onEdit, onDelete, onApprove, onEscalate }: RiskCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 15) return 'bg-rose-500';
    if (score >= 10) return 'bg-orange-500';
    if (score >= 5) return 'bg-amber-500';
    return 'bg-blue-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 15) return 'Critical';
    if (score >= 10) return 'High';
    if (score >= 5) return 'Medium';
    return 'Low';
  };

  // Determine if risk requires approval (high score or critical)
  const requiresApproval = risk.riskScore >= 15 || risk.impact >= 4;
  const isPending = risk.approvalStatus === 'pending';
  const isOverdue = risk.isOverdue || false;

  return (
    <Card
      variant="bordered"
      className="risk-item group hover:shadow-lg transition-all"
      data-testid="risk-item"
      data-status={risk.approvalStatus || risk.status}
      data-overdue={isOverdue ? 'true' : undefined}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="text-lg font-bold text-slate-900">{risk.name}</h3>
            <StatusBadge variant={risk.status === 'Open' ? 'open' : 'closed'}>
              {risk.status}
            </StatusBadge>
            {requiresApproval && !risk.approvalStatus && (
              <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium">
                Requires Approval
              </span>
            )}
            {isPending && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                Pending Approval
              </span>
            )}
            {risk.approvalStatus === 'approved' && (
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                Approved
              </span>
            )}
            {isOverdue && (
              <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                Overdue
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">{risk.riskType}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className={cn(
            'w-12 h-12 rounded-lg flex items-center justify-center',
            getScoreColor(risk.riskScore)
          )}>
            <span className="text-white font-bold text-lg">{risk.riskScore}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Likelihood</p>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-2 flex-1 rounded-sm',
                  i < risk.likelihood ? 'bg-rose-500' : 'bg-slate-200'
                )}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Impact</p>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-2 flex-1 rounded-sm',
                  i < risk.impact ? 'bg-orange-500' : 'bg-slate-200'
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {risk.mitigationPlan && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
            Mitigation Plan
          </p>
          <p className="text-sm text-slate-700 line-clamp-2">{risk.mitigationPlan}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        {risk.owner && (
          <MetadataItem label="Owner" value={risk.owner} icon={Shield} />
        )}
        {risk.targetClosureDate && (
          <span className="text-xs text-slate-500">
            Target: {new Date(risk.targetClosureDate).toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 flex-wrap">
        {onEdit && (
          <button
            onClick={() => onEdit(risk)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Edit
          </button>
        )}
        {isPending && onApprove && (
          <button
            onClick={() => onApprove(risk)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
            data-testid="approve-risk-btn"
          >
            <Shield className="w-4 h-4" />
            Approve
          </button>
        )}
        {isOverdue && onEscalate && (
          <button
            onClick={() => onEscalate(risk)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
            data-testid="escalate-risk-btn"
          >
            <AlertTriangle className="w-4 h-4" />
            Escalate
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(risk.id)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        )}
      </div>
    </Card>
  );
}

// ============================================================================
// RISKS LIST
// ============================================================================

interface RisksListProps {
  riskType?: RiskType;
  status?: RiskStatus;
  onEdit?: (risk: Risk) => void;
  onDelete?: (id: string) => void;
  onApprove?: (risk: Risk) => void;
  onEscalate?: (risk: Risk) => void;
}

export const RisksList = memo(function RisksList({ riskType, status, onEdit, onDelete, onApprove, onEscalate }: RisksListProps) {
  const { data: risks, isLoading, error } = useRisks({ riskType, status });

  if (isLoading) {
    return <div className="animate-pulse bg-slate-100 h-64 rounded-xl" data-testid="risks-list" />;
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-lg" data-testid="risks-list">
        <p className="text-rose-800">Error loading risks: {error.message}</p>
      </div>
    );
  }

  const risksArray = risks?.data || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="risks-list">
      {risksArray.length === 0 ? (
        <div className="col-span-full p-6 bg-slate-50 rounded-lg text-center">
          <Shield className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500">No risks found</p>
        </div>
      ) : (
        risksArray.map((risk) => (
          <RiskCard
            key={risk.id}
            risk={risk}
            onEdit={onEdit}
            onDelete={onDelete}
            onApprove={onApprove}
            onEscalate={onEscalate}
          />
        ))
      )}
    </div>
  );
});

// ============================================================================
// RISK HEAT MAP
// ============================================================================

interface HeatMapCellProps {
  likelihood: number;
  impact: number;
  count: number;
  risks: Risk[];
  onClick?: (risks: Risk[]) => void;
}

function HeatMapCell({ likelihood, impact, count, risks, onClick }: HeatMapCellProps) {
  const getCellColor = () => {
    const score = likelihood * impact;
    if (score >= 15) return 'bg-rose-500 hover:bg-rose-600';
    if (score >= 10) return 'bg-orange-500 hover:bg-orange-600';
    if (score >= 5) return 'bg-amber-400 hover:bg-amber-500';
    return 'bg-blue-400 hover:bg-blue-500';
  };

  return (
    <button
      onClick={() => onClick?.(risks)}
      className={cn(
        'relative aspect-square rounded-lg transition-all duration-200',
        'flex flex-col items-center justify-center',
        'hover:scale-105 hover:shadow-lg',
        getCellColor(),
        count === 0 && 'opacity-30 hover:opacity-40'
      )}
    >
      <span className="text-2xl font-bold text-white">{count}</span>
      <span className="text-xs text-white/80">{likelihood}×{impact}</span>
    </button>
  );
}

export const RiskHeatMap = memo(function RiskHeatMap({ onSelectRisks }: { onSelectRisks?: (risks: Risk[]) => void }) {
  const { data: heatMapData, isLoading } = useRiskHeatMap();

  // Always render the container with data-testid
  return (
    <Card className="p-6" data-testid="risk-heatmap">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Risk Heat Map</h2>
          <p className="text-sm text-slate-600">
            {heatMapData ? `${heatMapData.totalRisks} risks • Avg score: ${heatMapData.avgRiskScore.toFixed(1)}` : 'Loading...'}
          </p>
        </div>
        <IconBadge icon={Flame} label="Heat Map" variant="danger" />
      </div>

      {isLoading ? (
        <div className="animate-pulse bg-slate-100 h-64 rounded-lg flex items-center justify-center">
          <p className="text-slate-500">Loading heat map...</p>
        </div>
      ) : !heatMapData ? (
        <div className="bg-slate-50 rounded-lg p-8 text-center">
          <Flame className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600">Unable to load risk heat map</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Y-axis label */}
          <div className="flex items-center">
            <div className="w-16 text-xs font-semibold text-slate-500 text-right pr-2">
              IMPACT
            </div>

            {/* Grid */}
            <div className="flex-1 grid grid-cols-5 gap-2">
              {(() => {
                const grid: Array<{ likelihood: number; impact: number; count: number; risks: Risk[] }> = [];

                for (let impact = 5; impact >= 1; impact--) {
                  for (let likelihood = 1; likelihood <= 5; likelihood++) {
                    const cell = heatMapData.cells.find(
                      c => c.likelihood === likelihood && c.impact === impact
                    );

                    grid.push({
                      likelihood,
                      impact,
                      count: cell?.count || 0,
                      risks: cell?.risks || []
                    });
                  }
                }

                return grid.map((cell, idx) => (
                  <HeatMapCell
                    key={`${cell.likelihood}-${cell.impact}`}
                    likelihood={cell.likelihood}
                    impact={cell.impact}
                    count={cell.count}
                    risks={cell.risks}
                    onClick={onSelectRisks}
                  />
                ));
              })()}
            </div>
          </div>

          {/* X-axis label */}
          <div className="flex items-center justify-center">
            <div className="w-16" />
            <div className="flex-1 text-center">
              <span className="text-xs font-semibold text-slate-500">LIKELIHOOD →</span>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-rose-500" />
          <span className="text-xs text-slate-600">Critical (15-25)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-500" />
          <span className="text-xs text-slate-600">High (10-14)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-400" />
          <span className="text-xs text-slate-600">Medium (5-9)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-400" />
          <span className="text-xs text-slate-600">Low (1-4)</span>
        </div>
      </div>
    </Card>
  );
});

// ============================================================================
// TOP RISKS
// ============================================================================

export const TopRisks = memo(function TopRisks() {
  const { data: topRisks, isLoading } = useTopRisks();

  if (isLoading) {
    return <div className="animate-pulse bg-slate-100 h-64 rounded-xl" data-testid="top-risks" />;
  }

  if (!topRisks || topRisks.risks.length === 0) {
    return (
      <Card className="p-6" data-testid="top-risks">
        <div className="text-center py-8">
          <Shield className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500">No risks found</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6" data-testid="top-risks">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          <h2 className="text-lg font-bold text-slate-900">Top {topRisks.risks.length} Risks</h2>
        </div>
        <Link
          to="/governance/risks"
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          View All →
        </Link>
      </div>

      <div className="space-y-3" data-testid="top-risks-container">
        {topRisks.risks.map((risk, idx) => (
          <Link
            key={risk.id}
            to={`/governance/risks/${risk.id}`}
            className="block p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            data-testid="risk-item"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white',
                  idx < 3 ? 'bg-rose-500' : 'bg-amber-500'
                )}>
                  {idx + 1}
                </span>
                <div>
                  <p className="font-medium text-slate-900">{risk.name}</p>
                  <p className="text-xs text-slate-500">{risk.riskType} • {risk.status}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-rose-600">{risk.riskScore}</p>
                <p className="text-xs text-slate-500">Score</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
});

// ============================================================================
// RISK DASHBOARD
// ============================================================================

export const RiskDashboard = memo(function RiskDashboard() {
  return (
    <div className="space-y-6" data-testid="risk-dashboard">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Risk Management</h1>
        <p className="text-slate-600">Monitor and mitigate technical and operational risks</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RiskHeatMap />
        </div>
        <div>
          <TopRisks />
        </div>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">All Risks</h2>
        <RisksList />
      </Card>
    </div>
  );
});

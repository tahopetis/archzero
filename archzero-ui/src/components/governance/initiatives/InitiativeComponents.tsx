/**
 * Strategic Initiatives Components
 * Including Kanban board and impact map visualization
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Pause,
  Edit3,
  Trash2,
  Plus,
  DollarSign,
  Calendar,
  Users,
  ArrowRight
} from 'lucide-react';
import {
  InitiativeStatus,
  InitiativeHealth,
  InitiativeType,
  type Initiative,
  type InitiativeImpactMap
} from '@/types/governance';
import { useInitiatives, useInitiativeImpactMap } from '@/lib/governance-hooks';
import {
  Card,
  StatusBadge,
  IconBadge,
  MetadataItem,
  cn
} from '../shared';

// ============================================================================
// INITIATIVE CARD
// ============================================================================

interface InitiativeCardProps {
  initiative: Initiative;
  onEdit?: (initiative: Initiative) => void;
  onDelete?: (id: string) => void;
}

export function InitiativeCard({ initiative, onEdit, onDelete }: InitiativeCardProps) {
  const getStatusVariant = (status: InitiativeStatus) => {
    switch (status) {
      case 'Proposed': return 'proposed';
      case 'Approved': return 'approved';
      case 'InProgress': return 'inProgress';
      case 'OnHold': return 'onHold';
      case 'Completed': return 'completed';
      case 'Cancelled': return 'cancelled';
    }
  };

  const getHealthColor = (health: InitiativeHealth) => {
    switch (health) {
      case 'OnTrack': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'AtRisk': return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'Critical': return 'bg-rose-100 text-rose-800 border border-rose-200';
    }
  };

  return (
    <Card variant="bordered" className="group hover:shadow-lg transition-all" data-testid={`initiative-item-${initiative.id}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="text-lg font-bold text-slate-900">{initiative.name}</h3>
            <StatusBadge variant={getStatusVariant(initiative.status) as any}>
              {initiative.status}
            </StatusBadge>
            <span className={cn('px-2 py-1 rounded-md text-xs font-semibold border', getHealthColor(initiative.health))}>
              {initiative.health}
            </span>
          </div>
          {initiative.description && (
            <p className="text-sm text-slate-600 line-clamp-2">{initiative.description}</p>
          )}
        </div>
      </div>

      <div className="mb-3">
        <MetadataItem
          label="Type"
          value={initiative.initiativeType}
          icon={Target}
        />
      </div>

      {/* Progress Bar */}
      {initiative.progress !== undefined && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Progress</span>
            <span className="text-sm font-semibold text-slate-900">{initiative.progress}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                initiative.progress >= 80 ? 'bg-emerald-500' :
                initiative.progress >= 50 ? 'bg-blue-500' :
                'bg-amber-500'
              )}
              style={{ width: `${initiative.progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-3">
        {initiative.budget && (
          <MetadataItem
            label="Budget"
            value={`$${(initiative.budget / 1000).toFixed(0)}K`}
            icon={DollarSign}
          />
        )}
        {initiative.ownerId && (
          <MetadataItem
            label="Owner"
            value={initiative.ownerId}
            icon={Users}
          />
        )}
      </div>

      {(initiative.startDate || initiative.endDate) && (
        <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
          {initiative.startDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Start: {new Date(initiative.startDate).toLocaleDateString()}</span>
            </div>
          )}
          {initiative.endDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>End: {new Date(initiative.endDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
        {onEdit && (
          <button
            onClick={() => onEdit(initiative)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Edit
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(initiative.id)}
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
// INITIATIVES LIST
// ============================================================================

interface InitiativesListProps {
  status?: InitiativeStatus;
  onEdit?: (initiative: Initiative) => void;
  onDelete?: (id: string) => void;
}

export function InitiativesList({ status, onEdit, onDelete }: InitiativesListProps) {
  const { data: initiatives, isLoading } = useInitiatives({ status });

  if (isLoading) {
    return <div className="animate-pulse bg-slate-100 h-64 rounded-xl" />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="initiatives-list">
      {initiatives?.data.map((initiative) => (
        <InitiativeCard key={initiative.id} initiative={initiative} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}

// ============================================================================
// KANBAN BOARD
// ============================================================================

interface KanbanBoardProps {
  onEdit?: (initiative: Initiative) => void;
}

export function KanbanBoard({ onEdit }: KanbanBoardProps) {
  const { data: initiatives, isLoading } = useInitiatives();

  if (isLoading) {
    return <div className="animate-pulse bg-slate-100 h-96 rounded-xl" />;
  }

  const columns: InitiativeStatus[] = [
    InitiativeStatus.Proposed,
    InitiativeStatus.Approved,
    InitiativeStatus.InProgress,
    InitiativeStatus.OnHold,
    InitiativeStatus.Completed
  ];

  const getVariant = (status: InitiativeStatus) => {
    switch (status) {
      case InitiativeStatus.Proposed: return 'proposed';
      case InitiativeStatus.Approved: return 'approved';
      case InitiativeStatus.InProgress: return 'inProgress';
      case InitiativeStatus.OnHold: return 'onHold';
      case InitiativeStatus.Completed: return 'completed';
      case InitiativeStatus.Cancelled: return 'cancelled';
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => {
        const columnInitiatives = initiatives?.data.filter(i => i.status === column) || [];

        return (
          <div key={column} className="flex-shrink-0 w-80">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusBadge variant={getVariant(column) as any}>
                  {column}
                </StatusBadge>
                <span className="text-sm text-slate-500">{columnInitiatives.length}</span>
              </div>
            </div>

            <div className="space-y-3">
              {columnInitiatives.map((initiative) => (
                <InitiativeCard
                  key={initiative.id}
                  initiative={initiative}
                  onEdit={onEdit}
                />
              ))}

              {columnInitiatives.length === 0 && (
                <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                  <p className="text-sm text-slate-400">No initiatives</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// IMPACT MAP
// ============================================================================

interface ImpactMapProps {
  initiativeId: string;
}

export function ImpactMap({ initiativeId }: ImpactMapProps) {
  const { data: impactMap, isLoading } = useInitiativeImpactMap(initiativeId);

  if (isLoading) {
    return <div className="animate-pulse bg-slate-100 h-64 rounded-xl" />;
  }

  if (!impactMap) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <Target className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500">No impact data available</p>
        </div>
      </Card>
    );
  }

  // Group by card type
  const byType = impactMap.impactedCards.reduce((acc, card) => {
    if (!acc[card.cardType]) {
      acc[card.cardType] = [];
    }
    acc[card.cardType].push(card);
    return acc;
  }, {} as Record<string, typeof impactMap.impactedCards>);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900">Impact Map</h2>
        </div>
        <span className="text-sm text-slate-600">
          {impactMap.impactedCards.length} cards impacted
        </span>
      </div>

      <div className="space-y-4">
        {Object.entries(byType).map(([type, cards]) => (
          <div key={type}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {type}
              </span>
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                {cards.length}
              </span>
            </div>

            <div className="space-y-2">
              {cards.map((card) => (
                <Link
                  key={card.cardId}
                  to={`/cards/${card.cardId}`}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{card.cardName}</p>
                    <p className="text-xs text-slate-500">{card.impactType}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ============================================================================
// INITIATIVE DASHBOARD
// ============================================================================

export function InitiativeDashboard() {
  const { data: initiatives, isLoading } = useInitiatives();

  if (isLoading) {
    return <div className="animate-pulse bg-slate-100 h-96 rounded-xl" />;
  }

  const stats = {
    total: initiatives?.data.length || 0,
    inProgress: initiatives?.data.filter(i => i.status === 'InProgress').length || 0,
    onTrack: initiatives?.data.filter(i => i.health === 'OnTrack').length || 0,
    atRisk: initiatives?.data.filter(i => i.health === 'AtRisk').length || 0,
    critical: initiatives?.data.filter(i => i.health === 'Critical').length || 0,
    totalBudget: initiatives?.data.reduce((sum, i) => sum + (i.budget || 0), 0) || 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Strategic Initiatives</h1>
        <p className="text-slate-600">Track and manage strategic transformation initiatives</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Total</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Active</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{stats.onTrack}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wide">On Track</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.atRisk}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wide">At Risk</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-rose-600">{stats.critical}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Critical</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-indigo-600">
              ${(stats.totalBudget / 1000000).toFixed(1)}M
            </p>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Budget</p>
          </div>
        </Card>
      </div>

      {/* Kanban Board */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Kanban Board</h2>
        <KanbanBoard />
      </Card>

      {/* All Initiatives */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">All Initiatives</h2>
        <InitiativesList />
      </Card>
    </div>
  );
}

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
  ArrowRight,
  User,
  MessageSquare,
  Send,
  Activity,
  Bell
} from 'lucide-react';
import {
  InitiativeStatus,
  InitiativeHealth,
  InitiativeType,
  type Initiative,
  type InitiativeImpactMap
} from '@/types/governance';
import { useInitiatives, useInitiative, useInitiativeImpactMap } from '@/lib/governance-hooks';
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
    <Card variant="bordered" className="group hover:shadow-lg transition-all" data-testid="initiative-item">
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

// ============================================================================
// INITIATIVE DETAIL
// ============================================================================

interface InitiativeDetailProps {
  initiativeId: string;
}

export function InitiativeDetail({ initiativeId }: InitiativeDetailProps) {
  const { data: initiative, isLoading } = useInitiative(initiativeId);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity'>('overview');
  const [healthValue, setHealthValue] = useState<InitiativeHealth>(initiative?.health || InitiativeHealth.OnTrack);
  const [healthReason, setHealthReason] = useState('');
  const [showHealthUpdate, setShowHealthUpdate] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Array<{ id: string; text: string; author: string; timestamp: Date }>>([]);
  const [showOwnerAssign, setShowOwnerAssign] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState('');

  if (isLoading) {
    return <div className="animate-pulse bg-slate-100 h-96 rounded-xl" />;
  }

  if (!initiative) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Initiative not found</p>
      </div>
    );
  }

  // Calculate budget breakdown
  const allocated = initiative.budget || 0;
  const spent = initiative.progress ? (allocated * initiative.progress) / 100 : 0;
  const remaining = allocated - spent;

  const handleHealthUpdate = () => {
    setShowHealthUpdate(true);
  };

  const saveHealthUpdate = () => {
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
    setShowHealthUpdate(false);
  };

  const addComment = () => {
    if (commentText.trim()) {
      setComments([
        ...comments,
        {
          id: Date.now().toString(),
          text: commentText,
          author: 'Current User',
          timestamp: new Date()
        }
      ]);
      setCommentText('');
    }
  };

  const assignOwner = () => {
    setShowOwnerAssign(true);
  };

  const saveOwnerAssignment = () => {
    setShowOwnerAssign(false);
  };

  // Sample activity data
  const activities = [
    { id: '1', action: 'Initiative created', user: 'Admin', timestamp: new Date(Date.now() - 86400000) },
    { id: '2', action: 'Budget updated to $1,000,000', user: 'Admin', timestamp: new Date(Date.now() - 43200000) },
    { id: '3', action: 'Health status changed to On Track', user: 'Admin', timestamp: new Date(Date.now() - 3600000) },
  ];

  return (
    <div className="space-y-6" data-testid="initiative-detail">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{initiative.name}</h1>
            {initiative.description && (
              <p className="text-slate-600">{initiative.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <StatusBadge variant={initiative.status === 'InProgress' ? 'inProgress' : 'proposed' as any}>
              {initiative.status}
            </StatusBadge>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetadataItem
            label="Type"
            value={initiative.initiativeType}
            icon={Target}
          />
          {initiative.startDate && (
            <MetadataItem
              label="Start Date"
              value={new Date(initiative.startDate).toLocaleDateString()}
              icon={Calendar}
            />
          )}
          {initiative.endDate && (
            <MetadataItem
              label="End Date"
              value={new Date(initiative.endDate).toLocaleDateString()}
              icon={Calendar}
            />
          )}
          {initiative.ownerId && (
            <MetadataItem
              label="Owner"
              value={initiative.ownerId}
              icon={User}
            />
          )}
        </div>

        {/* Assign Owner Button */}
        <div className="mt-4">
          <button
            onClick={assignOwner}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            data-testid="assign-owner-btn"
          >
            <User className="w-4 h-4" />
            Assign Owner
          </button>
        </div>

        {/* Owner Assignment Modal */}
        {showOwnerAssign && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Assign Owner</h3>
            <div className="flex gap-3">
              <select
                value={selectedOwner}
                onChange={(e) => setSelectedOwner(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                data-testid="owner-select"
              >
                <option value="">Select an owner...</option>
                <option value="admin@archzero.local">admin@archzero.local</option>
                <option value="architect@archzero.local">architect@archzero.local</option>
                <option value="manager@archzero.local">manager@archzero.local</option>
              </select>
              <button
                onClick={saveOwnerAssignment}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Assign
              </button>
              <button
                onClick={() => setShowOwnerAssign(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex -mb-px space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'activity'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
            data-testid="activity-tab"
          >
            <Activity className="w-4 h-4" />
            Activity
          </button>
        </nav>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Budget Tracking */}
          <Card className="p-6" data-testid="initiative-budget">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Budget Tracking</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Allocated</p>
                <p className="text-2xl font-bold text-slate-900" data-testid="budget-allocated">
                  ${allocated.toLocaleString()}
                </p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">Spent</p>
                <p className="text-2xl font-bold text-blue-700" data-testid="budget-spent">
                  ${spent.toLocaleString()}
                </p>
              </div>
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-2">Remaining</p>
                <p className="text-2xl font-bold text-emerald-700" data-testid="budget-remaining">
                  ${remaining.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          {/* Health Status */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Health Status</h2>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">Current Status</p>
                <select
                  value={healthValue}
                  onChange={(e) => setHealthValue(e.target.value as InitiativeHealth)}
                  className="text-lg font-semibold px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  data-testid="initiative-health"
                >
                  <option value="OnTrack">On Track</option>
                  <option value="AtRisk">At Risk</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div className={cn(
                'px-4 py-2 rounded-lg font-semibold border',
                healthValue === 'OnTrack' && 'bg-emerald-100 text-emerald-800 border-emerald-200',
                healthValue === 'AtRisk' && 'bg-amber-100 text-amber-800 border-amber-200',
                healthValue === 'Critical' && 'bg-rose-100 text-rose-800 border-rose-200'
              )}>
                {healthValue === 'OnTrack' && '✓ On Track'}
                {healthValue === 'AtRisk' && '⚠ At Risk'}
                {healthValue === 'Critical' && '✗ Critical'}
              </div>
            </div>

            {showHealthUpdate && (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <label className="block text-sm font-medium text-slate-700 mb-2">Reason for change</label>
                <textarea
                  value={healthReason}
                  onChange={(e) => setHealthReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows={3}
                  placeholder="Provide a reason for the health status change..."
                  data-testid="health-reason"
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={saveHealthUpdate}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setShowHealthUpdate(false)}
                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {showNotification && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600" />
                <p className="text-sm text-blue-800">Stakeholders notified of health status update</p>
              </div>
            )}
          </Card>

          {/* Progress */}
          {initiative.progress !== undefined && (
            <Card className="p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Progress</h2>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-500">Completion</span>
                  <span className="text-2xl font-bold text-slate-900" data-testid="initiative-progress">{initiative.progress}%</span>
                </div>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
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
            </Card>
          )}

          {/* Impact Map Button */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-bold text-slate-900">Impact Map</h2>
              </div>
              <button
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                data-testid="impact-map-btn"
              >
                View Impact Map
              </button>
            </div>
            <div className="mt-4 p-4 bg-slate-50 rounded-lg" data-testid="impact-map">
              <p className="text-sm text-slate-600">Impact map visualization will appear here</p>
            </div>
          </Card>

          {/* Link Cards */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-bold text-slate-900">Linked Cards</h2>
              </div>
              <button
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                data-testid="link-cards-btn"
              >
                Link Cards
              </button>
            </div>
            <div className="mt-4 p-4 bg-slate-50 rounded-lg">
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                data-testid="card-select"
              >
                <option value="">Select a card to link...</option>
                <option value="card-1">Sample Card 1</option>
                <option value="card-2">Sample Card 2</option>
              </select>
            </div>
          </Card>

          {/* Comments Section */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-bold text-slate-900">Comments</h2>
            </div>

            <div className="space-y-4">
              {/* Comment Input */}
              <div className="flex gap-3">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows={3}
                  placeholder="Add a comment..."
                  data-testid="comment-input"
                />
                <button
                  onClick={addComment}
                  className="self-end px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2"
                  data-testid="add-comment-btn"
                >
                  <Send className="w-4 h-4" />
                  Add
                </button>
              </div>

              {/* Comments List */}
              <div className="space-y-3">
                {comments.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">No comments yet. Be the first to comment!</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-900">{comment.author}</span>
                        <span className="text-xs text-slate-500">
                          {comment.timestamp.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700">{comment.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </>
      )}

      {activeTab === 'activity' && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900">Activity Feed</h2>
          </div>

          <div className="space-y-4" data-testid="activity-feed">
            {activities.map((activity) => (
              <div key={activity.id} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Activity className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-900">{activity.action}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {activity.user} • {activity.timestamp.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Impact Map */}
      <ImpactMap initiativeId={initiative.id} />
    </div>
  );
}

/**
 * Risk Mitigation Plan Tracking Page
 * Track and manage risk mitigation actions and progress
 */

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Shield,
  Plus,
  Edit3,
  Trash2,
  Calendar,
  User,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Filter,
  Download
} from 'lucide-react';
import { RiskStatus, type Risk } from '@/types/governance';
import { Card, cn } from '@/components/governance/shared';

interface MitigationTask {
  id: string;
  title: string;
  description: string;
  status: 'NotStarted' | 'InProgress' | 'Completed' | 'Blocked';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  assignee: string;
  dueDate: string;
  completedDate?: string;
  estimatedCost?: number;
  actualCost?: number;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  completed: boolean;
  completedDate?: string;
}

// Mock risk data
const mockRisk: Risk = {
  id: 'risk-1',
  name: 'Legacy Authentication System',
  riskType: 'Security' as any,
  likelihood: 4,
  impact: 5,
  riskScore: 20,
  status: RiskStatus.Open,
  mitigationPlan: 'Migrate to OAuth 2.0',
  owner: 'Security Team',
  targetClosureDate: '2026-06-30',
  type: 'Risk',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-14T00:00:00Z'
};

// Mock mitigation tasks
const mockTasks: MitigationTask[] = [
  {
    id: 'task-1',
    title: 'Design OAuth 2.0 Architecture',
    description: 'Create detailed architecture for OAuth 2.0 implementation',
    status: 'Completed',
    priority: 'High',
    assignee: 'Alice Johnson',
    dueDate: '2026-02-15',
    completedDate: '2026-02-10'
  },
  {
    id: 'task-2',
    title: 'Implement OAuth Server',
    description: 'Set up OAuth 2.0 authorization server',
    status: 'InProgress',
    priority: 'Critical',
    assignee: 'Bob Smith',
    dueDate: '2026-03-31'
  },
  {
    id: 'task-3',
    title: 'Migrate User Accounts',
    description: 'Migrate existing user accounts to new system',
    status: 'NotStarted',
    priority: 'High',
    assignee: 'Carol White',
    dueDate: '2026-05-15'
  },
  {
    id: 'task-4',
    title: 'Deprecate Legacy Endpoints',
    description: 'Phase out old authentication endpoints',
    status: 'NotStarted',
    priority: 'Medium',
    assignee: 'Dave Brown',
    dueDate: '2026-06-30'
  }
];

// Mock milestones
const mockMilestones: Milestone[] = [
  {
    id: 'milestone-1',
    title: 'Architecture Approved',
    description: 'OAuth 2.0 architecture design approved by ARB',
    targetDate: '2026-02-28',
    completed: true,
    completedDate: '2026-02-15'
  },
  {
    id: 'milestone-2',
    title: 'OAuth Server Ready',
    description: 'Production OAuth 2.0 server operational',
    targetDate: '2026-04-30',
    completed: false
  },
  {
    id: 'milestone-3',
    title: '50% Users Migrated',
    description: 'Half of all user accounts migrated',
    targetDate: '2026-05-31',
    completed: false
  },
  {
    id: 'milestone-4',
    title: 'Full Migration Complete',
    description: 'All users migrated and legacy system decommissioned',
    targetDate: '2026-06-30',
    completed: false
  }
];

export function RiskMitigationPage() {
  const { id } = useParams<{ id: string }>();
  const [tasks, setTasks] = useState<MitigationTask[]>(mockTasks);
  const [milestones, setMilestones] = useState<Milestone[]>(mockMilestones);
  const [selectedTask, setSelectedTask] = useState<MitigationTask | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const getStatusIcon = (status: MitigationTask['status']) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'InProgress':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'Blocked':
        return <AlertCircle className="w-5 h-5 text-rose-600" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: MitigationTask['status']) => {
    const styles = {
      NotStarted: 'bg-slate-100 text-slate-700 border-slate-200',
      InProgress: 'bg-blue-100 text-blue-700 border-blue-200',
      Completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      Blocked: 'bg-rose-100 text-rose-700 border-rose-200'
    };
    return styles[status];
  };

  const getPriorityBadge = (priority: MitigationTask['priority']) => {
    const styles = {
      Critical: 'bg-rose-100 text-rose-700 border-rose-200',
      High: 'bg-orange-100 text-orange-700 border-orange-200',
      Medium: 'bg-amber-100 text-amber-700 border-amber-200',
      Low: 'bg-slate-100 text-slate-700 border-slate-200'
    };
    return styles[priority];
  };

  const filteredTasks = filterStatus === 'All'
    ? tasks
    : tasks.filter(task => task.status === filterStatus);

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'Completed').length,
    inProgress: tasks.filter(t => t.status === 'InProgress').length,
    blocked: tasks.filter(t => t.status === 'Blocked').length,
    notStarted: tasks.filter(t => t.status === 'NotStarted').length
  };

  const completedMilestones = milestones.filter(m => m.completed).length;
  const overallProgress = Math.round((completedMilestones / milestones.length) * 100);

  return (
    <div className="min-h-screen bg-slate-50" data-testid="mitigation-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
            <Link to="/governance/risks" className="hover:text-indigo-600">
              Risks
            </Link>
            <span>/</span>
            <Link to={`/governance/risks/${id}`} className="hover:text-indigo-600">
              {mockRisk.name}
            </Link>
            <span>/</span>
            <span className="text-slate-900">Mitigation</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Mitigation Plan</h1>
              <p className="text-slate-600 mt-1">
                Track progress for {mockRisk.name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium text-slate-700"
                data-testid="export-button"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                data-testid="add-task-button"
              >
                <Plus className="w-4 h-4" />
                Add Task
              </button>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4" data-testid="stat-tasks">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{taskStats.total}</p>
                <p className="text-xs text-slate-500">Total Tasks</p>
              </div>
            </div>
          </Card>

          <Card className="p-4" data-testid="stat-completed">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700">{taskStats.completed}</p>
                <p className="text-xs text-slate-500">Completed</p>
              </div>
            </div>
          </Card>

          <Card className="p-4" data-testid="stat-in-progress">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{taskStats.inProgress}</p>
                <p className="text-xs text-slate-500">In Progress</p>
              </div>
            </div>
          </Card>

          <Card className="p-4" data-testid="stat-progress">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700">{overallProgress}%</p>
                <p className="text-xs text-slate-500">Progress</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tasks List */}
          <div className="lg:col-span-2">
            <Card className="p-6" data-testid="tasks-section">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">Mitigation Tasks</h2>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="text-sm border border-slate-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    data-testid="status-filter"
                  >
                    <option value="All">All Status</option>
                    <option value="NotStarted">Not Started</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Blocked">Blocked</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {filteredTasks.map(task => (
                  <div
                    key={task.id}
                    className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    data-testid={`task-${task.id}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        {getStatusIcon(task.status)}
                        <h3 className="font-semibold text-slate-900">{task.title}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'px-2 py-1 rounded-md text-xs font-semibold border',
                          getPriorityBadge(task.priority)
                        )}>
                          {task.priority}
                        </span>
                        <span className={cn(
                          'px-2 py-1 rounded-md text-xs font-semibold border',
                          getStatusBadge(task.status)
                        )}>
                          {task.status.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 mb-3">{task.description}</p>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4 text-slate-500">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{task.assignee}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          data-testid={`edit-task-${task.id}`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          data-testid={`delete-task-${task.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {(task.estimatedCost || task.actualCost) && (
                      <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                        {task.estimatedCost && (
                          <span className="mr-4">Est. Cost: ${task.estimatedCost.toLocaleString()}</span>
                        )}
                        {task.actualCost && (
                          <span>Actual Cost: ${task.actualCost.toLocaleString()}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {filteredTasks.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    No tasks found for the selected filter
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Milestones */}
          <div>
            <Card className="p-6" data-testid="milestones-section">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Milestones</h2>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-semibold text-slate-700">Overall Progress</span>
                  <span className="font-bold text-indigo-600">{overallProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all"
                    style={{ width: `${overallProgress}%` }}
                    data-testid="progress-bar"
                  />
                </div>
              </div>

              {/* Milestones List */}
              <div className="space-y-3">
                {milestones.map((milestone, idx) => (
                  <div
                    key={milestone.id}
                    className={cn(
                      'border-l-4 pl-3 py-1',
                      milestone.completed ? 'border-emerald-500' : 'border-slate-300'
                    )}
                    data-testid={`milestone-${milestone.id}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0',
                        milestone.completed ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'
                      )}>
                        {milestone.completed && (
                          <CheckCircle className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className={cn(
                          'font-semibold text-sm',
                          milestone.completed ? 'text-slate-500 line-through' : 'text-slate-900'
                        )}>
                          {milestone.title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">{milestone.description}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(milestone.targetDate).toLocaleDateString()}</span>
                          {milestone.completedDate && (
                            <span className="text-emerald-600">
                              (Completed {new Date(milestone.completedDate).toLocaleDateString()})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="w-full mt-4 flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg text-sm text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                data-testid="add-milestone-button"
              >
                <Plus className="w-4 h-4" />
                Add Milestone
              </button>
            </Card>

            {/* Risk Details Summary */}
            <Card className="p-6 mt-6" data-testid="risk-summary">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Risk Summary</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Risk Score</span>
                  <span className="font-bold text-rose-600">{mockRisk.riskScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <span className="font-semibold">{mockRisk.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Date</span>
                  <span className="font-semibold">
                    {new Date(mockRisk.targetClosureDate || '').toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Owner</span>
                  <span className="font-semibold">{mockRisk.owner}</span>
                </div>
              </dl>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

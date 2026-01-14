/**
 * Architecture Review Board (ARB) Components
 * Including meeting management and decision recording
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Users,
  FileText,
  AlertCircle,
  ChevronRight,
  Video,
  Gavel
} from 'lucide-react';
import {
  ARBMeetingStatus,
  ARBSubmissionType,
  ARBDecisionType,
  type ARBMeeting,
  type ARBSubmission,
  type ARBDecision
} from '@/types/governance';
import {
  useARBMeetings,
  useARBSubmissions,
  useARBDashboard,
  useARBStatistics
} from '@/lib/governance-hooks';
import {
  Card,
  StatusBadge,
  PriorityBadge,
  MetadataItem,
  cn
} from '../shared';

// ============================================================================
// MEETING CARD
// ============================================================================

interface MeetingCardProps {
  meeting: ARBMeeting;
  onView?: (meeting: ARBMeeting) => void;
}

export function MeetingCard({ meeting, onView }: MeetingCardProps) {
  const getStatusColor = (status: ARBMeetingStatus) => {
    switch (status) {
      case 'Scheduled': return 'scheduled';
      case 'InProgress': return 'inProgress';
      case 'Completed': return 'completed';
      case 'Cancelled': return 'cancelled';
    }
  };

  const upcomingDate = new Date(meeting.scheduledDate);
  const isUpcoming = upcomingDate > new Date();

  return (
    <Card variant="bordered" className="group hover:shadow-lg transition-all" data-testid={`arb-meeting-${meeting.id}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-bold text-slate-900">{meeting.title}</h3>
            <StatusBadge variant={getStatusColor(meeting.status) as any}>
              {meeting.status}
            </StatusBadge>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{upcomingDate.toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{upcomingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{meeting.attendees.length} attendees</span>
            </div>
          </div>
        </div>
      </div>

      {meeting.agenda.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Agenda ({meeting.agenda.length})
          </p>
          <ul className="space-y-1">
            {meeting.agenda.slice(0, 3).map((item, idx) => (
              <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-1">{item}</span>
              </li>
            ))}
            {meeting.agenda.length > 3 && (
              <li className="text-sm text-slate-500 italic">
                +{meeting.agenda.length - 3} more items
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <span className="text-xs text-slate-400">
          Created {new Date(meeting.createdAt).toLocaleDateString()}
        </span>
        {onView && (
          <button
            onClick={() => onView(meeting)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            {meeting.status === 'Scheduled' && isUpcoming ? (
              <>
                <Video className="w-4 h-4" />
                Join Meeting
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                View Details
              </>
            )}
          </button>
        )}
      </div>
    </Card>
  );
}

// ============================================================================
// MEETINGS LIST
// ============================================================================

interface MeetingsListProps {
  status?: ARBMeetingStatus;
  onView?: (meeting: ARBMeeting) => void;
}

export function MeetingsList({ status, onView }: MeetingsListProps) {
  const { data: meetings, isLoading } = useARBMeetings({ status });

  if (isLoading) {
    return <div className="animate-pulse bg-slate-100 h-64 rounded-xl" />;
  }

  if (!meetings?.data.length) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">No meetings found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="arb-list">
      {meetings.data.map((meeting) => (
        <MeetingCard key={meeting.id} meeting={meeting} onView={onView} />
      ))}
    </div>
  );
}

// ============================================================================
// SUBMISSION CARD
// ============================================================================

interface SubmissionCardProps {
  submission: ARBSubmission;
  onReview?: (submission: ARBSubmission) => void;
  onRecordDecision?: (submission: ARBSubmission) => void;
}

export function SubmissionCard({ submission, onReview, onRecordDecision }: SubmissionCardProps) {
  const getSubmissionTypeColor = (type: ARBSubmissionType) => {
    switch (type) {
      case 'ExceptionRequest': return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'PolicyViolation': return 'bg-rose-100 text-rose-800 border border-rose-200';
      case 'StandardException': return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'NewTechnologyProposal': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'ArchitectureReview': return 'bg-teal-100 text-teal-800 border border-teal-200';
    }
  };

  const getDecisionBadge = (decision?: ARBDecision) => {
    if (!decision) {
      return (
        <span className="px-2 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
          Pending
        </span>
      );
    }

    const colors = {
      Approve: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      ApproveWithConditions: 'bg-blue-100 text-blue-800 border border-blue-200',
      Reject: 'bg-red-100 text-red-800 border border-red-200',
      RequestMoreInfo: 'bg-amber-100 text-amber-800 border border-amber-200',
      Defer: 'bg-slate-100 text-slate-800 border border-slate-200',
    };

    return (
      <span className={cn('px-2 py-1 rounded-md text-xs font-semibold border', colors[decision.decisionType])}>
        {decision.decisionType}
      </span>
    );
  };

  return (
    <Card variant="bordered" className="group hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Link
              to={`/cards/${submission.cardId}`}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Card {submission.cardId}
            </Link>
            <span className={cn('px-2 py-0.5 rounded-md text-xs font-semibold border', getSubmissionTypeColor(submission.submissionType))}>
              {submission.submissionType}
            </span>
            {submission.priority && (
              <PriorityBadge priority={submission.priority.toLowerCase() as any}>
                {submission.priority}
              </PriorityBadge>
            )}
            {getDecisionBadge(submission.decision)}
          </div>
          <p className="text-sm text-slate-600 line-clamp-2 mb-2">{submission.rationale}</p>
          <p className="text-xs text-slate-500">
            Submitted {new Date(submission.submittedAt).toLocaleDateString()} by {submission.submittedBy}
          </p>
        </div>
      </div>

      {submission.decision && (
        <div className="mb-3 p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Gavel className="w-4 h-4 text-slate-600" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Decision</p>
          </div>
          <p className="text-sm text-slate-700">{submission.decision.rationale}</p>
          {submission.decision.conditions && (
            <p className="text-xs text-slate-600 mt-1">
              <span className="font-semibold">Conditions:</span> {submission.decision.conditions}
            </p>
          )}
          <p className="text-xs text-slate-500 mt-1">
            By {submission.decision.decidedBy} on {new Date(submission.decision.decidedAt).toLocaleDateString()}
          </p>
        </div>
      )}

      {submission.meetingId && (
        <div className="mb-3">
          <MetadataItem
            label="Meeting"
            value={
              <Link to={`/governance/arb/meetings/${submission.meetingId}`} className="text-indigo-600 hover:text-indigo-700">
                {submission.meetingId}
              </Link>
            }
            icon={Calendar}
          />
        </div>
      )}

      <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
        {onReview && !submission.decision && (
          <button
            onClick={() => onReview(submission)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4" />
            Review
          </button>
        )}
        {onRecordDecision && !submission.decision && (
          <button
            onClick={() => onRecordDecision(submission)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-700 bg-indigo-50 rounded-lg transition-colors font-medium"
          >
            <Gavel className="w-4 h-4" />
            Record Decision
          </button>
        )}
        {submission.decision && (
          <Link
            to={`/governance/arb/submissions/${submission.id}`}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4" />
            View Details
          </Link>
        )}
      </div>
    </Card>
  );
}

// ============================================================================
// SUBMISSIONS QUEUE
// ============================================================================

interface SubmissionsQueueProps {
  submissionType?: ARBSubmissionType;
  onReview?: (submission: ARBSubmission) => void;
  onRecordDecision?: (submission: ARBSubmission) => void;
}

export function SubmissionsQueue({ submissionType, onReview, onRecordDecision }: SubmissionsQueueProps) {
  const { data: submissions, isLoading } = useARBSubmissions({ submissionType });

  if (isLoading) {
    return <div className="animate-pulse bg-slate-100 h-64 rounded-xl" />;
  }

  if (!submissions?.data.length) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">No submissions found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {submissions.data.map((submission) => (
        <SubmissionCard
          key={submission.id}
          submission={submission}
          onReview={onReview}
          onRecordDecision={onRecordDecision}
        />
      ))}
    </div>
  );
}

// ============================================================================
// ARB DASHBOARD
// ============================================================================

export function ARBDashboard() {
  const { data: dashboard, isLoading: dashboardLoading } = useARBDashboard();
  const { data: stats, isLoading: statsLoading } = useARBStatistics();

  if (dashboardLoading || statsLoading) {
    return <div className="animate-pulse bg-slate-100 h-96 rounded-xl" />;
  }

  if (!dashboard || !stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Architecture Review Board</h1>
        <p className="text-slate-600">Review and approve architecture decisions</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">{dashboard.pendingSubmissions}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Pending</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{dashboard.upcomingMeetings}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Upcoming</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{dashboard.decisionsThisMonth}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wide">This Month</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-rose-600">{dashboard.criticalSubmissions}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Critical</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-700">{dashboard.avgDecisionTimeDays.toFixed(1)}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Avg Days</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-indigo-600">{stats.approvalRate.toFixed(0)}%</p>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Approval</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Submissions */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-bold text-slate-900">Pending Submissions</h2>
            </div>
            <Link
              to="/governance/arb/submissions"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              View All →
            </Link>
          </div>
          <SubmissionsQueue />
        </Card>

        {/* Upcoming Meetings */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">Upcoming Meetings</h2>
            </div>
            <Link
              to="/governance/arb/meetings"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              View All →
            </Link>
          </div>
          <MeetingsList status={ARBMeetingStatus.Scheduled} />
        </Card>
      </div>

      {/* Statistics */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Submissions by Type
            </p>
            <div className="space-y-2">
              {stats.submissionsByType.map((item) => (
                <div key={item.submissionType} className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">{item.submissionType}</span>
                  <span className="text-sm font-semibold text-slate-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Decisions by Type
            </p>
            <div className="space-y-2">
              {stats.decisionsByType.map((item) => (
                <div key={item.decisionType} className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">{item.decisionType}</span>
                  <span className="text-sm font-semibold text-slate-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Summary
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-700">Total Submissions</span>
                <span className="text-sm font-semibold text-slate-900">{stats.totalSubmissions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-700">Total Meetings</span>
                <span className="text-sm font-semibold text-slate-900">{stats.totalMeetings}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-700">Avg Decision Time</span>
                <span className="text-sm font-semibold text-slate-900">
                  {stats.avgDecisionTimeHours.toFixed(1)}h
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// DECISION FORM
// ============================================================================

interface DecisionFormProps {
  submission: ARBSubmission;
  onSubmit: (decision: CreateARBDecisionRequest) => void;
  onCancel: () => void;
}

export interface CreateARBDecisionRequest {
  submissionId: string;
  decisionType: ARBDecisionType;
  conditions?: string;
  rationale: string;
  validUntil?: string;
}

export function DecisionForm({ submission, onSubmit, onCancel }: DecisionFormProps) {
  const [decisionType, setDecisionType] = useState<ARBDecisionType>(ARBDecisionType.Approve);
  const [conditions, setConditions] = useState('');
  const [rationale, setRationale] = useState('');
  const [validUntil, setValidUntil] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      submissionId: submission.id,
      decisionType,
      conditions: conditions || undefined,
      rationale,
      validUntil: validUntil || undefined,
    });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Gavel className="w-5 h-5 text-indigo-600" />
        <h2 className="text-lg font-bold text-slate-900">Record Decision</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Decision Type
          </label>
          <select
            value={decisionType}
            onChange={(e) => setDecisionType(e.target.value as ARBDecisionType)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            required
          >
            <option value={ARBDecisionType.Approve}>Approve</option>
            <option value={ARBDecisionType.ApproveWithConditions}>Approve with Conditions</option>
            <option value={ARBDecisionType.Reject}>Reject</option>
            <option value={ARBDecisionType.RequestMoreInfo}>Request More Info</option>
            <option value={ARBDecisionType.Defer}>Defer</option>
          </select>
        </div>

        {(decisionType === ARBDecisionType.ApproveWithConditions ||
          decisionType === ARBDecisionType.RequestMoreInfo) && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              {decisionType === ARBDecisionType.ApproveWithConditions ? 'Conditions' : 'Additional Information Required'}
            </label>
            <textarea
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder={decisionType === ARBDecisionType.ApproveWithConditions
                ? 'Specify conditions for approval...'
                : 'Describe what additional information is needed...'}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Rationale
          </label>
          <textarea
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Explain the reasoning behind this decision..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Valid Until (Optional)
          </label>
          <input
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Record Decision
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </Card>
  );
}

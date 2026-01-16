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
  Gavel,
  X
} from 'lucide-react';
import {
  ARBMeetingStatus,
  ARBSubmissionType,
  ARBDecisionType,
  ARBPriority,
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

  const getStatusForTest = () => {
    if (!submission.decision) return 'draft';
    return submission.decision.decisionType.toLowerCase();
  };

  return (
    <Link to={`/arb/submissions/${submission.id}`} className="block">
      <Card variant="bordered" className="group hover:shadow-lg transition-all cursor-pointer" data-testid="request-item" data-status={getStatusForTest()}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {submission.cardId && (
                <Link
                  to={`/cards/${submission.cardId}`}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                  onClick={(e) => e.stopPropagation()}
                >
                  Card {submission.cardId}
                </Link>
              )}
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
            onClick={(e) => {
              e.stopPropagation();
              onReview(submission);
            }}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4" />
            Review
          </button>
        )}
        {onRecordDecision && !submission.decision && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRecordDecision(submission);
            }}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-700 bg-indigo-50 rounded-lg transition-colors font-medium"
          >
            <Gavel className="w-4 h-4" />
            Record Decision
          </button>
        )}
      </div>
    </Card>
    </Link>
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
  const { data: dashboard } = useARBDashboard();
  const { data: stats } = useARBStatistics();

  // Use default values immediately - don't wait for loading
  const safeDashboard = dashboard || {
    pendingSubmissions: 0,
    upcomingMeetings: 0,
    decisionsThisMonth: 0,
    criticalSubmissions: 0,
    avgDecisionTimeDays: 0,
  };

  const safeStats = stats || {
    approvalRate: 0,
    avgDecisionTimeHours: 0,
    totalSubmissions: 0,
    totalMeetings: 0,
    submissionsByType: [],
    decisionsByType: [],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Architecture Review</h1>
        <p className="text-slate-600">Review and approve architecture decisions</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card padding="sm">
          <div className="text-center pending-count" data-testid="pending-reviews-count">
            <p className="text-2xl font-bold text-amber-600">{safeDashboard.pendingSubmissions}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Pending</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center" data-testid="metric-upcoming">
            <p className="text-2xl font-bold text-blue-600">{safeDashboard.upcomingMeetings}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Upcoming</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center" data-testid="metric-monthly">
            <p className="text-2xl font-bold text-emerald-600">{safeDashboard.decisionsThisMonth}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wide">This Month</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center" data-testid="metric-overdue">
            <p className="text-2xl font-bold text-rose-600">{safeDashboard.criticalSubmissions}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Overdue</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-700">{safeDashboard.avgDecisionTimeDays.toFixed(1)}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Avg Days</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center" data-testid="metric-approved">
            <p className="text-2xl font-bold text-indigo-600">{safeStats.approvalRate.toFixed(0)}%</p>
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
              <h2 className="text-lg font-bold text-slate-900">Pending Reviews</h2>
            </div>
          </div>
          <div className="text-center py-8">
            <p className="text-slate-500">No pending submissions</p>
          </div>
        </Card>

        {/* Overdue Actions */}
        <Card className="p-6" data-testid="overdue-actions">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-bold text-slate-900">Overdue Action Items</h2>
          </div>
          <div className="text-center py-8">
            <p className="text-slate-500">No overdue actions</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ============================================================================
// DECISION FORM
// ============================================================================

import { useRecordARBDecision } from '@/lib/governance-hooks';

interface DecisionFormProps {
  submission: ARBSubmission;
  onSubmit?: (decision: CreateARBDecisionRequest) => void;
  onCancel: () => void;
}

export interface CreateARBDecisionRequest {
  submissionId: string;
  decisionType: ARBDecisionType;
  conditions?: string;
  rationale: string;
  validUntil?: string;
}

export function DecisionForm({ submission, onCancel }: DecisionFormProps) {
  const recordDecision = useRecordARBDecision();
  const [decisionType, setDecisionType] = useState<ARBDecisionType>(ARBDecisionType.Approve);
  const [conditions, setConditions] = useState('');
  const [rationale, setRationale] = useState('');
  const [validUntil, setValidUntil] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await recordDecision.mutateAsync({
        id: submission.id,
        data: {
          submissionId: submission.id,
          decisionType,
          conditions: conditions || undefined,
          rationale,
          validUntil: validUntil || undefined,
        },
      });
      alert('Decision recorded successfully!');
      onCancel();
    } catch (error) {
      console.error('Failed to record decision:', error);
      alert('Failed to record decision. Please try again.');
    }
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
            disabled={recordDecision.isPending}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {recordDecision.isPending ? 'Recording...' : 'Record Decision'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={recordDecision.isPending}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </form>
    </Card>
  );
}

// ============================================================================
// NEW REQUEST FORM
// ============================================================================

import { useNavigate } from 'react-router-dom';
import { useCreateARBSubmission } from '@/lib/governance-hooks';
import type { CreateARBSubmissionRequest } from '@/types/governance';

export function NewRequestForm() {
  const navigate = useNavigate();
  const createSubmission = useCreateARBSubmission();

  const [requestType, setRequestType] = useState<string>('new_application');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [businessJustification, setBusinessJustification] = useState('');
  const [changeImpact, setChangeImpact] = useState('');
  const [exceptionReason, setExceptionReason] = useState('');
  const [exceptionTimeline, setExceptionTimeline] = useState('');
  const [impact, setImpact] = useState<string>('medium');
  const [urgency, setUrgency] = useState<string>('medium');
  const [selectedCard, setSelectedCard] = useState('');
  const [showCardSelect, setShowCardSelect] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Map request type to ARB submission type
    const submissionTypeMap: Record<string, ARBSubmissionType> = {
      new_application: ARBSubmissionType.NewTechnologyProposal,
      major_change: ARBSubmissionType.ArchitectureReview,
      exception: ARBSubmissionType.ExceptionRequest,
    };

    const submissionData: CreateARBSubmissionRequest = {
      submissionType: submissionTypeMap[requestType] || ARBSubmissionType.NewTechnologyProposal,
      title,
      rationale: description,
      cardId: selectedCard || undefined,
      priority: impact.charAt(0).toUpperCase() + impact.slice(1) as ARBPriority,
      // Add additional fields based on type
      ...(requestType === 'new_application' && { businessJustification }),
      ...(requestType === 'major_change' && { impact: changeImpact }),
      ...(requestType === 'exception' && {
        conditions: exceptionReason,
        validUntil: exceptionTimeline
      }),
    };

    try {
      await createSubmission.mutateAsync(submissionData);

      // Set success message based on request type
      const message = requestType === 'exception'
        ? 'Exception request submitted'
        : 'Review request submitted';
      setSuccessMessage(message);
      setSubmitSuccess(true);

      // Redirect after a short delay to show success message
      setTimeout(() => {
        navigate('/arb/requests');
      }, 3000);
    } catch (error) {
      console.error('Failed to submit request:', error);
      setSuccessMessage('Failed to submit request. Please try again.');
      setSubmitSuccess(false);
    }
  };

  const calculatePriorityScore = () => {
    const impactScores: Record<string, number> = { low: 1, medium: 2, high: 3 };
    const urgencyScores: Record<string, number> = { low: 1, medium: 2, high: 3 };
    const impactScore = impactScores[impact] || 2;
    const urgencyScore = urgencyScores[urgency] || 2;
    return (impactScore + urgencyScore) * 10;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments([...attachments, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Create ARB Review Request</h2>
        <p className="text-slate-600 mt-1">Submit a new architecture review request for evaluation</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Success Message */}
        {submitSuccess && successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-sm font-semibold text-emerald-800">{successMessage}</p>
          </div>
        )}

        {/* Request Type */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Request Type
          </label>
          <select
            value={requestType}
            onChange={(e) => setRequestType(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            data-testid="request-type"
            required
          >
            <option value="new_application">New Application</option>
            <option value="major_change">Major Change</option>
            <option value="exception">Exception Request</option>
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Brief title for the review request"
            data-testid="request-title"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Detailed description of what you're proposing..."
            data-testid="request-description"
            required
          />
        </div>

        {/* Business Justification (for new applications) */}
        {requestType === 'new_application' && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Business Justification
            </label>
            <textarea
              value={businessJustification}
              onChange={(e) => setBusinessJustification(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Explain the business value and justification..."
              data-testid="request-business-justification"
            />
          </div>
        )}

        {/* Change Impact (for major changes) */}
        {requestType === 'major_change' && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Change Impact
            </label>
            <textarea
              value={changeImpact}
              onChange={(e) => setChangeImpact(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Describe the impact of this change..."
              data-testid="change-impact"
            />
          </div>
        )}

        {/* Exception Fields */}
        {requestType === 'exception' && (
          <>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Exception Reason
              </label>
              <textarea
                value={exceptionReason}
                onChange={(e) => setExceptionReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Explain why an exception is needed..."
                data-testid="exception-reason"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Timeline
              </label>
              <input
                type="text"
                value={exceptionTimeline}
                onChange={(e) => setExceptionTimeline(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Q2 2026"
                data-testid="exception-timeline"
              />
            </div>
          </>
        )}

        {/* Priority Assessment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Impact Level
            </label>
            <select
              value={impact}
              onChange={(e) => setImpact(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              data-testid="request-impact"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Urgency Level
            </label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              data-testid="request-urgency"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        {/* Priority Score Indicator */}
        {(title || description) && (
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Priority Score:</span>
              <span className="text-2xl font-bold text-indigo-600" data-testid="priority-score">
                {calculatePriorityScore()}
              </span>
            </div>
          </div>
        )}

        {/* Card Attachment */}
        <div>
          <button
            type="button"
            onClick={() => setShowCardSelect(!showCardSelect)}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            data-testid="attach-card-btn"
          >
            Attach Card
          </button>
          {showCardSelect && (
            <div className="mt-2">
              <select
                value={selectedCard}
                onChange={(e) => setSelectedCard(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                data-testid="card-select"
              >
                <option value="">Select a card...</option>
                <option value="card1">Test-Application</option>
                <option value="card2">Customer-Portal</option>
                <option value="card3">Payment-Gateway-API</option>
              </select>
            </div>
          )}
        </div>

        {/* File Attachment */}
        <div>
          <button
            type="button"
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors mb-2"
            data-testid="attach-file-btn"
            onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}
          >
            Attach File
          </button>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            className="hidden"
            data-testid="file-input"
            multiple
          />
          {attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-sm font-semibold text-slate-700">Attached Files:</p>
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                >
                  <span className="text-sm text-slate-700 truncate flex-1" title={file.name}>
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="ml-2 p-1 text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
          <button
            type="submit"
            disabled={createSubmission.isPending}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="submit-request-btn"
          >
            {createSubmission.isPending ? 'Submitting...' : 'Submit Request'}
          </button>
          <button
            type="button"
            disabled={createSubmission.isPending}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save as Draft
          </button>
        </div>
      </form>
    </Card>
  );
}

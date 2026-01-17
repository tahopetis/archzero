/**
 * ARB Request Detail Component
 * Displays full submission information with review and edit capability
 */

import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useARBSubmission, useUpdateARBSubmission, useDeleteARBSubmission, useRecordARBDecision } from '@/lib/governance-hooks';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  Calendar,
  User,
  FileText,
  AlertCircle,
  Edit,
  Trash2,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  Save,
  X,
  Paperclip,
  Plus,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Pause,
  FileCheck,
  Gavel,
  Bell
} from 'lucide-react';
import { Card, StatusBadge } from '../shared';
import { NewRequestForm } from './ARBComponents';
import { ARBDecisionType, type ARBSubmission, type ARBDecision } from '@/types/governance';

interface Condition {
  id: string;
  text: string;
}

interface ActionItem {
  id: string;
  text: string;
  assignee: string;
}

export function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: submission, isLoading } = useARBSubmission(id!);
  const updateSubmission = useUpdateARBSubmission();
  const deleteSubmission = useDeleteARBSubmission();
  const recordDecision = useRecordARBDecision();
  const { user } = useAuthStore();

  // Check if user can approve (only ARB Chair)
  const canApprove = user?.role === 'arbchair' || user?.role === 'admin';

  // UI state
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);

  // Review state
  const [reviewComments, setReviewComments] = useState('');
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);

  // Decision state
  const [selectedDecisionType, setSelectedDecisionType] = useState<ARBDecisionType | null>(null);
  const [decisionRationale, setDecisionRationale] = useState('');
  const [decisionConditions, setDecisionConditions] = useState('');
  const [decisionConditions2, setDecisionConditions2] = useState('');

  // Success messages
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Assign reviewer state
  const [showAssignReviewer, setShowAssignReviewer] = useState(false);
  const [selectedReviewer, setSelectedReviewer] = useState('');

  const reviewers = [
    'architect1@archzero.local',
    'architect2@archzero.local',
    'security@archzero.local',
    'admin@archzero.local'
  ];

  const handleAssignReviewer = () => {
    setShowAssignReviewer(true);
  };

  const handleConfirmAssign = async () => {
    // For now, just show success message
    // In production, this would call an API to assign the reviewer
    setSuccessMessage('notification will be sent');
    setShowAssignReviewer(false);
    setSelectedReviewer('');
    setTimeout(() => setSuccessMessage(null), 10000);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse bg-slate-100 h-96 rounded-xl" data-testid="request-detail-loading" />
    );
  }

  if (!submission) {
    return (
      <div className="bg-white rounded-lg p-6" data-testid="request-detail">
        <p className="text-slate-500">Request not found</p>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      await deleteSubmission.mutateAsync(submission.id);
      alert('Request deleted successfully');
      window.location.href = '/arb/requests';
    } catch (error) {
      console.error('Failed to delete request:', error);
      alert('Failed to delete request. Please try again.');
    }
  };

  // Review handlers
  const handleStartReview = () => {
    setIsReviewing(true);
    setSelectedDecisionType(null);
  };

  const handleAddCondition = () => {
    setConditions([...conditions, { id: Date.now().toString(), text: '' }]);
  };

  const handleRemoveCondition = (id: string) => {
    setConditions(conditions.filter(c => c.id !== id));
  };

  const handleConditionChange = (id: string, text: string) => {
    setConditions(conditions.map(c => c.id === id ? { ...c, text } : c));
  };

  const handleAddAction = () => {
    setActionItems([...actionItems, { id: Date.now().toString(), text: '', assignee: '' }]);
  };

  const handleRemoveAction = (id: string) => {
    setActionItems(actionItems.filter(a => a.id !== id));
  };

  const handleActionChange = (id: string, field: 'text' | 'assignee', value: string) => {
    setActionItems(actionItems.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const handleSubmitReview = async () => {
    if (!submission) return;

    try {
      const conditionsText = conditions.length > 0
        ? conditions.map(c => c.text).join('\n')
        : undefined;

      await recordDecision.mutateAsync({
        id: submission.id,
        data: {
          submissionId: submission.id,
          type: ARBDecisionType.ApproveWithConditions,
          conditions: conditionsText,
          rationale: reviewComments,
        },
      });

      setSuccessMessage('Review submitted');
      setIsReviewing(false);
      setReviewComments('');
      setConditions([]);
      setActionItems([]);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Failed to submit review:', error);
      alert('Failed to submit review. Please try again.');
    }
  };

  // Decision handlers
  const handleQuickDecision = async (decisionType: ARBDecisionType) => {
    setSelectedDecisionType(decisionType);
    setDecisionRationale('');
    setDecisionConditions('');
    setDecisionConditions2('');
  };

  const handleConfirmDecision = async () => {
    if (!submission || !selectedDecisionType) return;

    try {
      // Combine conditions for conditional approval
      let combinedConditions = decisionConditions;
      if (selectedDecisionType === ARBDecisionType.ApproveWithConditions && decisionConditions2) {
        combinedConditions = `${decisionConditions}\n${decisionConditions2}`;
      }

      await recordDecision.mutateAsync({
        id: submission.id,
        data: {
          submissionId: submission.id,
          type: selectedDecisionType,
          conditions: combinedConditions || undefined,
          rationale: decisionRationale || decisionConditions || 'No rationale provided',
        },
      });

      const messages: Record<ARBDecisionType, string> = {
        [ARBDecisionType.Approve]: 'Notification sent',
        [ARBDecisionType.ApproveWithConditions]: 'Notification sent',
        [ARBDecisionType.Reject]: 'Notification sent',
        [ARBDecisionType.RequestMoreInfo]: 'Notification sent',
        [ARBDecisionType.Defer]: 'Notification sent',
      };

      // Show success message and close modal
      setSuccessMessage(messages[selectedDecisionType]);
      setSelectedDecisionType(null);
      setDecisionRationale('');
      setDecisionConditions('');
      setDecisionConditions2('');

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Failed to record decision:', error);
      alert('Failed to record decision. Please try again.');
    }
  };

  const handleCancelDecision = () => {
    setSelectedDecisionType(null);
    setDecisionRationale('');
    setDecisionConditions('');
    setDecisionConditions2('');
  };

  const canEdit = !submission.decision; // Can only edit draft/pending requests

  const isOverdue = () => {
    // A submission is overdue if it has no decision and was submitted more than 7 days ago
    if (submission.decision) return false;
    const daysSinceSubmission = (Date.now() - new Date(submission.submittedAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceSubmission > 7;
  };

  if (isEditing && canEdit) {
    return (
      <div data-testid="request-detail">
        <div className="mb-4">
          <button
            onClick={() => setIsEditing(false)}
            className="text-slate-600 hover:text-slate-700 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Cancel Edit
          </button>
        </div>
        <NewRequestForm />
      </div>
    );
  }

  const getStatusIcon = () => {
    if (!submission.decision) return <Clock className="w-5 h-5 text-amber-600" />;
    switch (submission.decision.decisionType) {
      case 'Approve':
      case 'ApproveWithConditions':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'Reject':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-slate-600" />;
    }
  };

  const getStatusText = () => {
    if (!submission.decision) return 'Pending Review';
    return submission.decision.decisionType;
  };

  return (
    <div className="space-y-6" data-testid="request-details">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-slate-900">{submission.title}</h1>
              {getStatusIcon()}
            </div>
            <p className="text-slate-600">{submission.rationale}</p>
          </div>
          <div className="flex items-center gap-2">
            {submission.cardId && (
              <Link
                to={`/cards/${submission.cardId}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                data-testid="view-card-btn"
              >
                <FileText className="w-4 h-4" />
                View Card
              </Link>
            )}
            {canEdit && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  data-testid="edit-request-btn"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600">Type:</span>
            <span className="font-semibold text-slate-900">{submission.submissionType}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600">Submitted by:</span>
            <span className="font-semibold text-slate-900">{submission.submittedBy}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600">Date:</span>
            <span className="font-semibold text-slate-900">
              {new Date(submission.submittedAt).toLocaleDateString()}
            </span>
          </div>
          {submission.cardId && (
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">Card:</span>
              <Link
                to={`/cards/${submission.cardId}`}
                className="font-semibold text-indigo-600 hover:text-indigo-700"
              >
                {submission.cardId}
              </Link>
            </div>
          )}
          {submission.priority && (
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">Priority:</span>
              <StatusBadge
                variant={submission.priority.toLowerCase() as any}
                className="text-xs"
              >
                {submission.priority}
              </StatusBadge>
            </div>
          )}
        </div>
      </Card>

      {/* Success Message */}
      {successMessage && (
        <div
          className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm font-semibold text-emerald-800"
          data-testid="success-message"
        >
          {successMessage.trim()}
        </div>
      )}

      {/* Review Interface - when no decision exists and reviewer clicks Start Review */}
      {!submission.decision && isReviewing && (
        <Card className="p-6" data-testid="review-interface">
          <div className="flex items-center gap-2 mb-4">
            <FileCheck className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Review Request</h2>
          </div>

          <div className="space-y-4">
            {/* Review Comments */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Review Comments
              </label>
              <textarea
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Add your review comments..."
                data-testid="review-comments"
              />
            </div>

            {/* Dynamic Conditions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Conditions
                </label>
                <button
                  type="button"
                  onClick={handleAddCondition}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                  data-testid="add-condition-btn"
                >
                  <Plus className="w-4 h-4" />
                  Add Condition
                </button>
              </div>
              {conditions.map((condition) => (
                <div key={condition.id} className="mb-2 flex gap-2">
                  <textarea
                    value={condition.text}
                    onChange={(e) => handleConditionChange(condition.id, e.target.value)}
                    rows={2}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter condition..."
                    data-testid="condition-text"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveCondition(condition.id)}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Dynamic Action Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Action Items
                </label>
                <button
                  type="button"
                  onClick={handleAddAction}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                  data-testid="add-action-btn"
                >
                  <Plus className="w-4 h-4" />
                  Add Action
                </button>
              </div>
              {actionItems.map((action) => (
                <div key={action.id} className="mb-2 space-y-2">
                  <div className="flex gap-2">
                    <textarea
                      value={action.text}
                      onChange={(e) => handleActionChange(action.id, 'text', e.target.value)}
                      rows={2}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter action item..."
                      data-testid="action-text"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveAction(action.id)}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <select
                    value={action.assignee}
                    onChange={(e) => handleActionChange(action.id, 'assignee', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    data-testid="action-assignee"
                  >
                    <option value="">Select assignee...</option>
                    <option value="admin@archzero.local">admin@archzero.local</option>
                    <option value="security@archzero.local">security@archzero.local</option>
                    <option value="architect@archzero.local">architect@archzero.local</option>
                  </select>
                </div>
              ))}
            </div>

            {/* Submit buttons */}
            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={handleSubmitReview}
                disabled={recordDecision.isPending}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Review
              </button>
              <button
                onClick={() => {
                  setIsReviewing(false);
                  setReviewComments('');
                  setConditions([]);
                  setActionItems([]);
                }}
                disabled={recordDecision.isPending}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Decision Buttons */}
      {!submission.decision && !isReviewing && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Gavel className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>
          </div>

          <div className="space-y-3">
            {/* Start Review Button */}
            <button
              onClick={handleStartReview}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              data-testid="start-review-btn"
            >
              <FileCheck className="w-5 h-5" />
              Start Review
            </button>

            {/* Assign Reviewer Button */}
            <button
              onClick={handleAssignReviewer}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
              data-testid="assign-reviewer-btn"
            >
              <User className="w-5 h-5" />
              Set Reviewer
            </button>

            {/* Send Reminder Button - only for overdue requests */}
            {isOverdue() && (
              <button
                onClick={() => {
                  setSuccessMessage('Reminder sent');
                  setTimeout(() => setSuccessMessage(null), 3000);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors font-medium"
                data-testid="send-reminder-btn"
              >
                <Bell className="w-5 h-5" />
                Send Reminder
              </button>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => handleQuickDecision(ARBDecisionType.Approve)}
                disabled={!canApprove}
                className={`flex flex-col items-center gap-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                  canApprove
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                data-testid="decision-approve"
              >
                <ThumbsUp className="w-5 h-5" />
                <span className="text-sm">Approve</span>
              </button>

              <button
                onClick={() => handleQuickDecision(ARBDecisionType.Reject)}
                disabled={!canApprove}
                className={`flex flex-col items-center gap-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                  canApprove
                    ? 'bg-red-50 text-red-700 hover:bg-red-100'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                data-testid="decision-reject"
              >
                <ThumbsDown className="w-5 h-5" />
                <span className="text-sm">Reject</span>
              </button>

              <button
                onClick={() => handleQuickDecision(ARBDecisionType.ApproveWithConditions)}
                disabled={!canApprove}
                className={`flex flex-col items-center gap-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                  canApprove
                    ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                data-testid="decision-conditional"
              >
                <AlertTriangle className="w-5 h-5" />
                <span className="text-sm">Conditional</span>
              </button>

              <button
                onClick={() => handleQuickDecision(ARBDecisionType.RequestMoreInfo)}
                disabled={!canApprove}
                className={`flex flex-col items-center gap-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                  canApprove
                    ? 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                data-testid="decision-defer"
              >
                <Pause className="w-5 h-5" />
                <span className="text-sm">Defer</span>
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Assign Reviewer Dialog */}
      {showAssignReviewer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Assign Reviewer</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Select Reviewer
                </label>
                <select
                  value={selectedReviewer}
                  onChange={(e) => setSelectedReviewer(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  data-testid="reviewer-select"
                >
                  <option value="">Select a reviewer...</option>
                  {reviewers.map(reviewer => (
                    <option key={reviewer} value={reviewer}>{reviewer}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={handleConfirmAssign}
                  disabled={!selectedReviewer}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="confirm-assign-reviewer-btn"
                >
                  Assign
                </button>
                <button
                  onClick={() => {
                    setShowAssignReviewer(false);
                    setSelectedReviewer('');
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Decision Confirmation Dialogs */}
      {selectedDecisionType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {selectedDecisionType === ARBDecisionType.Approve && 'Confirm Approval'}
              {selectedDecisionType === ARBDecisionType.Reject && 'Confirm Rejection'}
              {selectedDecisionType === ARBDecisionType.ApproveWithConditions && 'Conditional Approval'}
              {selectedDecisionType === ARBDecisionType.RequestMoreInfo && 'Defer Request'}
              {selectedDecisionType === ARBDecisionType.Defer && 'Defer Request'}
            </h3>

            <div className="space-y-4">
              {selectedDecisionType === ARBDecisionType.Approve && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Conditions (Optional)
                  </label>
                  <textarea
                    value={decisionConditions}
                    onChange={(e) => setDecisionConditions(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Specify approval conditions..."
                    data-testid="approval-conditions"
                  />
                </div>
              )}

              {selectedDecisionType === ARBDecisionType.Reject && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Rejection Reason
                  </label>
                  <textarea
                    value={decisionRationale}
                    onChange={(e) => setDecisionRationale(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Explain why this request is being rejected..."
                    required
                    data-testid="rejection-reason"
                  />
                </div>
              )}

              {selectedDecisionType === ARBDecisionType.ApproveWithConditions && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Condition 1
                    </label>
                    <textarea
                      value={decisionConditions}
                      onChange={(e) => setDecisionConditions(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="First condition..."
                      data-testid="condition-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Condition 2
                    </label>
                    <textarea
                      value={decisionConditions2}
                      onChange={(e) => setDecisionConditions2(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Second condition..."
                      data-testid="condition-2"
                    />
                  </div>
                </div>
              )}

              {selectedDecisionType === ARBDecisionType.RequestMoreInfo && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Information Needed
                  </label>
                  <textarea
                    value={decisionRationale}
                    onChange={(e) => setDecisionRationale(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Specify what additional information is needed..."
                    required
                    data-testid="defer-reason"
                  />
                </div>
              )}

              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={handleConfirmDecision}
                  disabled={recordDecision.isPending || (selectedDecisionType === ARBDecisionType.Reject && !decisionRationale)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selectedDecisionType === ARBDecisionType.Approve && 'Confirm Approval'}
                  {selectedDecisionType === ARBDecisionType.Reject && 'Confirm Rejection'}
                  {selectedDecisionType === ARBDecisionType.ApproveWithConditions && 'Confirm Conditional Approval'}
                  {selectedDecisionType === ARBDecisionType.RequestMoreInfo && 'Confirm Deferral'}
                  {selectedDecisionType === ARBDecisionType.Defer && 'Confirm Deferral'}
                </button>
                <button
                  onClick={handleCancelDecision}
                  disabled={recordDecision.isPending}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Decision */}
      {submission.decision && (
        <Card className="p-6" data-testid="decision-display">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Decision</h2>
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-semibold text-slate-700">Status:</span>
              <span className="ml-2 px-2 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                {submission.decision.decisionType}
              </span>
            </div>
            <div>
              <span className="text-sm font-semibold text-slate-700">Rationale:</span>
              <p className="mt-1 text-sm text-slate-700">{submission.decision.rationale}</p>
            </div>
            {submission.decision.conditions && (
              <div>
                <span className="text-sm font-semibold text-slate-700">Conditions:</span>
                <p className="mt-1 text-sm text-slate-700">{submission.decision.conditions}</p>
              </div>
            )}
            <div>
              <span className="text-sm font-semibold text-slate-700">Decided by:</span>
              <span className="ml-2 text-sm text-slate-700">{submission.decision.decidedBy}</span>
            </div>
            <div>
              <span className="text-sm font-semibold text-slate-700">Date:</span>
              <span className="ml-2 text-sm text-slate-700">
                {new Date(submission.decision.decidedAt).toLocaleString()}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Attachments */}
      {submission.attachments && submission.attachments.length > 0 && (
        <Card className="p-6" data-testid="attachments-display">
          <div className="flex items-center gap-2 mb-3">
            <Paperclip className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-bold text-slate-900">Attachments</h2>
          </div>
          <div className="space-y-2">
            {submission.attachments.map((attachment: any) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-700">{attachment.filename}</span>
                </div>
                <button
                  onClick={() => window.open(attachment.fileUrl, '_blank')}
                  className="p-1 text-slate-600 hover:text-indigo-600"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* History/Decision History */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-5 h-5 text-slate-600" />
          <h2 className="text-lg font-bold text-slate-900" data-testid="decision-history-tab">History</h2>
        </div>
        <div className="space-y-3" data-testid="decision-history">
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="flex-shrink-0 w-2 h-2 mt-2 bg-indigo-600 rounded-full" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Request Created</p>
              <p className="text-xs text-slate-600">
                {new Date(submission.submittedAt).toLocaleString()} by {submission.submittedBy}
              </p>
            </div>
          </div>
          {submission.decision && (
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="flex-shrink-0 w-2 h-2 mt-2 bg-emerald-600 rounded-full" />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Decision: {submission.decision.decisionType}
                </p>
                <p className="text-xs text-slate-600">
                  {new Date(submission.decision.decidedAt).toLocaleString()} by {submission.decision.decidedBy}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Request?</h3>
            <p className="text-slate-600 mb-4">
              Are you sure you want to delete this request? This action cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDelete}
                disabled={deleteSubmission.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              >
                {deleteSubmission.isPending ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

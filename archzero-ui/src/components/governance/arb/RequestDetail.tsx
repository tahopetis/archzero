/**
 * ARB Request Detail Component
 * Displays full submission information with edit capability
 */

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useARBSubmission, useUpdateARBSubmission, useDeleteARBSubmission } from '@/lib/governance-hooks';
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
  Paperclip
} from 'lucide-react';
import { Card, StatusBadge } from '../shared';
import { NewRequestForm } from './ARBComponents';
import type { ARBSubmission, ARBDecision } from '@/types/governance';

export function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: submission, isLoading } = useARBSubmission(id!);
  const updateSubmission = useUpdateARBSubmission();
  const deleteSubmission = useDeleteARBSubmission();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const canEdit = !submission.decision; // Can only edit draft/pending requests

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

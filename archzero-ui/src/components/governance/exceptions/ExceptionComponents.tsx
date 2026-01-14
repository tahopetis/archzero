/**
 * Exception Management Components
 * Including approval workflow
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Edit3,
  Trash2,
  Plus,
  Shield,
  Calendar
} from 'lucide-react';
import {
  ExceptionStatus,
  ExceptionDuration,
  type Exception
} from '@/types/governance';
import { useExceptions, useApproveException, useRejectException } from '@/lib/governance-hooks';
import {
  Card,
  StatusBadge,
  IconBadge,
  MetadataItem,
  cn
} from '../shared';

// ============================================================================
// EXCEPTION CARD
// ============================================================================

interface ExceptionCardProps {
  exception: Exception;
  onApprove?: (exception: Exception) => void;
  onReject?: (exception: Exception) => void;
  onDelete?: (id: string) => void;
}

export function ExceptionCard({ exception, onApprove, onReject, onDelete }: ExceptionCardProps) {
  const getStatusVariant = (status: ExceptionStatus) => {
    switch (status) {
      case 'Pending': return 'pending';
      case 'Approved': return 'compliant';
      case 'Rejected': return 'rejected';
      case 'Expired': return 'expired';
    }
  };

  const isExpiringSoon = exception.expirationDate &&
    new Date(exception.expirationDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <Card variant="bordered" className={cn(
      'group hover:shadow-lg transition-all',
      isExpiringSoon && exception.status === 'Approved' && 'border-amber-300 bg-amber-50/30'
    )} data-testid={`exception-item-${exception.id}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="text-lg font-bold text-slate-900">{exception.name}</h3>
            <StatusBadge variant={getStatusVariant(exception.status) as any}>
              {exception.status}
            </StatusBadge>
            {isExpiringSoon && exception.status === 'Approved' && (
              <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-md text-xs font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Expiring Soon
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 line-clamp-2">{exception.exceptionReason}</p>
        </div>
      </div>

      <div className="mb-3">
        <MetadataItem
          label="Duration"
          value={exception.duration.replace('Days', ' Days')}
          icon={Clock}
        />
      </div>

      {exception.compensatingControls && exception.compensatingControls.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
            Compensating Controls
          </p>
          <ul className="space-y-1">
            {exception.compensatingControls.map((control, idx) => (
              <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                <Shield className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>{control}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {exception.expirationDate && (
        <div className="mb-3">
          <MetadataItem
            label="Expiration"
            value={new Date(exception.expirationDate).toLocaleDateString()}
            icon={Calendar}
          />
        </div>
      )}

      {exception.status === 'Approved' && exception.approvedBy && (
        <div className="mb-3 p-2 bg-emerald-50 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span className="text-slate-700">
              Approved by {exception.approvedBy}
              {exception.approvedAt && ` on ${new Date(exception.approvedAt).toLocaleDateString()}`}
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
        {exception.status === 'Pending' && (
          <>
            {onApprove && (
              <button
                onClick={() => onApprove(exception)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </button>
            )}
            {onReject && (
              <button
                onClick={() => onReject(exception)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            )}
          </>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(exception.id)}
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
// EXCEPTIONS LIST
// ============================================================================

interface ExceptionsListProps {
  status?: ExceptionStatus;
  onApprove?: (exception: Exception) => void;
  onReject?: (exception: Exception) => void;
  onDelete?: (id: string) => void;
}

export function ExceptionsList({ status, onApprove, onReject, onDelete }: ExceptionsListProps) {
  const { data: exceptions, isLoading } = useExceptions({ status });

  if (isLoading) {
    return <div className="animate-pulse bg-slate-100 h-64 rounded-xl" />;
  }

  if (!exceptions?.data.length) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">No exceptions found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="exceptions-list">
      {exceptions.data.map((exception) => (
        <ExceptionCard
          key={exception.id}
          exception={exception}
          onApprove={onApprove}
          onReject={onReject}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

// ============================================================================
// PENDING EXCEPTIONS
// ============================================================================

export function PendingExceptions() {
  const { data: exceptions, isLoading } = useExceptions({ status: ExceptionStatus.Pending });

  if (isLoading) {
    return <div className="animate-pulse bg-slate-100 h-48 rounded-xl" />;
  }

  if (!exceptions?.data.length) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <h2 className="text-lg font-bold text-slate-900">Pending Exceptions</h2>
        </div>
        <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-md text-sm font-semibold">
          {exceptions.data.length}
        </span>
      </div>

      <div className="space-y-3">
        {exceptions.data.slice(0, 3).map((exception) => (
          <Link
            key={exception.id}
            to={`/governance/exceptions/${exception.id}`}
            className="block p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
          >
            <p className="font-medium text-slate-900">{exception.name}</p>
            <p className="text-sm text-slate-600 line-clamp-1 mt-1">{exception.exceptionReason}</p>
          </Link>
        ))}
        {exceptions.data.length > 3 && (
          <Link
            to="/governance/exceptions?status=Pending"
            className="block text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            View all {exceptions.data.length} pending →
          </Link>
        )}
      </div>
    </Card>
  );
}

// ============================================================================
// APPROVAL FORM
// ============================================================================

interface ApprovalFormProps {
  exception: Exception;
  onSubmit: (comments?: string) => void;
  onCancel: () => void;
}

export function ApprovalForm({ exception, onSubmit, onCancel }: ApprovalFormProps) {
  const [comments, setComments] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleApprove = () => {
    onSubmit(comments || undefined);
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    onSubmit(undefined); // Will be handled by caller with rejection reason
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-indigo-600" />
        <h2 className="text-lg font-bold text-slate-900">
          {isRejecting ? 'Reject Exception' : 'Approve Exception'}
        </h2>
      </div>

      <div className="mb-4 p-3 bg-slate-50 rounded-lg">
        <p className="font-medium text-slate-900">{exception.name}</p>
        <p className="text-sm text-slate-600 mt-1">{exception.exceptionReason}</p>
      </div>

      {!isRejecting ? (
        <>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Comments (Optional)
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Add any comments for the approval..."
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleApprove}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              Approve Exception
            </button>
            <button
              onClick={() => setIsRejecting(true)}
              className="px-4 py-2 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 transition-colors font-medium"
            >
              Reject Instead
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Rejection Reason <span className="text-rose-600">*</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Explain why this exception is being rejected..."
              required
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReject}
              className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium"
            >
              Confirm Rejection
            </button>
            <button
              onClick={() => setIsRejecting(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Back to Approval
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </Card>
  );
}

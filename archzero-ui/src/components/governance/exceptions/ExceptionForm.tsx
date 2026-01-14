/**
 * Exception Form Component
 */

import { useState } from 'react';
import { ExceptionDuration, type Exception, type CreateExceptionRequest } from '@/types/governance';
import { useCreateException, useUpdateException } from '@/lib/governance-hooks';

interface ExceptionFormProps {
  exception?: Exception;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ExceptionForm({ exception, onSuccess, onCancel }: ExceptionFormProps) {
  const createMutation = useCreateException();
  const updateMutation = useUpdateException();

  const [name, setName] = useState(exception?.name || '');
  const [exceptionReason, setExceptionReason] = useState(exception?.exceptionReason || '');
  const [duration, setDuration] = useState<ExceptionDuration>(exception?.duration || ExceptionDuration.Days30);
  const [compensatingControls, setCompensatingControls] = useState(
    exception?.compensatingControls?.join('\n') || ''
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const controls = compensatingControls.split('\n').filter(c => c.trim());

    if (exception) {
      await updateMutation.mutateAsync({
        id: exception.id,
        data: {
          exceptionReason,
          duration,
          compensatingControls: controls.length > 0 ? controls : undefined,
        },
      });
    } else {
      await createMutation.mutateAsync({
        name,
        exceptionReason,
        duration,
        compensatingControls: controls.length > 0 ? controls : undefined,
      });
    }

    onSuccess();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6" data-testid="exception-form">
      <h2 className="text-xl font-bold text-slate-900 mb-4">
        {exception ? 'Edit Exception' : 'Request Exception'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!exception && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Exception Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., Legacy Database Exception"
              required
              data-testid="exception-name-input"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Exception Reason *
          </label>
          <textarea
            value={exceptionReason}
            onChange={(e) => setExceptionReason(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Explain why this exception is needed..."
            required
            data-testid="exception-justification-input"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Duration *
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value as ExceptionDuration)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            required
            data-testid="exception-type-select"
          >
            {Object.values(ExceptionDuration).map((d) => (
              <option key={d} value={d}>{d.replace('Days', ' Days')}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Compensating Controls
          </label>
          <textarea
            value={compensatingControls}
            onChange={(e) => setCompensatingControls(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter one compensating control per line..."
            data-testid="exception-controls-input"
          />
          <p className="text-xs text-slate-500 mt-1">Alternative measures to mitigate risk</p>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
            data-testid="exception-save-button"
          >
            {createMutation.isPending || updateMutation.isPending
              ? 'Saving...'
              : exception
              ? 'Update Exception'
              : 'Submit Exception'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            data-testid="exception-cancel-button"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * Bulk Edit Dialog
 * Edit common fields across multiple cards
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/components/governance/shared';
import { CardType, LifecyclePhase } from '@/types';
import { useBulkUpdateCards } from '@/lib/bulk-hooks';

interface BulkEditDialogProps {
  selectedIds: string[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkEditDialog({
  selectedIds,
  isOpen,
  onClose,
  onSuccess,
}: BulkEditDialogProps) {
  const [updates, setUpdates] = useState({
    type_: '',
    lifecycle_phase: '',
    tags: '',
    quality_score: '',
  });

  const bulkUpdate = useBulkUpdateCards();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const updateData: any = {};
    if (updates.type_) updateData.type_ = updates.type_;
    if (updates.lifecycle_phase) updateData.lifecycle_phase = updates.lifecycle_phase;
    if (updates.tags) updateData.tags = updates.tags.split(',').map(t => t.trim()).filter(Boolean);
    if (updates.quality_score) updateData.quality_score = parseInt(updates.quality_score, 10);

    await bulkUpdate.mutateAsync({
      ids: selectedIds,
      updates: updateData,
    });

    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-slate-900">
            Edit {selectedIds.length} {selectedIds.length === 1 ? 'Card' : 'Cards'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-slate-700 mb-1">
              Type
            </label>
            <select
              id="type"
              value={updates.type_}
              onChange={(e) => setUpdates({ ...updates, type_: e.target.value })}
              className={cn(
                'w-full px-3 py-2 border border-slate-300 rounded-lg',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
              )}
            >
              <option value="">Leave unchanged</option>
              {Object.values(CardType).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="lifecycle-phase" className="block text-sm font-medium text-slate-700 mb-1">
              Lifecycle Phase
            </label>
            <select
              id="lifecycle-phase"
              value={updates.lifecycle_phase}
              onChange={(e) => setUpdates({ ...updates, lifecycle_phase: e.target.value })}
              className={cn(
                'w-full px-3 py-2 border border-slate-300 rounded-lg',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
              )}
            >
              <option value="">Leave unchanged</option>
              {Object.values(LifecyclePhase).map((phase) => (
                <option key={phase} value={phase}>
                  {phase}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={updates.tags}
              onChange={(e) => setUpdates({ ...updates, tags: e.target.value })}
              placeholder="e.g. critical, payment, legacy"
              className={cn(
                'w-full px-3 py-2 border border-slate-300 rounded-lg',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
              )}
            />
            <p className="mt-1 text-xs text-slate-500">
              Leave empty to keep existing tags
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Quality Score (0-100)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={updates.quality_score}
              onChange={(e) => setUpdates({ ...updates, quality_score: e.target.value })}
              placeholder="e.g. 75"
              className={cn(
                'w-full px-3 py-2 border border-slate-300 rounded-lg',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
              )}
            />
            <p className="mt-1 text-xs text-slate-500">
              Leave empty to keep existing scores
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'px-4 py-2 rounded-lg transition-colors',
                'text-slate-700 hover:bg-slate-100'
              )}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={bulkUpdate.isPending}
              className={cn(
                'px-4 py-2 rounded-lg transition-colors',
                'bg-indigo-600 text-white hover:bg-indigo-700',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {bulkUpdate.isPending ? 'Updating...' : 'Update Cards'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

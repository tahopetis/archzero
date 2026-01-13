/**
 * Bulk Tag Dialog
 * Add or replace tags on multiple cards
 */

import { useState } from 'react';
import { Tag as TagIcon, X } from 'lucide-react';
import { cn } from '@/components/governance/shared';
import { useBulkUpdateCards } from '@/lib/bulk-hooks';

interface BulkTagDialogProps {
  selectedIds: string[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkTagDialog({
  selectedIds,
  isOpen,
  onClose,
  onSuccess,
}: BulkTagDialogProps) {
  const [tags, setTags] = useState('');
  const [mode, setMode] = useState<'add' | 'replace'>('add');

  const bulkUpdate = useBulkUpdateCards();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);

    await bulkUpdate.mutateAsync({
      ids: selectedIds,
      updates: { tags: tagArray },
    });

    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-slate-900">
            Tag {selectedIds.length} {selectedIds.length === 1 ? 'Card' : 'Cards'}
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
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tag Mode
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('add')}
                className={cn(
                  'flex-1 px-4 py-2 rounded-lg transition-colors',
                  mode === 'add'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                )}
              >
                Add Tags
              </button>
              <button
                type="button"
                onClick={() => setMode('replace')}
                className={cn(
                  'flex-1 px-4 py-2 rounded-lg transition-colors',
                  mode === 'replace'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                )}
              >
                Replace Tags
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {mode === 'add'
                ? 'Add new tags to existing ones'
                : 'Replace all existing tags with new ones'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tags
            </label>
            <div className="relative">
              <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. critical, payment, legacy"
                className={cn(
                  'w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg',
                  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                )}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Separate multiple tags with commas
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
              disabled={bulkUpdate.isPending || !tags.trim()}
              className={cn(
                'px-4 py-2 rounded-lg transition-colors',
                'bg-indigo-600 text-white hover:bg-indigo-700',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {bulkUpdate.isPending ? 'Updating...' : 'Update Tags'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

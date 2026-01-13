/**
 * Bulk Delete Confirmation Dialog
 */

import { AlertTriangle } from 'lucide-react';
import { cn } from '@/components/governance/shared';
import { useBulkDeleteCards } from '@/lib/bulk-hooks';

interface BulkDeleteConfirmProps {
  selectedIds: string[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkDeleteConfirm({
  selectedIds,
  isOpen,
  onClose,
  onSuccess,
}: BulkDeleteConfirmProps) {
  const bulkDelete = useBulkDeleteCards();

  if (!isOpen) return null;

  const handleDelete = async () => {
    await bulkDelete.mutateAsync(selectedIds);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                Delete {selectedIds.length} {selectedIds.length === 1 ? 'Card' : 'Cards'}?
              </h2>
              <p className="text-slate-600 mb-4">
                This action cannot be undone. All selected cards and their relationships will be permanently deleted.
              </p>
              {bulkDelete.error && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                  <p className="text-sm text-rose-800">
                    Error: {bulkDelete.error.message}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              disabled={bulkDelete.isPending}
              className={cn(
                'px-4 py-2 rounded-lg transition-colors',
                'text-slate-700 hover:bg-slate-100',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={bulkDelete.isPending}
              className={cn(
                'px-4 py-2 rounded-lg transition-colors',
                'bg-rose-600 text-white hover:bg-rose-700',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {bulkDelete.isPending ? 'Deleting...' : `Delete ${selectedIds.length} ${selectedIds.length === 1 ? 'Card' : 'Cards'}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

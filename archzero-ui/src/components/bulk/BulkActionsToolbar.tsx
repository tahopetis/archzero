/**
 * Bulk Actions Toolbar
 * Multi-select and bulk operations on cards
 */

import { Trash2, Edit, Tag, Download, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/components/governance/shared';

interface BulkActionsToolbarProps {
  selectedCount: number;
  onBulkDelete: () => void;
  onBulkEdit: () => void;
  onBulkTag: () => void;
  onBulkExport: () => void;
  onClearSelection: () => void;
}

export function BulkActionsToolbar({
  selectedCount,
  onBulkDelete,
  onBulkEdit,
  onBulkTag,
  onBulkExport,
  onClearSelection,
}: BulkActionsToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div data-testid="bulk-actions" className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-indigo-900">
            {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
          </span>
          <button
            onClick={onClearSelection}
            className="p-1 hover:bg-indigo-100 rounded transition-colors"
            title="Clear selection"
          >
            <X className="w-4 h-4 text-indigo-600" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBulkEdit}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
              'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300'
            )}
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>

          <button
            onClick={onBulkTag}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
              'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300'
            )}
          >
            <Tag className="w-4 h-4" />
            Tag
          </button>

          <button
            onClick={onBulkExport}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
              'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300'
            )}
          >
            <Download className="w-4 h-4" />
            Export
          </button>

          <button
            data-testid="bulk-delete-button"
            onClick={onBulkDelete}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
              'bg-rose-600 text-white hover:bg-rose-700'
            )}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

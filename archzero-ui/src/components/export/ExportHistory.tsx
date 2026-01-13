/**
 * Export History
 * Display past exports and allow re-downloading
 */

import { format } from 'date-fns';
import { Download, Trash2, Calendar } from 'lucide-react';
import { cn } from '@/components/governance/shared';

export interface ExportHistoryItem {
  id: string;
  filename: string;
  domain: string;
  format: string;
  created_at: string;
  size: number;
  created_by: string;
}

interface ExportHistoryProps {
  history: ExportHistoryItem[];
  onReDownload: (item: ExportHistoryItem) => void;
  onDelete: (id: string) => void;
}

export function ExportHistory({ history, onReDownload, onDelete }: ExportHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">No Export History</h3>
        <p className="text-slate-500">Your previous exports will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {history.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-slate-900">{item.filename}</h4>
              <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded">
                {item.format.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')} • {item.domain} •{' '}
              {(item.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onReDownload(item)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                'text-slate-600 hover:bg-slate-100'
              )}
              title="Download again"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                'text-rose-600 hover:bg-rose-50'
              )}
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

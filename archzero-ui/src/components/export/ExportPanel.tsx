/**
 * Export Panel
 * Configure and trigger exports
 */

import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, File } from 'lucide-react';
import { cn } from '@/components/governance/shared';
import { useExportCards, useDownloadExport } from '@/lib/export-hooks';

interface ExportPanelProps {
  selectedIds?: string[];
  onClose?: () => void;
}

type ExportFormat = 'csv' | 'excel' | 'pdf';
type ExportDomain = 'cards' | 'principles' | 'standards' | 'policies' | 'exceptions' | 'initiatives' | 'risks' | 'compliance';

export function ExportPanel({ selectedIds, onClose }: ExportPanelProps) {
  const [format, setFormat] = useState<ExportFormat>('excel');
  const [domain, setDomain] = useState<ExportDomain>('cards');
  const [includeFilters, setIncludeFilters] = useState(false);
  const [template, setTemplate] = useState<string>('default');

  const exportMutation = useExportCards();
  const downloadMutation = useDownloadExport();

  const handleExport = async () => {
    const blob = await exportMutation.mutateAsync({
      ids: selectedIds,
      format,
      template,
    });

    const extension = format === 'csv' ? 'csv' : format === 'excel' ? 'xlsx' : 'pdf';
    const filename = `${domain}-export-${new Date().toISOString().split('T')[0]}.${extension}`;

    await downloadMutation.mutateAsync({ blob, filename });
    onClose?.();
  };

  const formats = [
    { value: 'csv' as const, label: 'CSV', icon: FileText, description: 'Comma-separated values' },
    { value: 'excel' as const, label: 'Excel', icon: FileSpreadsheet, description: 'Microsoft Excel format' },
    { value: 'pdf' as const, label: 'PDF', icon: File, description: 'Portable Document Format' },
  ];

  const domains = [
    { value: 'cards' as const, label: 'Cards' },
    { value: 'principles' as const, label: 'Architecture Principles' },
    { value: 'standards' as const, label: 'Technology Standards' },
    { value: 'policies' as const, label: 'Architecture Policies' },
    { value: 'exceptions' as const, label: 'Exceptions' },
    { value: 'initiatives' as const, label: 'Initiatives' },
    { value: 'risks' as const, label: 'Risks' },
    { value: 'compliance' as const, label: 'Compliance' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Export Data</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            ×
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Domain Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            What to Export
          </label>
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value as ExportDomain)}
            className={cn(
              'w-full px-3 py-2 border border-slate-300 rounded-lg',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500'
            )}
          >
            {domains.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
          {selectedIds && selectedIds.length > 0 && (
            <p className="mt-1 text-sm text-slate-500">
              {selectedIds.length} items selected
            </p>
          )}
        </div>

        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Export Format
          </label>
          <div className="grid grid-cols-3 gap-3">
            {formats.map((f) => {
              const Icon = f.icon;
              return (
                <button
                  key={f.value}
                  onClick={() => setFormat(f.value)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors',
                    format === f.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  <Icon className="w-6 h-6 text-slate-600" />
                  <span className="text-sm font-medium text-slate-900">{f.label}</span>
                  <span className="text-xs text-slate-500 text-center">{f.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Template Selection */}
        {format === 'excel' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Template
            </label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className={cn(
                'w-full px-3 py-2 border border-slate-300 rounded-lg',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500'
              )}
            >
              <option value="default">Default Template</option>
              <option value="detailed">Detailed Report</option>
              <option value="summary">Executive Summary</option>
              <option value="audit">Audit Trail</option>
            </select>
          </div>
        )}

        {/* Options */}
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeFilters}
              onChange={(e) => setIncludeFilters(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-slate-700">
              Include current filters
            </span>
          </label>
        </div>

        {/* Export Button */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <button
            onClick={onClose}
            className={cn(
              'px-4 py-2 rounded-lg transition-colors',
              'text-slate-700 hover:bg-slate-100'
            )}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={exportMutation.isPending || downloadMutation.isPending}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
              'bg-indigo-600 text-white hover:bg-indigo-700',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <Download className="w-4 h-4" />
            {exportMutation.isPending || downloadMutation.isPending
              ? 'Exporting...'
              : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
}

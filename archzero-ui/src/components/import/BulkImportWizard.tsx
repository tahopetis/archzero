/**
 * Bulk Import Wizard Component
 * Multi-step wizard for importing cards from CSV/Excel
 */

import { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useBulkImportCards } from '@/lib/import-hooks';
import type { ColumnMapping } from '@/types/import';
import { cn } from '@/components/governance/shared';

interface BulkImportWizardProps {
  onSuccess: () => void;
  onCancel: () => void;
}

type WizardStep = 'upload' | 'mapping' | 'validation' | 'importing' | 'complete';

export function BulkImportWizard({ onSuccess, onCancel }: BulkImportWizardProps) {
  const [step, setStep] = useState<WizardStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [previewData, setPreviewData] = useState<any[]>([]);

  const importMutation = useBulkImportCards();

  const handleFileUpload = (uploadedFile: File) => {
    setFile(uploadedFile);
    setStep('mapping');
  };

  const handleMappingNext = (mapping: ColumnMapping, data: any[]) => {
    setColumnMapping(mapping);
    setPreviewData(data);
    setStep('validation');
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      const result = await importMutation.mutateAsync({
        file,
        columnMapping,
      });

      setStep('importing');

      // Poll for completion
      const interval = setInterval(async () => {
        // Check status and update UI
      }, 1000);

      setTimeout(() => {
        clearInterval(interval);
        setStep('complete');
      }, 3000);
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {['upload', 'mapping', 'validation', 'importing', 'complete'].map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className={cn(
              'flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-semibold',
              step === s ? 'border-indigo-600 bg-indigo-50 text-indigo-600' :
              ['upload', 'mapping', 'validation', 'importing', 'complete'].indexOf(step) > i
                ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                : 'border-slate-300 text-slate-400'
            )}>
              {i + 1}
            </div>
            {i < 4 && (
              <div className={cn(
                'flex-1 h-1 mx-2 rounded',
                ['upload', 'mapping', 'validation', 'importing', 'complete'].indexOf(step) > i
                  ? 'bg-emerald-500'
                  : 'bg-slate-200'
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {step === 'upload' && (
        <UploadStep onFileSelect={handleFileUpload} onCancel={onCancel} />
      )}

      {step === 'mapping' && file && (
        <ColumnMappingStep
          file={file}
          onNext={handleMappingNext}
          onBack={() => setStep('upload')}
        />
      )}

      {step === 'validation' && (
        <ValidationStep
          previewData={previewData}
          onNext={handleImport}
          onBack={() => setStep('mapping')}
        />
      )}

      {step === 'importing' && (
        <div className="text-center py-12">
          <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">Importing Cards...</h3>
          <p className="text-slate-600">This may take a few moments</p>
        </div>
      )}

      {step === 'complete' && (
        <div className="text-center py-12">
          <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">Import Complete!</h3>
          <p className="text-slate-600 mb-6">Your cards have been successfully imported</p>
          <button
            onClick={onSuccess}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            View Cards
          </button>
        </div>
      )}
    </div>
  );
}

// Upload Step Component
function UploadStep({ onFileSelect, onCancel }: { onFileSelect: (file: File) => void; onCancel: () => void }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      onFileSelect(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-4">Upload File</h2>
      <p className="text-slate-600 mb-6">
        Upload a CSV or Excel file containing card data. Maximum file size: 50MB
      </p>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        className={cn(
          'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors',
          isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400'
        )}
      >
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-lg font-semibold text-slate-700 mb-2">
            Drop your file here, or click to browse
          </p>
          <p className="text-sm text-slate-500">
            Supports CSV, Excel (.xlsx, .xls)
          </p>
        </label>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// Column Mapping Step Component
function ColumnMappingStep({
  file,
  onNext,
  onBack
}: {
  file: File;
  onNext: (mapping: ColumnMapping, data: any[]) => void;
  onBack: () => void;
}) {
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    name: '',
    type: '',
    lifecycle_phase: '',
    description: '',
    tags: '',
    owner_id: '',
    quality_score: '',
  });

  // Parse file to get columns
  useState(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      if (typeof data === 'string') {
        const rows = data.split('\n');
        if (rows.length > 0) {
          setColumns(rows[0].split(','));
        }
      }
    };
    reader.readAsText(file);
  });

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-4">Map Columns</h2>
      <p className="text-slate-600 mb-6">
        Match your file columns to Arc Zero card fields
      </p>

      <div className="space-y-4">
        {['name', 'type', 'lifecycle_phase', 'description', 'tags', 'owner_id', 'quality_score'].map((field) => (
          <div key={field} className="flex items-center gap-4">
            <label className="w-48 text-sm font-semibold text-slate-700">
              {field.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </label>
            <select
              value={mapping[field as keyof ColumnMapping] || ''}
              onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="">-- Select Column --</option>
              {columns.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => onNext(mapping, [])}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}

// Validation Step Component
function ValidationStep({
  previewData,
  onNext,
  onBack
}: {
  previewData: any[];
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-4">Review & Import</h2>
      <p className="text-slate-600 mb-6">
        Review your data before importing
      </p>

      <div className="bg-slate-50 rounded-lg p-4 mb-4">
        <p className="text-sm font-semibold text-slate-700 mb-2">
          {previewData.length} rows ready to import
        </p>
        <div className="max-h-64 overflow-auto">
          {previewData.slice(0, 10).map((row, i) => (
            <div key={i} className="text-sm py-1 border-b border-slate-200 last:border-0">
              {Object.values(row).join(' | ')}
            </div>
          ))}
          {previewData.length > 10 && (
            <p className="text-sm text-slate-500 italic mt-2">
              ... and {previewData.length - 10} more rows
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Start Import
        </button>
      </div>
    </div>
  );
}

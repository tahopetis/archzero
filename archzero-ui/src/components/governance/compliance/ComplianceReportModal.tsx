/**
 * Compliance Report Generation Modal
 */

import { useState } from 'react';
import { X, FileText, Download } from 'lucide-react';

interface ReportParameters {
  framework: string;
  dateRange: string;
  includeEvidence: boolean;
  includeAssessments: boolean;
  format: 'pdf' | 'xlsx';
}

interface ComplianceReportModalProps {
  onClose: () => void;
  onGenerate: (params: ReportParameters) => void;
}

export function ComplianceReportModal({ onClose, onGenerate }: ComplianceReportModalProps) {
  const [framework, setFramework] = useState<string>('GDPR');
  const [dateRange, setDateRange] = useState<string>('last-quarter');
  const [includeEvidence, setIncludeEvidence] = useState<boolean>(true);
  const [includeAssessments, setIncludeAssessments] = useState<boolean>(true);
  const [format, setFormat] = useState<'pdf' | 'xlsx'>('pdf');

  const handleGenerate = () => {
    onGenerate({
      framework,
      dateRange,
      includeEvidence,
      includeAssessments,
      format,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full" data-testid="report-preview">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Generate Compliance Report</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Framework Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Compliance Framework
            </label>
            <select
              value={framework}
              onChange={(e) => setFramework(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              data-testid="report-framework"
            >
              <option value="all">All Frameworks</option>
              <option value="GDPR">GDPR</option>
              <option value="SOX">SOX</option>
              <option value="HIPAA">HIPAA</option>
              <option value="ISO 27001">ISO 27001</option>
              <option value="PCI DSS">PCI DSS</option>
              <option value="SOC 2">SOC 2</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              data-testid="report-date-range"
            >
              <option value="last-month">Last Month</option>
              <option value="last-quarter">Last Quarter</option>
              <option value="last-year">Last Year</option>
              <option value="ytd">Year to Date</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Report Format
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormat('pdf')}
                className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                  format === 'pdf'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                PDF
              </button>
              <button
                type="button"
                onClick={() => setFormat('xlsx')}
                className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                  format === 'xlsx'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                Excel (XLSX)
              </button>
            </div>
          </div>

          {/* Include Options */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeEvidence}
                onChange={(e) => setIncludeEvidence(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-700">Include evidence documents</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeAssessments}
                onChange={(e) => setIncludeAssessments(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-700">Include control assessments</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );
}

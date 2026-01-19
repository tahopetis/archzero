/**
 * Audit Scheduling Modal
 */

import { useState } from 'react';
import { X, Calendar, User } from 'lucide-react';

interface AuditDetails {
  title: string;
  date: string;
  framework: string;
  auditor: string;
  notes?: string;
}

interface AuditScheduleModalProps {
  onClose: () => void;
  onSchedule: (audit: AuditDetails) => void;
}

export function AuditScheduleModal({ onClose, onSchedule }: AuditScheduleModalProps) {
  const [title, setTitle] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [framework, setFramework] = useState<string>('GDPR');
  const [auditor, setAuditor] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const handleSchedule = () => {
    if (!title || !date || !auditor) {
      alert('Please fill in all required fields');
      return;
    }

    onSchedule({
      title,
      date,
      framework,
      auditor,
      notes,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Schedule Audit</h2>
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
          {/* Audit Title */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Audit Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Q2 2026 Compliance Audit"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              data-testid="audit-title"
            />
          </div>

          {/* Audit Date */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Audit Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              data-testid="audit-date"
            />
          </div>

          {/* Framework */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Compliance Framework *
            </label>
            <select
              value={framework}
              onChange={(e) => setFramework(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              data-testid="audit-framework"
            >
              <option value="GDPR">GDPR</option>
              <option value="SOX">SOX</option>
              <option value="HIPAA">HIPAA</option>
              <option value="ISO 27001">ISO 27001</option>
              <option value="PCI DSS">PCI DSS</option>
              <option value="SOC 2">SOC 2</option>
            </select>
          </div>

          {/* Auditor */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Auditor / Firm *
            </label>
            <input
              type="text"
              value={auditor}
              onChange={(e) => setAuditor(e.target.value)}
              placeholder="e.g., External Audit Firm"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              data-testid="audit-auditor"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes or requirements..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
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
            onClick={handleSchedule}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Schedule Audit
          </button>
        </div>
      </div>
    </div>
  );
}

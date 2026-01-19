/**
 * Framework Setup Modal Component
 * Allows users to configure and set up compliance frameworks
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import { Card } from '../shared';

interface FrameworkSetupModalProps {
  onClose: () => void;
  onSetup: (framework: {
    type: string;
    name: string;
    description: string;
  }) => void;
}

export function FrameworkSetupModal({ onClose, onSetup }: FrameworkSetupModalProps) {
  const [framework, setFramework] = useState<string>('GDPR');
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const frameworks = [
    { value: 'GDPR', label: 'GDPR' },
    { value: 'SOX', label: 'SOX' },
    { value: 'HIPAA', label: 'HIPAA' },
    { value: 'ISO 27001', label: 'ISO 27001' },
    { value: 'PCI DSS', label: 'PCI DSS' },
    { value: 'SOC 2', label: 'SOC 2' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Please enter a framework name');
      return;
    }

    onSetup({
      type: framework,
      name: name.trim(),
      description: description.trim(),
    });

    // Close modal after setup
    onClose();

    // Reset form
    setName('');
    setDescription('');
    setFramework('GDPR');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Setup Compliance Framework</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Framework Type */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Framework Type
            </label>
            <select
              value={framework}
              onChange={(e) => setFramework(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              data-testid="compliance-framework"
              required
            >
              {frameworks.map((fw) => (
                <option key={fw.value} value={fw.value}>
                  {fw.label}
                </option>
              ))}
            </select>
          </div>

          {/* Framework Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Framework Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., GDPR Compliance Program"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              data-testid="framework-name"
              required
            />
          </div>

          {/* Framework Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the scope and objectives of this framework implementation"
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              data-testid="framework-description"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              data-testid="save-framework-btn"
            >
              Save Framework
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}

/**
 * Compliance Management Page
 */

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ComplianceHub, ComplianceDashboard, type ComplianceRequirement } from '@/components/governance/compliance';
import { ComplianceForm } from '@/components/governance/compliance/ComplianceForm';

export function CompliancePage() {
  const { id } = useParams();
  const [selectedRequirement, setSelectedRequirement] = useState<ComplianceRequirement | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState<string>('all');

  if (id) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <ComplianceDashboard complianceId={id} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="compliance-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Compliance Management</h1>
            <p className="text-slate-600 mt-1">Track compliance across frameworks and regulations</p>
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            data-testid="add-compliance-btn"
          >
            New Requirement
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Filter by Framework
          </label>
          <select
            value={selectedFramework}
            onChange={(e) => setSelectedFramework(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            data-testid="compliance-framework"
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

        {isFormOpen && (
          <div className="mb-6">
            <ComplianceForm
              requirement={selectedRequirement || undefined}
              onSuccess={() => {
                setIsFormOpen(false);
                setSelectedRequirement(null);
              }}
              onCancel={() => {
                setIsFormOpen(false);
                setSelectedRequirement(null);
              }}
            />
          </div>
        )}

        <ComplianceHub />
      </div>
    </div>
  );
}

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
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Compliance Management</h1>
            <p className="text-slate-600 mt-1">Track compliance across frameworks and regulations</p>
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            New Requirement
          </button>
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

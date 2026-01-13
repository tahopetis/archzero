/**
 * Architecture Policies Page
 */

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { PoliciesList, PolicyDetail, type ArchitecturePolicy } from '@/components/governance/policies';
import { PolicyForm } from '@/components/governance/policies/PolicyForm';

export function PoliciesPage() {
  const { id } = useParams();
  const [selectedPolicy, setSelectedPolicy] = useState<ArchitecturePolicy | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  if (id) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PolicyDetail id={id} onEdit={(p) => setSelectedPolicy(p)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Architecture Policies</h1>
            <p className="text-slate-600 mt-1">Define and manage architecture policies with rule builders</p>
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            New Policy
          </button>
        </div>

        {isFormOpen && (
          <div className="mb-6">
            <PolicyForm
              policy={selectedPolicy || undefined}
              onSuccess={() => {
                setIsFormOpen(false);
                setSelectedPolicy(null);
              }}
              onCancel={() => {
                setIsFormOpen(false);
                setSelectedPolicy(null);
              }}
            />
          </div>
        )}

        <PoliciesList
          onEdit={(policy) => {
            setSelectedPolicy(policy);
            setIsFormOpen(true);
          }}
        />
      </div>
    </div>
  );
}

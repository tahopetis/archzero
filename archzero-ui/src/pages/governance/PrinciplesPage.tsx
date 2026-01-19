/**
 * Architecture Principles Page
 */

import { useState } from 'react';
import { PrinciplesList, PrincipleDetail, type ArchitecturePrinciple } from '@/components/governance/principles';
import { PrincipleForm } from '@/components/governance/principles/PrincipleForm';
import { usePrinciples } from '@/lib/governance-hooks';
import { useParams } from 'react-router-dom';

export function PrinciplesPage() {
  const { id } = useParams();
  const [selectedPrinciple, setSelectedPrinciple] = useState<ArchitecturePrinciple | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  if (id) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PrincipleDetail id={id} onEdit={(p) => setSelectedPrinciple(p)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Architecture Principles</h1>
            <p className="text-slate-600 mt-1">Define and manage architectural principles for the organization</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => console.log('Export principles report')}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium"
              data-testid="export-report-btn"
            >
              Export
            </button>
            <button
              onClick={() => setIsFormOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              New Principle
            </button>
          </div>
        </div>

        {isFormOpen && (
          <div className="mb-6">
            <PrincipleForm
              principle={selectedPrinciple || undefined}
              onSuccess={() => {
                setIsFormOpen(false);
                setSelectedPrinciple(null);
              }}
              onCancel={() => {
                setIsFormOpen(false);
                setSelectedPrinciple(null);
              }}
            />
          </div>
        )}

        <PrinciplesList
          onEdit={(principle) => {
            setSelectedPrinciple(principle);
            setIsFormOpen(true);
          }}
        />
      </div>
    </div>
  );
}

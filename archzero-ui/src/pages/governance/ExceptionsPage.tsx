/**
 * Exceptions Management Page
 */

import { useState } from 'react';
import { ExceptionsList, PendingExceptions, type Exception } from '@/components/governance/exceptions';
import { ExceptionForm } from '@/components/governance/exceptions/ExceptionForm';
import { useExceptions } from '@/lib/governance-hooks';

export function ExceptionsPage() {
  const [selectedException, setSelectedException] = useState<Exception | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Exceptions Management</h1>
            <p className="text-slate-600 mt-1">Request and manage policy exceptions</p>
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Request Exception
          </button>
        </div>

        {/* Pending Exceptions Alert */}
        <PendingExceptions />

        {isFormOpen && !isApproving && (
          <div className="mb-6">
            <ExceptionForm
              exception={selectedException || undefined}
              onSuccess={() => {
                setIsFormOpen(false);
                setSelectedException(null);
              }}
              onCancel={() => {
                setIsFormOpen(false);
                setSelectedException(null);
              }}
            />
          </div>
        )}

        {isApproving && selectedException && (
          <div className="mb-6">
            {/* ApprovalForm would be rendered here */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800">Approval workflow would be rendered here</p>
            </div>
          </div>
        )}

        <ExceptionsList
          onApprove={(exception) => {
            setSelectedException(exception);
            setIsApproving(true);
          }}
          onReject={(exception) => {
            setSelectedException(exception);
            setIsApproving(true);
          }}
          onDelete={() => {
            // Delete logic
          }}
        />
      </div>
    </div>
  );
}

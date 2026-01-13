/**
 * Bulk Import Page
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { BulkImportWizard } from '@/components/import/BulkImportWizard';

export function BulkImportPage() {
  const navigate = useNavigate();
  const [showWizard, setShowWizard] = useState(false);

  const handleSuccess = () => {
    setShowWizard(false);
    navigate('/cards');
  };

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900">Bulk Import Cards</h1>
            <p className="mt-2 text-slate-600">
              Import cards from CSV or Excel files in bulk
            </p>
          </div>

          {!showWizard ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <svg className="w-24 h-24 text-slate-300 mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3 3v12" />
              </svg>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Ready to Import?</h2>
              <p className="text-slate-600 mb-8">
                Start the import wizard to upload your file
              </p>
              <button
                onClick={() => setShowWizard(true)}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-lg"
              >
                Start Import Wizard
              </button>
            </div>
          ) : (
            <BulkImportWizard onSuccess={handleSuccess} onCancel={() => setShowWizard(false)} />
          )}
        </div>
      </div>
    </Layout>
  );
}

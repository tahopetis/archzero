/**
 * Export Page
 */

import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { ExportPanel } from '@/components/export/ExportPanel';
import { ExportHistory, type ExportHistoryItem } from '@/components/export/ExportHistory';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export function ExportPage() {
  const [showExportPanel, setShowExportPanel] = useState(false);

  const { data: history = [] } = useQuery({
    queryKey: ['export', 'history'],
    queryFn: async () => {
      const { data } = await api.get<ExportHistoryItem[]>('/api/v1/export/history');
      return data;
    },
  });

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900">Export Center</h1>
            <p className="mt-2 text-slate-600">
              Export cards and governance data in various formats
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Export Panel */}
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">New Export</h2>
              <ExportPanel onClose={() => {}} />
            </div>

            {/* Export History */}
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Export History</h2>
              <div className="bg-white rounded-lg shadow p-6">
                <ExportHistory
                  history={history}
                  onReDownload={(item) => {
                    // TODO: Implement re-download
                    console.log('Re-download:', item);
                  }}
                  onDelete={(id) => {
                    // TODO: Implement delete
                    console.log('Delete export:', id);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Scheduled Exports */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Scheduled Exports</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-slate-500 text-center py-8">
                Scheduled exports allow you to automatically generate reports on a recurring basis.
              </p>
              <button
                onClick={() => {
                  // TODO: Implement schedule dialog
                  console.log('Schedule export');
                }}
                className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-colors"
              >
                + Schedule a New Export
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

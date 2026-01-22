/**
 * Export Page
 */

import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { ExportPanel } from '@/components/export/ExportPanel';
import { ExportHistory, type ExportHistoryItem } from '@/components/export/ExportHistory';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useReDownloadExport,
  useDeleteExport,
  useScheduledExports,
  useDownloadExport,
  useCreateScheduledExport,
  useDeleteScheduledExport,
} from '@/lib/export-hooks';
import { Download, Trash2, Plus, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface ScheduledExport {
  id: string;
  name: string;
  export_type: string;
  schedule: string;
  format: string;
  next_run_at: string;
  last_run_at?: string;
  is_active: boolean;
}

export function ExportPage() {
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: history = [], refetch: refetchHistory } = useQuery({
    queryKey: ['export', 'history'],
    queryFn: async () => {
      const response = await fetch('/api/v1/export/history');
      if (!response.ok) throw new Error('Failed to fetch export history');
      const data = await response.json();
      return data.data || [];
    },
  });

  const { data: scheduledExports = [], refetch: refetchScheduled } = useQuery({
    queryKey: ['export', 'scheduled'],
    queryFn: async () => {
      const response = await fetch('/api/v1/export/scheduled');
      if (!response.ok) throw new Error('Failed to fetch scheduled exports');
      const data = await response.json();
      return data.data || [];
    },
  });

  const reDownloadMutation = useReDownloadExport();
  const downloadMutation = useDownloadExport();
  const deleteMutation = useDeleteExport();
  const deleteScheduledMutation = useDeleteScheduledExport();
  const createScheduledMutation = useCreateScheduledExport();

  const handleReDownload = async (item: ExportHistoryItem) => {
    try {
      const { blob, filename } = await reDownloadMutation.mutateAsync({
        id: item.id,
        filename: item.filename,
      });
      await downloadMutation.mutateAsync({ blob, filename });
    } catch (error) {
      console.error('Failed to re-download:', error);
      alert('Failed to re-download export. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this export?')) return;

    try {
      await deleteMutation.mutateAsync(id);
      await refetchHistory();
    } catch (error) {
      console.error('Failed to delete export:', error);
      alert('Failed to delete export. Please try again.');
    }
  };

  const handleDeleteScheduled = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scheduled export?')) return;

    try {
      await deleteScheduledMutation.mutateAsync(id);
      await refetchScheduled();
    } catch (error) {
      console.error('Failed to delete scheduled export:', error);
      alert('Failed to delete scheduled export. Please try again.');
    }
  };

  const handleCreateScheduled = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const scheduledExport = {
      name: formData.get('name') as string,
      exportType: formData.get('exportType') as string,
      schedule: formData.get('schedule') as string,
      format: formData.get('format') as string,
    };

    try {
      await createScheduledMutation.mutateAsync(scheduledExport);
      setShowScheduleDialog(false);
      await refetchScheduled();
      alert('Scheduled export created successfully!');
    } catch (error) {
      console.error('Failed to create scheduled export:', error);
      alert('Failed to create scheduled export. Please try again.');
    }
  };

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
                  onReDownload={handleReDownload}
                  onDelete={handleDelete}
                />
              </div>
            </div>
          </div>

          {/* Scheduled Exports */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-900">Scheduled Exports</h2>
              <button
                onClick={() => setShowScheduleDialog(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Schedule Export
              </button>
            </div>

            {scheduledExports.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No Scheduled Exports</h3>
                <p className="text-slate-500 mb-4">
                  Create scheduled exports to automatically generate reports on a recurring basis
                </p>
                <button
                  onClick={() => setShowScheduleDialog(true)}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Create your first scheduled export →
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                {scheduledExports.map((scheduled: ScheduledExport) => (
                  <div
                    key={scheduled.id}
                    className="flex items-center justify-between p-4 border-b border-slate-200 last:border-b-0"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-slate-900">{scheduled.name}</h4>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                          scheduled.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {scheduled.is_active ? 'Active' : 'Paused'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        {scheduled.export_type} • {scheduled.format.toUpperCase()} • {scheduled.schedule}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                        {scheduled.last_run_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Last: {format(new Date(scheduled.last_run_at), 'MMM d, h:mm a')}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Next: {format(new Date(scheduled.next_run_at), 'MMM d, h:mm a')}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteScheduled(scheduled.id)}
                      className="ml-4 p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete scheduled export"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Schedule Dialog */}
        {showScheduleDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Schedule Export</h2>
              <form onSubmit={handleCreateScheduled} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Weekly Cards Export"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Export Type
                  </label>
                  <select
                    name="exportType"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="cards">Cards</option>
                    <option value="principles">Architecture Principles</option>
                    <option value="standards">Technology Standards</option>
                    <option value="policies">Architecture Policies</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Schedule
                  </label>
                  <select
                    name="schedule"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Format
                  </label>
                  <select
                    name="format"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="csv">CSV</option>
                    <option value="excel">Excel</option>
                    <option value="json">JSON</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowScheduleDialog(false)}
                    className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Create Schedule
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

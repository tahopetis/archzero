/**
 * ARB Audit Log Page
 * Displays comprehensive audit trail for all ARB activities
 */

import { useState, useEffect } from 'react';
import { Clock, FileText, CheckCircle, XCircle, AlertCircle, User, Filter, Download } from 'lucide-react';
import { Card } from '../shared';

interface ARBAuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor_id: string;
  actor_name: string;
  actor_role: string | null;
  changes: Record<string, {old: any; new: any}> | null;
  metadata: Record<string, any> | null;
  ip_address: string | null;
  created_at: string;
}

export function AuditLogPage() {
  const [logs, setLogs] = useState<ARBAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'submission' | 'decision' | 'meeting'>('all');

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const url = filter === 'all'
        ? '/api/v1/arb/audit-logs?limit=100'
        : `/api/v1/arb/audit-logs?entity_type=${filter}&limit=100`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      const data = await response.json();
      setLogs(data.data || data);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/v1/arb/audit-logs/export');
      if (!response.ok) throw new Error('Failed to export audit logs');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `arb-audit-logs-${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export audit logs:', error);
      alert('Failed to export audit logs. Please try again.');
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'created':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'updated':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'deleted':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'status_changed':
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      case 'decision_recorded':
        return <CheckCircle className="w-5 h-5 text-purple-600" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getActionLabel = (action: string) => {
    return action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getEntityTypeLabel = (entityType: string) => {
    switch (entityType) {
      case 'submission': return 'ARB Request';
      case 'decision': return 'Decision';
      case 'meeting': return 'Meeting';
      default: return entityType;
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse bg-slate-100 h-96 rounded-xl" data-testid="audit-log-page-loading" />
    );
  }

  return (
    <div className="space-y-6" data-testid="audit-log-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ARB Audit Trail</h1>
          <p className="text-slate-600 mt-1">Complete activity history for ARB requests and decisions</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          data-testid="export-audit-btn"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4" variant="bordered">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-slate-400" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              data-testid="filter-all"
            >
              All Activity
            </button>
            <button
              onClick={() => setFilter('submission')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === 'submission'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              data-testid="filter-submission"
            >
              Requests
            </button>
            <button
              onClick={() => setFilter('decision')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === 'decision'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              data-testid="filter-decision"
            >
              Decisions
            </button>
            <button
              onClick={() => setFilter('meeting')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === 'meeting'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              data-testid="filter-meeting"
            >
              Meetings
            </button>
          </div>
        </div>
      </Card>

      {/* Audit Log List */}
      {logs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-slate-300">
          <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">No audit logs found</p>
          <p className="text-sm text-slate-500 mt-1">ARB activity will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log, index) => (
            <Card
              key={log.id}
              className="p-4 hover:shadow-md transition-shadow"
              data-testid={`audit-log-entry-${index}`}
            >
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  {getActionIcon(log.action)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-900">
                          {getActionLabel(log.action)}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700">
                          {getEntityTypeLabel(log.entity_type)}
                        </span>
                        {log.actor_role && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                            {log.actor_role}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <User className="w-3.5 h-3.5" />
                        <span>{log.actor_name}</span>
                        <span>•</span>
                        <span className="text-slate-500">{formatDate(log.created_at)}</span>
                      </div>
                    </div>
                    {log.entity_id && (
                      <a
                        href={`/arb/submissions/${log.entity_id}`}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                        data-testid={`view-entity-${index}`}
                      >
                        View →
                      </a>
                    )}
                  </div>

                  {log.changes && Object.keys(log.changes).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <p className="text-xs font-medium text-slate-700 mb-2">Changes:</p>
                      <div className="space-y-1">
                        {Object.entries(log.changes).map(([field, change]: [string, any]) => (
                          <div key={field} className="text-xs">
                            <span className="font-medium text-slate-700">{field}:</span>
                            <span className="text-slate-500">
                              {' '}{JSON.stringify(change.old)} → {JSON.stringify(change.new)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <p className="text-xs font-medium text-slate-700 mb-2">Details:</p>
                      <div className="space-y-1">
                        {Object.entries(log.metadata).map(([key, value]: [string, any]) => (
                          <div key={key} className="text-xs text-slate-600">
                            <span className="font-medium">{key}:</span> {JSON.stringify(value)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

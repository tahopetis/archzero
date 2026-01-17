import { useState, useEffect } from 'react';
import { Clock, FileText, CheckCircle, XCircle, AlertCircle, User } from 'lucide-react';
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

interface AuditTrailProps {
  entityType: string;
  entityId: string;
}

export function AuditTrail({ entityType, entityId }: AuditTrailProps) {
  const [logs, setLogs] = useState<ARBAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [entityType, entityId]);

  const fetchLogs = async () => {
    try {
      const response = await fetch(`/api/v1/arb/audit-logs/${entityType}/${entityId}?limit=50`);
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setIsLoading(false);
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

  if (isLoading) {
    return (
      <div className="animate-pulse bg-slate-100 h-64 rounded-xl" data-testid="audit-trail-loading" />
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
        <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-600">No activity yet</p>
        <p className="text-sm text-slate-500 mt-1">Actions on this item will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="audit-trail">
      <h3 className="text-lg font-semibold text-slate-900">Activity History</h3>
      <div className="space-y-3">
        {logs.map((log, index) => (
          <div
            key={log.id}
            className="relative pl-8 pb-6 border-l-2 border-slate-200 last:border-0"
            data-testid={`audit-log-${index}`}
          >
            <div className="absolute left-0 top-0 -translate-x-1/2 bg-white">
              {getActionIcon(log.action)}
            </div>
            <Card className="p-4" variant="bordered">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">
                    {getActionLabel(log.action)}
                  </span>
                  {log.actor_role && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                      {log.actor_role}
                    </span>
                  )}
                </div>
                <span className="text-sm text-slate-500">{formatDate(log.created_at)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                <User className="w-4 h-4" />
                <span>{log.actor_name}</span>
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
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}

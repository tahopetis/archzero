/**
 * Compliance Audit Timeline Component
 * Shows upcoming audits and countdown to next audit
 */

import { Calendar, Clock, User, ChevronRight } from 'lucide-react';
import { Card } from '../shared';

interface Audit {
  id: string;
  title: string;
  date: string;
  framework: string;
  auditor: string;
  status: 'scheduled' | 'in-progress' | 'completed';
}

interface ComplianceAuditTimelineProps {
  framework?: string;
}

export function ComplianceAuditTimeline({ framework = 'all' }: ComplianceAuditTimelineProps) {
  // Mock data - in production, fetch from API
  const audits: Audit[] = [
    {
      id: '1',
      title: 'Q2 2026 GDPR Compliance Audit',
      date: '2026-04-15',
      framework: 'GDPR',
      auditor: 'External Audit Firm',
      status: 'scheduled',
    },
    {
      id: '2',
      title: 'ISO 27001 Surveillance Audit',
      date: '2026-06-01',
      framework: 'ISO 27001',
      auditor: 'Certification Body',
      status: 'scheduled',
    },
    {
      id: '3',
      title: 'SOX Compliance Review',
      date: '2026-03-30',
      framework: 'SOX',
      auditor: 'Internal Audit Team',
      status: 'scheduled',
    },
  ];

  const nextAudit = audits[0];
  const daysUntilAudit = Math.ceil(
    (new Date(nextAudit.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card className="p-6" data-testid="audit-timeline">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900">Audit Timeline</h2>
        </div>
      </div>

      {/* Next Audit Countdown */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-indigo-900 mb-2">Next Audit</h3>
            <p className="text-xl font-bold text-indigo-700">{nextAudit.title}</p>
            <p className="text-sm text-indigo-600 mt-1">
              {new Date(nextAudit.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-indigo-600 mb-1">
              <Clock className="w-5 h-5" />
              <span className="text-sm font-semibold">In {daysUntilAudit} days</span>
            </div>
            <p className="text-xs text-indigo-500">{nextAudit.framework}</p>
          </div>
        </div>
      </div>

      {/* Upcoming Audits */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Upcoming Audits</h3>
        <div className="space-y-3">
          {audits.map((audit) => (
            <div
              key={audit.id}
              className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              data-testid="audit-item"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">{audit.title}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-600 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {audit.auditor}
                    </span>
                    <span className="text-xs text-slate-600">
                      {new Date(audit.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded-md text-xs font-semibold ${
                    audit.status === 'scheduled'
                      ? 'bg-blue-100 text-blue-700'
                      : audit.status === 'in-progress'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                  data-testid="audit-status"
                >
                  {audit.status}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

/**
 * Compliance Management Page
 */

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download, FileText, Calendar } from 'lucide-react';
import { ComplianceHub, ComplianceDashboard, ComplianceScoreCard, ComplianceAuditTimeline, type ComplianceRequirement } from '@/components/governance/compliance';
import { ComplianceForm } from '@/components/governance/compliance/ComplianceForm';
import { ComplianceReportModal } from '@/components/governance/compliance/ComplianceReportModal';
import { AuditScheduleModal } from '@/components/governance/compliance/AuditScheduleModal';

export function CompliancePage() {
  const { id } = useParams();
  const [selectedRequirement, setSelectedRequirement] = useState<ComplianceRequirement | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState<string>('all');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  const handleExportReport = async (format: 'pdf' | 'csv') => {
    // Implement export functionality
    console.log(`Exporting compliance report as ${format}`);
    // TODO: Call backend API to generate report
  };

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
    <div className="min-h-screen bg-slate-50" data-testid="compliance-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Compliance Management</h1>
            <p className="text-slate-600 mt-1">Track compliance across frameworks and regulations</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium"
              data-testid="schedule-audit-btn"
            >
              <Calendar className="w-4 h-4" />
              Schedule Audit
            </button>
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              data-testid="generate-report-btn"
            >
              <FileText className="w-4 h-4" />
              Generate Report
            </button>
            <button
              onClick={() => handleExportReport('csv')}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
              data-testid="export-compliance-btn"
            >
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>

        {/* Compliance Score Cards */}
        <div className="mb-6">
          <ComplianceScoreCard framework={selectedFramework} />
        </div>

        {/* Audit Timeline */}
        <div className="mb-6">
          <ComplianceAuditTimeline framework={selectedFramework} />
        </div>

        {/* Framework Filter */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Filter by Framework
          </label>
          <select
            value={selectedFramework}
            onChange={(e) => setSelectedFramework(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            data-testid="framework-filter"
          >
            <option value="all">All Frameworks</option>
            <option value="GDPR">GDPR</option>
            <option value="SOX">SOX</option>
            <option value="HIPAA">HIPAA</option>
            <option value="ISO 27001">ISO 27001</option>
            <option value="PCI DSS">PCI DSS</option>
            <option value="SOC 2">SOC 2</option>
          </select>
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

        <ComplianceHub framework={selectedFramework} />

        {/* Modals */}
        {isReportModalOpen && (
          <ComplianceReportModal
            onClose={() => setIsReportModalOpen(false)}
            onGenerate={(params) => {
              console.log('Generating report:', params);
              setIsReportModalOpen(false);
            }}
          />
        )}

        {isAuditModalOpen && (
          <AuditScheduleModal
            onClose={() => setIsAuditModalOpen(false)}
            onSchedule={(audit) => {
              console.log('Scheduling audit:', audit);
              setIsAuditModalOpen(false);
            }}
          />
        )}
      </div>
    </div>
  );
}

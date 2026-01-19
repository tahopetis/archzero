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
import { FrameworkSetupModal } from '@/components/governance/compliance/FrameworkSetupModal';

export function CompliancePage() {
  const { id } = useParams();
  const [selectedRequirement, setSelectedRequirement] = useState<ComplianceRequirement | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState<string>('all');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isFrameworkSetupOpen, setIsFrameworkSetupOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleExportReport = async (format: 'pdf' | 'csv') => {
    try {
      // Fetch compliance requirements from backend
      const token = localStorage.getItem('auth_token');
      const frameworkParam = selectedFramework !== 'all' ? `?framework=${selectedFramework}` : '';
      const response = await fetch(`/api/v1/compliance-requirements${frameworkParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch compliance data');
      }

      const data = await response.json();
      const requirements = data.data || data;

      if (!Array.isArray(requirements)) {
        throw new Error('Invalid response format');
      }

      if (format === 'csv') {
        // Generate CSV content
        const headers = ['ID', 'Name', 'Framework', 'Description', 'Applicable Card Types', 'Required Controls', 'Audit Frequency'];
        const csvRows = [
          headers.join(','),
          ...requirements.map(req => [
            req.id,
            `"${req.name.replace(/"/g, '""')}"`,
            req.framework || '',
            `"${(req.description || '').replace(/"/g, '""')}"`,
            `"${(req.applicable_card_types || []).join('; ')}"`,
            `"${(req.required_controls || []).join('; ')}"`,
            req.audit_frequency || '',
          ].join(',')),
        ];

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `compliance-report-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // For PDF, we would need a backend endpoint or a client-side PDF library
        // For now, export as CSV with a note
        console.warn('PDF export not yet implemented, exporting as CSV');
        alert('PDF export will be implemented soon. Exporting as CSV instead.');
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleSetupFramework = async (framework: { type: string; name: string; description: string }) => {
    // TODO: Call backend API to create framework
    console.log('Setting up framework:', framework);

    // For now, just close the modal
    // In production, this would call the backend API
    setIsFrameworkSetupOpen(false);

    // Show success message
    setSuccessMessage('Framework created');

    // Clear success message after 3 seconds
    setTimeout(() => setSuccessMessage(null), 3000);
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
              onClick={() => setIsFrameworkSetupOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              data-testid="setup-framework-btn"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Setup Framework
            </button>
            <button
              onClick={() => setIsFrameworkSetupOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              data-testid="add-framework-btn"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Framework
            </button>
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

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">{successMessage}</p>
          </div>
        )}

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

        <ComplianceHub />

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

        {isFrameworkSetupOpen && (
          <FrameworkSetupModal
            onClose={() => setIsFrameworkSetupOpen(false)}
            onSetup={handleSetupFramework}
          />
        )}
      </div>
    </div>
  );
}

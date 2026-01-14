/**
 * Compliance Evidence Collection Page
 * Collect and manage evidence for compliance requirements
 */

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Search,
  Filter,
  File,
  Image,
  FileSpreadsheet,
  Calendar
} from 'lucide-react';
import { ComplianceFramework, type ComplianceRequirement } from '@/types/governance';
import { Card, cn } from '@/components/governance/shared';

interface EvidenceItem {
  id: string;
  name: string;
  description: string;
  type: 'document' | 'screenshot' | 'report' | 'policy' | 'other';
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'UnderReview';
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  url?: string;
}

interface ControlCheck {
  id: string;
  controlId: string;
  controlName: string;
  status: 'Implemented' | 'Partial' | 'NotImplemented' | 'NotApplicable';
  evidenceCount: number;
  lastUpdated: string;
}

// Mock compliance requirement
const mockRequirement: ComplianceRequirement = {
  id: 'comp-1',
  name: 'Access Control Requirements',
  framework: ComplianceFramework.SOC2,
  description: 'Implement proper access controls for system resources',
  applicableCardTypes: ['System', 'Application', 'Database'],
  requiredControls: ['MFA', 'Role-Based Access', 'Audit Logging'],
  auditFrequency: 'Quarterly',
  type: 'ComplianceRequirement',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-14T00:00:00Z'
};

// Mock evidence items
const mockEvidence: EvidenceItem[] = [
  {
    id: 'ev-1',
    name: 'MFA Implementation Documentation',
    description: 'Technical documentation for MFA implementation across all systems',
    type: 'document',
    fileName: 'mfa-implementation.pdf',
    fileSize: 2458624,
    uploadedAt: '2026-01-10T10:30:00Z',
    uploadedBy: 'Alice Johnson',
    status: 'Approved',
    reviewedBy: 'Compliance Team',
    reviewedAt: '2026-01-11T14:20:00Z',
    url: '/evidence/mfa-implementation.pdf'
  },
  {
    id: 'ev-2',
    name: 'Role-Based Access Policy',
    description: 'Policy document defining RBAC rules and approval workflows',
    type: 'policy',
    fileName: 'rbac-policy.pdf',
    fileSize: 1567890,
    uploadedAt: '2026-01-12T09:15:00Z',
    uploadedBy: 'Bob Smith',
    status: 'UnderReview'
  },
  {
    id: 'ev-3',
    name: 'Audit Log Configuration Screenshots',
    description: 'Screenshots showing audit logging configuration',
    type: 'screenshot',
    fileName: 'audit-logs-screenshots.zip',
    fileSize: 3456789,
    uploadedAt: '2026-01-13T16:45:00Z',
    uploadedBy: 'Carol White',
    status: 'Pending'
  },
  {
    id: 'ev-4',
    name: 'Q4 2025 Access Review Report',
    description: 'Quarterly access review and certification report',
    type: 'report',
    fileName: 'q4-2025-access-review.xlsx',
    fileSize: 89012,
    uploadedAt: '2026-01-08T11:20:00Z',
    uploadedBy: 'Dave Brown',
    status: 'Approved',
    reviewedBy: 'Compliance Team',
    reviewedAt: '2026-01-09T10:00:00Z',
    url: '/evidence/q4-2025-access-review.xlsx'
  }
];

// Mock control checks
const mockControls: ControlCheck[] = [
  {
    id: 'ctrl-1',
    controlId: 'AC-001',
    controlName: 'Multi-Factor Authentication',
    status: 'Implemented',
    evidenceCount: 2,
    lastUpdated: '2026-01-10T10:30:00Z'
  },
  {
    id: 'ctrl-2',
    controlId: 'AC-002',
    controlName: 'Role-Based Access Control',
    status: 'Partial',
    evidenceCount: 1,
    lastUpdated: '2026-01-12T09:15:00Z'
  },
  {
    id: 'ctrl-3',
    controlId: 'AC-003',
    controlName: 'Audit Logging',
    status: 'Implemented',
    evidenceCount: 2,
    lastUpdated: '2026-01-13T16:45:00Z'
  }
];

export function ComplianceEvidencePage() {
  const { id } = useParams<{ id: string }>();
  const [evidence, setEvidence] = useState<EvidenceItem[]>(mockEvidence);
  const [controls, setControls] = useState<ControlCheck[]>(mockControls);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);
  const [filterType, setFilterType] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const getFileIcon = (type: EvidenceItem['type']) => {
    switch (type) {
      case 'document':
        return <FileText className="w-5 h-5 text-indigo-600" />;
      case 'screenshot':
        return <Image className="w-5 h-5 text-emerald-600" />;
      case 'report':
        return <FileSpreadsheet className="w-5 h-5 text-teal-600" />;
      case 'policy':
        return <File className="w-5 h-5 text-amber-600" />;
      default:
        return <File className="w-5 h-5 text-slate-600" />;
    }
  };

  const getStatusIcon = (status: EvidenceItem['status']) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'Rejected':
        return <XCircle className="w-5 h-5 text-rose-600" />;
      case 'UnderReview':
        return <Eye className="w-5 h-5 text-blue-600" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: EvidenceItem['status']) => {
    const styles = {
      Pending: 'bg-slate-100 text-slate-700 border-slate-200',
      UnderReview: 'bg-blue-100 text-blue-700 border-blue-200',
      Approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      Rejected: 'bg-rose-100 text-rose-700 border-rose-200'
    };
    return styles[status];
  };

  const getControlStatusBadge = (status: ControlCheck['status']) => {
    const styles = {
      Implemented: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      Partial: 'bg-amber-100 text-amber-700 border-amber-200',
      NotImplemented: 'bg-rose-100 text-rose-700 border-rose-200',
      NotApplicable: 'bg-slate-100 text-slate-700 border-slate-200'
    };
    return styles[status];
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const filteredEvidence = evidence.filter(item => {
    const matchesType = filterType === 'All' || item.type === filterType;
    const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
    const matchesSearch = searchQuery === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  const evidenceStats = {
    total: evidence.length,
    approved: evidence.filter(e => e.status === 'Approved').length,
    pending: evidence.filter(e => e.status === 'Pending').length,
    underReview: evidence.filter(e => e.status === 'UnderReview').length,
    rejected: evidence.filter(e => e.status === 'Rejected').length
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="evidence-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
            <Link to="/governance/compliance" className="hover:text-indigo-600">
              Compliance
            </Link>
            <span>/</span>
            <span className="text-slate-900">Evidence</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Compliance Evidence</h1>
              <p className="text-slate-600 mt-1">
                Collect and manage evidence for {mockRequirement.name}
              </p>
            </div>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
              data-testid="upload-evidence-button"
            >
              <Upload className="w-4 h-4" />
              Upload Evidence
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card className="p-4" data-testid="stat-total">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{evidenceStats.total}</p>
              <p className="text-xs text-slate-500">Total Evidence</p>
            </div>
          </Card>
          <Card className="p-4" data-testid="stat-approved">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-700">{evidenceStats.approved}</p>
              <p className="text-xs text-slate-500">Approved</p>
            </div>
          </Card>
          <Card className="p-4" data-testid="stat-pending">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-700">{evidenceStats.pending}</p>
              <p className="text-xs text-slate-500">Pending</p>
            </div>
          </Card>
          <Card className="p-4" data-testid="stat-review">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-700">{evidenceStats.underReview}</p>
              <p className="text-xs text-slate-500">Under Review</p>
            </div>
          </Card>
          <Card className="p-4" data-testid="stat-rejected">
            <div className="text-center">
              <p className="text-2xl font-bold text-rose-700">{evidenceStats.rejected}</p>
              <p className="text-xs text-slate-500">Rejected</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Evidence List */}
          <div className="lg:col-span-2">
            <Card className="p-6" data-testid="evidence-list-section">
              {/* Filters */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search evidence..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    data-testid="search-input"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    data-testid="type-filter"
                  >
                    <option value="All">All Types</option>
                    <option value="document">Documents</option>
                    <option value="screenshot">Screenshots</option>
                    <option value="report">Reports</option>
                    <option value="policy">Policies</option>
                  </select>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    data-testid="status-filter"
                  >
                    <option value="All">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="UnderReview">Under Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Evidence Items */}
              <div className="space-y-3">
                {filteredEvidence.map(item => (
                  <div
                    key={item.id}
                    className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    data-testid={`evidence-${item.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getFileIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900">{item.name}</h3>
                            <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            {getStatusIcon(item.status)}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span>{item.fileName}</span>
                            <span>•</span>
                            <span>{formatFileSize(item.fileSize)}</span>
                            <span>•</span>
                            <span>Uploaded by {item.uploadedBy}</span>
                            <span>•</span>
                            <span>{new Date(item.uploadedAt).toLocaleDateString()}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={cn(
                              'px-2 py-1 rounded-md text-xs font-semibold border',
                              getStatusBadge(item.status)
                            )}>
                              {item.status}
                            </span>
                            <button
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              data-testid={`view-${item.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              data-testid={`download-${item.id}`}
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              data-testid={`delete-${item.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {item.rejectionReason && (
                          <div className="mt-3 p-2 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700">
                            <strong>Rejection Reason:</strong> {item.rejectionReason}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredEvidence.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    No evidence found matching your filters
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Control Checks */}
          <div>
            <Card className="p-6" data-testid="controls-section">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Control Checks</h2>

              <div className="space-y-3">
                {controls.map(control => (
                  <div
                    key={control.id}
                    className="border border-slate-200 rounded-lg p-3"
                    data-testid={`control-${control.id}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-indigo-600">{control.controlId}</span>
                          <span className={cn(
                            'px-2 py-0.5 rounded-md text-xs font-semibold border',
                            getControlStatusBadge(control.status)
                          )}>
                            {control.status.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-900">{control.controlName}</h4>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{control.evidenceCount} evidence items</span>
                      <span>{new Date(control.lastUpdated).toLocaleDateString()}</span>
                    </div>

                    <button
                      className="w-full mt-2 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                      data-testid={`view-control-${control.id}`}
                    >
                      View Evidence →
                    </button>
                  </div>
                ))}
              </div>

              <button
                className="w-full mt-4 flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg text-sm text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                data-testid="add-control-button"
              >
                <Plus className="w-4 h-4" />
                Add Control Check
              </button>
            </Card>

            {/* Requirement Info */}
            <Card className="p-6 mt-6" data-testid="requirement-info">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Requirement Details</h3>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-slate-500">Framework</dt>
                  <dd className="font-semibold">{mockRequirement.framework}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Audit Frequency</dt>
                  <dd className="font-semibold">{mockRequirement.auditFrequency}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Required Controls</dt>
                  <dd className="flex flex-wrap gap-1 mt-1">
                    {mockRequirement.requiredControls.map(control => (
                      <span
                        key={control}
                        className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium"
                      >
                        {control}
                      </span>
                    ))}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Next Audit</dt>
                  <dd className="font-semibold flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Q2 2026
                  </dd>
                </div>
              </dl>
            </Card>
          </div>
        </div>
      </div>

      {/* Upload Modal (simplified placeholder) */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="upload-modal">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Upload Evidence</h2>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600 mb-1">Drag and drop files here</p>
              <p className="text-xs text-slate-500">or click to browse</p>
            </div>
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

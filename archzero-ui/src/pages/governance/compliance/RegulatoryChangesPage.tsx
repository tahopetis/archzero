/**
 * Regulatory Changes Management Page
 * Tracks regulatory changes and their impact on the organization
 */

import { useState } from 'react';
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  TrendingUp,
} from 'lucide-react';

interface CardProps {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  'data-testid'?: string;
}

function Card({ className, children, onClick, 'data-testid': dataTestid }: CardProps) {
  return (
    <div
      className={className ? `bg-white rounded-xl shadow-sm border border-slate-200 ${className}` : 'bg-white rounded-xl shadow-sm border border-slate-200'}
      onClick={onClick}
      data-testid={dataTestid}
    >
      {children}
    </div>
  );
}

function Button({ children, onClick, className, variant = 'primary' }: { children: React.ReactNode; onClick?: () => void; className?: string; variant?: string }) {
  const baseClass = 'px-4 py-2 rounded-lg font-medium transition-colors';
  const variantClass = variant === 'outline'
    ? 'border border-slate-300 text-slate-700 hover:bg-slate-50'
    : 'bg-indigo-600 text-white hover:bg-indigo-700';

  return (
    <button onClick={onClick} className={`${baseClass} ${variantClass} ${className || ''}`}>
      {children}
    </button>
  );
}

function Badge({ children, className, variant = 'default' }: { children: React.ReactNode; className?: string; variant?: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${className || ''}`}>
      {children}
    </span>
  );
}

interface RegulatoryChange {
  id: string;
  title: string;
  description: string;
  effectiveDate: string;
  impact: 'high' | 'medium' | 'low';
  status: 'pending' | 'assessing' | 'addressed';
  category: string;
}

const mockChanges: RegulatoryChange[] = [
  {
    id: '1',
    title: 'GDPR Amendment 2024',
    description: 'New requirements for consent management and data portability',
    effectiveDate: '2025-03-15',
    impact: 'high',
    status: 'assessing',
    category: 'Data Protection',
  },
  {
    id: '2',
    title: 'SOX Section 404 Update',
    description: 'Revised internal control reporting requirements',
    effectiveDate: '2025-06-30',
    impact: 'high',
    status: 'pending',
    category: 'Financial Reporting',
  },
  {
    id: '3',
    title: 'HIPAA Security Rule Enhancement',
    description: 'Updated encryption and access control standards',
    effectiveDate: '2025-04-01',
    impact: 'medium',
    status: 'assessing',
    category: 'Healthcare',
  },
];

export function RegulatoryChangesPage() {
  const [changes] = useState<RegulatoryChange[]>(mockChanges);
  const [selectedChange, setSelectedChange] = useState<RegulatoryChange | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'impact'>('overview');
  const [showActionForm, setShowActionForm] = useState(false);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-rose-100 text-rose-800';
      case 'medium':
        return 'bg-amber-100 text-amber-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-slate-500" />;
      case 'assessing':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'addressed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6" data-testid="regulatory-changes">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Regulatory Changes</h1>
          <p className="text-slate-600 mt-1">
            Track and assess regulatory changes affecting your organization
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {changes.length} Active Changes
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">High Impact</p>
              <p className="text-2xl font-bold text-slate-900">
                {changes.filter(c => c.impact === 'high').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Pending</p>
              <p className="text-2xl font-bold text-slate-900">
                {changes.filter(c => c.status === 'pending').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Assessing</p>
              <p className="text-2xl font-bold text-slate-900">
                {changes.filter(c => c.status === 'assessing').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Addressed</p>
              <p className="text-2xl font-bold text-slate-900">
                {changes.filter(c => c.status === 'addressed').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Regulatory Changes List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Recent Changes</h2>
          {changes.map((change) => (
            <Card
              key={change.id}
              data-testid="regulatory-change"
              className={`p-4 cursor-pointer hover:shadow-md transition-all ${selectedChange?.id === change.id ? "ring-2 ring-indigo-500" : ""}`}
              onClick={() => setSelectedChange(change)}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">{getStatusIcon(change.status)}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-900 truncate">{change.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{change.category}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={getImpactColor(change.impact)} variant="outline">
                      {change.impact}
                    </Badge>
                    <span className="text-xs text-slate-500">
                      {new Date(change.effectiveDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Detail View */}
        <div className="lg:col-span-2">
          {selectedChange ? (
            <Card className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{selectedChange.title}</h2>
                  <p className="text-slate-600 mt-2">{selectedChange.description}</p>
                  <div className="flex items-center gap-4 mt-4">
                    <Badge className={getImpactColor(selectedChange.impact)}>
                      {selectedChange.impact} Impact
                    </Badge>
                    <span className="text-sm text-slate-600">
                      Effective: {new Date(selectedChange.effectiveDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => setShowActionForm(!showActionForm)}
                  data-testid="create-action-btn"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Action
                </Button>
              </div>

              {/* Tabs */}
              <div className="border-b border-slate-200 mb-6">
                <div className="flex gap-6">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview'
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-600 hover:text-slate-900"}`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('impact')}
                    data-testid="impact-tab"
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'impact'
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-600 hover:text-slate-900"}`}
                  >
                    Impact
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Description</h3>
                    <p className="text-sm text-slate-600">{selectedChange.description}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Category</h3>
                    <Badge variant="outline">{selectedChange.category}</Badge>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Status</h3>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedChange.status)}
                      <span className="text-sm text-slate-600 capitalize">
                        {selectedChange.status}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'impact' && (
                <div className="space-y-4" data-testid="impact-assessment">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Impact Assessment</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      This regulatory change has been assessed as having{' '}
                      <strong>{selectedChange.impact}</strong> impact on the organization.
                    </p>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-slate-900 mb-2">Affected Areas</h4>
                      <ul className="text-sm text-slate-600 space-y-1">
                        <li>• Data governance policies</li>
                        <li>• Compliance training programs</li>
                        <li>• System configuration requirements</li>
                        <li>• Documentation standards</li>
                      </ul>
                    </div>
                  </div>

                  {showActionForm && (
                    <div className="border-t border-slate-200 pt-4 mt-4">
                      <h3 className="text-sm font-semibold text-slate-700 mb-4">Create Action Item</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-slate-700 mb-1 block">
                            Action Title
                          </label>
                          <input
                            type="text"
                            data-testid="action-title"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            placeholder="Enter action title"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-700 mb-1 block">
                            Owner
                          </label>
                          <select
                            data-testid="action-owner"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                          >
                            <option value="">Select owner...</option>
                            <option value="legal@archzero.local">Legal Team</option>
                            <option value="compliance@archzero.local">Compliance Team</option>
                            <option value="it@archzero.local">IT Team</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-700 mb-1 block">
                            Due Date
                          </label>
                          <input
                            type="date"
                            data-testid="action-due-date"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button className="flex-1">Create</Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowActionForm(false)}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                No Change Selected
              </h3>
              <p className="text-sm text-slate-600">
                Select a regulatory change from the list to view details
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

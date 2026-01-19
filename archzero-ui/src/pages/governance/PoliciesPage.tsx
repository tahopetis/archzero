/**
 * Architecture Policies Page
 * Includes compliance policy acknowledgment tracking
 */

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, Check, Clock, Users } from 'lucide-react';
import { PoliciesList, PolicyDetail, type ArchitecturePolicy } from '@/components/governance/policies';
import { PolicyForm } from '@/components/governance/policies/PolicyForm';

interface CompliancePolicy {
  id: string;
  title: string;
  category: string;
  version: string;
  effectiveDate: string;
  status: 'pending' | 'acknowledged';
  acknowledgmentCount: number;
  totalRecipients: number;
}

export function PoliciesPage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<'architecture' | 'compliance'>('compliance');
  const [selectedPolicy, setSelectedPolicy] = useState<ArchitecturePolicy | null>(null);
  const [selectedCompliancePolicy, setSelectedCompliancePolicy] = useState<CompliancePolicy | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Mock compliance policies data
  const compliancePolicies: CompliancePolicy[] = [
    {
      id: '1',
      title: 'Data Protection Policy',
      category: 'GDPR',
      version: '2.1',
      effectiveDate: '2026-01-01',
      status: 'pending',
      acknowledgmentCount: 42,
      totalRecipients: 85,
    },
    {
      id: '2',
      title: 'Information Security Policy',
      category: 'ISO 27001',
      version: '3.0',
      effectiveDate: '2026-01-15',
      status: 'pending',
      acknowledgmentCount: 28,
      totalRecipients: 85,
    },
    {
      id: '3',
      title: 'Acceptable Use Policy',
      category: 'General',
      version: '1.5',
      effectiveDate: '2025-12-01',
      status: 'acknowledged',
      acknowledgmentCount: 85,
      totalRecipients: 85,
    },
  ];

  const handleAcknowledge = async (policyId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`/api/v1/policies/${policyId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      setSuccessMessage('Policy acknowledged');
      setTimeout(() => setSuccessMessage(null), 3000);
      setSelectedCompliancePolicy(null);
    } catch (error) {
      console.error('Acknowledgment failed:', error);
    }
  };

  if (id) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PolicyDetail id={id} onEdit={(p) => setSelectedPolicy(p)} />
        </div>
      </div>
    );
  }

  const pendingPolicies = compliancePolicies.filter(p => p.status === 'pending');

  return (
    <div className="min-h-screen bg-slate-50" data-testid="policies-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Policies</h1>
          <p className="text-slate-600 mt-1">Architecture policies and compliance acknowledgments</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">{successMessage}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-slate-200">
          <nav className="flex -mb-px space-x-8">
            <button
              onClick={() => setActiveTab('architecture')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'architecture'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
              data-testid="architecture-tab"
            >
              Architecture Policies
            </button>
            <button
              onClick={() => setActiveTab('compliance')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'compliance'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
              data-testid="compliance-tab"
            >
              Compliance Policies
            </button>
          </nav>
        </div>

        {/* Architecture Policies Tab */}
        {activeTab === 'architecture' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Architecture Policies</h2>
                <p className="text-slate-600">Define and manage architecture policies with rule builders</p>
              </div>
              <button
                onClick={() => setIsFormOpen(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                data-testid="new-policy-btn"
              >
                New Policy
              </button>
            </div>

            {isFormOpen && (
              <div className="mb-6">
                <PolicyForm
                  policy={selectedPolicy || undefined}
                  onSuccess={() => {
                    setIsFormOpen(false);
                    setSelectedPolicy(null);
                  }}
                  onCancel={() => {
                    setIsFormOpen(false);
                    setSelectedPolicy(null);
                  }}
                />
              </div>
            )}

            <PoliciesList
              onEdit={(policy) => {
                setSelectedPolicy(policy);
                setIsFormOpen(true);
              }}
            />
          </div>
        )}

        {/* Compliance Policies Tab */}
        {activeTab === 'compliance' && (
          <div>
            {/* Compliance Tabs */}
            <div className="mb-6 border-b border-slate-200">
              <nav className="flex -mb-px space-x-8">
                <button
                  onClick={() => setActiveTab('compliance')}
                  className="py-4 px-1 border-b-2 font-medium text-sm border-indigo-500 text-indigo-600"
                  data-testid="all-tab"
                >
                  All Policies
                </button>
                <button
                  onClick={() => {/* Already on compliance tab */}}
                  className="py-4 px-1 border-b-2 font-medium text-sm border-indigo-500 text-indigo-600"
                  data-testid="pending-tab"
                >
                  Pending
                </button>
              </nav>
            </div>

            {/* Pending Acknowledgments Summary */}
            <div className="mb-6 bg-white rounded-lg shadow-md p-6" data-testid="pending-acknowledgments">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Pending Acknowledgments</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-8 h-8 text-yellow-600" />
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{pendingPolicies.length}</p>
                    <p className="text-sm text-slate-600">Policies Pending</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold text-slate-900">
                      {pendingPolicies.reduce((sum, p) => sum + (p.totalRecipients - p.acknowledgmentCount), 0)}
                    </p>
                    <p className="text-sm text-slate-600">Pending Acknowledgments</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-slate-900">
                      {Math.round(compliancePolicies.reduce((sum, p) => sum + (p.acknowledgmentCount / p.totalRecipients * 100), 0) / compliancePolicies.length)}%
                    </p>
                    <p className="text-sm text-slate-600">Completion Rate</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Compliance Policies List */}
            <div className="space-y-4">
              {compliancePolicies.map((policy) => (
                <div
                  key={policy.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  data-testid="policy-item"
                  onClick={() => setSelectedCompliancePolicy(policy)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="w-5 h-5 text-slate-600" />
                        <h3 className="text-lg font-bold text-slate-900">{policy.title}</h3>
                        {policy.status === 'acknowledged' && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                            Acknowledged
                          </span>
                        )}
                        {policy.status === 'pending' && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                            Pending
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600">
                        <div>
                          <span className="font-medium">Category:</span> {policy.category}
                        </div>
                        <div>
                          <span className="font-medium">Version:</span> {policy.version}
                        </div>
                        <div>
                          <span className="font-medium">Effective:</span> {policy.effectiveDate}
                        </div>
                        <div>
                          <span className="font-medium">Progress:</span> {policy.acknowledgmentCount}/{policy.totalRecipients}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compliance Policy Detail Modal */}
        {selectedCompliancePolicy && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{selectedCompliancePolicy.title}</h2>
                    <p className="text-slate-600 mt-1">{selectedCompliancePolicy.category} - Version {selectedCompliancePolicy.version}</p>
                  </div>
                  <button
                    onClick={() => setSelectedCompliancePolicy(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ×
                  </button>
                </div>

                <div className="prose max-w-none mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Policy Summary</h3>
                  <p className="text-slate-600">
                    This policy outlines the requirements and guidelines for {selectedCompliancePolicy.title.toLowerCase()}.
                    All employees must review and acknowledge this policy.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-slate-900 mb-3">Acknowledgment Progress</h4>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{ width: `${(selectedCompliancePolicy.acknowledgmentCount / selectedCompliancePolicy.totalRecipients) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      {selectedCompliancePolicy.acknowledgmentCount} / {selectedCompliancePolicy.totalRecipients}
                    </span>
                  </div>
                </div>

                {selectedCompliancePolicy.status === 'pending' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAcknowledge(selectedCompliancePolicy.id)}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                      data-testid="acknowledge-policy-btn"
                    >
                      <Check className="w-4 h-4 inline mr-2" />
                      Acknowledge Policy
                    </button>
                    <button
                      onClick={() => setSelectedCompliancePolicy(null)}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {selectedCompliancePolicy.status === 'acknowledged' && (
                  <div className="flex gap-3">
                    <div className="flex-1 px-4 py-2 bg-green-50 text-green-800 rounded-lg flex items-center justify-center font-medium">
                      <Check className="w-4 h-4 inline mr-2" />
                      Policy Acknowledged
                    </div>
                    <button
                      onClick={() => setSelectedCompliancePolicy(null)}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

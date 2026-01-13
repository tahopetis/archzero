/**
 * Architecture Policy Components
 * Including policy rule builder and compliance checker
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Shield,
  AlertCircle,
  Edit3,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  Settings,
  Play
} from 'lucide-react';
import {
  PolicySeverity,
  PolicyEnforcement,
  type ArchitecturePolicy,
  type PolicyRule,
  type PolicyCondition,
  type PolicyComplianceCheckResponse
} from '@/types/governance';
import { usePolicies } from '@/lib/governance-hooks';
import {
  Card,
  StatusBadge,
  PriorityBadge,
  IconBadge,
  MetadataItem,
  cn
} from '../shared';

// ============================================================================
// POLICY CARD
// ============================================================================

interface PolicyCardProps {
  policy: ArchitecturePolicy;
  onEdit?: (policy: ArchitecturePolicy) => void;
  onDelete?: (id: string) => void;
}

export function PolicyCard({ policy, onEdit, onDelete }: PolicyCardProps) {
  const getSeverityColor = (severity: PolicySeverity) => {
    switch (severity) {
      case 'Critical': return 'critical';
      case 'High': return 'high';
      case 'Medium': return 'medium';
      case 'Low': return 'low';
    }
  };

  return (
    <Card variant="bordered" className="group hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-bold text-slate-900">{policy.name}</h3>
            <PriorityBadge priority={getSeverityColor(policy.severity) as any}>
              {policy.severity}
            </PriorityBadge>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <StatusBadge
              variant={policy.enforcement === 'Blocking' ? 'open' : 'mitigated'}
            >
              {policy.enforcement}
            </StatusBadge>
          </div>
        </div>
      </div>

      {policy.description && (
        <p className="text-sm text-slate-600 mb-3 line-clamp-2">{policy.description}</p>
      )}

      <div className="mb-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
          Rule Summary
        </p>
        <div className="text-xs text-slate-700 space-y-1">
          <p>• Applies to: {policy.ruleJson.applicableTo.length} card types</p>
          <p>• Requires: {policy.ruleJson.requiredAttributes.length} attributes</p>
          <p>• Conditions: {policy.ruleJson.conditions.length} rules</p>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
        {onEdit && (
          <button
            onClick={() => onEdit(policy)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Edit
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(policy.id)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        )}
      </div>
    </Card>
  );
}

// ============================================================================
// POLICIES LIST
// ============================================================================

interface PoliciesListProps {
  severity?: PolicySeverity;
  enforcement?: PolicyEnforcement;
  onEdit?: (policy: ArchitecturePolicy) => void;
  onDelete?: (id: string) => void;
}

export function PoliciesList({ severity, enforcement, onEdit, onDelete }: PoliciesListProps) {
  const { data: policies, isLoading } = usePolicies({ severity, enforcement });

  if (isLoading) {
    return <div className="animate-pulse bg-slate-100 h-64 rounded-xl" />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {policies?.data.map((policy) => (
        <PolicyCard key={policy.id} policy={policy} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}

// ============================================================================
// POLICY RULE BUILDER
// ============================================================================

interface PolicyRuleBuilderProps {
  rule?: PolicyRule;
  onChange: (rule: PolicyRule) => void;
}

export function PolicyRuleBuilder({ rule, onChange }: PolicyRuleBuilderProps) {
  const [localRule, setLocalRule] = useState<PolicyRule>(
    rule || {
      applicableTo: [],
      requiredAttributes: [],
      conditions: []
    }
  );

  const updateRule = (updates: Partial<PolicyRule>) => {
    const updated = { ...localRule, ...updates };
    setLocalRule(updated);
    onChange(updated);
  };

  const addCondition = () => {
    const newCondition: PolicyCondition = {
      field: '',
      operator: 'equals',
      value: ''
    };
    updateRule({
      conditions: [...localRule.conditions, newCondition]
    });
  };

  const updateCondition = (index: number, updates: Partial<PolicyCondition>) => {
    const updated = localRule.conditions.map((cond, i) =>
      i === index ? { ...cond, ...updates } : cond
    );
    updateRule({ conditions: updated });
  };

  const removeCondition = (index: number) => {
    updateRule({
      conditions: localRule.conditions.filter((_, i) => i !== index)
    });
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-bold text-slate-900">Policy Rule Builder</h3>
      </div>

      {/* Applicable To */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Applicable Card Types
        </label>
        <div className="space-y-2">
          {['System', 'Database', 'Cache', 'API', 'Queue', 'Frontend'].map((type) => (
            <label key={type} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={localRule.applicableTo.includes(type)}
                onChange={(e) => {
                  if (e.target.checked) {
                    updateRule({
                      applicableTo: [...localRule.applicableTo, type]
                    });
                  } else {
                    updateRule({
                      applicableTo: localRule.applicableTo.filter(t => t !== type)
                    });
                  }
                }}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-700">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Required Attributes */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Required Attributes
        </label>
        <textarea
          value={localRule.requiredAttributes.join('\n')}
          onChange={(e) => {
            const attributes = e.target.value.split('\n').filter(a => a.trim());
            updateRule({ requiredAttributes: attributes });
          }}
          rows={4}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          placeholder="Enter one attribute per line&#10;Example:&#10;host&#10;port&#10;database"
        />
        <p className="text-xs text-slate-500 mt-1">
          {localRule.requiredAttributes.length} attributes required
        </p>
      </div>

      {/* Conditions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-slate-700">
            Conditions
          </label>
          <button
            onClick={addCondition}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add Condition
          </button>
        </div>

        <div className="space-y-3">
          {localRule.conditions.map((condition, index) => (
            <div key={index} className="p-3 bg-slate-50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Condition {index + 1}</span>
                <button
                  onClick={() => removeCondition(index)}
                  className="text-rose-600 hover:text-rose-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={condition.field}
                  onChange={(e) => updateCondition(index, { field: e.target.value })}
                  placeholder="Field"
                  className="px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500"
                />

                <select
                  value={condition.operator}
                  onChange={(e) => updateCondition(index, { operator: e.target.value as any })}
                  className="px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="equals">equals</option>
                  <option value="not_equals">not equals</option>
                  <option value="contains">contains</option>
                  <option value="exists">exists</option>
                  <option value="not_exists">not exists</option>
                  <option value="greater_than">greater than</option>
                  <option value="less_than">less than</option>
                  <option value="gte">greater or equal</option>
                  <option value="lte">less or equal</option>
                </select>

                <input
                  type="text"
                  value={condition.value}
                  onChange={(e) => updateCondition(index, { value: e.target.value })}
                  placeholder="Value"
                  className="px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          ))}

          {localRule.conditions.length === 0 && (
            <div className="text-center py-4 text-sm text-slate-500">
              No conditions defined. Click "Add Condition" to create one.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// COMPLIANCE CHECKER
// ============================================================================

interface ComplianceCheckerProps {
  policyId: string;
  onCheck?: (cardIds: string[]) => void;
}

export function ComplianceChecker({ policyId, onCheck }: ComplianceCheckerProps) {
  const [cardIds, setCardIds] = useState('');
  const [result, setResult] = useState<PolicyComplianceCheckResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCheck = async () => {
    const ids = cardIds.split('\n').map(id => id.trim()).filter(id => id);
    if (ids.length === 0) return;

    setIsLoading(true);
    try {
      // This would call the API
      // const response = await policiesApi.checkCompliance(policyId, ids);
      // setResult(response);
      onCheck?.(ids);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-bold text-slate-900">Compliance Checker</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Card IDs to Check
          </label>
          <textarea
            value={cardIds}
            onChange={(e) => setCardIds(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono"
            placeholder="Enter one card ID per line&#10;Example:&#10;card-123&#10;card-456&#10;card-789"
          />
        </div>

        <button
          onClick={handleCheck}
          disabled={isLoading || !cardIds.trim()}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
            isLoading || !cardIds.trim()
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          )}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Checking...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Check Compliance
            </>
          )}
        </button>

        {result && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">{result.totalCards}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">{result.compliant}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Compliant</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-rose-600">{result.violations}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Violations</p>
              </div>
            </div>

            {result.results.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Results
                </p>
                <div className="space-y-2">
                  {result.results.map((result, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'flex items-start gap-2 p-3 rounded-lg',
                        result.status === 'Compliant'
                          ? 'bg-emerald-50'
                          : result.status === 'Violation'
                          ? 'bg-rose-50'
                          : 'bg-amber-50'
                      )}
                    >
                      {result.status === 'Compliant' ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/cards/${result.cardId}`}
                          className="font-medium text-slate-900 hover:text-indigo-600"
                        >
                          {result.cardName}
                        </Link>
                        {(result.missingRequirements || result.violationDetails) && (
                          <div className="mt-1 space-y-1">
                            {result.missingRequirements?.map((req, i) => (
                              <p key={i} className="text-xs text-rose-700">
                                Missing: {req}
                              </p>
                            ))}
                            {result.violationDetails?.map((detail, i) => (
                              <p key={i} className="text-xs text-rose-700">
                                {detail}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

// ============================================================================
// POLICY DETAIL
// ============================================================================

interface PolicyDetailProps {
  id: string;
  onEdit?: (policy: ArchitecturePolicy) => void;
}

export function PolicyDetail({ id, onEdit }: PolicyDetailProps) {
  const { data: policy, isLoading } = usePolicies();

  if (isLoading) {
    return <div className="animate-pulse bg-slate-100 h-64 rounded-xl" />;
  }

  if (!policy?.data.length) {
    return <div>Policy not found</div>;
  }

  const policyData = policy.data.find(p => p.id === id);
  if (!policyData) return <div>Policy not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold text-slate-900">{policyData.name}</h1>
            <PriorityBadge priority={policyData.severity.toLowerCase() as any}>
              {policyData.severity}
            </PriorityBadge>
          </div>
          <p className="text-slate-600">{policyData.description}</p>
        </div>
        <button
          onClick={() => onEdit?.(policyData)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Edit3 className="w-4 h-4" />
          Edit
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Policy Details</h2>
          <div className="space-y-3">
            <MetadataItem
              label="Severity"
              value={<PriorityBadge priority={policyData.severity.toLowerCase() as any}>{policyData.severity}</PriorityBadge>}
              icon={Shield}
            />
            <MetadataItem
              label="Enforcement"
              value={<StatusBadge variant={policyData.enforcement === 'Blocking' ? 'open' : 'mitigated'}>{policyData.enforcement}</StatusBadge>}
              icon={AlertCircle}
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Rule Configuration</h2>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Applicable To
              </p>
              <div className="flex flex-wrap gap-1">
                {policyData.ruleJson.applicableTo.map((type) => (
                  <span
                    key={type}
                    className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Required Attributes
              </p>
              <div className="flex flex-wrap gap-1">
                {policyData.ruleJson.requiredAttributes.map((attr) => (
                  <span
                    key={attr}
                    className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium"
                  >
                    {attr}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Conditions ({policyData.ruleJson.conditions.length})
              </p>
              <div className="space-y-1">
                {policyData.ruleJson.conditions.map((cond, idx) => (
                  <p key={idx} className="text-xs text-slate-700 font-mono bg-slate-50 px-2 py-1 rounded">
                    {cond.field} {cond.operator} {cond.value}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <ComplianceChecker policyId={policyData.id} />
    </div>
  );
}

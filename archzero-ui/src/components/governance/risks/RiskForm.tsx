/**
 * Risk Form Component
 */

import { useState } from 'react';
import { RiskType, RiskStatus, type Risk, type CreateRiskRequest } from '@/types/governance';
import { useCreateRisk, useUpdateRisk } from '@/lib/governance-hooks';
import { cn } from '../shared';

interface RiskFormProps {
  risk?: Risk;
  onSuccess: () => void;
  onCancel: () => void;
}

export function RiskForm({ risk, onSuccess, onCancel }: RiskFormProps) {
  const createMutation = useCreateRisk();
  const updateMutation = useUpdateRisk();

  const [name, setName] = useState(risk?.name || '');
  const [riskType, setRiskType] = useState<RiskType>(risk?.riskType || RiskType.Operational);
  const [likelihood, setLikelihood] = useState(risk?.likelihood?.toString() || '3');
  const [impact, setImpact] = useState(risk?.impact?.toString() || '3');
  const [status, setStatus] = useState<RiskStatus>(risk?.status || RiskStatus.Open);
  const [mitigationPlan, setMitigationPlan] = useState(risk?.mitigationPlan || '');
  const [owner, setOwner] = useState(risk?.owner || '');
  const [targetClosureDate, setTargetClosureDate] = useState(risk?.targetClosureDate?.split('T')[0] || '');

  const riskScore = parseInt(likelihood) * parseInt(impact);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      name,
      riskType,
      likelihood: parseInt(likelihood),
      impact: parseInt(impact),
      status,
      mitigationPlan,
      owner,
      targetClosureDate: targetClosureDate || undefined,
    };

    if (risk) {
      await updateMutation.mutateAsync({
        id: risk.id,
        data: {
          name,
          riskType,
          likelihood: parseInt(likelihood),
          impact: parseInt(impact),
          status,
          mitigationPlan,
          owner,
          targetClosureDate: targetClosureDate || undefined,
        },
      });
    } else {
      await createMutation.mutateAsync(data);
    }

    onSuccess();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6" data-testid="risk-form">
      <h2 className="text-xl font-bold text-slate-900 mb-4">
        {risk ? 'Edit Risk' : 'New Risk'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Risk Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., Database Single Point of Failure"
            required
            data-testid="risk-name-input"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Risk Type *
            </label>
            <select
              value={riskType}
              onChange={(e) => setRiskType(e.target.value as RiskType)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
              data-testid="risk-type-select"
            >
              {Object.values(RiskType).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Likelihood (1-5) *
            </label>
            <select
              value={likelihood}
              onChange={(e) => setLikelihood(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
              data-testid="risk-likelihood-select"
            >
              {[1, 2, 3, 4, 5].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Impact (1-5) *
            </label>
            <select
              value={impact}
              onChange={(e) => setImpact(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
              data-testid="risk-impact-select"
            >
              {[1, 2, 3, 4, 5].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Risk Score</span>
            <div className="flex items-center gap-2">
              <span className={cn(
                'text-2xl font-bold',
                riskScore >= 15 ? 'text-rose-600' :
                riskScore >= 10 ? 'text-orange-600' :
                riskScore >= 5 ? 'text-amber-600' :
                'text-blue-600'
              )}>
                {riskScore}
              </span>
              <span className="text-xs text-slate-500">
                ({likelihood} × {impact})
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Status *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as RiskStatus)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
              data-testid="risk-status-select"
            >
              {Object.values(RiskStatus).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Owner
            </label>
            <input
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Risk owner name"
              data-testid="risk-owner-input"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Mitigation Plan
          </label>
          <textarea
            value={mitigationPlan}
            onChange={(e) => setMitigationPlan(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Describe the mitigation strategy..."
            data-testid="risk-mitigation-input"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Target Closure Date
          </label>
          <input
            type="date"
            value={targetClosureDate}
            onChange={(e) => setTargetClosureDate(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            data-testid="risk-target-closure-date-input"
          />
        </div>

        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
            data-testid="risk-save-button"
          >
            {createMutation.isPending || updateMutation.isPending
              ? 'Saving...'
              : risk
              ? 'Update Risk'
              : 'Create Risk'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            data-testid="risk-cancel-button"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

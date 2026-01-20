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

interface FormError {
  message: string;
}

export function RiskForm({ risk, onSuccess, onCancel }: RiskFormProps) {
  const createMutation = useCreateRisk();
  const updateMutation = useUpdateRisk();

  const [name, setName] = useState(risk?.name || '');
  const [description, setDescription] = useState(risk?.description || '');
  const [riskType, setRiskType] = useState<RiskType>(risk?.riskType || RiskType.Operational);
  const [likelihood, setLikelihood] = useState(risk?.likelihood?.toString() || '3');
  const [impact, setImpact] = useState(risk?.impact?.toString() || '3');
  const [status, setStatus] = useState<RiskStatus>(risk?.status || RiskStatus.Open);
  const [mitigationPlan, setMitigationPlan] = useState(risk?.mitigationPlan || '');
  const [owner, setOwner] = useState(risk?.owner || '');
  const [targetClosureDate, setTargetClosureDate] = useState(risk?.targetClosureDate?.split('T')[0] || '');

  const [error, setError] = useState<FormError | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const riskScore = parseInt(likelihood) * parseInt(impact);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Basic validation
    if (!name.trim()) {
      setError({ message: 'Risk name is required' });
      return;
    }

    const data = {
      name,
      description,
      riskType,
      likelihood: parseInt(likelihood),
      impact: parseInt(impact),
      status,
      mitigationPlan,
      owner,
      targetClosureDate: targetClosureDate || undefined,
    };

    try {
      if (risk) {
        await updateMutation.mutateAsync({
          id: risk.id,
          data: {
            name,
            description,
            riskType,
            likelihood: parseInt(likelihood),
            impact: parseInt(impact),
            status,
            mitigationPlan,
            owner,
            targetClosureDate: targetClosureDate || undefined,
          },
        });
        setSuccessMessage('Risk updated Success');
      } else {
        await createMutation.mutateAsync(data);
        setSuccessMessage('Risk created Success');
      }

      // Call onSuccess after a brief delay to show the success message
      setTimeout(() => {
        onSuccess();
      }, 500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save risk';
      setError({ message: errorMessage });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6" data-testid="risk-form">
      <h2 className="text-xl font-bold text-slate-900 mb-4">
        {risk ? 'Edit Risk' : 'New Risk'}
      </h2>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg" data-testid="success-message">
          <p className="text-sm font-medium text-emerald-800">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg" data-testid="error-message">
          <p className="text-sm font-medium text-rose-800">{error.message}</p>
        </div>
      )}

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
            data-testid="risk-title"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Describe the risk in detail..."
            data-testid="risk-description"
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
              data-testid="risk-category"
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
              data-testid="risk-probability"
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
              data-testid="risk-impact"
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
              )} data-testid="risk-score">
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
          <div className="mt-2">
            <button
              type="button"
              onClick={() => {}}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              data-testid="add-mitigation-btn"
            >
              + Add Mitigation Action
            </button>
          </div>
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
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            data-testid="save-risk-btn"
          >
            {createMutation.isPending || updateMutation.isPending ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Saving...</span>
              </>
            ) : risk ? (
              'Update Risk'
            ) : (
              'Create Risk'
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={createMutation.isPending || updateMutation.isPending}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="risk-cancel-button"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

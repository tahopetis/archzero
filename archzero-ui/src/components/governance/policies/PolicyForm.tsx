/**
 * Policy Form Component
 */

import { useState } from 'react';
import { PolicySeverity, PolicyEnforcement, type ArchitecturePolicy, type CreatePolicyRequest } from '@/types/governance';
import { useCreatePolicy, useUpdatePolicy } from '@/lib/governance-hooks';
import { PolicyRuleBuilder } from './PolicyComponents';

interface PolicyFormProps {
  policy?: ArchitecturePolicy;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PolicyForm({ policy, onSuccess, onCancel }: PolicyFormProps) {
  const createMutation = useCreatePolicy();
  const updateMutation = useUpdatePolicy();

  const [name, setName] = useState(policy?.name || '');
  const [severity, setSeverity] = useState<PolicySeverity>(policy?.severity || PolicySeverity.Medium);
  const [enforcement, setEnforcement] = useState<PolicyEnforcement>(policy?.enforcement || PolicyEnforcement.Warning);
  const [description, setDescription] = useState(policy?.description || '');
  const [rule, setRule] = useState(policy?.ruleJson);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rule) {
      alert('Please configure the policy rule');
      return;
    }

    if (policy) {
      await updateMutation.mutateAsync({
        id: policy.id,
        data: {
          name,
          ruleJson: rule,
          severity,
          enforcement,
          description,
        },
      });
    } else {
      await createMutation.mutateAsync({
        name,
        ruleJson: rule,
        severity,
        enforcement,
        description,
      });
    }

    onSuccess();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">
          {policy ? 'Edit Policy' : 'New Architecture Policy'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Policy Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., Database Encryption Required"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Severity *
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as PolicySeverity)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                {Object.values(PolicySeverity).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Enforcement *
              </label>
              <select
                value={enforcement}
                onChange={(e) => setEnforcement(e.target.value as PolicyEnforcement)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                {Object.values(PolicyEnforcement).map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
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
              placeholder="Describe the policy purpose..."
            />
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending || !rule}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : policy
                ? 'Update Policy'
                : 'Create Policy'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      <PolicyRuleBuilder rule={rule} onChange={setRule} />
    </div>
  );
}

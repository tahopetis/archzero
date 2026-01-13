/**
 * Compliance Requirement Form Component
 */

import { useState } from 'react';
import { ComplianceFramework, type ComplianceRequirement, type CreateComplianceRequirementRequest } from '@/types/governance';
import { useCreateComplianceRequirement, useUpdateComplianceRequirement } from '@/lib/governance-hooks';

interface ComplianceFormProps {
  requirement?: ComplianceRequirement;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ComplianceForm({ requirement, onSuccess, onCancel }: ComplianceFormProps) {
  const createMutation = useCreateComplianceRequirement();
  const updateMutation = useUpdateComplianceRequirement();

  const [name, setName] = useState(requirement?.name || '');
  const [framework, setFramework] = useState<ComplianceFramework>(requirement?.framework || ComplianceFramework.Other);
  const [description, setDescription] = useState(requirement?.description || '');
  const [applicableCardTypes, setApplicableCardTypes] = useState(
    requirement?.applicableCardTypes.join(', ') || ''
  );
  const [requiredControls, setRequiredControls] = useState(
    requirement?.requiredControls.join(', ') || ''
  );
  const [auditFrequency, setAuditFrequency] = useState(requirement?.auditFrequency || 'Annually');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      name,
      framework,
      description,
      applicableCardTypes: applicableCardTypes.split(',').map(t => t.trim()).filter(t => t),
      requiredControls: requiredControls.split(',').map(c => c.trim()).filter(c => c),
      auditFrequency,
    };

    if (requirement) {
      await updateMutation.mutateAsync({
        id: requirement.id,
        data: {
          name,
          framework,
          description,
          applicableCardTypes: applicableCardTypes.split(',').map(t => t.trim()).filter(t => t),
          requiredControls: requiredControls.split(',').map(c => c.trim()).filter(c => c),
          auditFrequency,
        },
      });
    } else {
      await createMutation.mutateAsync(data);
    }

    onSuccess();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-slate-900 mb-4">
        {requirement ? 'Edit Requirement' : 'New Compliance Requirement'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Requirement Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., GDPR Data Processing"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Framework *
            </label>
            <select
              value={framework}
              onChange={(e) => setFramework(e.target.value as ComplianceFramework)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              {Object.values(ComplianceFramework).map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Description *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Describe the compliance requirement..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Applicable Card Types *
          </label>
          <input
            type="text"
            value={applicableCardTypes}
            onChange={(e) => setApplicableCardTypes(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Application, Database, ITComponent"
            required
          />
          <p className="text-xs text-slate-500 mt-1">Comma-separated list of card types</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Required Controls *
          </label>
          <textarea
            value={requiredControls}
            onChange={(e) => setRequiredControls(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Data encryption at rest, Access logging, Data retention policy"
            required
          />
          <p className="text-xs text-slate-500 mt-1">Comma-separated list of controls</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Audit Frequency *
          </label>
          <input
            type="text"
            value={auditFrequency}
            onChange={(e) => setAuditFrequency(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., Annually, Quarterly, Monthly"
            required
          />
        </div>

        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
          >
            {createMutation.isPending || updateMutation.isPending
              ? 'Saving...'
              : requirement
              ? 'Update Requirement'
              : 'Create Requirement'}
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
  );
}

/**
 * Principle Form Component
 */

import { useState } from 'react';
import { PrincipleCategory, type ArchitecturePrinciple, type CreatePrincipleRequest, type UpdatePrincipleRequest } from '@/types/governance';
import { useCreatePrinciple, useUpdatePrinciple } from '@/lib/governance-hooks';

interface PrincipleFormProps {
  principle?: ArchitecturePrinciple;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PrincipleForm({ principle, onSuccess, onCancel }: PrincipleFormProps) {
  const createMutation = useCreatePrinciple();
  const updateMutation = useUpdatePrinciple();

  const [name, setName] = useState(principle?.name || '');
  const [statement, setStatement] = useState(principle?.statement || '');
  const [rationale, setRationale] = useState(principle?.rationale || '');
  const [category, setCategory] = useState<PrincipleCategory>(principle?.category || PrincipleCategory.Technical);
  const [owner, setOwner] = useState(principle?.owner || '');
  const [implications, setImplications] = useState(principle?.implications.join('\n') || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const implicationsArray = implications.split('\n').filter(i => i.trim());

    if (principle) {
      await updateMutation.mutateAsync({
        id: principle.id,
        data: {
          name,
          statement,
          rationale,
          category,
          owner,
          implications: implicationsArray,
        },
      });
    } else {
      await createMutation.mutateAsync({
        name,
        statement,
        rationale,
        category,
        owner,
        implications: implicationsArray,
      });
    }

    onSuccess();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6" data-testid="principle-form">
      <h2 className="text-xl font-bold text-slate-900 mb-4">
        {principle ? 'Edit Principle' : 'New Architecture Principle'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., Cloud-First Architecture"
            required
            data-testid="principle-name-input"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Statement *
          </label>
          <textarea
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Brief principle statement..."
            required
            data-testid="principle-statement-input"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Category *
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as PrincipleCategory)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            required
            data-testid="principle-category-select"
          >
            {Object.values(PrincipleCategory).map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Rationale *
          </label>
          <textarea
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Explain why this principle exists..."
            required
            data-testid="principle-rationale-input"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Implications *
          </label>
          <textarea
            value={implications}
            onChange={(e) => setImplications(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="One implication per line..."
            required
            data-testid="principle-implications-input"
          />
          <p className="text-xs text-slate-500 mt-1">Enter one implication per line</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Owner *
          </label>
          <input
            type="text"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., Enterprise Architecture Team"
            required
            data-testid="principle-owner-input"
          />
        </div>

        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
            data-testid="principle-save-button"
          >
            {createMutation.isPending || updateMutation.isPending
              ? 'Saving...'
              : principle
              ? 'Update Principle'
              : 'Create Principle'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            data-testid="principle-cancel-button"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

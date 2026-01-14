/**
 * Standard Form Component
 */

import { useState } from 'react';
import { TechnologyStatus, RadarQuadrant, RadarRing, type TechnologyStandard, type CreateStandardRequest } from '@/types/governance';
import { useCreateStandard, useUpdateStandard } from '@/lib/governance-hooks';

interface StandardFormProps {
  standard?: TechnologyStandard;
  onSuccess: () => void;
  onCancel: () => void;
}

export function StandardForm({ standard, onSuccess, onCancel }: StandardFormProps) {
  const createMutation = useCreateStandard();
  const updateMutation = useUpdateStandard();

  const [name, setName] = useState(standard?.name || '');
  const [category, setCategory] = useState(standard?.category || '');
  const [status, setStatus] = useState<TechnologyStatus>(standard?.status || TechnologyStatus.Assess);
  const [quadrant, setQuadrant] = useState<RadarQuadrant | undefined>(standard?.quadrant);
  const [ring, setRing] = useState<RadarRing | undefined>(standard?.ring);
  const [rationale, setRationale] = useState(standard?.rationale || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (standard) {
      await updateMutation.mutateAsync({
        id: standard.id,
        data: {
          name,
          category,
          status,
          quadrant,
          ring,
          rationale,
        },
      });
    } else {
      await createMutation.mutateAsync({
        name,
        category,
        status,
        quadrant,
        ring,
        rationale,
      });
    }

    onSuccess();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6" data-testid="standard-form">
      <h2 className="text-xl font-bold text-slate-900 mb-4">
        {standard ? 'Edit Standard' : 'New Technology Standard'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Technology Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., React, PostgreSQL, Docker"
            required
            data-testid="standard-name-input"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Category *
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., Frontend Framework, Database, Container"
            required
            data-testid="standard-category-input"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Status *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TechnologyStatus)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
              data-testid="standard-status-select"
            >
              {Object.values(TechnologyStatus).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Radar Quadrant
            </label>
            <select
              value={quadrant || ''}
              onChange={(e) => setQuadrant(e.target.value as RadarQuadrant | undefined)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              data-testid="standard-quadrant-select"
            >
              <option value="">None</option>
              {Object.values(RadarQuadrant).map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          </div>
        </div>

        {quadrant && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Radar Ring *
            </label>
            <select
              value={ring || ''}
              onChange={(e) => setRing(e.target.value as RadarRing | undefined)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
              data-testid="standard-ring-select"
            >
              {Object.values(RadarRing).map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Rationale
          </label>
          <textarea
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Explain the technology choice and its fit..."
            data-testid="standard-rationale-input"
          />
        </div>

        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
            data-testid="standard-save-button"
          >
            {createMutation.isPending || updateMutation.isPending
              ? 'Saving...'
              : standard
              ? 'Update Standard'
              : 'Create Standard'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            data-testid="standard-cancel-button"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

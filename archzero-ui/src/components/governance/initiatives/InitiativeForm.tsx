/**
 * Initiative Form Component
 */

import { useState } from 'react';
import { InitiativeStatus, InitiativeHealth, InitiativeType, type Initiative, type CreateInitiativeRequest } from '@/types/governance';
import { useCreateInitiative, useUpdateInitiative } from '@/lib/governance-hooks';

interface InitiativeFormProps {
  initiative?: Initiative;
  onSuccess: () => void;
  onCancel: () => void;
}

export function InitiativeForm({ initiative, onSuccess, onCancel }: InitiativeFormProps) {
  const createMutation = useCreateInitiative();
  const updateMutation = useUpdateInitiative();
  const [showSuccess, setShowSuccess] = useState(false);

  const [name, setName] = useState(initiative?.name || '');
  const [description, setDescription] = useState(initiative?.description || '');
  const [initiativeType, setInitiativeType] = useState<InitiativeType>(initiative?.initiativeType || InitiativeType.Strategic);
  const [status, setStatus] = useState<InitiativeStatus>(initiative?.status || InitiativeStatus.Proposed);
  const [health, setHealth] = useState<InitiativeHealth>(initiative?.health || InitiativeHealth.OnTrack);
  const [budget, setBudget] = useState(initiative?.budget?.toString() || '');
  const [startDate, setStartDate] = useState(initiative?.startDate?.split('T')[0] || '');
  const [endDate, setEndDate] = useState(initiative?.endDate?.split('T')[0] || '');
  const [progress, setProgress] = useState(initiative?.progress?.toString() || '');
  const [ownerId, setOwnerId] = useState(initiative?.ownerId || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      name,
      description,
      initiativeType,
      status,
      health,
      budget: budget ? parseFloat(budget) : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      progress: progress ? parseInt(progress) : undefined,
      ownerId: ownerId || undefined,
    };

    if (initiative) {
      await updateMutation.mutateAsync({
        id: initiative.id,
        data: {
          name,
          description,
          initiativeType,
          status,
          health,
          budget: budget ? parseFloat(budget) : undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          progress: progress ? parseInt(progress) : undefined,
          ownerId: ownerId || undefined,
        },
      });
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onSuccess();
      }, 2000);
    } else {
      await createMutation.mutateAsync(data);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onSuccess();
      }, 2000);
    }
  };

  return (
    <div className="space-y-4">
      {showSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg" data-testid="success-message">
          <p className="font-semibold">Initiative created</p>
          <p className="text-sm">Success</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6" data-testid="initiative-form">
      <h2 className="text-xl font-bold text-slate-900 mb-4">
        {initiative ? 'Edit Initiative' : 'New Strategic Initiative'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Initiative Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., Cloud Migration Program"
            required
            data-testid="initiative-name"
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
            placeholder="Describe the initiative goals..."
            data-testid="initiative-description"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Type *
            </label>
            <select
              value={initiativeType}
              onChange={(e) => setInitiativeType(e.target.value as InitiativeType)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
              data-testid="initiative-type"
            >
              {Object.values(InitiativeType).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Status *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as InitiativeStatus)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
              data-testid="initiative-status-select"
            >
              {Object.values(InitiativeStatus).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Health *
            </label>
            <select
              value={health}
              onChange={(e) => setHealth(e.target.value as InitiativeHealth)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
              data-testid="initiative-health-select"
            >
              {Object.values(InitiativeHealth).map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Budget ($)
            </label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="100000"
              data-testid="initiative-budget"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              data-testid="initiative-start-date"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              data-testid="initiative-end-date"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Progress (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="50"
              data-testid="initiative-progress-input"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Owner ID
            </label>
            <input
              type="text"
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="UUID"
              data-testid="initiative-ownerId-input"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
            data-testid="save-initiative-btn"
          >
            {createMutation.isPending || updateMutation.isPending
              ? 'Saving...'
              : initiative
              ? 'Update Initiative'
              : 'Create Initiative'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            data-testid="initiative-cancel-button"
          >
            Cancel
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}

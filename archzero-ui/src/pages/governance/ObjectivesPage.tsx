import { useState } from 'react';
import { Plus, Edit, Trash2, Target, TrendingUp } from 'lucide-react';

interface KeyResult {
  id: string;
  name: string;
  targetValue: number;
  currentValue: number;
  unit: string;
}

interface Objective {
  id: string;
  title: string;
  description: string;
  period: string;
  progress: number;
  keyResults: KeyResult[];
  initiativesCount: number;
}

export function ObjectivesPage() {
  const [objectives, setObjectives] = useState<Objective[]>([
    // Mock data - replace with API call
    {
      id: '1',
      title: 'Reduce Cloud Costs by 30%',
      description: 'Optimize cloud infrastructure and reduce operational costs through better resource utilization',
      period: 'Q1 2026',
      progress: 45,
      keyResults: [
        { id: 'kr1', name: 'Reduce EC2 costs', targetValue: 10000, currentValue: 7500, unit: '$/month' },
        { id: 'kr2', name: 'Optimize storage', targetValue: 5000, currentValue: 4200, unit: '$/month' },
        { id: 'kr3', name: 'Reduce data transfer costs', targetValue: 2000, currentValue: 1800, unit: '$/month' },
      ],
      initiativesCount: 3,
    },
    {
      id: '2',
      title: 'Achieve 99.9% Uptime',
      description: 'Improve system reliability and minimize downtime',
      period: 'Q1 2026',
      progress: 78,
      keyResults: [
        { id: 'kr1', name: 'Reduce incidents', targetValue: 5, currentValue: 3, unit: 'incidents/month' },
        { id: 'kr2', name: 'Improve MTTR', targetValue: 30, currentValue: 25, unit: 'minutes' },
      ],
      initiativesCount: 2,
    },
  ]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingObjective, setEditingObjective] = useState<Objective | null>(null);

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold" data-testid="objectives-page-title">
          Objectives & Key Results
        </h1>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          data-testid="add-objective-btn"
        >
          <Plus size={20} />
          Add Objective
        </button>
      </div>

      <div className="space-y-6">
        {objectives.map((objective) => (
          <div
            key={objective.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
            data-testid={`objective-item-${objective.id}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Target size={24} className="text-blue-600" />
                  <h3 className="text-2xl font-semibold" data-testid={`objective-title-${objective.id}`}>
                    {objective.title}
                  </h3>
                  <span className="text-sm px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full" data-testid={`objective-period-${objective.id}`}>
                    {objective.period}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-3" data-testid={`objective-description-${objective.id}`}>
                  {objective.description}
                </p>
                <div className="text-sm text-gray-500 dark:text-gray-500" data-testid={`objective-initiatives-${objective.id}`}>
                  {objective.initiativesCount} initiatives linked
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingObjective(objective)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  data-testid={`edit-objective-${objective.id}`}
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this objective?')) {
                      setObjectives(objectives.filter((o) => o.id !== objective.id));
                    }
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-red-600"
                  data-testid={`delete-objective-${objective.id}`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Overall Progress</span>
                <span data-testid={`objective-progress-${objective.id}`}>{objective.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{ width: `${objective.progress}%` }}
                  data-testid={`objective-progress-bar-${objective.id}`}
                />
              </div>
            </div>

            {/* Key Results */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <TrendingUp size={18} />
                Key Results
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {objective.keyResults.map((kr) => (
                  <div
                    key={kr.id}
                    className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4"
                    data-testid={`kr-item-${kr.id}`}
                  >
                    <div className="font-medium mb-2" data-testid={`kr-name-${kr.id}`}>
                      {kr.name}
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-2xl font-bold text-blue-600" data-testid={`kr-current-${kr.id}`}>
                        {kr.currentValue}
                      </span>
                      <span className="text-gray-500">/</span>
                      <span className="text-lg text-gray-600 dark:text-gray-400" data-testid={`kr-target-${kr.id}`}>
                        {kr.targetValue}
                      </span>
                      <span className="text-sm text-gray-500">{kr.unit}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${Math.min((kr.currentValue / kr.targetValue) * 100, 100)}%` }}
                        data-testid={`kr-progress-bar-${kr.id}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isCreating && (
        <ObjectiveForm
          onClose={() => setIsCreating(false)}
          onSave={(newObjective) => {
            setObjectives([...objectives, { ...newObjective, id: Date.now().toString(), initiativesCount: 0 }]);
            setIsCreating(false);
          }}
        />
      )}

      {editingObjective && (
        <ObjectiveForm
          objective={editingObjective}
          onClose={() => setEditingObjective(null)}
          onSave={(updatedObjective) => {
            setObjectives(objectives.map((o) => (o.id === editingObjective.id ? { ...o, ...updatedObjective } : o)));
            setEditingObjective(null);
          }}
        />
      )}
    </div>
  );
}

interface ObjectiveFormProps {
  objective?: Objective;
  onClose: () => void;
  onSave: (objective: Omit<Objective, 'id' | 'initiativesCount'>) => void;
}

function ObjectiveForm({ objective, onClose, onSave }: ObjectiveFormProps) {
  const [title, setTitle] = useState(objective?.title || '');
  const [description, setDescription] = useState(objective?.description || '');
  const [period, setPeriod] = useState(objective?.period || 'Q1 2026');
  const [keyResults, setKeyResults] = useState<KeyResult[]>(
    objective?.keyResults || [
      { id: 'kr1', name: '', targetValue: 100, currentValue: 0, unit: '' },
    ]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const progress = keyResults.length > 0
      ? Math.round(keyResults.reduce((sum, kr) => sum + (kr.currentValue / kr.targetValue) * 100, 0) / keyResults.length)
      : 0;

    onSave({ title, description, period, progress, keyResults });
  };

  const addKeyResult = () => {
    setKeyResults([...keyResults, { id: `kr${Date.now()}`, name: '', targetValue: 100, currentValue: 0, unit: '' }]);
  };

  const updateKeyResult = (id: string, field: keyof KeyResult, value: string | number) => {
    setKeyResults(keyResults.map((kr) => (kr.id === id ? { ...kr, [field]: value } : kr)));
  };

  const removeKeyResult = (id: string) => {
    setKeyResults(keyResults.filter((kr) => kr.id !== id));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto" data-testid="objective-form-modal">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl my-8">
        <h2 className="text-2xl font-bold mb-4">{objective ? 'Edit Objective' : 'Create Objective'}</h2>
        <form onSubmit={handleSubmit} data-testid="objective-form">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              data-testid="objective-title-input"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              data-testid="objective-description-input"
              rows={3}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              data-testid="objective-period-select"
            >
              <option value="Q1 2026">Q1 2026</option>
              <option value="Q2 2026">Q2 2026</option>
              <option value="Q3 2026">Q3 2026</option>
              <option value="Q4 2026">Q4 2026</option>
            </select>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium">Key Results</label>
              <button
                type="button"
                onClick={addKeyResult}
                className="text-blue-600 hover:text-blue-700 text-sm"
                data-testid="add-kr-btn"
              >
                + Add Key Result
              </button>
            </div>
            <div className="space-y-3">
              {keyResults.map((kr, index) => (
                <div key={kr.id} className="flex gap-2 items-start bg-gray-50 dark:bg-gray-900 p-3 rounded">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      placeholder="Key result name"
                      value={kr.name}
                      onChange={(e) => updateKeyResult(kr.id, 'name', e.target.value)}
                      className="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                      data-testid={`kr-name-input-${index}`}
                      required
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Current"
                        value={kr.currentValue}
                        onChange={(e) => updateKeyResult(kr.id, 'currentValue', parseFloat(e.target.value) || 0)}
                        className="w-1/3 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                        data-testid={`kr-current-input-${index}`}
                        required
                      />
                      <input
                        type="number"
                        placeholder="Target"
                        value={kr.targetValue}
                        onChange={(e) => updateKeyResult(kr.id, 'targetValue', parseFloat(e.target.value) || 0)}
                        className="w-1/3 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                        data-testid={`kr-target-input-${index}`}
                        required
                      />
                      <input
                        type="text"
                        placeholder="Unit"
                        value={kr.unit}
                        onChange={(e) => updateKeyResult(kr.id, 'unit', e.target.value)}
                        className="w-1/3 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                        data-testid={`kr-unit-input-${index}`}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeKeyResult(kr.id)}
                    className="text-red-600 hover:text-red-700 p-1"
                    data-testid={`remove-kr-${index}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              data-testid="cancel-objective-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              data-testid="save-objective-btn"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

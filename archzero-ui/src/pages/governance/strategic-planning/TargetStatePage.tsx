import { useState } from 'react';
import { Plus, Edit, Trash2, Building2, Layers, Network, Database } from 'lucide-react';

interface ArchitectureComponent {
  id: string;
  name: string;
  type: 'service' | 'layer' | 'network' | 'data';
  description: string;
  status: 'planned' | 'in-progress' | 'completed';
  dependencies: string[];
}

interface TargetStateModel {
  id: string;
  name: string;
  description: string;
  version: string;
  lastUpdated: string;
  components: ArchitectureComponent[];
}

export function TargetStatePage() {
  const [models, setModels] = useState<TargetStateModel[]>([
    {
      id: '1',
      name: 'Q2 2026 Target Architecture',
      description: 'Cloud-native architecture with microservices and event-driven communication',
      version: '2.0',
      lastUpdated: '2026-01-10',
      components: [
        {
          id: 'c1',
          name: 'API Gateway',
          type: 'service',
          description: 'Centralized API management and routing',
          status: 'completed',
          dependencies: [],
        },
        {
          id: 'c2',
          name: 'Authentication Service',
          type: 'service',
          description: 'OAuth2/OIDC authentication and authorization',
          status: 'completed',
          dependencies: [],
        },
        {
          id: 'c3',
          name: 'Event Bus',
          type: 'network',
          description: 'Kafka-based event streaming platform',
          status: 'in-progress',
          dependencies: ['c1'],
        },
        {
          id: 'c4',
          name: 'Data Lake',
          type: 'data',
          description: 'Centralized data storage and analytics platform',
          status: 'planned',
          dependencies: ['c3'],
        },
      ],
    },
    {
      id: '2',
      name: 'Q4 2026 Target Architecture',
      description: 'AI-enabled architecture with ML pipeline and real-time analytics',
      version: '3.0',
      lastUpdated: '2026-01-12',
      components: [
        {
          id: 'c5',
          name: 'ML Pipeline',
          type: 'service',
          description: 'Machine learning model training and deployment',
          status: 'planned',
          dependencies: [],
        },
        {
          id: 'c6',
          name: 'Real-time Analytics',
          type: 'data',
          description: 'Stream processing and real-time dashboards',
          status: 'planned',
          dependencies: ['c5'],
        },
      ],
    },
  ]);
  const [selectedModel, setSelectedModel] = useState<TargetStateModel | null>(models[0] || null);
  const [isCreating, setIsCreating] = useState(false);

  const getIconForType = (type: ArchitectureComponent['type']) => {
    switch (type) {
      case 'service':
        return Building2;
      case 'layer':
        return Layers;
      case 'network':
        return Network;
      case 'data':
        return Database;
      default:
        return Building2;
    }
  };

  const getStatusColor = (status: ArchitectureComponent['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'planned':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold" data-testid="target-state-page-title">
          Target Architecture Modeling
        </h1>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          data-testid="add-model-btn"
        >
          <Plus size={20} />
          New Model
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Model List */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-4" data-testid="models-list-title">
              Architecture Models
            </h2>
            <div className="space-y-2">
              {models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedModel?.id === model.id
                      ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-600'
                      : 'bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  data-testid={`model-item-${model.id}`}
                >
                  <div className="font-medium" data-testid={`model-name-${model.id}`}>
                    {model.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400" data-testid={`model-version-${model.id}`}>
                    v{model.version}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Model Details */}
        <div className="lg:col-span-3">
          {selectedModel ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2" data-testid={`selected-model-name-${selectedModel.id}`}>
                    {selectedModel.name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400" data-testid={`selected-model-description-${selectedModel.id}`}>
                    {selectedModel.description}
                  </p>
                  <div className="flex gap-4 mt-2 text-sm text-gray-500 dark:text-gray-500">
                    <span data-testid={`selected-model-version-${selectedModel.id}`}>Version: {selectedModel.version}</span>
                    <span data-testid={`selected-model-updated-${selectedModel.id}`}>Updated: {selectedModel.lastUpdated}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    data-testid={`edit-model-${selectedModel.id}`}
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this model?')) {
                        setModels(models.filter((m) => m.id !== selectedModel.id));
                        setSelectedModel(models[0] || null);
                      }
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-red-600"
                    data-testid={`delete-model-${selectedModel.id}`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Architecture Diagram Placeholder */}
              <div className="mb-6 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                <div className="text-center text-gray-500 dark:text-gray-400" data-testid="architecture-diagram-placeholder">
                  <Network size={48} className="mx-auto mb-2" />
                  <p>Interactive Architecture Diagram</p>
                  <p className="text-sm">Visual representation of components and dependencies</p>
                </div>
              </div>

              {/* Components List */}
              <div>
                <h3 className="text-xl font-semibold mb-4" data-testid="components-title">
                  Architecture Components
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedModel.components.map((component) => {
                    const Icon = getIconForType(component.type);
                    return (
                      <div
                        key={component.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                        data-testid={`component-item-${component.id}`}
                      >
                        <div className="flex items-start gap-3 mb-2">
                          <Icon size={20} className="text-blue-600 mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold" data-testid={`component-name-${component.id}`}>
                                {component.name}
                              </h4>
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${getStatusColor(component.status)}`}
                                data-testid={`component-status-${component.id}`}
                              >
                                {component.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400" data-testid={`component-description-${component.id}`}>
                              {component.description}
                            </p>
                            {component.dependencies.length > 0 && (
                              <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                                <span data-testid={`component-deps-${component.id}`}>
                                  Dependencies: {component.dependencies.length}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
              <Building2 size={64} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400" data-testid="no-model-selected">
                Select an architecture model or create a new one
              </p>
            </div>
          )}
        </div>
      </div>

      {isCreating && (
        <ModelForm
          onClose={() => setIsCreating(false)}
          onSave={(newModel) => {
            setModels([...models, { ...newModel, id: Date.now().toString(), components: [] }]);
            setIsCreating(false);
          }}
        />
      )}
    </div>
  );
}

interface ModelFormProps {
  onClose: () => void;
  onSave: (model: Omit<TargetStateModel, 'id' | 'components'>) => void;
}

function ModelForm({ onClose, onSave }: ModelFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [version, setVersion] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      description,
      version,
      lastUpdated: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="model-form-modal">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Create Target Model</h2>
        <form onSubmit={handleSubmit} data-testid="model-form">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Model Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              data-testid="model-name-input"
              placeholder="e.g., Q2 2026 Target Architecture"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              data-testid="model-description-input"
              rows={3}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Version</label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              data-testid="model-version-input"
              placeholder="e.g., 2.0"
              required
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              data-testid="cancel-model-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              data-testid="save-model-btn"
            >
              Create Model
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

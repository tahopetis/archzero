import { useState } from 'react';
import { Plus, Eye, Trash2, Calendar, FileText, Download, Search } from 'lucide-react';

interface BaselineMetric {
  id: string;
  name: string;
  value: string;
  category: 'performance' | 'cost' | 'reliability' | 'security';
}

interface BaselineSnapshot {
  id: string;
  name: string;
  description: string;
  capturedAt: string;
  capturedBy: string;
  status: 'active' | 'archived';
  metrics: BaselineMetric[];
  tags: string[];
}

export function BaselinePage() {
  const [snapshots, setSnapshots] = useState<BaselineSnapshot[]>([
    {
      id: '1',
      name: 'Q4 2025 Baseline',
      description: 'Current state before cloud migration initiative',
      capturedAt: '2025-12-31',
      capturedBy: 'John Smith',
      status: 'active',
      metrics: [
        { id: 'm1', name: 'Monthly Cloud Cost', value: '$45,000', category: 'cost' },
        { id: 'm2', name: 'Average Response Time', value: '245ms', category: 'performance' },
        { id: 'm3', name: 'System Uptime', value: '99.5%', category: 'reliability' },
        { id: 'm4', name: 'Security Incidents', value: '12/month', category: 'security' },
      ],
      tags: ['pre-migration', 'on-premise'],
    },
    {
      id: '2',
      name: 'Q1 2026 Baseline',
      description: 'Post-migration baseline for new cloud architecture',
      capturedAt: '2026-01-15',
      capturedBy: 'Sarah Johnson',
      status: 'active',
      metrics: [
        { id: 'm5', name: 'Monthly Cloud Cost', value: '$38,000', category: 'cost' },
        { id: 'm6', name: 'Average Response Time', value: '180ms', category: 'performance' },
        { id: 'm7', name: 'System Uptime', value: '99.8%', category: 'reliability' },
        { id: 'm8', name: 'Security Incidents', value: '8/month', category: 'security' },
      ],
      tags: ['post-migration', 'cloud-native'],
    },
    {
      id: '3',
      name: 'Legacy System Baseline (2024)',
      description: 'Historical baseline for legacy system documentation',
      capturedAt: '2024-06-30',
      capturedBy: 'Mike Wilson',
      status: 'archived',
      metrics: [
        { id: 'm9', name: 'Monthly Infrastructure Cost', value: '$52,000', category: 'cost' },
        { id: 'm10', name: 'Average Response Time', value: '320ms', category: 'performance' },
        { id: 'm11', name: 'System Uptime', value: '98.9%', category: 'reliability' },
      ],
      tags: ['legacy', 'historical'],
    },
  ]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<BaselineSnapshot | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'archived'>('all');

  const filteredSnapshots = snapshots.filter((snapshot) => {
    const matchesSearch = snapshot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         snapshot.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         snapshot.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterStatus === 'all' || snapshot.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getCategoryColor = (category: BaselineMetric['category']) => {
    switch (category) {
      case 'performance':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'cost':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'reliability':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'security':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold" data-testid="baseline-page-title">
          Baseline Snapshots
        </h1>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          data-testid="add-snapshot-btn"
        >
          <Plus size={20} />
          New Snapshot
        </button>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search snapshots..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            data-testid="snapshot-search-input"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'archived')}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          data-testid="snapshot-status-filter"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Snapshots List */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-4" data-testid="snapshots-list-title">
              Snapshots ({filteredSnapshots.length})
            </h2>
            <div className="space-y-3">
              {filteredSnapshots.map((snapshot) => (
                <div
                  key={snapshot.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedSnapshot?.id === snapshot.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-600'
                      : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setSelectedSnapshot(snapshot)}
                  data-testid={`snapshot-item-${snapshot.id}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold" data-testid={`snapshot-name-${snapshot.id}`}>
                        {snapshot.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <Calendar size={14} />
                        <span data-testid={`snapshot-date-${snapshot.id}`}>{snapshot.capturedAt}</span>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        snapshot.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}
                      data-testid={`snapshot-status-${snapshot.id}`}
                    >
                      {snapshot.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2" data-testid={`snapshot-description-${snapshot.id}`}>
                    {snapshot.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {snapshot.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded"
                        data-testid={`snapshot-tag-${snapshot.id}-${tag}`}
                      >
                        {tag}
                      </span>
                    ))}
                    {snapshot.tags.length > 2 && (
                      <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">
                        +{snapshot.tags.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Snapshot Details */}
        <div className="lg:col-span-2">
          {selectedSnapshot ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2" data-testid={`selected-snapshot-name-${selectedSnapshot.id}`}>
                    {selectedSnapshot.name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400" data-testid={`selected-snapshot-description-${selectedSnapshot.id}`}>
                    {selectedSnapshot.description}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                    data-testid={`export-snapshot-${selectedSnapshot.id}`}
                  >
                    <Download size={18} />
                    Export
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this snapshot?')) {
                        setSnapshots(snapshots.filter((s) => s.id !== selectedSnapshot.id));
                        setSelectedSnapshot(null);
                      }
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-red-600"
                    data-testid={`delete-snapshot-${selectedSnapshot.id}`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Captured Date</div>
                  <div className="font-medium" data-testid={`selected-snapshot-date-${selectedSnapshot.id}`}>
                    {selectedSnapshot.capturedAt}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Captured By</div>
                  <div className="font-medium" data-testid={`selected-snapshot-by-${selectedSnapshot.id}`}>
                    {selectedSnapshot.capturedBy}
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="mb-6">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Tags</div>
                <div className="flex flex-wrap gap-2">
                  {selectedSnapshot.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                      data-testid={`selected-snapshot-tag-${selectedSnapshot.id}-${tag}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Metrics */}
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <FileText size={20} />
                  Baseline Metrics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedSnapshot.metrics.map((metric) => (
                    <div
                      key={metric.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                      data-testid={`metric-item-${metric.id}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1" data-testid={`metric-name-${metric.id}`}>
                            {metric.name}
                          </div>
                          <div className="text-2xl font-bold text-blue-600" data-testid={`metric-value-${metric.id}`}>
                            {metric.value}
                          </div>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(metric.category)}`}
                          data-testid={`metric-category-${metric.id}`}
                        >
                          {metric.category}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
              <FileText size={64} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400" data-testid="no-snapshot-selected">
                Select a baseline snapshot to view details
              </p>
            </div>
          )}
        </div>
      </div>

      {isCreating && (
        <SnapshotForm
          onClose={() => setIsCreating(false)}
          onSave={(newSnapshot) => {
            setSnapshots([...snapshots, { ...newSnapshot, id: Date.now().toString(), status: 'active' }]);
            setIsCreating(false);
          }}
        />
      )}
    </div>
  );
}

interface SnapshotFormProps {
  onClose: () => void;
  onSave: (snapshot: Omit<BaselineSnapshot, 'id' | 'status'>) => void;
}

function SnapshotForm({ onClose, onSave }: SnapshotFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      description,
      capturedAt: new Date().toISOString().split('T')[0],
      capturedBy: 'Current User',
      metrics: [],
      tags: [],
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="snapshot-form-modal">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Create Baseline Snapshot</h2>
        <form onSubmit={handleSubmit} data-testid="snapshot-form">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Snapshot Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              data-testid="snapshot-name-input"
              placeholder="e.g., Q1 2026 Baseline"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              data-testid="snapshot-description-input"
              rows={3}
              required
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              data-testid="cancel-snapshot-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              data-testid="save-snapshot-btn"
            >
              Create Snapshot
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Plus, Edit, Trash2, Calendar, MapPin, ChevronRight, Circle, CheckCircle2, Clock, GitBranch, Filter } from 'lucide-react';

interface Milestone {
  id: string;
  name: string;
  description: string;
  date: string;
  status: 'completed' | 'in-progress' | 'pending';
  dependencies: string[];
}

interface RoadmapPhase {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'not-started' | 'in-progress' | 'completed';
  milestones: Milestone[];
  color: string;
}

interface Roadmap {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  phases: RoadmapPhase[];
}

export function RoadmapPage() {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([
    {
      id: '1',
      name: 'Cloud Migration Roadmap 2026',
      description: 'Strategic transformation plan for migrating to cloud-native architecture',
      createdAt: '2026-01-05',
      phases: [
        {
          id: 'p1',
          name: 'Phase 1: Foundation',
          description: 'Infrastructure setup and core services',
          startDate: '2026-01-01',
          endDate: '2026-03-31',
          status: 'in-progress',
          color: '#3b82f6',
          milestones: [
            {
              id: 'm1',
              name: 'Cloud Account Setup',
              description: 'Configure cloud accounts and networking',
              date: '2026-01-15',
              status: 'completed',
              dependencies: [],
            },
            {
              id: 'm2',
              name: 'CI/CD Pipeline',
              description: 'Implement automated deployment pipeline',
              date: '2026-02-15',
              status: 'completed',
              dependencies: ['m1'],
            },
            {
              id: 'm3',
              name: 'Authentication Service',
              description: 'Deploy OAuth2/OIDC authentication',
              date: '2026-03-15',
              status: 'in-progress',
              dependencies: ['m2'],
            },
            {
              id: 'm4',
              name: 'API Gateway',
              description: 'Deploy centralized API management',
              date: '2026-03-31',
              status: 'pending',
              dependencies: ['m3'],
            },
          ],
        },
        {
          id: 'p2',
          name: 'Phase 2: Migration',
          description: 'Migrate core applications to cloud',
          startDate: '2026-04-01',
          endDate: '2026-06-30',
          status: 'not-started',
          color: '#10b981',
          milestones: [
            {
              id: 'm5',
              name: 'Database Migration',
              description: 'Migrate databases to cloud-native solutions',
              date: '2026-04-30',
              status: 'pending',
              dependencies: ['m4'],
            },
            {
              id: 'm6',
              name: 'Application Migration',
              description: 'Migrate core business applications',
              date: '2026-06-15',
              status: 'pending',
              dependencies: ['m5'],
            },
            {
              id: 'm7',
              name: 'Data Sync',
              description: 'Establish data synchronization',
              date: '2026-06-30',
              status: 'pending',
              dependencies: ['m6'],
            },
          ],
        },
        {
          id: 'p3',
          name: 'Phase 3: Optimization',
          description: 'Optimize and modernize cloud architecture',
          startDate: '2026-07-01',
          endDate: '2026-09-30',
          status: 'not-started',
          color: '#8b5cf6',
          milestones: [
            {
              id: 'm8',
              name: 'Cost Optimization',
              description: 'Implement cost monitoring and optimization',
              date: '2026-07-31',
              status: 'pending',
              dependencies: ['m7'],
            },
            {
              id: 'm9',
              name: 'Performance Tuning',
              description: 'Optimize application performance',
              date: '2026-08-31',
              status: 'pending',
              dependencies: ['m8'],
            },
            {
              id: 'm10',
              name: 'Security Hardening',
              description: 'Complete security review and hardening',
              date: '2026-09-30',
              status: 'pending',
              dependencies: ['m9'],
            },
          ],
        },
      ],
    },
  ]);
  const [selectedRoadmap, setSelectedRoadmap] = useState<Roadmap | null>(roadmaps[0] || null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<RoadmapPhase | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDependencyView, setShowDependencyView] = useState(false);
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [phaseFilter, setPhaseFilter] = useState<string>('all');

  const getStatusIcon = (status: Milestone['status']) => {
    switch (status) {
      case 'completed':
        return CheckCircle2;
      case 'in-progress':
        return Clock;
      case 'pending':
        return Circle;
    }
  };

  const getStatusColor = (status: RoadmapPhase['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'not-started':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getMilestoneStatusColor = (status: Milestone['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'in-progress':
        return 'text-blue-600';
      case 'pending':
        return 'text-gray-400';
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold" data-testid="transformation-roadmap">
          Roadmap
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setIsGenerating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            data-testid="generate-roadmap-btn"
          >
            <GitBranch size={20} />
            Generate Roadmap
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            data-testid="add-roadmap-btn"
          >
            <Plus size={20} />
            New Roadmap
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Roadmaps List */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-4" data-testid="roadmaps-list-title">
              Roadmaps
            </h2>
            <div className="space-y-2">
              {roadmaps.map((roadmap) => (
                <button
                  key={roadmap.id}
                  onClick={() => setSelectedRoadmap(roadmap)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedRoadmap?.id === roadmap.id
                      ? 'bg-blue-100 dark:bg-blue-900/20 border-2 border-blue-600'
                      : 'bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  data-testid={`roadmap-item-${roadmap.id}`}
                >
                  <div className="font-medium mb-1" data-testid={`roadmap-name-${roadmap.id}`}>
                    {roadmap.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400" data-testid={`roadmap-phases-${roadmap.id}`}>
                    {roadmap.phases.length} phases
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Roadmap Details */}
        <div className="lg:col-span-3">
          {selectedRoadmap ? (
            <div className="space-y-6">
              {/* Roadmap Header */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-2" data-testid={`selected-roadmap-name-${selectedRoadmap.id}`}>
                      {selectedRoadmap.name}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400" data-testid={`selected-roadmap-description-${selectedRoadmap.id}`}>
                      {selectedRoadmap.description}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this roadmap?')) {
                        setRoadmaps(roadmaps.filter((r) => r.id !== selectedRoadmap.id));
                        setSelectedRoadmap(roadmaps[0] || null);
                      }
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-red-600"
                    data-testid={`delete-roadmap-${selectedRoadmap.id}`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Progress Summary */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600" data-testid={`total-phases-${selectedRoadmap.id}`}>
                      {selectedRoadmap.phases.length}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Phases</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600" data-testid={`completed-milestones-${selectedRoadmap.id}`}>
                      {selectedRoadmap.phases.reduce((sum, phase) =>
                        sum + phase.milestones.filter(m => m.status === 'completed').length, 0
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600" data-testid={`pending-milestones-${selectedRoadmap.id}`}>
                      {selectedRoadmap.phases.reduce((sum, phase) =>
                        sum + phase.milestones.filter(m => m.status !== 'completed').length, 0
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Pending</div>
                  </div>
                </div>
              </div>

              {/* Timeline Visualization */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6" data-testid="roadmap-timeline">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <Calendar size={20} />
                    Timeline View
                  </h3>
                  <div className="flex gap-2">
                    <select
                      value={phaseFilter}
                      onChange={(e) => setPhaseFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      data-testid="phase-filter"
                    >
                      <option value="all">All Phases</option>
                      {selectedRoadmap.phases.map((phase) => (
                        <option key={phase.id} value={phase.id}>
                          {phase.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => setShowDependencyView(!showDependencyView)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        showDependencyView
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                      data-testid="dependency-view"
                    >
                      <GitBranch size={20} />
                      Dependencies
                    </button>
                    <button
                      onClick={() => setIsAddingMilestone(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      data-testid="add-milestone-btn"
                    >
                      <Plus size={20} />
                      Add Milestone
                    </button>
                  </div>
                </div>

                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-700" />

                  {/* Dependency View */}
                  {showDependencyView && (
                    <div className="mb-6 p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg" data-testid="roadmap-dependencies">
                      <h4 className="text-lg font-semibold mb-4">Dependency Graph</h4>
                      <div className="space-y-2">
                        {selectedRoadmap.phases.flatMap((phase) =>
                          phase.milestones.filter((m) => m.dependencies.length > 0).map((milestone) => (
                            <div key={milestone.id} className="flex items-center gap-2 text-sm">
                              <span className="font-medium" data-testid="roadmap-milestone">{milestone.name}</span>
                              <span className="text-gray-500">depends on:</span>
                              {milestone.dependencies.map((depId) => {
                                const depMilestone = selectedRoadmap.phases
                                  .flatMap((p) => p.milestones)
                                  .find((m) => m.id === depId);
                                return depMilestone ? (
                                  <span key={depId} className="px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs">
                                    {depMilestone.name}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-8">
                    {selectedRoadmap.phases
                      .filter((phase) => phaseFilter === 'all' || phaseFilter === phase.id)
                      .map((phase, phaseIndex) => (
                      <div key={phase.id} className="relative pl-16">
                        {/* Phase Marker */}
                        <div
                          className="absolute left-6 top-0 w-5 h-5 rounded-full border-4 border-white dark:border-gray-800"
                          style={{ backgroundColor: phase.color }}
                          data-testid={`phase-marker-${phase.id}`}
                        />

                        {/* Phase Card */}
                        <div
                          className="bg-gray-50 dark:bg-gray-900 rounded-lg p-5 border-l-4 hover:shadow-md transition-shadow cursor-pointer"
                          style={{ borderLeftColor: phase.color }}
                          onClick={() => setSelectedPhase(selectedPhase?.id === phase.id ? null : phase)}
                          data-testid={`phase-card-${phase.id}`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-lg font-semibold" data-testid={`phase-name-${phase.id}`}>
                                  {phase.name}
                                </h4>
                                <span
                                  className={`text-xs px-3 py-1 rounded-full ${getStatusColor(phase.status)}`}
                                  data-testid={`phase-status-${phase.id}`}
                                >
                                  {phase.status}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2" data-testid={`phase-description-${phase.id}`}>
                                {phase.description}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
                                <span data-testid={`phase-start-${phase.id}`}>Start: {phase.startDate}</span>
                                <ChevronRight size={16} />
                                <span data-testid={`phase-end-${phase.id}`}>End: {phase.endDate}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold" style={{ color: phase.color }} data-testid={`phase-milestones-${phase.id}`}>
                                {phase.milestones.length}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Milestones</div>
                            </div>
                          </div>

                          {/* Expanded Milestones */}
                          {selectedPhase?.id === phase.id && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                              <h5 className="text-sm font-medium mb-3">Milestones</h5>
                              <div className="space-y-3">
                                {phase.milestones.map((milestone, milestoneIndex) => {
                                  const StatusIcon = getStatusIcon(milestone.status);
                                  return (
                                    <div
                                      key={milestone.id}
                                      className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg hover:shadow-sm transition-shadow"
                                      data-testid="roadmap-milestone"
                                    >
                                      <StatusIcon
                                        size={20}
                                        className={getMilestoneStatusColor(milestone.status)}
                                        data-testid={`milestone-icon-${milestone.id}`}
                                      />
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="font-medium" data-testid={`milestone-name-${milestone.id}`}>
                                            {milestone.name}
                                          </span>
                                          <span className="text-xs text-gray-500 dark:text-gray-400" data-testid={`milestone-date-${milestone.id}`}>
                                            {milestone.date}
                                          </span>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400" data-testid={`milestone-description-${milestone.id}`}>
                                          {milestone.description}
                                        </p>
                                        {milestone.dependencies.length > 0 && (
                                          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                            Depends on: {milestone.dependencies.length} milestone{milestone.dependencies.length > 1 ? 's' : ''}
                                          </div>
                                        )}
                                      </div>
                                      <div
                                        className={`text-xs px-2 py-1 rounded-full ${
                                          milestone.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                          milestone.status === 'in-progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                        }`}
                                        data-testid={`milestone-status-${milestone.id}`}
                                      >
                                        {milestone.status}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Progress Bar */}
                          <div className="mt-3">
                            <div className="flex justify-between text-xs mb-1">
                              <span>Progress</span>
                              <span data-testid={`phase-progress-${phase.id}`}>
                                {Math.round((phase.milestones.filter(m => m.status === 'completed').length / phase.milestones.length) * 100)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="h-2 rounded-full transition-all"
                                style={{
                                  width: `${(phase.milestones.filter(m => m.status === 'completed').length / phase.milestones.length) * 100}%`,
                                  backgroundColor: phase.color
                                }}
                                data-testid={`phase-progress-bar-${phase.id}`}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Connector to next phase */}
                        {phaseIndex < selectedRoadmap.phases.length - 1 && (
                          <div className="flex items-center gap-2 py-2">
                            <ChevronRight size={20} className="text-gray-400" />
                            <span className="text-sm text-gray-500 dark:text-gray-500">Next Phase</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
              <MapPin size={64} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400" data-testid="no-roadmap-selected">
                Select a roadmap to view the transformation timeline
              </p>
            </div>
          )}
        </div>
      </div>

      {isCreating && (
        <RoadmapForm
          onClose={() => setIsCreating(false)}
          onSave={(newRoadmap) => {
            setRoadmaps([...roadmaps, { ...newRoadmap, id: Date.now().toString(), phases: [] }]);
            setIsCreating(false);
          }}
        />
      )}

      {isGenerating && (
        <GenerateRoadmapModal
          onClose={() => setIsGenerating(false)}
          onGenerate={(newRoadmap) => {
            setRoadmaps([...roadmaps, newRoadmap]);
            setIsGenerating(false);
          }}
        />
      )}

      {isAddingMilestone && selectedRoadmap && (
        <AddMilestoneModal
          onClose={() => setIsAddingMilestone(false)}
          onAdd={(milestone) => {
            // Add milestone to the first phase for simplicity
            if (selectedRoadmap.phases.length > 0) {
              const updatedRoadmaps = roadmaps.map((r) => {
                if (r.id === selectedRoadmap.id) {
                  const updatedPhases = [...r.phases];
                  updatedPhases[0] = {
                    ...updatedPhases[0],
                    milestones: [
                      ...updatedPhases[0].milestones,
                      { ...milestone, id: Date.now().toString(), status: 'pending' as const, dependencies: [] }
                    ]
                  };
                  return { ...r, phases: updatedPhases };
                }
                return r;
              });
              setRoadmaps(updatedRoadmaps);
              setSelectedRoadmap(updatedRoadmaps.find((r) => r.id === selectedRoadmap.id) || null);
            }
            setIsAddingMilestone(false);
          }}
        />
      )}
    </div>
  );
}

interface RoadmapFormProps {
  onClose: () => void;
  onSave: (roadmap: Omit<Roadmap, 'id' | 'phases'>) => void;
}

function RoadmapForm({ onClose, onSave }: RoadmapFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      description,
      createdAt: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="roadmap-form-modal">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Create Roadmap</h2>
        <form onSubmit={handleSubmit} data-testid="roadmap-form">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Roadmap Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              data-testid="roadmap-name-input"
              placeholder="e.g., Cloud Migration Roadmap 2026"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              data-testid="roadmap-description-input"
              rows={3}
              required
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              data-testid="cancel-roadmap-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              data-testid="save-roadmap-btn"
            >
              Create Roadmap
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface GenerateRoadmapModalProps {
  onClose: () => void;
  onGenerate: (roadmap: Roadmap) => void;
}

function GenerateRoadmapModal({ onClose, onGenerate }: GenerateRoadmapModalProps) {
  const [baseline, setBaseline] = useState('');
  const [target, setTarget] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Generate a sample roadmap based on baseline and target
    const newRoadmap: Roadmap = {
      id: Date.now().toString(),
      name: `Roadmap from ${baseline} to ${target}`,
      description: `Generated transformation roadmap from ${baseline} to ${target}`,
      createdAt: new Date().toISOString().split('T')[0],
      phases: [
        {
          id: 'p1',
          name: 'Phase 1: Assessment',
          description: 'Assess current state and define requirements',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'not-started',
          color: '#3b82f6',
          milestones: [],
        },
      ],
    };
    onGenerate(newRoadmap);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="generate-roadmap-modal">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Generate Roadmap</h2>
        <form onSubmit={handleSubmit} data-testid="generate-roadmap-form">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Baseline State</label>
            <select
              value={baseline}
              onChange={(e) => setBaseline(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              data-testid="baseline-select"
              required
            >
              <option value="">Select baseline...</option>
              <option value="current">Current State</option>
              <option value="legacy">Legacy System</option>
              <option value="on-premise">On-Premise Infrastructure</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Target State</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              data-testid="target-select"
              required
            >
              <option value="">Select target...</option>
              <option value="cloud-native">Cloud-Native Architecture</option>
              <option value="microservices">Microservices-based</option>
              <option value="serverless">Serverless Architecture</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              data-testid="cancel-generate-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              data-testid="confirm-generate-btn"
            >
              Generate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface AddMilestoneModalProps {
  onClose: () => void;
  onAdd: (milestone: Omit<Milestone, 'id' | 'status' | 'dependencies'>) => void;
}

function AddMilestoneModal({ onClose, onAdd }: AddMilestoneModalProps) {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      name,
      date,
      description,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="add-milestone-modal">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Add Milestone</h2>
        <form onSubmit={handleSubmit} data-testid="milestone-form">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Milestone Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              data-testid="milestone-name"
              placeholder="e.g., Cloud Migration Complete"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Target Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              data-testid="milestone-date"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              data-testid="milestone-description"
              rows={3}
              required
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              data-testid="cancel-milestone-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              data-testid="save-milestone-btn"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

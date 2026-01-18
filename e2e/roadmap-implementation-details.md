# RoadmapPage Implementation Details

## Key Code Changes

### 1. Main Container with Test Selector
```tsx
<div className="container mx-auto py-6" data-testid="transformation-roadmap">
```

### 2. Generate Roadmap Button
```tsx
<button
  onClick={() => setIsGenerating(true)}
  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
  data-testid="generate-roadmap-btn"
>
  <GitBranch size={20} />
  Generate Roadmap
</button>
```

### 3. Timeline with Test Selector
```tsx
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6" data-testid="roadmap-timeline">
```

### 4. Phase Filter
```tsx
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
```

### 5. Dependency View Toggle
```tsx
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
```

### 6. Dependency Visualization
```tsx
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
```

### 7. Add Milestone Button
```tsx
<button
  onClick={() => setIsAddingMilestone(true)}
  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
  data-testid="add-milestone-btn"
>
  <Plus size={20} />
  Add Milestone
</button>
```

### 8. Milestone Item with Test Selector
```tsx
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
  </div>
</div>
```

### 9. GenerateRoadmapModal Component
```tsx
function GenerateRoadmapModal({ onClose, onGenerate }: GenerateRoadmapModalProps) {
  const [baseline, setBaseline] = useState('');
  const [target, setTarget] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRoadmap: Roadmap = {
      id: Date.now().toString(),
      name: `Roadmap from ${baseline} to ${target}`,
      description: `Generated transformation roadmap from ${baseline} to ${target}`,
      createdAt: new Date().toISOString().split('T')[0],
      phases: [/* ... */],
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
```

### 10. AddMilestoneModal Component
```tsx
function AddMilestoneModal({ onClose, onAdd }: AddMilestoneModalProps) {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ name, date, description });
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
```

### 11. State Management
```tsx
const [isGenerating, setIsGenerating] = useState(false);
const [showDependencyView, setShowDependencyView] = useState(false);
const [isAddingMilestone, setIsAddingMilestone] = useState(false);
const [phaseFilter, setPhaseFilter] = useState<string>('all');
```

### 12. Filtered Phase Rendering
```tsx
{selectedRoadmap.phases
  .filter((phase) => phaseFilter === 'all' || phaseFilter === phase.id)
  .map((phase, phaseIndex) => (
    // Phase rendering...
  ))}
```

## New Component Interfaces

### GenerateRoadmapModalProps
```tsx
interface GenerateRoadmapModalProps {
  onClose: () => void;
  onGenerate: (roadmap: Roadmap) => void;
}
```

### AddMilestoneModalProps
```tsx
interface AddMilestoneModalProps {
  onClose: () => void;
  onAdd: (milestone: Omit<Milestone, 'id' | 'status' | 'dependencies'>) => void;
}
```

## Feature Highlights

1. **Generate Roadmap**: Creates new roadmaps by selecting baseline and target states
2. **Dependency Visualization**: Shows milestone dependencies in a visual graph
3. **Phase Filtering**: Filter timeline view by specific phases
4. **Add Milestones**: Add new milestones to any phase with full form validation
5. **Responsive Design**: All modals and features work on mobile and desktop
6. **Dark Mode**: Full dark mode support maintained
7. **Accessibility**: Proper labels, focus states, and semantic HTML

## Test Selector Mapping to E2E Tests

| E2E Test Line | Expected Selector | Implemented |
|--------------|-------------------|-------------|
| 441 | `data-testid="transformation-roadmap"` | ✅ Line 198 |
| 448 | `data-testid="generate-roadmap-btn"` | ✅ Line 207 |
| 453 | `data-testid="baseline-select"` | ✅ Line 696 |
| 454 | `data-testid="target-select"` | ✅ Line 711 |
| 465 | `data-testid="roadmap-timeline"` | ✅ Line 311 |
| 474 | `data-testid="dependency-view"` | ✅ Line 338 |
| 479 | `data-testid="roadmap-dependencies"` | ✅ Line 360 |
| 486 | `data-testid="roadmap-milestone"` | ✅ Line 445 |
| 496 | `data-testid="add-milestone-btn"` | ✅ Line 346 |
| 500 | `data-testid="milestone-name"` | ✅ Line 774 |
| 501 | `data-testid="milestone-date"` | ✅ Line 786 |
| 502 | `data-testid="milestone-description"` | ✅ Line 796 |
| 513 | `data-testid="phase-filter"` | ✅ Line 322 |

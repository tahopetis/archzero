import { useState } from 'react';

interface TechItem {
  id: string;
  name: string;
  quadrant: string;
  ring: string;
}

export function TechnologyRadarPage() {
  const [ringFilter, setRingFilter] = useState<string>('all');
  const [hoveredTech, setHoveredTech] = useState<string | null>(null);

  const techItems: TechItem[] = [
    { id: '1', name: 'Kubernetes', quadrant: 'tools', ring: 'adopt' },
    { id: '2', name: 'React', quadrant: 'languages', ring: 'adopt' },
    { id: '3', name: 'TypeScript', quadrant: 'languages', ring: 'adopt' },
    { id: '4', name: 'GraphQL', quadrant: 'tools', ring: 'trial' },
    { id: '5', name: 'Rust', quadrant: 'languages', ring: 'assess' },
    { id: '6', name: 'WebAssembly', quadrant: 'platforms', ring: 'assess' },
    { id: '7', name: 'Legacy Systems', quadrant: 'tools', ring: 'hold' },
    { id: '8', name: 'Monolith', quadrant: 'techniques', ring: 'hold' },
  ];

  const quadrants = [
    { id: 'tools', name: 'Tools', color: 'bg-blue-100 dark:bg-blue-900/20' },
    { id: 'languages', name: 'Languages', color: 'bg-green-100 dark:bg-green-900/20' },
    { id: 'platforms', name: 'Platforms', color: 'bg-purple-100 dark:bg-purple-900/20' },
    { id: 'techniques', name: 'Techniques', color: 'bg-yellow-100 dark:bg-yellow-900/20' },
  ];

  const rings = ['adopt', 'trial', 'assess', 'hold'];

  const filteredItems = ringFilter === 'all'
    ? techItems
    : techItems.filter(item => item.ring === ringFilter);

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold" data-testid="radar-page">Technology Radar</h1>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
            <select
              value={ringFilter}
              onChange={(e) => setRingFilter(e.target.value)}
              className="px-2 py-1 border-0 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              data-testid="ring-filter"
              name="ring"
            >
              <option value="all">All Rings</option>
              <option value="adopt">Adopt</option>
              <option value="trial">Trial</option>
              <option value="assess">Assess</option>
              <option value="hold">Hold</option>
            </select>
          </div>
        </div>
      </div>

      {/* Radar Visualization */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6" data-testid="tech-radar">
        <div className="grid grid-cols-2 gap-4">
          {quadrants.map((quadrant) => (
            <div
              key={quadrant.id}
              className={`radar-quadrant rounded-lg p-6 ${quadrant.color}`}
              data-testid="quadrant"
            >
              <h3 className="text-lg font-semibold mb-4">{quadrant.name}</h3>
              <div className="space-y-2">
                {techItems
                  .filter(item => item.quadrant === quadrant.id)
                  .filter(item => ringFilter === 'all' || item.ring === ringFilter)
                  .map((item) => (
                    <div
                      key={item.id}
                      className={`tech-item radar-item p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                        hoveredTech === item.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      data-testid="tech-item"
                      onMouseEnter={() => setHoveredTech(item.id)}
                      onMouseLeave={() => setHoveredTech(null)}
                    >
                      <div className="font-medium text-sm">{item.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{item.ring}</div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {hoveredTech && (
        <div
          className="radar-tooltip fixed bg-gray-900 text-white p-3 rounded-lg shadow-lg z-50 text-sm"
          data-testid="tech-tooltip"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="font-medium mb-1">
            {techItems.find(t => t.id === hoveredTech)?.name}
          </div>
          <div className="text-xs text-gray-300">
            Ring: {techItems.find(t => t.id === hoveredTech)?.ring}
          </div>
          <div className="text-xs text-gray-300">
            Quadrant: {techItems.find(t => t.id === hoveredTech)?.quadrant}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Rings</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {rings.map((ring) => (
            <div key={ring} className="flex items-center gap-2">
              <div
                className={`w-4 h-4 rounded-full ${
                  ring === 'adopt' ? 'bg-green-500' :
                  ring === 'trial' ? 'bg-blue-500' :
                  ring === 'assess' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
              />
              <span className="text-sm capitalize">{ring}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

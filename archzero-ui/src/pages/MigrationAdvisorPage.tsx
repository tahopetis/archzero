import { useState } from 'react';
import { GitCompare, BarChart3, TrendingUp, ArrowRight } from 'lucide-react';

interface MigrationOption {
  id: string;
  name: string;
  description: string;
  effort: number; // 1-10 scale
  cost: string;
  timeline: string;
  risk: 'low' | 'medium' | 'high';
  benefits: string[];
}

const migrationOptions: MigrationOption[] = [
  {
    id: 'rehost',
    name: 'Rehost',
    description: 'Lift and shift to cloud infrastructure',
    effort: 3,
    cost: '$$',
    timeline: '2-4 weeks',
    risk: 'low',
    benefits: ['Fastest migration', 'Minimal code changes', 'Quick cloud adoption'],
  },
  {
    id: 'refactor',
    name: 'Refactor',
    description: 'Optimize for cloud without major changes',
    effort: 6,
    cost: '$$$',
    timeline: '6-12 weeks',
    risk: 'medium',
    benefits: ['Improved performance', 'Better cloud utilization', 'Cost optimization'],
  },
  {
    id: 'revise',
    name: 'Revise',
    description: 'Make minor changes to enhance cloud compatibility',
    effort: 5,
    cost: '$$$',
    timeline: '4-8 weeks',
    risk: 'medium',
    benefits: ['Balanced approach', 'Some cloud benefits', 'Moderate effort'],
  },
  {
    id: 'rebuild',
    name: 'Rebuild',
    description: 'Re-architect and rebuild using cloud-native services',
    effort: 9,
    cost: '$$$$$',
    timeline: '16-24 weeks',
    risk: 'high',
    benefits: ['Maximum cloud benefits', 'Modern architecture', 'Best performance'],
  },
  {
    id: 'replace',
    name: 'Replace',
    description: 'Replace with SaaS or commercial solution',
    effort: 4,
    cost: '$$$$',
    timeline: '4-6 weeks',
    risk: 'medium',
    benefits: ['No maintenance', 'Fast implementation', 'Vendor support'],
  },
  {
    id: 'retire',
    name: 'Retire',
    description: 'Decommission application',
    effort: 2,
    cost: '$',
    timeline: '1-2 weeks',
    risk: 'low',
    benefits: ['Cost savings', 'Reduced complexity', 'Focus on core apps'],
  },
];

export function MigrationAdvisorPage() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [comparisonOptions, setComparisonOptions] = useState<string[]>([]);

  const getEffortColor = (effort: number) => {
    if (effort <= 3) return 'bg-green-500';
    if (effort <= 6) return 'bg-yellow-500';
    if (effort <= 8) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
  };

  const toggleComparison = (optionId: string) => {
    if (comparisonOptions.includes(optionId)) {
      setComparisonOptions(comparisonOptions.filter(id => id !== optionId));
    } else if (comparisonOptions.length < 2) {
      setComparisonOptions([...comparisonOptions, optionId]);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="migration-page">Migration Advisor</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            6R framework recommendations for cloud migration strategy
          </p>
        </div>
        <button
          onClick={() => {
            setCompareMode(!compareMode);
            setComparisonOptions([]);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            compareMode
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          <GitCompare size={20} />
          Compare Options
        </button>
      </div>

      {/* 6R Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {migrationOptions.map((option) => (
          <div
            key={option.id}
            data-testid="6r-recommendation"
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-2 transition-all cursor-pointer ${
              selectedOption === option.id || comparisonOptions.includes(option.id)
                ? 'border-blue-500'
                : 'border-transparent'
            } ${compareMode ? 'hover:border-blue-300' : ''}`}
            onClick={() => {
              if (compareMode) {
                toggleComparison(option.id);
              } else {
                setSelectedOption(option.id);
              }
            }}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">{option.name}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(option.risk)}`}>
                {option.risk.toUpperCase()}
              </span>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{option.description}</p>

            {/* Effort Estimate */}
            <div className="mb-4" data-testid="effort-estimate">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Effort Level</span>
                <span className="text-gray-600 dark:text-gray-400">{option.effort}/10</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`effort-bar h-2 rounded-full transition-all ${getEffortColor(option.effort)}`}
                  style={{ width: `${option.effort * 10}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
              <div>
                <div className="text-gray-600 dark:text-gray-400">Cost</div>
                <div className="font-medium">{option.cost}</div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400">Timeline</div>
                <div className="font-medium">{option.timeline}</div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Key Benefits:</div>
              {option.benefits.slice(0, 2).map((benefit, idx) => (
                <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1">
                  <ArrowRight size={12} className="mt-0.5 flex-shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Comparison View */}
      {(compareMode || comparisonOptions.length > 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6" data-testid="comparison-view">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <BarChart3 size={24} />
            Migration Options Comparison
          </h2>

          {comparisonOptions.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              Select 2 options above to compare
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left p-4">Criteria</th>
                    {comparisonOptions.map((id) => {
                      const option = migrationOptions.find(o => o.id === id);
                      return (
                        <th key={id} className="text-center p-4">
                          <div className="font-semibold">{option?.name}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="p-4 font-medium">Effort (1-10)</td>
                    {comparisonOptions.map((id) => {
                      const option = migrationOptions.find(o => o.id === id);
                      return (
                        <td key={id} className="text-center p-4">
                          <div className="flex items-center justify-center gap-2">
                            <div className={`w-16 h-2 rounded-full ${getEffortColor(option?.effort || 0)}`}
                              style={{ width: `${((option?.effort || 0) / 10) * 64}px` }}
                            />
                            <span className="text-sm">{option?.effort}/10</span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="p-4 font-medium">Timeline</td>
                    {comparisonOptions.map((id) => {
                      const option = migrationOptions.find(o => o.id === id);
                      return (
                        <td key={id} className="text-center p-4 text-sm">{option?.timeline}</td>
                      );
                    })}
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="p-4 font-medium">Cost Range</td>
                    {comparisonOptions.map((id) => {
                      const option = migrationOptions.find(o => o.id === id);
                      return (
                        <td key={id} className="text-center p-4 text-sm">{option?.cost}</td>
                      );
                    })}
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="p-4 font-medium">Risk Level</td>
                    {comparisonOptions.map((id) => {
                      const option = migrationOptions.find(o => o.id === id);
                      return (
                        <td key={id} className="text-center p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(option?.risk || 'medium')}`}>
                            {option?.risk.toUpperCase()}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="p-4 font-medium">Recommended For</td>
                    {comparisonOptions.map((id) => {
                      const option = migrationOptions.find(o => o.id === id);
                      const recommendations = {
                        rehost: 'Quick migration, legacy apps',
                        refactor: 'Performance optimization',
                        revise: 'Balanced approach',
                        rebuild: 'Modern architecture needed',
                        replace: 'Commodity solutions',
                        retire: 'Low-value applications',
                      };
                      return (
                        <td key={id} className="text-center p-4 text-sm">
                          {recommendations[option?.id as keyof typeof recommendations] || '-'}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Detailed View */}
      {selectedOption && !compareMode && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Detailed Analysis: {migrationOptions.find(o => o.id === selectedOption)?.name}</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-gray-600 dark:text-gray-400">{migrationOptions.find(o => o.id === selectedOption)?.description}</p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Key Benefits</h3>
              <ul className="list-disc list-inside space-y-1">
                {migrationOptions.find(o => o.id === selectedOption)?.benefits.map((benefit, idx) => (
                  <li key={idx} className="text-gray-600 dark:text-gray-400">{benefit}</li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Effort</div>
                <div className="text-lg font-bold">{migrationOptions.find(o => o.id === selectedOption)?.effort}/10</div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Timeline</div>
                <div className="text-lg font-bold">{migrationOptions.find(o => o.id === selectedOption)?.timeline}</div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Risk</div>
                <div className="text-lg font-bold capitalize">{migrationOptions.find(o => o.id === selectedOption)?.risk}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Relationship Explorer
 * Interactive exploration of card relationships
 */

import { useState } from 'react';
import { useDependencyChains } from '@/lib/relationship-hooks';
import { cn } from '@/components/governance/shared';
import { Search, Filter, RotateCw } from 'lucide-react';

type RelationshipType = 'all' | 'depends_on' | 'implements' | 'similar_to' | 'conflicts_with';

interface RelationshipExplorerProps {
  cardId: string;
}

export function RelationshipExplorer({ cardId }: RelationshipExplorerProps) {
  const [selectedType, setSelectedType] = useState<RelationshipType>('all');
  const [maxDepth, setMaxDepth] = useState(3);
  const [view, setView] = useState<'tree' | 'graph'>('tree');

  const { data: chain, isLoading, refetch } = useDependencyChains(cardId, maxDepth);

  const relationshipTypes = [
    { value: 'all' as const, label: 'All Types', color: 'bg-slate-500' },
    { value: 'depends_on' as const, label: 'Depends On', color: 'bg-indigo-500' },
    { value: 'implements' as const, label: 'Implements', color: 'bg-emerald-500' },
    { value: 'similar_to' as const, label: 'Similar To', color: 'bg-amber-500' },
    { value: 'conflicts_with' as const, label: 'Conflicts With', color: 'bg-rose-500' },
  ];

  const selectedTypeConfig = relationshipTypes.find((t) => t.value === selectedType);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-48 mb-4"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Relationship Explorer</h3>
            <p className="text-sm text-slate-500">
              {chain?.nodes.length || 0} cards • {chain?.links.length || 0} relationships
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className={cn(
              'p-2 rounded-lg transition-colors',
              'hover:bg-slate-100 text-slate-600'
            )}
            title="Refresh"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          {/* Relationship Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <div className="flex gap-1">
              {relationshipTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    selectedType === type.value
                      ? 'text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                    selectedType === type.value ? type.color : ''
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Depth Control */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Depth:</span>
            <select
              value={maxDepth}
              onChange={(e) => setMaxDepth(Number(e.target.value))}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={1}>1 level</option>
              <option value={2}>2 levels</option>
              <option value={3}>3 levels</option>
              <option value={4}>4 levels</option>
              <option value={5}>5 levels</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setView('tree')}
              className={cn(
                'px-3 py-1 rounded text-sm font-medium transition-colors',
                view === 'tree'
                  ? 'bg-white text-slate-900 shadow'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Tree
            </button>
            <button
              onClick={() => setView('graph')}
              className={cn(
                'px-3 py-1 rounded text-sm font-medium transition-colors',
                view === 'graph'
                  ? 'bg-white text-slate-900 shadow'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Graph
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {view === 'tree' ? (
          <div className="min-h-[400px] flex items-center justify-center text-slate-500">
            <div className="text-center">
              <p className="text-sm">Tree view visualization</p>
              <p className="text-xs mt-1">Use the ReactFlow graph component for full visualization</p>
            </div>
          </div>
        ) : (
          <div className="min-h-[400px] flex items-center justify-center text-slate-500">
            <div className="text-center">
              <p className="text-sm">Graph view visualization</p>
              <p className="text-xs mt-1">Use the ReactFlow graph component for full visualization</p>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="px-6 pb-6">
        <div className="flex items-center gap-4 text-xs">
          <span className="font-medium text-slate-700">Relationship types:</span>
          {relationshipTypes.slice(1).map((type) => (
            <div key={type.value} className="flex items-center gap-1">
              <div className={cn('w-3 h-3 rounded', type.color)} />
              <span className="text-slate-600">{type.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

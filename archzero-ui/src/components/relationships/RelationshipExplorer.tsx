/**
 * Relationship Explorer
 * Interactive exploration of card relationships
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  Position,
  MarkerType,
} from '@reactflow/core';
import { ReactFlow } from 'reactflow';
import { Background } from '@reactflow/background';
import { Controls } from '@reactflow/controls';
import { MiniMap } from '@reactflow/minimap';
import '@reactflow/core/dist/style.css';
import html2canvas from 'html2canvas';
import { useDependencyChains } from '@/lib/relationship-hooks';
import { cn } from '@/components/governance/shared';
import { Search, Filter, RotateCw, Download } from 'lucide-react';
import type { DependencyNode, DependencyLink } from '@/lib/relationship-hooks';

type RelationshipType = 'all' | 'depends_on' | 'implements' | 'similar_to' | 'conflicts_with' | 'upstream' | 'downstream' | 'peer';
type LifecycleState = 'current' | 'target';

interface RelationshipExplorerProps {
  cardId: string;
  lifecycleState?: 'current' | 'target';
}

// Custom node component for relationship graph
function RelationshipNode({ data }: { data: DependencyNode & { selected?: boolean } }) {
  const getColorByType = (type: string) => {
    const colors: Record<string, string> = {
      BusinessCapability: '#a855f7',
      Objective: '#c084fc',
      Application: '#3b82f6',
      Interface: '#06b6d4',
      ITComponent: '#10b981',
      Platform: '#14b8a6',
      ArchitecturePrinciple: '#6366f1',
      TechnologyStandard: '#8b5cf6',
      ArchitecturePolicy: '#f43f5e',
      Exception: '#f59e0b',
      Initiative: '#ec4899',
      Risk: '#ef4444',
      ComplianceRequirement: '#f97316',
    };
    return colors[type] || '#64748b';
  };

  const color = getColorByType(data.type);
  const isSelected = data.selected || false;

  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg border-2 shadow-lg bg-white min-w-[180px] max-w-[220px]',
        isSelected ? 'border-indigo-500 ring-2 ring-indigo-300' : 'border-slate-300'
      )}
      style={{ borderTopColor: color, borderTopWidth: '4px' }}
    >
      {/* Card type badge */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs font-semibold text-slate-500 uppercase">
          {data.type.replace(/([A-Z])/g, ' $1').trim()}
        </span>
      </div>

      {/* Card name */}
      <h3 className="font-bold text-slate-900 text-sm mb-1 line-clamp-2">
        {data.name}
      </h3>

      {/* Criticality indicator */}
      {data.criticality !== undefined && (
        <div className="mt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Criticality:</span>
            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  data.criticality >= 0.8 ? 'bg-rose-500' :
                  data.criticality >= 0.6 ? 'bg-amber-500' :
                  'bg-emerald-500'
                )}
                style={{ width: `${data.criticality * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-slate-600">
              {Math.round(data.criticality * 100)}
            </span>
          </div>
        </div>
      )}

      {/* Level indicator */}
      <div className="mt-1 text-xs text-slate-400">
        Level: {data.level}
      </div>
    </div>
  );
}

const nodeTypes = {
  relationshipNode: RelationshipNode,
};

export function RelationshipExplorer({ cardId, lifecycleState: propLifecycleState }: RelationshipExplorerProps) {
  const [selectedType, setSelectedType] = useState<RelationshipType>('all');
  const [maxDepth, setMaxDepth] = useState(3);
  const [view, setView] = useState<'tree' | 'graph'>('graph');
  const [searchQuery, setSearchQuery] = useState('');
  const [lifecycleState, setLifecycleState] = useState<LifecycleState>(propLifecycleState || 'current');
  const [showImpactAnalysis, setShowImpactAnalysis] = useState(false);
  const [cardTypeFilter, setCardTypeFilter] = useState<string>('all');
  const [lifecycleFilter, setLifecycleFilter] = useState<string>('all');

  const { data: chain, isLoading, refetch } = useDependencyChains(cardId, maxDepth, lifecycleState);

  // Convert dependency chain to ReactFlow format
  const { initialNodes, initialEdges } = useMemo(() => {
    if (!chain) return { initialNodes: [], initialEdges: [] };

    // Filter by relationship type or direction
    let filteredLinks = chain.links;

    if (selectedType === 'upstream') {
      // Show only relationships where current card is the target (dependencies)
      filteredLinks = chain.links.filter(link => link.target === cardId);
    } else if (selectedType === 'downstream') {
      // Show only relationships where current card is the source (dependents)
      filteredLinks = chain.links.filter(link => link.source === cardId);
    } else if (selectedType === 'peer') {
      // Show bidirectional relationships (both source and target are related to each other)
      const bidirectionalPairs = new Set<string>();
      chain.links.forEach(link => {
        const reverseLink = chain.links.find(l =>
          l.source === link.target && l.target === link.source
        );
        if (reverseLink) {
          bidirectionalPairs.add(link.source);
          bidirectionalPairs.add(link.target);
        }
      });
      filteredLinks = chain.links.filter(link =>
        bidirectionalPairs.has(link.source) || bidirectionalPairs.has(link.target)
      );
    } else if (selectedType !== 'all') {
      // Filter by specific relationship type
      filteredLinks = chain.links.filter(link => link.type === selectedType);
    }

    // Filter by search query
    const filteredNodeIds = new Set<string>();
    if (searchQuery) {
      chain.nodes
        .filter(node => node.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .forEach(node => filteredNodeIds.add(node.id));
    } else {
      chain.nodes.forEach(node => filteredNodeIds.add(node.id));
    }

    // Filter by card type
    let typeFilteredNodeIds = new Set(filteredNodeIds);
    if (cardTypeFilter !== 'all') {
      typeFilteredNodeIds = new Set(
        chain.nodes.filter(node => node.type === cardTypeFilter).map(node => node.id)
      );
    }

    // Filter by lifecycle phase
    let finalFilteredNodeIds = new Set(typeFilteredNodeIds);
    if (lifecycleFilter !== 'all') {
      finalFilteredNodeIds = new Set(
        chain.nodes.filter(node =>
          typeFilteredNodeIds.has(node.id) && node.lifecyclePhase === lifecycleFilter
        ).map(node => node.id)
      );
    }

    // Create nodes
    const nodes: Node[] = chain.nodes
      .filter(node => finalFilteredNodeIds.has(node.id))
      .map((node, index) => {
        // Position nodes in a tree layout based on level
        const level = node.level || 0;
        const nodesAtLevel = chain.nodes.filter(n => (n.level || 0) === level).length;
        const positionInLevel = chain.nodes
          .filter(n => (n.level || 0) === level)
          .findIndex(n => n.id === node.id);

        const x = (positionInLevel - nodesAtLevel / 2) * 300;
        const y = level * 200;

        return {
          id: node.id,
          type: 'relationshipNode',
          position: { x, y },
          data: node,
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        };
      });

    // Create edges
    const edges: Edge[] = filteredLinks
      .filter(link => filteredNodeIds.has(link.source) && filteredNodeIds.has(link.target))
      .map((link, index) => {
        const getEdgeColor = (type: string) => {
          const colors: Record<string, string> = {
            depends_on: '#6366f1',
            implements: '#10b981',
            similar_to: '#f59e0b',
            conflicts_with: '#ef4444',
          };
          return colors[type] || '#64748b';
        };

        const color = getEdgeColor(link.type);
        const strength = link.strength || 0.5;

        return {
          id: `${link.source}-${link.target}`,
          source: link.source,
          target: link.target,
          type: 'smoothstep',
          animated: strength < 0.5,
          style: {
            stroke: color,
            strokeWidth: Math.max(1, strength * 4),
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color,
          },
          label: link.type,
          labelStyle: {
            fontSize: 10,
            fontWeight: 600,
          },
          labelBgStyle: {
            fill: 'white',
            fillOpacity: 0.8,
          },
        };
      });

    return { initialNodes: nodes, initialEdges: edges };
  }, [chain, selectedType, searchQuery, cardTypeFilter, lifecycleFilter]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes and edges when data changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const relationshipTypes = [
    { value: 'all' as const, label: 'All Types', color: 'bg-slate-500' },
    { value: 'upstream' as const, label: 'Upstream', color: 'bg-blue-500' },
    { value: 'downstream' as const, label: 'Downstream', color: 'bg-green-500' },
    { value: 'peer' as const, label: 'Peer', color: 'bg-purple-500' },
    { value: 'depends_on' as const, label: 'Depends On', color: 'bg-indigo-500' },
    { value: 'implements' as const, label: 'Implements', color: 'bg-emerald-500' },
    { value: 'similar_to' as const, label: 'Similar To', color: 'bg-amber-500' },
    { value: 'conflicts_with' as const, label: 'Conflicts With', color: 'bg-rose-500' },
  ];

  const selectedTypeConfig = relationshipTypes.find((t) => t.value === selectedType);

  // Export functionality - download graph as PNG
  const handleExport = useCallback(async () => {
    try {
      const flowElement = document.querySelector('.react-flow') as HTMLElement;
      if (!flowElement) {
        alert('Could not find graph to export');
        return;
      }

      // Use html2canvas to capture the graph
      const canvasResult = await html2canvas(flowElement, {
        backgroundColor: '#ffffff',
        scale: 2,
      });

      // Download the image
      canvasResult.toBlob((blob: Blob | null) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `relationship-explorer-${cardId}-${new Date().toISOString()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export graph. Please try again.');
    }
  }, [cardId]);

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
    <div className="bg-white rounded-lg shadow" data-testid="relationship-explorer">
      {/* Header */}
      <div className="p-6 border-b" data-testid="relationship-header">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Relationship Explorer</h3>
            <p className="text-sm text-slate-500">
              {chain?.nodes.length || 0} cards • {chain?.links.length || 0} relationships
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              data-testid="relationship-refresh-button"
              className={cn(
                'p-2 rounded-lg transition-colors',
                'hover:bg-slate-100 text-slate-600'
              )}
              title="Refresh"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <button
              onClick={handleExport}
              data-testid="export-graph-btn"
              className={cn(
                'p-2 rounded-lg transition-colors',
                'hover:bg-slate-100 text-slate-600'
              )}
              title="Export as PNG"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Search Input */}
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              data-testid="graph-search"
            />
          </div>

          {/* Relationship Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <div className="flex gap-1">
              {relationshipTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value)}
                  data-testid="relationship-type-filter"
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
              data-testid="relationship-depth-selector"
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={1}>1 level</option>
              <option value={2}>2 levels</option>
              <option value={3}>3 levels</option>
              <option value={4}>4 levels</option>
              <option value={5}>5 levels</option>
            </select>
          </div>

          {/* Card Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Card Type:</span>
            <select
              value={cardTypeFilter}
              onChange={(e) => setCardTypeFilter(e.target.value)}
              data-testid="card-type-filter"
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Types</option>
              <option value="BusinessCapability">Business Capability</option>
              <option value="Objective">Objective</option>
              <option value="Application">Application</option>
              <option value="Interface">Interface</option>
              <option value="ITComponent">IT Component</option>
              <option value="Platform">Platform</option>
              <option value="ArchitecturePrinciple">Architecture Principle</option>
              <option value="TechnologyStandard">Technology Standard</option>
              <option value="ArchitecturePolicy">Architecture Policy</option>
              <option value="Exception">Exception</option>
              <option value="Initiative">Initiative</option>
              <option value="Risk">Risk</option>
              <option value="ComplianceRequirement">Compliance Requirement</option>
            </select>
          </div>

          {/* Lifecycle Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Lifecycle:</span>
            <select
              value={lifecycleFilter}
              onChange={(e) => setLifecycleFilter(e.target.value)}
              data-testid="lifecycle-filter"
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Phases</option>
              <option value="Discovery">Discovery</option>
              <option value="Strategy">Strategy</option>
              <option value="Planning">Planning</option>
              <option value="Development">Development</option>
              <option value="Testing">Testing</option>
              <option value="Active">Active</option>
              <option value="Decommissioned">Decommissioned</option>
              <option value="Retired">Retired</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setView('tree')}
              data-testid="graph-layout-selector"
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
              data-testid="graph-layout-selector"
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

          {/* State Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">State:</span>
            <select
              value={lifecycleState}
              onChange={(e) => setLifecycleState(e.target.value as LifecycleState)}
              data-testid="state-selector"
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="current">Current</option>
              <option value="target">Target</option>
            </select>
          </div>

          {/* Impact Analysis Toggle */}
          <button
            onClick={() => setShowImpactAnalysis(!showImpactAnalysis)}
            data-testid="impact-analysis-tab"
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              showImpactAnalysis
                ? 'bg-indigo-500 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            )}
          >
            Impact Analysis
          </button>
        </div>
      </div>

      {/* Impact Analysis Section */}
      {showImpactAnalysis && (
        <div className="px-6 py-4 border-b bg-slate-50" data-testid="impact-analysis">
          <h4 className="text-sm font-semibold text-slate-900 mb-2">Impact Analysis</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div data-testid="upstream-impact">
              <p className="text-xs text-slate-600 mb-1">Upstream Impact</p>
              <p className="text-sm font-medium text-slate-900">{chain?.nodes.filter(n => (n.level || 0) < 0).length || 0} dependencies</p>
            </div>
            <div data-testid="downstream-impact">
              <p className="text-xs text-slate-600 mb-1">Downstream Impact</p>
              <p className="text-sm font-medium text-slate-900">{chain?.nodes.filter(n => (n.level || 0) > 0).length || 0} dependents</p>
            </div>
          </div>
          <div className="mt-3" data-testid="impact-view">
            <p className="text-xs text-slate-500">Showing impact analysis for {lifecycleState} state</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6" data-testid="relationship-graph-container">
        <div style={{ height: '500px', width: '100%' }} data-testid="relationship-graph">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            className="bg-slate-50"
          >
            <Background />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                const typeColors: Record<string, string> = {
                  BusinessCapability: '#a855f7',
                  Objective: '#c084fc',
                  Application: '#3b82f6',
                  Interface: '#06b6d4',
                  ITComponent: '#10b981',
                  Platform: '#14b8a6',
                  ArchitecturePrinciple: '#6366f1',
                  TechnologyStandard: '#8b5cf6',
                  ArchitecturePolicy: '#f43f5e',
                  Exception: '#f59e0b',
                  Initiative: '#ec4899',
                  Risk: '#ef4444',
                  ComplianceRequirement: '#f97316',
                };
                const data = node.data as DependencyNode;
                return typeColors[data.type] || '#64748b';
              }}
              className="!bg-white !border-slate-200"
            />
          </ReactFlow>
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 pb-6">
        <div className="flex items-center gap-4 text-xs flex-wrap">
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

/**
 * Graph View Component
 * Interactive graph visualization using ReactFlow
 */

import { useState, useCallback, useMemo } from 'react';
import {
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  Panel,
} from '@reactflow/core';
import { ReactFlow } from 'reactflow';
import { Background } from '@reactflow/background';
import { Controls } from '@reactflow/controls';
import { MiniMap } from '@reactflow/minimap';
import '@reactflow/core/dist/style.css';
import { ZoomIn, ZoomOut, Maximize, Filter, Download } from 'lucide-react';
import { GraphNode } from './GraphNode';
import { useGraphData } from './useGraphData';
import type { GraphNodeData, GraphEdgeData, GraphControls } from './types';
import { Position } from '@reactflow/core';
import { cn } from '@/components/governance/shared';

const nodeTypes = {
  cardNode: GraphNode,
};

interface GraphViewProps {
  centerCardId?: string;
  initialDepth?: number;
}

export function GraphView({ centerCardId, initialDepth = 2 }: GraphViewProps) {
  const [controls, setControls] = useState<GraphControls>({
    depth: initialDepth,
    maxDepth: 5,
    showRelationshipTypes: [],
    showCardTypes: [],
    minConfidence: 0.5,
    layout: 'force',
  });

  const { data: graphData, isLoading } = useGraphData({
    centerCardId,
    depth: controls.depth,
    relationshipTypes: controls.showRelationshipTypes,
    cardTypes: controls.showCardTypes,
    minConfidence: controls.minConfidence,
  });

  // Convert API data to ReactFlow format
  const initialNodes = useMemo(() => {
    if (!graphData) return [];

    return graphData.nodes.map((node) => ({
      id: node.id,
      type: 'cardNode',
      position: { x: 0, y: 0 },
      data: node.data,
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    }));
  }, [graphData]);

  const initialEdges = useMemo(() => {
    if (!graphData) return [];

    return graphData.edges.map((edge) => {
      const confidence = edge.data?.confidence ?? 0.5;
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        data: edge.data,
        type: 'smoothstep',
        animated: confidence < 0.7,
        style: {
          stroke: confidence >= 0.8 ? '#10b981' :
                 confidence >= 0.5 ? '#f59e0b' : '#ef4444',
          strokeWidth: Math.max(1, confidence * 3),
        },
      };
    });
  }, [graphData]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading graph...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-slate-50"
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as GraphNodeData;
            return data?.color || '#94a3b8';
          }}
          className="!bg-white !border-slate-200"
        />

        {/* Control Panel */}
        <Panel position="top-left" className="!bg-white !border-slate-200 !shadow-lg !rounded-lg p-4">
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 mb-3">Graph Controls</h3>

              {/* Depth Control */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Depth: {controls.depth}
                </label>
                <input
                  type="range"
                  min="1"
                  max={controls.maxDepth}
                  value={controls.depth}
                  onChange={(e) => setControls({ ...controls, depth: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Confidence Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Min Confidence: {(controls.minConfidence * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={controls.minConfidence}
                  onChange={(e) => setControls({ ...controls, minConfidence: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Layout */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Layout</label>
                <select
                  value={controls.layout}
                  onChange={(e) => setControls({ ...controls, layout: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="force">Force Directed</option>
                  <option value="hierarchical">Hierarchical</option>
                  <option value="circular">Circular</option>
                </select>
              </div>
            </div>

            {/* Stats */}
            <div className="pt-3 border-t border-slate-200">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-slate-50 px-3 py-2 rounded">
                  <p className="text-slate-500">Nodes</p>
                  <p className="font-bold text-slate-900">{nodes.length}</p>
                </div>
                <div className="bg-slate-50 px-3 py-2 rounded">
                  <p className="text-slate-500">Edges</p>
                  <p className="font-bold text-slate-900">{edges.length}</p>
                </div>
              </div>
            </div>
          </div>
        </Panel>

        {/* Export Panel */}
        <Panel position="top-right" className="!bg-white !border-slate-200 !shadow-lg !rounded-lg">
          <div className="flex gap-2">
            <button
              className={cn(
                'p-2 rounded-lg hover:bg-slate-100 transition-colors',
                'text-slate-600 hover:text-slate-900'
              )}
              title="Export as PNG"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

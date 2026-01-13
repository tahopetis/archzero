/**
 * Dependency Chain Visualization
 * Show upstream and downstream dependencies
 */

import type { DependencyChain, DependencyNode, DependencyLink } from '@/lib/relationship-hooks';
import { cn } from '@/components/governance/shared';
import { ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface DependencyChainProps {
  chain: DependencyChain;
  selectedNodeId?: string;
  onNodeClick?: (nodeId: string) => void;
}

export function DependencyChainVisualization({
  chain,
  selectedNodeId,
  onNodeClick,
}: DependencyChainProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set([chain.nodes[0]?.id]));

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const getNodeChildren = (nodeId: string): DependencyLink[] => {
    return chain.links.filter((link) => link.source === nodeId);
  };

  const renderNode = (node: DependencyNode, depth: number = 0) => {
    const children = getNodeChildren(node.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNodeId === node.id;
    const indent = depth * 24;

    return (
      <div key={node.id} className="select-none">
        <div
          className={cn(
            'flex items-center gap-2 py-2 px-3 rounded-lg transition-colors cursor-pointer',
            'hover:bg-slate-100',
            isSelected && 'bg-indigo-100 border border-indigo-300',
            depth === 0 && 'font-semibold'
          )}
          style={{ marginLeft: `${indent}px` }}
          onClick={() => {
            onNodeClick?.(node.id);
            if (hasChildren) {
              toggleNode(node.id);
            }
          }}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              className="p-1 hover:bg-slate-200 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-500" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-6" />}
          <div
            className={cn(
              'w-3 h-3 rounded-full',
              node.criticality >= 80 && 'bg-rose-500',
              node.criticality >= 60 && node.criticality < 80 && 'bg-amber-500',
              node.criticality < 60 && 'bg-emerald-500'
            )}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm">{node.name}</span>
              <span className="px-2 py-0.5 text-xs bg-slate-200 text-slate-700 rounded">
                {node.type}
              </span>
            </div>
          </div>
          {node.criticality >= 80 && (
            <AlertTriangle className="w-4 h-4 text-rose-600" aria-label="High criticality" />
          )}
        </div>

        {isExpanded && hasChildren && (
          <div>
            {children.map((link) => {
              const childNode = chain.nodes.find((n) => n.id === link.target);
              if (!childNode) return null;
              return <div key={link.target}>{renderNode(childNode, depth + 1)}</div>;
            })}
          </div>
        )}
      </div>
    );
  };

  if (!chain.nodes || chain.nodes.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        No dependencies found
      </div>
    );
  }

  const rootNode = chain.nodes[0];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Dependency Chain</h3>
        <p className="text-sm text-slate-500">
          Showing {chain.nodes.length} cards with {chain.links.length} relationships
        </p>
      </div>
      <div className="border-t pt-4">
        {renderNode(rootNode)}
      </div>
    </div>
  );
}

/**
 * Custom Graph Node Component
 */

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@reactflow/core';
import { type GraphNodeData } from './types';
import { cn } from '@/components/governance/shared';

export const GraphNode = memo(({ data, selected }: NodeProps<GraphNodeData>) => {
  const getColorByType = (type: string) => {
    const colors: Record<string, string> = {
      BusinessCapability: 'bg-purple-500',
      Objective: 'bg-purple-400',
      Application: 'bg-blue-500',
      Interface: 'bg-cyan-500',
      ITComponent: 'bg-emerald-500',
      Platform: 'bg-teal-500',
      ArchitecturePrinciple: 'bg-indigo-500',
      TechnologyStandard: 'bg-violet-500',
      ArchitecturePolicy: 'bg-rose-500',
      Exception: 'bg-amber-500',
      Initiative: 'bg-pink-500',
      Risk: 'bg-red-500',
      ComplianceRequirement: 'bg-orange-500',
    };
    return colors[type] || 'bg-slate-500';
  };

  const color = getColorByType(data.type);

  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg border-2 shadow-lg bg-white min-w-[200px] max-w-[250px]',
        selected ? 'border-indigo-500 ring-2 ring-indigo-300' : 'border-slate-300'
      )}
    >
      {/* Input handle */}
      <Handle type="target" position={Position.Top} className="!bg-slate-400" />

      {/* Card header */}
      <div className="flex items-center gap-2 mb-2">
        <div className={cn('w-3 h-3 rounded-full', color)} />
        <span className="text-xs font-semibold text-slate-500 uppercase">
          {data.type.replace(/([A-Z])/g, ' $1').trim()}
        </span>
      </div>

      {/* Card name */}
      <h3 className="font-bold text-slate-900 text-sm mb-1 line-clamp-2">
        {data.name}
      </h3>

      {/* Quality score badge */}
      {data.qualityScore !== undefined && (
        <div className="mt-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  data.qualityScore >= 0.8 ? 'bg-emerald-500' :
                  data.qualityScore >= 0.6 ? 'bg-amber-500' :
                  'bg-rose-500'
                )}
                style={{ width: `${data.qualityScore * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-slate-600">
              {Math.round(data.qualityScore * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Tags */}
      {data.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {data.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded"
            >
              {tag}
            </span>
          ))}
          {data.tags.length > 3 && (
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
              +{data.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Output handle */}
      <Handle type="source" position={Position.Bottom} className="!bg-slate-400" />
    </div>
  );
});

GraphNode.displayName = 'GraphNode';

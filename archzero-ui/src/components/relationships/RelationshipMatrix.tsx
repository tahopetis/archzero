/**
 * Relationship Matrix Visualization
 * Show relationships between cards in a matrix format
 */

import type { MatrixCell } from '@/lib/relationship-hooks';
import { cn } from '@/components/governance/shared';
import { useState } from 'react';

interface RelationshipMatrixProps {
  nodes: { id: string; name: string }[];
  cells: MatrixCell[];
  onCellClick?: (cell: MatrixCell) => void;
}

export function RelationshipMatrix({ nodes, cells, onCellClick }: RelationshipMatrixProps) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  // Create a map for quick lookup
  const cellMap = new Map<string, MatrixCell>();
  cells.forEach((cell) => {
    const key = `${cell.source}-${cell.target}`;
    cellMap.set(key, cell);
  });

  const getCell = (sourceId: string, targetId: string): MatrixCell | undefined => {
    const key = `${sourceId}-${targetId}`;
    return cellMap.get(key);
  };

  const getCellColor = (value: number, type: string): string => {
    if (value === 0) return 'bg-slate-50';

    const intensity = Math.min(value / 10, 1);

    switch (type) {
      case 'depends_on':
        return `rgba(99, 102, 241, ${intensity})`; // Indigo
      case 'implements':
        return `rgba(16, 185, 129, ${intensity})`; // Emerald
      case 'similar_to':
        return `rgba(245, 158, 11, ${intensity})`; // Amber
      case 'conflicts_with':
        return `rgba(239, 68, 68, ${intensity})`; // Red
      default:
        return `rgba(107, 114, 128, ${intensity})`; // Gray
    }
  };

  if (nodes.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        No data to display
      </div>
    );
  }

  const maxSize = 20; // Max nodes to display
  const displayNodes = nodes.slice(0, maxSize);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Relationship Matrix</h3>
        <p className="text-sm text-slate-500">
          {nodes.length > maxSize && `Showing ${maxSize} of ${nodes.length} cards • `}
          Click a cell to view details
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-xs font-medium text-slate-500 bg-slate-50"></th>
              {displayNodes.map((node) => (
                <th
                  key={node.id}
                  className="p-2 text-xs font-medium text-slate-500 bg-slate-50 text-center"
                  style={{ minWidth: '60px', maxWidth: '60px' }}
                >
                  <div className="transform -rotate-45 origin-left translate-x-2">
                    {node.name.slice(0, 10)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayNodes.map((sourceNode) => (
              <tr key={sourceNode.id}>
                <td className="p-2 text-xs font-medium text-slate-700 bg-slate-50 whitespace-nowrap">
                  {sourceNode.name}
                </td>
                {displayNodes.map((targetNode) => {
                  const cell = getCell(sourceNode.id, targetNode.id);
                  const isHovered = hoveredCell === `${sourceNode.id}-${targetNode.id}`;
                  const hasRelation = cell && cell.value > 0;

                  return (
                    <td
                      key={targetNode.id}
                      onMouseEnter={() => setHoveredCell(`${sourceNode.id}-${targetNode.id}`)}
                      onMouseLeave={() => setHoveredCell(null)}
                      onClick={() => cell && onCellClick?.(cell)}
                      className={cn(
                        'p-1 border border-slate-100 cursor-pointer transition-all',
                        isHovered && 'ring-2 ring-indigo-500 ring-inset'
                      )}
                      style={{
                        backgroundColor: hasRelation
                          ? getCellColor(cell.value, cell.type)
                          : undefined,
                        minWidth: '60px',
                        maxWidth: '60px',
                      }}
                    >
                      {hasRelation && (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-xs font-bold text-white">
                            {cell.value}
                          </span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center gap-4 text-xs">
          <span className="font-medium text-slate-700">Relationship types:</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-indigo-500" />
            <span className="text-slate-600">Depends on</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-emerald-500" />
            <span className="text-slate-600">Implements</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-amber-500" />
            <span className="text-slate-600">Similar to</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-rose-500" />
            <span className="text-slate-600">Conflicts</span>
          </div>
        </div>
      </div>
    </div>
  );
}

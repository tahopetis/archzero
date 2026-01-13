/**
 * Faceted Search Component
 * Display search facets and allow filtering by them
 */

import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/components/governance/shared';
import { useState } from 'react';

export interface Facet {
  name: string;
  field: string;
  values: {
    value: string;
    count: number;
  }[];
}

interface FacetedSearchProps {
  facets: Facet[];
  selectedFacets: Record<string, string[]>;
  onFacetChange: (field: string, value: string) => void;
}

export function FacetedSearch({ facets, selectedFacets, onFacetChange }: FacetedSearchProps) {
  const [expandedFacets, setExpandedFacets] = useState<Set<string>>(new Set());

  const toggleFacet = (facetName: string) => {
    setExpandedFacets((prev) => {
      const next = new Set(prev);
      if (next.has(facetName)) {
        next.delete(facetName);
      } else {
        next.add(facetName);
      }
      return next;
    });
  };

  const getSelectedCount = (field: string) => {
    return selectedFacets[field]?.length || 0;
  };

  if (facets.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        No facets available. Perform a search to see filters.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {facets.map((facet) => {
        const isExpanded = expandedFacets.has(facet.name);
        const selectedCount = getSelectedCount(facet.field);

        return (
          <div key={facet.field} className="border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleFacet(facet.name)}
              className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <span className="font-medium text-slate-900">
                {facet.name}
                {selectedCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-indigo-600 text-white rounded-full">
                    {selectedCount}
                  </span>
                )}
              </span>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {isExpanded && (
              <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                {facet.values.map((value) => {
                  const isSelected = selectedFacets[facet.field]?.includes(value.value);

                  return (
                    <label
                      key={value.value}
                      className="flex items-center justify-between gap-2 text-sm cursor-pointer hover:bg-slate-50 p-1 rounded"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onFacetChange(facet.field, value.value)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className={cn('truncate', isSelected && 'font-medium text-indigo-700')}>
                          {value.value}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 flex-shrink-0">{value.count}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

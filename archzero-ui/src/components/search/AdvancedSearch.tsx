/**
 * Advanced Search Component
 * Full-text search with filters and faceted search
 */

import { useState } from 'react';
import { Filter, SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/components/governance/shared';
import { CardType, LifecyclePhase } from '@/types';

interface AdvancedSearchProps {
  onSearch: (params: any) => void;
  isLoading?: boolean;
}

export function AdvancedSearch({ onSearch, isLoading }: AdvancedSearchProps) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: [] as string[],
    lifecycle_phase: [] as string[],
    quality_score_min: '',
    quality_score_max: '',
    tags: [] as string[],
    owner_id: '',
    date_from: '',
    date_to: '',
  });

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleMultiSelectToggle = (key: string, value: string) => {
    setFilters((prev) => {
      const currentArray = prev[key as keyof typeof prev] as string[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter((v) => v !== value)
        : [...currentArray, value];
      return { ...prev, [key]: newArray };
    });
  };

  const handleSearch = () => {
    onSearch({
      query,
      filters: Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => {
          if (Array.isArray(v)) return v.length > 0;
          return v !== '';
        })
      ),
    });
  };

  const handleClearFilters = () => {
    setFilters({
      type: [],
      lifecycle_phase: [],
      quality_score_min: '',
      quality_score_max: '',
      tags: [],
      owner_id: '',
      date_from: '',
      date_to: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some((v) => {
    if (Array.isArray(v)) return v.length > 0;
    return v !== '';
  });

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Main Search Bar */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Advanced search..."
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
              showFilters || hasActiveFilters
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-indigo-600 text-white rounded-full">
                {Object.values(filters).filter((v) => {
                  if (Array.isArray(v)) return v.length > 0;
                  return v !== '';
                }).length}
              </span>
            )}
          </button>
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className={cn(
              'px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="p-4 border-b bg-slate-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Filters</h3>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Card Type
              </label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {Object.values(CardType).map((type) => (
                  <label key={type} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filters.type.includes(type)}
                      onChange={() => handleMultiSelectToggle('type', type)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>

            {/* Lifecycle Phase */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Lifecycle Phase
              </label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {Object.values(LifecyclePhase).map((phase) => (
                  <label key={phase} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filters.lifecycle_phase.includes(phase)}
                      onChange={() => handleMultiSelectToggle('lifecycle_phase', phase)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    {phase}
                  </label>
                ))}
              </div>
            </div>

            {/* Quality Score Range */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Quality Score
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.quality_score_min}
                  onChange={(e) => handleFilterChange('quality_score_min', e.target.value)}
                  placeholder="Min"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-slate-500">-</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.quality_score_max}
                  onChange={(e) => handleFilterChange('quality_score_max', e.target.value)}
                  placeholder="Max"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Date Range
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-slate-500">-</span>
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Owner */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Owner ID
              </label>
              <input
                type="text"
                value={filters.owner_id}
                onChange={(e) => handleFilterChange('owner_id', e.target.value)}
                placeholder="Enter owner ID"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tags
              </label>
              <input
                type="text"
                value={filters.tags.join(', ')}
                onChange={(e) =>
                  handleFilterChange('tags', e.target.value.split(',').map((t) => t.trim()).filter(Boolean))
                }
                placeholder="comma-separated tags"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Active Filters */}
      {hasActiveFilters && !showFilters && (
        <div className="px-4 py-2 bg-slate-50 flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-700">Active filters:</span>
          {filters.type.map((t) => (
            <span
              key={t}
              className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full flex items-center gap-1"
            >
              {t}
              <button onClick={() => handleMultiSelectToggle('type', t)} className="hover:text-indigo-900">
                ×
              </button>
            </span>
          ))}
          {filters.lifecycle_phase.map((p) => (
            <span
              key={p}
              className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full flex items-center gap-1"
            >
              {p}
              <button onClick={() => handleMultiSelectToggle('lifecycle_phase', p)} className="hover:text-indigo-900">
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

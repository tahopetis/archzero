/**
 * Global Search Dialog (Cmd+K)
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, File, Clock, Command } from 'lucide-react';
import { cn } from '@/components/governance/shared';
import { useGlobalSearch, useSearchSuggestions, useSavedSearches } from '@/lib/search-hooks';
import { debounce } from 'lodash';

interface GlobalSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchDialog({ isOpen, onClose }: GlobalSearchDialogProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState<'all' | 'cards' | 'principles' | 'standards' | 'policies' | 'exceptions' | 'initiatives' | 'risks' | 'compliance'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { data: searchResults, isLoading } = useGlobalSearch({ query, domain });
  const { data: suggestions } = useSearchSuggestions(query);
  const { data: savedSearches } = useSavedSearches();

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, (searchResults?.results.length || 0) - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter' && searchResults?.results[selectedIndex]) {
        const result = searchResults.results[selectedIndex];
        navigate(result.url);
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, navigate, searchResults, selectedIndex]);

  // Reset search when dialog opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const results = searchResults?.results || [];
  const hasResults = results.length > 0;
  const hasQuery = query.length >= 2;

  const domainOptions = [
    { value: 'all' as const, label: 'All' },
    { value: 'cards' as const, label: 'Cards' },
    { value: 'principles' as const, label: 'Principles' },
    { value: 'standards' as const, label: 'Standards' },
    { value: 'policies' as const, label: 'Policies' },
    { value: 'exceptions' as const, label: 'Exceptions' },
    { value: 'initiatives' as const, label: 'Initiatives' },
    { value: 'risks' as const, label: 'Risks' },
    { value: 'compliance' as const, label: 'Compliance' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-[20vh] z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b">
          <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search..."
            autoFocus
            className="flex-1 text-lg outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Domain Filter */}
        {hasQuery && (
          <div className="flex items-center gap-2 px-4 py-2 border-b bg-slate-50 overflow-x-auto">
            {domainOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setDomain(option.value)}
                className={cn(
                  'px-3 py-1 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
                  domain === option.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading && hasQuery && (
            <div className="p-8 text-center text-slate-500">Searching...</div>
          )}

          {!isLoading && !hasResults && hasQuery && (
            <div className="p-8 text-center">
              <p className="text-slate-500">No results found for "{query}"</p>
            </div>
          )}

          {!hasQuery && (
            <div className="p-4">
              {/* Recent Searches / Saved Searches */}
              {savedSearches && savedSearches.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                    <Clock className="w-3 h-3" />
                    Saved Searches
                  </div>
                  {savedSearches.slice(0, 5).map((search) => (
                    <button
                      key={search.id}
                      onClick={() => {
                        setQuery(search.query);
                        setDomain(search.domain as any);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg transition-colors text-left"
                    >
                      <Clock className="w-4 h-4 text-slate-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{search.name}</p>
                        <p className="text-xs text-slate-500 truncate">{search.query}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Suggestions */}
              {suggestions && suggestions.length > 0 && query.length > 0 && query.length < 2 && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                    <Search className="w-3 h-3" />
                    Suggestions
                  </div>
                  {suggestions.slice(0, 5).map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(suggestion)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg transition-colors text-left"
                    >
                      <Search className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-700">{suggestion}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Keyboard Shortcuts Hint */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 bg-slate-100 rounded">↑↓</kbd>
                    <span>navigate</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 bg-slate-100 rounded">↵</kbd>
                    <span>select</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 bg-slate-100 rounded">esc</kbd>
                    <span>close</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {hasResults && (
            <div>
              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => {
                    navigate(result.url);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    'w-full flex items-start gap-3 px-4 py-3 transition-colors text-left',
                    index === selectedIndex ? 'bg-indigo-50' : 'hover:bg-slate-50'
                  )}
                >
                  <File className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-900 truncate">{result.title}</p>
                      <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded flex-shrink-0">
                        {result.domain}
                      </span>
                    </div>
                    {result.description && (
                      <p className="text-sm text-slate-500 truncate mt-0.5">{result.description}</p>
                    )}
                    {result.highlights && result.highlights.length > 0 && (
                      <div className="mt-1">
                        {result.highlights.slice(0, 2).map((highlight, hi) => (
                          <p key={hi} className="text-xs text-slate-400 truncate">
                            {highlight.fragments.join(' ... ')}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

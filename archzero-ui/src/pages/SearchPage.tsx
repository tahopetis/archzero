import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  X,
  Clock,
  Bookmark,
  Star,
  FileText,
  Box,
  Network,
  Settings,
  Shield,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Tag,
  SlidersHorizontal,
} from 'lucide-react';

// Types
type SearchResultType =
  | 'card'
  | 'governance'
  | 'relationship'
  | 'initiative'
  | 'risk'
  | 'compliance'
  | 'policy'
  | 'standard'
  | 'principle';

type SearchResult = {
  id: string;
  type: SearchResultType;
  title: string;
  description: string;
  tags: string[];
  relevance: number;
  modifiedAt: string;
  url: string;
};

type SearchFilter = {
  type: SearchResultType[];
  tags: string[];
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
  sortBy: 'relevance' | 'date' | 'name';
};

type SavedSearch = {
  id: string;
  name: string;
  query: string;
  filters: SearchFilter;
  createdAt: string;
};

// Mock data
const mockSearchResults: SearchResult[] = [
  {
    id: '1',
    type: 'card',
    title: 'Customer Relationship Management System',
    description: 'Central CRM platform managing customer data, sales pipelines, and support tickets. Core business application for sales and customer service teams.',
    tags: ['salesforce', 'crm', 'critical', 'cloud'],
    relevance: 95,
    modifiedAt: '2026-01-10',
    url: '/cards/1',
  },
  {
    id: '2',
    type: 'governance',
    title: 'Data Privacy Principle',
    description: 'All customer data must be encrypted at rest and in transit. Privacy by design principles must be applied to all systems processing personal information.',
    tags: ['privacy', 'security', 'gdpr', 'compliance'],
    relevance: 88,
    modifiedAt: '2026-01-08',
    url: '/governance/principles/1',
  },
  {
    id: '3',
    type: 'initiative',
    title: 'Cloud Migration 2026',
    description: 'Strategic initiative to migrate all on-premise applications to cloud infrastructure. Target completion Q4 2026.',
    tags: ['cloud', 'migration', 'strategic', 'infrastructure'],
    relevance: 85,
    modifiedAt: '2026-01-12',
    url: '/governance/initiatives/1',
  },
  {
    id: '4',
    type: 'risk',
    title: 'Legacy System Dependency',
    description: 'Critical business processes depend on unsupported legacy systems with no vendor support. High risk of system failure and security vulnerabilities.',
    tags: ['legacy', 'high-risk', 'technical-debt'],
    relevance: 82,
    modifiedAt: '2026-01-05',
    url: '/governance/risks/1',
  },
  {
    id: '5',
    type: 'card',
    title: 'Enterprise Service Bus',
    description: 'Integration middleware enabling communication between disparate systems. Handles message transformation, routing, and protocol translation.',
    tags: ['integration', 'middleware', 'api', 'esb'],
    relevance: 78,
    modifiedAt: '2026-01-09',
    url: '/cards/2',
  },
  {
    id: '6',
    type: 'policy',
    title: 'Application Security Policy',
    description: 'Mandatory security standards for all applications. Includes requirements for authentication, authorization, encryption, and vulnerability testing.',
    tags: ['security', 'policy', 'standards', 'mandatory'],
    relevance: 75,
    modifiedAt: '2026-01-07',
    url: '/governance/policies/1',
  },
  {
    id: '7',
    type: 'relationship',
    title: 'Salesforce to ERP Integration',
    description: 'Real-time data synchronization between Salesforce CRM and SAP ERP. Customer and order data flow bidirectionally.',
    tags: ['integration', 'salesforce', 'sap', 'api'],
    relevance: 72,
    modifiedAt: '2026-01-11',
    url: '/relationships?source=1&target=2',
  },
  {
    id: '8',
    type: 'standard',
    title: 'RESTful API Design Standards',
    description: 'Technical standards for designing and implementing REST APIs. Includes naming conventions, error handling, and versioning guidelines.',
    tags: ['api', 'rest', 'standards', 'development'],
    relevance: 70,
    modifiedAt: '2026-01-06',
    url: '/governance/standards/1',
  },
  {
    id: '9',
    type: 'compliance',
    title: 'SOC 2 Type II Certification',
    description: 'Annual compliance assessment for security, availability, and confidentiality controls. Maintains SOC 2 Type II certification status.',
    tags: ['compliance', 'security', 'audit', 'soc2'],
    relevance: 68,
    modifiedAt: '2026-01-04',
    url: '/governance/compliance/1',
  },
  {
    id: '10',
    type: 'card',
    title: 'Data Analytics Platform',
    description: 'Business intelligence and analytics platform providing reporting, dashboards, and data visualization capabilities.',
    tags: ['analytics', 'bi', 'reporting', 'data'],
    relevance: 65,
    modifiedAt: '2026-01-10',
    url: '/cards/3',
  },
  {
    id: '11',
    type: 'principle',
    title: 'Interoperability First',
    description: 'Systems must be designed with open standards and well-defined interfaces. Avoid vendor lock-in through proprietary technologies.',
    tags: ['interoperability', 'standards', 'architecture'],
    relevance: 62,
    modifiedAt: '2026-01-03',
    url: '/governance/principles/2',
  },
  {
    id: '12',
    type: 'risk',
    title: 'Single Point of Failure',
    description: 'Multiple critical services depend on single database instance. No high availability or failover mechanism implemented.',
    tags: ['high-risk', 'availability', 'database'],
    relevance: 60,
    modifiedAt: '2026-01-02',
    url: '/governance/risks/2',
  },
];

const availableTags = [
  'security',
  'cloud',
  'api',
  'integration',
  'compliance',
  'critical',
  'legacy',
  'strategic',
  'analytics',
  'infrastructure',
];

// Type icon mapping
const getTypeIcon = (type: SearchResultType) => {
  const iconMap = {
    card: Box,
    governance: Shield,
    relationship: Network,
    initiative: TrendingUp,
    risk: AlertTriangle,
    compliance: FileText,
    policy: FileText,
    standard: Settings,
    principle: Star,
  };
  return iconMap[type] || FileText;
};

// Type color mapping
const getTypeColor = (type: SearchResultType) => {
  const colorMap = {
    card: 'bg-blue-100 text-blue-800',
    governance: 'bg-purple-100 text-purple-800',
    relationship: 'bg-green-100 text-green-800',
    initiative: 'bg-indigo-100 text-indigo-800',
    risk: 'bg-red-100 text-red-800',
    compliance: 'bg-yellow-100 text-yellow-800',
    policy: 'bg-orange-100 text-orange-800',
    standard: 'bg-cyan-100 text-cyan-800',
    principle: 'bg-pink-100 text-pink-800',
  };
  return colorMap[type] || 'bg-gray-100 text-gray-800';
};

export function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse URL params
  const initialQuery = searchParams.get('q') || '';
  const initialType = searchParams.get('type') as SearchResultType | null;
  const initialTags = searchParams.get('tags')?.split(',').filter(Boolean) || [];

  // State
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilter>({
    type: initialType ? [initialType] : [],
    tags: initialTags,
    dateRange: 'all',
    sortBy: 'relevance',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 10;

  // Search history (mock - would come from localStorage in production)
  const [searchHistory, setSearchHistory] = useState<Array<{ query: string; timestamp: string }>>([
    { query: 'security', timestamp: '2026-01-13T10:30:00' },
    { query: 'cloud migration', timestamp: '2026-01-12T15:45:00' },
    { query: 'API integration', timestamp: '2026-01-11T09:15:00' },
  ]);

  // Saved searches (mock)
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([
    {
      id: '1',
      name: 'Critical Systems',
      query: 'critical',
      filters: { type: ['card'], tags: ['critical'], dateRange: 'all', sortBy: 'relevance' },
      createdAt: '2026-01-10',
    },
    {
      id: '2',
      name: 'Security Risks',
      query: 'security',
      filters: { type: ['risk'], tags: ['security'], dateRange: 'month', sortBy: 'date' },
      createdAt: '2026-01-08',
    },
  ]);

  // Update URL params when search changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (filters.type.length > 0) params.set('type', filters.type[0]);
    if (filters.tags.length > 0) params.set('tags', filters.tags.join(','));
    setSearchParams(params);
  }, [query, filters, setSearchParams]);

  // Filter and sort results
  const filteredResults = useMemo(() => {
    let results = mockSearchResults;

    // Apply query filter
    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(
        (r) =>
          r.title.toLowerCase().includes(lowerQuery) ||
          r.description.toLowerCase().includes(lowerQuery) ||
          r.tags.some((t) => t.toLowerCase().includes(lowerQuery))
      );
    }

    // Apply type filter
    if (filters.type.length > 0) {
      results = results.filter((r) => filters.type.includes(r.type));
    }

    // Apply tag filter
    if (filters.tags.length > 0) {
      results = results.filter((r) => filters.tags.some((t) => r.tags.includes(t)));
    }

    // Apply date filter (mock logic)
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      switch (filters.dateRange) {
        case 'today':
          cutoff.setDate(now.getDate() - 1);
          break;
        case 'week':
          cutoff.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoff.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          cutoff.setFullYear(now.getFullYear() - 1);
          break;
      }
      results = results.filter((r) => new Date(r.modifiedAt) >= cutoff);
    }

    // Sort
    results = [...results].sort((a, b) => {
      switch (filters.sortBy) {
        case 'date':
          return new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime();
        case 'name':
          return a.title.localeCompare(b.title);
        case 'relevance':
        default:
          return b.relevance - a.relevance;
      }
    });

    return results;
  }, [query, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredResults.length / resultsPerPage);
  const paginatedResults = filteredResults.slice(
    (currentPage - 1) * resultsPerPage,
    currentPage * resultsPerPage
  );

  // Handlers
  const handleSearch = (value: string) => {
    setQuery(value);
    setCurrentPage(1);

    // Add to history
    if (value.trim()) {
      const newHistory = [
        { query: value, timestamp: new Date().toISOString() },
        ...searchHistory.filter((h) => h.query !== value),
      ].slice(0, 10);
      setSearchHistory(newHistory);
    }
  };

  const handleTypeToggle = (type: SearchResultType) => {
    setFilters((prev) => ({
      ...prev,
      type: prev.type.includes(type)
        ? prev.type.filter((t) => t !== type)
        : [...prev.type, type],
    }));
    setCurrentPage(1);
  };

  const handleTagToggle = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      type: [],
      tags: [],
      dateRange: 'all',
      sortBy: 'relevance',
    });
    setCurrentPage(1);
  };

  const handleSaveSearch = () => {
    const newSaved: SavedSearch = {
      id: Date.now().toString(),
      name: query || 'Untitled Search',
      query,
      filters: { ...filters },
      createdAt: new Date().toISOString().split('T')[0],
    };
    setSavedSearches((prev) => [...prev, newSaved]);
  };

  const handleLoadSaved = (saved: SavedSearch) => {
    setQuery(saved.query);
    setFilters(saved.filters);
    setShowSaved(false);
    setCurrentPage(1);
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.url);
  };

  const hasActiveFilters =
    filters.type.length > 0 ||
    filters.tags.length > 0 ||
    filters.dateRange !== 'all' ||
    filters.sortBy !== 'relevance';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="search-page-title">
          Search
        </h1>
        <p className="text-gray-600">
          Search across cards, governance items, relationships, and more
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
            data-testid="search-icon"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search for anything..."
            className="w-full pl-12 pr-32 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
            data-testid="search-input"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 hover:bg-gray-100 rounded-md transition"
              data-testid="search-history-button"
              title="Search history"
            >
              <Clock size={18} className="text-gray-500" />
            </button>
            <button
              onClick={() => setShowSaved(!showSaved)}
              className="p-2 hover:bg-gray-100 rounded-md transition"
              data-testid="saved-searches-button"
              title="Saved searches"
            >
              <Bookmark size={18} className="text-gray-500" />
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-md transition ${
                hasActiveFilters ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100'
              }`}
              data-testid="filters-toggle-button"
              title="Toggle filters"
            >
              <SlidersHorizontal size={18} />
            </button>
          </div>
        </div>

        {/* History Dropdown */}
        {showHistory && searchHistory.length > 0 && (
          <div
            className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200"
            data-testid="search-history-dropdown"
          >
            <div className="p-2">
              {searchHistory.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    handleSearch(item.query);
                    setShowHistory(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-md flex items-center gap-3"
                  data-testid={`history-item-${index}`}
                >
                  <Clock size={16} className="text-gray-400" />
                  <span className="flex-1">{item.query}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Saved Searches Dropdown */}
        {showSaved && savedSearches.length > 0 && (
          <div
            className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200"
            data-testid="saved-searches-dropdown"
          >
            <div className="p-2">
              {savedSearches.map((saved) => (
                <button
                  key={saved.id}
                  onClick={() => handleLoadSaved(saved)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-100 rounded-md"
                  data-testid={`saved-search-${saved.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Bookmark size={16} className="text-indigo-500" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{saved.name}</div>
                      <div className="text-sm text-gray-500">{saved.query}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filters Section */}
      {showFilters && (
        <div className="mb-6 bg-white rounded-lg shadow p-6" data-testid="filters-section">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-indigo-600 hover:text-indigo-700"
                data-testid="clear-filters-button"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <div className="flex flex-wrap gap-2" data-testid="type-filters">
              {[
                { value: 'card', label: 'Cards' },
                { value: 'governance', label: 'Governance' },
                { value: 'initiative', label: 'Initiatives' },
                { value: 'risk', label: 'Risks' },
                { value: 'relationship', label: 'Relationships' },
                { value: 'policy', label: 'Policies' },
                { value: 'standard', label: 'Standards' },
                { value: 'principle', label: 'Principles' },
                { value: 'compliance', label: 'Compliance' },
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => handleTypeToggle(type.value as SearchResultType)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    filters.type.includes(type.value as SearchResultType)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  data-testid={`filter-type-${type.value}`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tag Filter */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
            <div className="flex flex-wrap gap-2" data-testid="tag-filters">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    filters.tags.includes(tag)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  data-testid={`filter-tag-${tag}`}
                >
                  <Tag size={14} className="inline mr-1" />
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range & Sort */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    dateRange: e.target.value as SearchFilter['dateRange'],
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                data-testid="date-range-filter"
              >
                <option value="all">All time</option>
                <option value="today">Today</option>
                <option value="week">Past week</option>
                <option value="month">Past month</option>
                <option value="year">Past year</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    sortBy: e.target.value as SearchFilter['sortBy'],
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                data-testid="sort-by-filter"
              >
                <option value="relevance">Relevance</option>
                <option value="date">Date modified</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>

          {/* Save Search Button */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleSaveSearch}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition flex items-center justify-center gap-2"
              data-testid="save-search-button"
            >
              <Bookmark size={18} />
              Save Current Search
            </button>
          </div>
        </div>
      )}

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="mb-4 flex flex-wrap gap-2" data-testid="active-filters">
          {filters.type.map((type) => (
            <button
              key={type}
              onClick={() => handleTypeToggle(type)}
              className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm flex items-center gap-1 hover:bg-indigo-200"
              data-testid={`active-filter-type-${type}`}
            >
              {type}
              <X size={14} />
            </button>
          ))}
          {filters.tags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagToggle(tag)}
              className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm flex items-center gap-1 hover:bg-indigo-200"
              data-testid={`active-filter-tag-${tag}`}
            >
              <Tag size={14} />
              {tag}
              <X size={14} />
            </button>
          ))}
          {filters.dateRange !== 'all' && (
            <button
              onClick={() => setFilters((prev) => ({ ...prev, dateRange: 'all' }))}
              className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm flex items-center gap-1 hover:bg-indigo-200"
              data-testid="active-filter-date-range"
            >
              <Calendar size={14} />
              {filters.dateRange}
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* Results */}
      <div data-testid="search-results">
        {/* Results Header */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600" data-testid="results-count">
            {filteredResults.length} {filteredResults.length === 1 ? 'result' : 'results'}
            {query && ` for "${query}"`}
          </p>
        </div>

        {/* Results List */}
        {paginatedResults.length === 0 ? (
          <div
            className="text-center py-12 bg-white rounded-lg shadow"
            data-testid="no-results"
          >
            <Search size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your search terms or filters
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedResults.map((result) => {
              const TypeIcon = getTypeIcon(result.type);
              return (
                <div
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="bg-white rounded-lg shadow hover:shadow-md transition cursor-pointer p-6"
                  data-testid={`search-result-${result.id}`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-lg ${getTypeColor(result.type)}`}
                      data-testid={`result-type-icon-${result.id}`}
                    >
                      <TypeIcon size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium uppercase ${getTypeColor(
                            result.type
                          )}`}
                          data-testid={`result-type-${result.id}`}
                        >
                          {result.type}
                        </span>
                        <span
                          className="text-xs text-gray-500"
                          data-testid={`result-relevance-${result.id}`}
                        >
                          {result.relevance}% relevant
                        </span>
                      </div>
                      <h3
                        className="text-lg font-semibold text-gray-900 mb-1"
                        data-testid={`result-title-${result.id}`}
                      >
                        {result.title}
                      </h3>
                      <p
                        className="text-gray-600 mb-3 line-clamp-2"
                        data-testid={`result-description-${result.id}`}
                      >
                        {result.description}
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="flex flex-wrap gap-2" data-testid={`result-tags-${result.id}`}>
                          {result.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                            >
                              <Tag size={12} className="inline mr-1" />
                              {tag}
                            </span>
                          ))}
                        </div>
                        <span
                          className="text-xs text-gray-500 ml-auto"
                          data-testid={`result-date-${result.id}`}
                        >
                          Modified {new Date(result.modifiedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2" data-testid="pagination">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="pagination-previous"
            >
              Previous
            </button>
            <div className="flex gap-1" data-testid="pagination-numbers">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 rounded-md ${
                    currentPage === page
                      ? 'bg-indigo-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                  data-testid={`pagination-page-${page}`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="pagination-next"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

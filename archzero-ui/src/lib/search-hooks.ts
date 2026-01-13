/**
 * Search Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface SearchParams {
  query: string;
  domain?: 'all' | 'cards' | 'principles' | 'standards' | 'policies' | 'exceptions' | 'initiatives' | 'risks' | 'compliance';
  filters?: Record<string, any>;
  limit?: number;
}

export interface SearchResult {
  id: string;
  type: string;
  domain: string;
  title: string;
  description: string;
  url: string;
  highlights?: {
    field: string;
    fragments: string[];
  }[];
  score: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  facets: {
    domain: Record<string, number>;
    type: Record<string, number>;
  };
}

export function useGlobalSearch(params: SearchParams) {
  return useQuery<SearchResponse>({
    queryKey: ['search', 'global', params],
    queryFn: async () => {
      const { data } = await api.post<SearchResponse>('/api/v1/search/global', params);
      return data;
    },
    enabled: params.query.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useSearchSuggestions(query: string) {
  return useQuery<string[]>({
    queryKey: ['search', 'suggestions', query],
    queryFn: async () => {
      const { data } = await api.get<string[]>(`/api/v1/search/suggestions?q=${encodeURIComponent(query)}`);
      return data;
    },
    enabled: query.length >= 2,
  });
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  domain: string;
  filters: Record<string, any>;
  created_at: string;
}

export function useSavedSearches() {
  return useQuery<SavedSearch[]>({
    queryKey: ['search', 'saved'],
    queryFn: async () => {
      const { data } = await api.get<SavedSearch[]>('/api/v1/search/saved');
      return data;
    },
  });
}

export function useSaveSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (search: Omit<SavedSearch, 'id' | 'created_at'>) => {
      const { data } = await api.post<SavedSearch>('/api/v1/search/saved', search);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search', 'saved'] });
    },
  });
}

export function useDeleteSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/search/saved/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search', 'saved'] });
    },
  });
}

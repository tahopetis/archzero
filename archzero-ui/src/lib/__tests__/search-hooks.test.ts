/**
 * Search Hooks Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGlobalSearch, useSearchSuggestions, useSavedSearches } from '../search-hooks';
import api from '../api';

// Mock the API module
vi.mock('../api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

const mockApi = api as {
  post: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
};

describe('Search Hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  describe('useGlobalSearch', () => {
    it('should not execute search with query less than 2 characters', () => {
      mockApi.post.mockResolvedValue({
        data: { results: [], total: 0, facets: { domain: {}, type: {} } },
      });

      const { result } = renderHook(
        () => useGlobalSearch({ query: 'a', domain: 'all' }),
        { wrapper }
      );

      expect(result.current.isLoading).toBe(false);
      expect(mockApi.post).not.toHaveBeenCalled();
    });

    it('should execute search with query of 2 or more characters', async () => {
      const mockResponse = {
        results: [
          {
            id: '1',
            type: 'card',
            domain: 'cards',
            title: 'Test Card',
            description: 'Test description',
            url: '/cards/1',
            score: 0.9,
            highlights: [],
          },
        ],
        total: 1,
        facets: {
          domain: { cards: 1 },
          type: { Application: 1 },
        },
      };

      mockApi.post.mockResolvedValue({ data: mockResponse });

      const { result } = renderHook(
        () => useGlobalSearch({ query: 'test', domain: 'all' }),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/search/global', {
        query: 'test',
        domain: 'all',
      });
      expect(result.current.data).toEqual(mockResponse);
    });

    it('should include filters in search request', async () => {
      mockApi.post.mockResolvedValue({
        data: { results: [], total: 0, facets: { domain: {}, type: {} } },
      });

      const { result } = renderHook(
        () =>
          useGlobalSearch({
            query: 'test',
            domain: 'cards',
            filters: { type: ['Application'] },
          }),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/search/global', {
        query: 'test',
        domain: 'cards',
        filters: { type: ['Application'] },
      });
    });
  });

  describe('useSearchSuggestions', () => {
    it('should not fetch suggestions with less than 2 characters', () => {
      const { result } = renderHook(() => useSearchSuggestions('a'), {
        wrapper,
      });

      expect(result.current.isLoading).toBe(false);
      expect(mockApi.get).not.toHaveBeenCalled();
    });

    it('should fetch suggestions with 2 or more characters', async () => {
      const mockSuggestions = ['test card', 'test application', 'test service'];
      mockApi.get.mockResolvedValue({ data: mockSuggestions });

      const { result } = renderHook(() => useSearchSuggestions('test'), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(mockApi.get).toHaveBeenCalledWith(
        '/api/v1/search/suggestions?q=test'
      );
      expect(result.current.data).toEqual(mockSuggestions);
    });
  });

  describe('useSavedSearches', () => {
    it('should fetch saved searches', async () => {
      const mockSavedSearches = [
        {
          id: '1',
          name: 'My Search',
          query: 'test',
          domain: 'cards',
          filters: {},
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockApi.get.mockResolvedValue({ data: mockSavedSearches });

      const { result } = renderHook(() => useSavedSearches(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/search/saved');
      expect(result.current.data).toEqual(mockSavedSearches);
    });
  });
});

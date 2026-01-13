/**
 * Relationship Hooks Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useDependencyChains,
  useRelationshipMatrix,
  useImpactAnalysis,
  useRelationshipTypes,
  useCriticalPaths,
} from '../relationship-hooks';
import api from '../api';

// Mock the API module
vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockApi = api as {
  get: ReturnType<typeof vi.fn>;
};

describe('Relationship Hooks', () => {
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

  describe('useDependencyChains', () => {
    it('should fetch dependency chains for a card', async () => {
      const mockChain = {
        nodes: [
          {
            id: 'card-1',
            name: 'Card 1',
            type: 'Application',
            level: 0,
            criticality: 80,
          },
          {
            id: 'card-2',
            name: 'Card 2',
            type: 'Service',
            level: 1,
            criticality: 60,
          },
        ],
        links: [
          {
            source: 'card-1',
            target: 'card-2',
            type: 'depends_on',
            strength: 0.8,
          },
        ],
        depth: 2,
      };

      mockApi.get.mockResolvedValue({ data: mockChain });

      const { result } = renderHook(
        () => useDependencyChains('card-1', 2),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(mockApi.get).toHaveBeenCalledWith(
        '/api/v1/relationships/card-1/chains?depth=2'
      );
      expect(result.current.data).toEqual(mockChain);
    });

    it('should not fetch when cardId is not provided', () => {
      renderHook(() => useDependencyChains('', 2), { wrapper });

      expect(mockApi.get).not.toHaveBeenCalled();
    });

    it('should use default depth of 3', async () => {
      mockApi.get.mockResolvedValue({ data: { nodes: [], links: [], depth: 3 } });

      renderHook(() => useDependencyChains('card-1'), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(mockApi.get).toHaveBeenCalledWith(
        '/api/v1/relationships/card-1/chains?depth=3'
      );
    });
  });

  describe('useRelationshipMatrix', () => {
    it('should fetch relationship matrix', async () => {
      const mockMatrix = {
        nodes: [
          { id: 'card-1', name: 'Card 1' },
          { id: 'card-2', name: 'Card 2' },
        ],
        cells: [
          {
            source: 'card-1',
            target: 'card-2',
            value: 5,
            type: 'depends_on',
          },
        ],
      };

      mockApi.get.mockResolvedValue({ data: mockMatrix });

      const { result } = renderHook(() => useRelationshipMatrix(), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/relationships/matrix');
      expect(result.current.data).toEqual(mockMatrix);
    });

    it('should include card IDs in request when provided', async () => {
      mockApi.get.mockResolvedValue({
        data: { nodes: [], cells: [] },
      });

      const { result } = renderHook(
        () => useRelationshipMatrix(['card-1', 'card-2']),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(mockApi.get).toHaveBeenCalledWith(
        '/api/v1/relationships/matrix?card_ids=card-1,card-2'
      );
    });
  });

  describe('useImpactAnalysis', () => {
    it('should fetch impact analysis for a card', async () => {
      const mockImpact = {
        upstream: ['card-0', 'card-1'],
        downstream: ['card-2', 'card-3', 'card-4'],
        criticality: 85,
        risk_level: 'high' as const,
      };

      mockApi.get.mockResolvedValue({ data: mockImpact });

      const { result } = renderHook(() => useImpactAnalysis('card-1'), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(mockApi.get).toHaveBeenCalledWith(
        '/api/v1/relationships/card-1/impact'
      );
      expect(result.current.data).toEqual(mockImpact);
    });

    it('should classify risk level correctly', async () => {
      const mockImpact = {
        upstream: [],
        downstream: ['card-2'],
        criticality: 90,
        risk_level: 'critical' as const,
      };

      mockApi.get.mockResolvedValue({ data: mockImpact });

      const { result } = renderHook(() => useImpactAnalysis('card-1'), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.data?.risk_level).toBe('critical');
    });

    it('should not fetch when cardId is not provided', () => {
      renderHook(() => useImpactAnalysis(''), { wrapper });

      expect(mockApi.get).not.toHaveBeenCalled();
    });
  });

  describe('useRelationshipTypes', () => {
    it('should fetch available relationship types', async () => {
      const mockTypes = [
        {
          type: 'depends_on',
          count: 150,
          description: 'One card depends on another',
        },
        {
          type: 'implements',
          count: 75,
          description: 'One card implements another',
        },
        {
          type: 'similar_to',
          count: 30,
          description: 'Cards are similar in functionality',
        },
      ];

      mockApi.get.mockResolvedValue({ data: mockTypes });

      const { result } = renderHook(() => useRelationshipTypes(), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/relationships/types');
      expect(result.current.data).toEqual(mockTypes);
    });
  });

  describe('useCriticalPaths', () => {
    it('should fetch critical paths', async () => {
      const mockPaths = [
        {
          id: 'path-1',
          cards: ['card-1', 'card-2', 'card-3'],
          risk_score: 85,
        },
        {
          id: 'path-2',
          cards: ['card-4', 'card-5'],
          risk_score: 70,
        },
      ];

      mockApi.get.mockResolvedValue({ data: mockPaths });

      const { result } = renderHook(() => useCriticalPaths(), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/relationships/critical-paths');
      expect(result.current.data).toEqual(mockPaths);
    });

    it('should return empty array when no critical paths exist', async () => {
      mockApi.get.mockResolvedValue({ data: [] });

      const { result } = renderHook(() => useCriticalPaths(), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.data).toEqual([]);
    });
  });
});

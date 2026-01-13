/**
 * Graph Data Hook
 */

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { GraphData, GraphSearchParams } from './types';

export function useGraphData(params: GraphSearchParams = {}) {
  return useQuery<GraphData>({
    queryKey: ['graph', params],
    queryFn: async () => {
      const { data } = await api.get<GraphData>('/api/v1/graph', { params });
      return data;
    },
    enabled: !!params.centerCardId || params.depth === 0,
  });
}

export function useGraphNodeCount() {
  return useQuery<{ count: number }>({
    queryKey: ['graph', 'count'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/graph/count');
      return data;
    },
  });
}

export function useGraphStats() {
  return useQuery({
    queryKey: ['graph', 'stats'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/graph/stats');
      return data;
    },
  });
}

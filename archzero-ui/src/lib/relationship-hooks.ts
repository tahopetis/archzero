/**
 * Relationship Visualization Hooks
 */

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface DependencyNode {
  id: string;
  name: string;
  type: string;
  level: number;
  criticality: number;
}

export interface DependencyLink {
  source: string;
  target: string;
  type: string;
  strength: number;
}

export interface DependencyChain {
  nodes: DependencyNode[];
  links: DependencyLink[];
  depth: number;
}

export interface MatrixCell {
  source: string;
  target: string;
  value: number;
  type: string;
}

export function useDependencyChains(cardId: string, depth: number = 3) {
  return useQuery<DependencyChain>({
    queryKey: ['relationships', 'chains', cardId, depth],
    queryFn: async () => {
      const { data } = await api.get<DependencyChain>(
        `/api/v1/relationships/${cardId}/chains?depth=${depth}`
      );
      return data;
    },
    enabled: !!cardId,
  });
}

export function useRelationshipMatrix(cardIds?: string[]) {
  return useQuery<{
    nodes: { id: string; name: string }[];
    cells: MatrixCell[];
  }>({
    queryKey: ['relationships', 'matrix', cardIds],
    queryFn: async () => {
      const params = cardIds ? `?card_ids=${cardIds.join(',')}` : '';
      const { data } = await api.get(`/api/v1/relationships/matrix${params}`);
      return data;
    },
  });
}

export function useImpactAnalysis(cardId: string) {
  return useQuery<{
    upstream: string[];
    downstream: string[];
    criticality: number;
    risk_level: 'low' | 'medium' | 'high' | 'critical';
  }>({
    queryKey: ['relationships', 'impact', cardId],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/relationships/${cardId}/impact`);
      return data;
    },
    enabled: !!cardId,
  });
}

export function useRelationshipTypes() {
  return useQuery<
    {
      type: string;
      count: number;
      description: string;
    }[]
  >({
    queryKey: ['relationships', 'types'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/relationships/types');
      return data;
    },
  });
}

export function useCriticalPaths() {
  return useQuery<
    {
      id: string;
      cards: string[];
      risk_score: number;
    }[]
  >({
    queryKey: ['relationships', 'critical-paths'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/relationships/critical-paths');
      return data;
    },
  });
}

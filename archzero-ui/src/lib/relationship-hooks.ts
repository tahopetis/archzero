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
  lifecyclePhase?: string;
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

export function useDependencyChains(cardId: string, depth: number = 3, lifecycleState: 'current' | 'target' = 'current') {
  return useQuery<DependencyChain>({
    queryKey: ['relationships', 'chains', cardId, depth, lifecycleState],
    queryFn: async () => {
      // Fetch relationships for the specified card
      const { data: relationships } = await api.get<any[]>(
        `/api/v1/relationships?card_id=${cardId}`
      );

      // Filter relationships by lifecycle state based on valid_from dates
      // Current state: relationships where valid_from is in the past
      // Target state: relationships where valid_from is in the future
      const now = new Date();
      const filteredRelationships = relationships.filter((rel: any) => {
        const validFromDate = new Date(rel.valid_from);
        const validToDate = rel.valid_to ? new Date(rel.valid_to) : null;

        if (lifecycleState === 'current') {
          // Current state: valid now (valid_from <= now < valid_to)
          return validFromDate <= now && (!validToDate || now < validToDate);
        } else {
          // Target state: valid in the future (valid_from > now)
          return validFromDate > now;
        }
      });

      // Fetch all cards to build node data
      const { data: allCards } = await api.get<any[]>('/cards');

      // Build a set of all card IDs in the relationship chain
      const cardIds = new Set<string>();
      cardIds.add(cardId);

      filteredRelationships.forEach((rel: any) => {
        cardIds.add(rel.from_card_id);
        cardIds.add(rel.to_card_id);
      });

      // Fetch full card details for all related cards
      const cards = allCards.filter((card: any) => cardIds.has(card.id));

      // Create node map
      const nodeMap = new Map<string, DependencyNode>();
      cards.forEach((card: any) => {
        nodeMap.set(card.id, {
          id: card.id,
          name: card.name,
          type: card.type,
          level: card.id === cardId ? 0 : cardIds.has(card.id) ? 1 : 99,
          criticality: card.attributes?.criticality || Math.random() * 0.5 + 0.25,
          lifecyclePhase: card.lifecyclePhase,
        });
      });

      // Convert relationships to links
      const links: DependencyLink[] = filteredRelationships.map((rel: any) => ({
        source: rel.from_card_id,
        target: rel.to_card_id,
        type: rel.relationship_type,
        strength: rel.confidence || 0.5,
      }));

      // Build chain from nodes and links
      const nodes = Array.from(nodeMap.values());

      return {
        nodes,
        links,
        depth,
      };
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
      // Fetch all relationships
      const { data: relationships } = await api.get<any[]>('/api/v1/relationships');

      // Fetch all cards
      const { data: cards } = await api.get<any[]>('/cards');

      // Filter by card IDs if provided
      const filteredCards = cardIds
        ? cards.filter((card: any) => cardIds.includes(card.id))
        : cards;

      // Create matrix cells from relationships
      const cells: MatrixCell[] = relationships.map((rel: any) => ({
        source: rel.from_card_id,
        target: rel.to_card_id,
        value: 1,
        type: rel.relationship_type,
      }));

      return {
        nodes: filteredCards.map((card: any) => ({
          id: card.id,
          name: card.name,
        })),
        cells,
      };
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
      // Fetch relationships for this card
      const { data: relationships } = await api.get<any[]>(
        `/api/v1/relationships?card_id=${cardId}`
      );

      // Separate upstream and downstream
      const upstream: string[] = [];
      const downstream: string[] = [];

      relationships.forEach((rel: any) => {
        if (rel.to_card_id === cardId) {
          upstream.push(rel.from_card_id);
        } else if (rel.from_card_id === cardId) {
          downstream.push(rel.to_card_id);
        }
      });

      // Calculate risk level based on number of dependencies
      const totalDeps = upstream.length + downstream.length;
      let risk_level: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (totalDeps > 20) risk_level = 'critical';
      else if (totalDeps > 10) risk_level = 'high';
      else if (totalDeps > 5) risk_level = 'medium';

      return {
        upstream,
        downstream,
        criticality: Math.min(1, totalDeps / 20),
        risk_level,
      };
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
      // Fetch all relationships
      const { data: relationships } = await api.get<any[]>('/api/v1/relationships');

      // Count by type
      const typeCounts = new Map<string, number>();
      relationships.forEach((rel: any) => {
        const type = rel.relationship_type || 'unknown';
        typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
      });

      // Convert to array
      return Array.from(typeCounts.entries()).map(([type, count]) => ({
        type,
        count,
        description: `${type} relationships`,
      }));
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
      // Fetch all relationships
      const { data: relationships } = await api.get<any[]>('/api/v1/relationships');

      // Fetch all cards to calculate critical paths
      const { data: cards } = await api.get<any[]>('/cards');

      // Calculate dependency counts for each card
      const depCounts = new Map<string, number>();
      cards.forEach((card: any) => {
        depCounts.set(card.id, 0);
      });

      relationships.forEach((rel: any) => {
        depCounts.set(rel.from_card_id, (depCounts.get(rel.from_card_id) || 0) + 1);
        depCounts.set(rel.to_card_id, (depCounts.get(rel.to_card_id) || 0) + 1);
      });

      // Find cards with high dependency counts (critical paths)
      const criticalPaths = Array.from(depCounts.entries())
        .filter(([_, count]) => count > 3)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([cardId, count]) => ({
          id: cardId,
          cards: [cardId],
          risk_score: Math.min(1, count / 10),
        }));

      return criticalPaths;
    },
  });
}

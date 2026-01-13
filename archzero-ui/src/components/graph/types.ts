/**
 * Graph Visualization Types
 */

import type { Node, Edge } from '@reactflow/core';

export interface GraphNodeData {
  id: string;
  name: string;
  type: string;
  lifecyclePhase: string;
  qualityScore?: number;
  description?: string;
  tags: string[];
  // Visual properties
  color: string;
  size: number;
}

export interface GraphEdgeData {
  relationshipType: string;
  confidence: number;
  validFrom: string;
  validTo?: string;
}

export type GraphNode = Node<GraphNodeData>;
export type GraphEdge = Edge<GraphEdgeData>;

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphSearchParams {
  centerCardId?: string;
  depth?: number;
  relationshipTypes?: string[];
  cardTypes?: string[];
  minConfidence?: number;
}

export interface GraphControls {
  depth: number;
  maxDepth: number;
  showRelationshipTypes: string[];
  showCardTypes: string[];
  minConfidence: number;
  layout: 'force' | 'hierarchical' | 'circular';
}

export interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  connectedComponents: number;
  averageDegree: number;
  maxDepth: number;
}

import { api } from './api';
import type { Card } from '@/types/api';

export interface Relationship {
  id: string;
  fromCardId: string;
  toCardId: string;
  relationshipType: string;
  validFrom: string;
  validTo: string | null;
  attributes: Record<string, unknown> | null;
  confidence: number | null;
  createdAt: string;
}

export interface CreateRelationshipRequest {
  fromCardId: string;
  toCardId: string;
  relationshipType: 'depends_on' | 'implements' | 'similar_to' | 'conflicts_with';
  validFrom?: string;
  validTo?: string;
  attributes?: Record<string, unknown>;
  confidence?: number;
}

export const relationshipApi = {
  /**
   * Create a new relationship between two cards
   */
  async create(request: CreateRelationshipRequest): Promise<Relationship> {
    const { data } = await api.post<Relationship>('/relationships', request);
    return data;
  },

  /**
   * Get all relationships for a specific card
   */
  async getForCard(cardId: string): Promise<Relationship[]> {
    const { data } = await api.get<Relationship[]>(`/relationships?card_id=${cardId}`);
    return data;
  },

  /**
   * Get all relationships
   */
  async getAll(): Promise<Relationship[]> {
    const { data } = await api.get<Relationship[]>('/relationships');
    return data;
  },

  /**
   * Update a relationship
   */
  async update(id: string, updates: Partial<Omit<CreateRelationshipRequest, 'fromCardId' | 'toCardId'>>): Promise<Relationship> {
    const { data } = await api.patch<Relationship>(`/relationships/${id}`, updates);
    return data;
  },

  /**
   * Delete a relationship
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/relationships/${id}`);
  },

  /**
   * Get available cards for relationship creation (excludes current card)
   */
  async getAvailableCards(currentCardId: string): Promise<Card[]> {
    const { data } = await api.get<{ data: Card[]; total: number }>(`/cards`);
    // Filter out the current card
    return data.data?.filter((card: Card) => card.id !== currentCardId) || [];
  },
};

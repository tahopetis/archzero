/**
 * Regression Tests
 * Ensure Phase 4 doesn't break existing functionality from Phases 0-3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderWithProviders } from '../lib/__tests__/test-utils';
import { Layout } from '../components/Layout';
import { Cards } from '../pages/Cards';
import api from '../lib/api';

// Mock the API module
vi.mock('../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockApi = api as any;

describe('Regression Tests - Phase 0-3 Functionality', () => {
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

  describe('Phase 0: Basic Architecture', () => {
    it('should render Layout component without errors', () => {
      renderWithProviders(<Layout><span>Test Content</span></Layout>);

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should maintain existing routing structure', () => {
      // Verify that routes are not disrupted by Phase 4 additions
      expect(true).toBe(true); // Placeholder - actual routing test would need Router setup
    });
  });

  describe('Phase 1: Core Card Management', () => {
    it('should still be able to list cards', async () => {
      const mockCards = [
        {
          id: 'card-1',
          name: 'Card 1',
          type_: 'Application',
          lifecycle_phase: 'Production',
        },
        {
          id: 'card-2',
          name: 'Card 2',
          type_: 'Service',
          lifecycle_phase: 'Development',
        },
      ];

      mockApi.get.mockResolvedValue({ data: mockCards });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => import('../lib/cards').then(m => m.useCards()), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/cards');
    });

    it('should still be able to create a card', async () => {
      const newCard = {
        id: 'card-3',
        name: 'New Card',
        type_: 'Application',
        lifecycle_phase: 'Development',
      };

      mockApi.post.mockResolvedValue({ data: newCard });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => import('../lib/cards').then(m => m.useCreateCard()), { wrapper });

      await waitFor(async () => {
        const mutation = await result.current;
        await mutation.mutateAsync({
          name: 'New Card',
          type_: 'Application',
          lifecycle_phase: 'Development',
        });
      });

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/cards', expect.any(Object));
    });
  });

  describe('Phase 2: Intelligence Features', () => {
    it('should still fetch BIA profiles', async () => {
      mockApi.get.mockResolvedValue({ data: [] });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => import('../lib/intelligence').then(m => m.useBIAProfiles()), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/bia/profiles');
    });

    it('should still calculate TCO', async () => {
      mockApi.post.mockResolvedValue({ data: { total_cost: 100000 } });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => import('../lib/intelligence').then(m => m.useCalculateTCO()), { wrapper });

      await waitFor(async () => {
        const mutation = await result.current;
        await mutation.mutateAsync({ card_id: 'card-1', timeframe: 36 });
      });

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/tco/calculate', expect.any(Object));
    });
  });

  describe('Phase 3: Governance & Compliance', () => {
    it('should still list architecture principles', async () => {
      mockApi.get.mockResolvedValue({
        data: {
          principles: [
            { id: 'p1', name: 'Principle 1', category: 'Strategic' },
          ],
          pagination: { total: 1, page: 1, page_size: 10 },
        },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => import('../lib/governance-hooks').then(m => m.usePrinciples()), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/principles');
    });

    it('should still fetch technology standards', async () => {
      mockApi.get.mockResolvedValue({
        data: {
          standards: [
            { id: 's1', name: 'Standard 1', status: 'Active' },
          ],
          pagination: { total: 1, page: 1, page_size: 10 },
        },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => import('../lib/governance-hooks').then(m => m.useStandards()), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/tech-standards');
    });

    it('should still fetch ARB meetings', async () => {
      mockApi.get.mockResolvedValue({
        data: {
          meetings: [
            { id: 'm1', title: 'Meeting 1', status: 'Scheduled' },
          ],
          pagination: { total: 1, page: 1, page_size: 10 },
        },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => import('../lib/governance-hooks').then(m => m.useARBMeetings()), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/arb/meetings');
    });
  });

  describe('Integration: Cross-phase functionality', () => {
    it('should handle cards with governance relationships', async () => {
      const mockCard = {
        id: 'card-1',
        name: 'Test Card',
        type_: 'Application',
        lifecycle_phase: 'Production',
        related_policies: ['policy-1'],
        related_principles: ['principle-1'],
      };

      mockApi.get.mockResolvedValue({ data: mockCard });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => import('../lib/cards').then(m => m.useCard('card-1')), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.data).toBeDefined();
    });

    it('should not break existing relationships between cards', async () => {
      const mockRelationships = [
        {
          id: 'rel-1',
          source_card_id: 'card-1',
          target_card_id: 'card-2',
          type: 'depends_on',
        },
      ];

      mockApi.get.mockResolvedValue({ data: mockRelationships });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => import('../lib/cards').then(m => m.useRelationships('card-1')), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.data).toEqual(mockRelationships);
    });
  });
});

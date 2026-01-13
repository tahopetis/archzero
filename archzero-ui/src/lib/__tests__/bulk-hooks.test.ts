/**
 * Bulk Operations Hooks Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBulkDeleteCards, useBulkUpdateCards, useBulkExportCards } from '../bulk-hooks';
import api from '../api';

// Mock the API module
vi.mock('../api', () => ({
  default: {
    delete: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
  },
}));

const mockApi = api as {
  delete: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
};

describe('Bulk Operations Hooks', () => {
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

  describe('useBulkDeleteCards', () => {
    it('should delete multiple cards successfully', async () => {
      const mockResponse = { success: true, processed_count: 3, failed_ids: [] };
      mockApi.delete.mockResolvedValue({ data: mockResponse });

      const { result } = renderHook(() => useBulkDeleteCards(), { wrapper });

      await result.current.mutateAsync(['id1', 'id2', 'id3']);

      expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/cards/bulk', {
        data: { ids: ['id1', 'id2', 'id3'] },
      });
    });

    it('should handle partial failures', async () => {
      const mockResponse = {
        success: false,
        processed_count: 2,
        failed_ids: ['id3'],
      };
      mockApi.delete.mockResolvedValue({ data: mockResponse });

      const { result } = renderHook(() => useBulkDeleteCards(), { wrapper });

      const response = await result.current.mutateAsync(['id1', 'id2', 'id3']);

      expect(response.failed_ids).toEqual(['id3']);
      expect(response.processed_count).toBe(2);
    });
  });

  describe('useBulkUpdateCards', () => {
    it('should update multiple cards with provided fields', async () => {
      const mockResponse = { success: true, processed_count: 2, failed_ids: [] };
      mockApi.put.mockResolvedValue({ data: mockResponse });

      const { result } = renderHook(() => useBulkUpdateCards(), { wrapper });

      const updates = {
        type_: 'Application',
        lifecycle_phase: 'Production',
        tags: ['updated', 'tag'],
      };

      await result.current.mutateAsync({
        ids: ['id1', 'id2'],
        updates,
      });

      expect(mockApi.put).toHaveBeenCalledWith('/api/v1/cards/bulk/update', {
        ids: ['id1', 'id2'],
        updates,
      });
    });

    it('should handle empty update objects', async () => {
      const mockResponse = { success: true, processed_count: 1, failed_ids: [] };
      mockApi.put.mockResolvedValue({ data: mockResponse });

      const { result } = renderHook(() => useBulkUpdateCards(), { wrapper });

      await result.current.mutateAsync({
        ids: ['id1'],
        updates: {},
      });

      expect(mockApi.put).toHaveBeenCalled();
    });
  });

  describe('useBulkExportCards', () => {
    it('should export cards as Excel by default', async () => {
      const mockBlob = new Blob(['test data'], { type: 'application/vnd.ms-excel' });
      mockApi.post.mockResolvedValue({ data: mockBlob });

      const { result } = renderHook(() => useBulkExportCards(), { wrapper });

      await result.current.mutateAsync({ ids: ['id1', 'id2'] });

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/export/bulk', {
        ids: ['id1', 'id2'],
        format: 'excel',
      }, {
        responseType: 'blob',
      });
    });

    it('should export cards as CSV when specified', async () => {
      const mockBlob = new Blob(['test data'], { type: 'text/csv' });
      mockApi.post.mockResolvedValue({ data: mockBlob });

      const { result } = renderHook(() => useBulkExportCards(), { wrapper });

      await result.current.mutateAsync({ ids: ['id1'], format: 'csv' });

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/export/bulk', {
        ids: ['id1'],
        format: 'csv',
      }, {
        responseType: 'blob',
      });
    });
  });
});

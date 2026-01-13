/**
 * Import Hooks Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBulkImportCards, useImportStatus } from '../import-hooks';
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

describe('Import Hooks', () => {
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

  describe('useBulkImportCards', () => {
    it('should import cards with file and column mapping', async () => {
      const mockResult = {
        job_id: 'job-123',
        status: 'processing' as const,
        total_rows: 100,
        successful_rows: 0,
        failed_rows: 0,
        errors: [],
      };

      mockApi.post.mockResolvedValue({ data: mockResult });

      const { result } = renderHook(() => useBulkImportCards(), { wrapper });

      const file = new File(['test data'], 'test.csv', { type: 'text/csv' });
      const columnMapping = {
        name: 'Name',
        type_: 'Type',
        lifecycle_phase: 'Phase',
        description: 'Description',
      };

      const response = await result.current.mutateAsync({
        file,
        columnMapping,
      });

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/import/cards', expect.any(FormData), {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      expect(response.job_id).toBe('job-123');
    });

    it('should handle partial import failures', async () => {
      const mockResult = {
        job_id: 'job-456',
        status: 'completed' as const,
        total_rows: 100,
        successful_rows: 95,
        failed_rows: 5,
        errors: [
          {
            row: 10,
            field: 'type',
            message: 'Invalid type value',
            severity: 'error' as const,
          },
        ],
      };

      mockApi.post.mockResolvedValue({ data: mockResult });

      const { result } = renderHook(() => useBulkImportCards(), { wrapper });

      const file = new File(['data'], 'test.xlsx');
      const response = await result.current.mutateAsync({
        file,
        columnMapping: {},
      });

      expect(response.failed_rows).toBe(5);
      expect(response.successful_rows).toBe(95);
      expect(response.errors).toHaveLength(1);
    });
  });

  describe('useImportStatus', () => {
    it('should poll for status while processing', async () => {
      const processingJob = {
        id: 'job-123',
        status: 'processing' as const,
        total_rows: 100,
        processed_rows: 50,
        successful_rows: 45,
        failed_rows: 5,
        errors: [],
        started_at: '2024-01-01T00:00:00Z',
      };

      mockApi.get.mockResolvedValue({ data: processingJob });

      const { result } = renderHook(() => useImportStatus('job-123'), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/import/status/job-123');
      expect(result.current.data).toEqual(processingJob);
    });

    it('should stop polling when job is completed', async () => {
      const completedJob = {
        id: 'job-123',
        status: 'completed' as const,
        total_rows: 100,
        processed_rows: 100,
        successful_rows: 98,
        failed_rows: 2,
        errors: [],
        started_at: '2024-01-01T00:00:00Z',
        completed_at: '2024-01-01T00:05:00Z',
      };

      mockApi.get.mockResolvedValue({ data: completedJob });

      const { result } = renderHook(() => useImportStatus('job-123'), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.data?.status).toBe('completed');
    });

    it('should not fetch when jobId is not provided', () => {
      renderHook(() => useImportStatus(''), { wrapper });

      expect(mockApi.get).not.toHaveBeenCalled();
    });
  });
});

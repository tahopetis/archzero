/**
 * Export Hooks Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useExportCards, useExportGovernance, useDownloadExport } from '../export-hooks';
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

describe('Export Hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();

    // Mock URL.createObjectURL and related methods
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  describe('useExportCards', () => {
    it('should export cards as Excel by default', async () => {
      const mockBlob = new Blob(['test data'], {
        type: 'application/vnd.ms-excel',
      });
      mockApi.post.mockResolvedValue({ data: mockBlob });

      const { result } = renderHook(() => useExportCards(), { wrapper });

      await result.current.mutateAsync({
        ids: ['id1', 'id2'],
        format: 'excel',
      });

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/export/cards', {
        ids: ['id1', 'id2'],
        format: 'excel',
        template: undefined,
      }, {
        responseType: 'blob',
      });
    });

    it('should export cards with custom template', async () => {
      const mockBlob = new Blob(['test data'], { type: 'text/csv' });
      mockApi.post.mockResolvedValue({ data: mockBlob });

      const { result } = renderHook(() => useExportCards(), { wrapper });

      await result.current.mutateAsync({
        format: 'csv',
        template: 'detailed',
      });

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/export/cards', {
        ids: undefined,
        format: 'csv',
        template: 'detailed',
      }, {
        responseType: 'blob',
      });
    });

    it('should include filters in export request', async () => {
      const mockBlob = new Blob(['test data']);
      mockApi.post.mockResolvedValue({ data: mockBlob });

      const { result } = renderHook(() => useExportCards(), { wrapper });

      const filters = {
        type: ['Application'],
        lifecycle_phase: ['Production'],
      };

      await result.current.mutateAsync({
        format: 'excel',
        filters,
      });

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/export/cards', {
        ids: undefined,
        format: 'excel',
        filters,
        template: undefined,
      }, {
        responseType: 'blob',
      });
    });
  });

  describe('useExportGovernance', () => {
    it('should export governance data by domain', async () => {
      const mockBlob = new Blob(['governance data']);
      mockApi.post.mockResolvedValue({ data: mockBlob });

      const { result } = renderHook(() => useExportGovernance(), { wrapper });

      await result.current.mutateAsync({
        domain: 'principles',
        format: 'excel',
      });

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/export/principles', {
        filters: undefined,
        format: 'excel',
      }, {
        responseType: 'blob',
      });
    });

    it('should include filters for governance exports', async () => {
      const mockBlob = new Blob(['governance data']);
      mockApi.post.mockResolvedValue({ data: mockBlob });

      const { result } = renderHook(() => useExportGovernance(), { wrapper });

      const filters = { category: ['Strategic'] };

      await result.current.mutateAsync({
        domain: 'principles',
        format: 'pdf',
        filters,
      });

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/export/principles', {
        filters,
        format: 'pdf',
      }, {
        responseType: 'blob',
      });
    });
  });

  describe('useDownloadExport', () => {
    it('should create download link and trigger download', async () => {
      const mockBlob = new Blob(['test data']);
      const createElementSpy = vi.spyOn(document, 'createElement');
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      const removeChildSpy = vi.spyOn(document.body, 'removeChild');

      // Mock link element
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      createElementSpy.mockReturnValue(mockLink as any);

      const { result } = renderHook(() => useDownloadExport(), { wrapper });

      await result.current.mutateAsync({
        blob: mockBlob,
        filename: 'test-export.xlsx',
      });

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(mockLink.download).toBe('test-export.xlsx');
      expect(mockLink.click).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it('should revoke object URL after download', async () => {
      const mockBlob = new Blob(['test data']);
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };

      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);

      const { result } = renderHook(() => useDownloadExport(), { wrapper });

      await result.current.mutateAsync({
        blob: mockBlob,
        filename: 'test.xlsx',
      });

      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');

      vi.spyOn(document, 'createElement').mockRestore();
    });
  });
});

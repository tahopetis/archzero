/**
 * Import Hooks
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ImportJob, ImportResult, ColumnMapping } from '@/types/import';

export function useBulkImportCards() {
  return useMutation({
    mutationFn: async ({ file, columnMapping }: { file: File; columnMapping: ColumnMapping }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('columnMapping', JSON.stringify(columnMapping));

      const { data } = await api.post<ImportResult>('/api/v1/import/cards', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data;
    },
  });
}

export function useImportStatus(jobId: string) {
  return useQuery<ImportJob>({
    queryKey: ['import', 'status', jobId],
    queryFn: async () => {
      const { data } = await api.get<ImportJob>(`/api/v1/import/status/${jobId}`);
      return data;
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      // Poll while processing
      return query.state.data?.status === 'processing' ? 1000 : false;
    },
  });
}

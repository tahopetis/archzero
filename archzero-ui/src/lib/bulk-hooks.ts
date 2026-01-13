/**
 * Bulk Operations Hooks
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';

export function useBulkDeleteCards() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { data } = await api.delete('/api/v1/cards/bulk', { data: { ids } });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
    },
  });
}

export function useBulkUpdateCards() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: any }) => {
      const { data } = await api.put('/api/v1/cards/bulk/update', { ids, updates });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
    },
  });
}

export function useBulkExportCards() {
  return useMutation({
    mutationFn: async ({ ids, format }: { ids: string[]; format?: 'csv' | 'excel' }) => {
      const { data } = await api.post('/api/v1/export/bulk', { ids, format: format || 'excel' }, {
        responseType: 'blob',
      });
      return data;
    },
  });
}

/**
 * Export Hooks
 */

import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';

export interface ExportParams {
  ids?: string[];
  filters?: Record<string, any>;
  format: 'csv' | 'excel' | 'pdf';
  template?: string;
}

export function useExportCards() {
  return useMutation({
    mutationFn: async ({ ids, filters, format, template }: ExportParams) => {
      const { data } = await api.post('/api/v1/export/cards', {
        ids,
        filters,
        format,
        template,
      }, {
        responseType: 'blob',
      });
      return data;
    },
  });
}

export function useExportGovernance() {
  return useMutation({
    mutationFn: async ({
      domain,
      format,
      filters
    }: {
      domain: 'principles' | 'standards' | 'policies' | 'exceptions' | 'initiatives' | 'risks' | 'compliance' | 'arb';
      format: 'csv' | 'excel' | 'pdf';
      filters?: Record<string, any>;
    }) => {
      const { data } = await api.post(`/api/v1/export/${domain}`, {
        filters,
        format,
      }, {
        responseType: 'blob',
      });
      return data;
    },
  });
}

export function useDownloadExport() {
  return useMutation({
    mutationFn: async ({ blob, filename }: { blob: Blob; filename: string }) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });
}

export function useScheduleExport() {
  return useMutation({
    mutationFn: async ({
      name,
      domain,
      format,
      schedule,
      filters
    }: {
      name: string;
      domain: string;
      format: string;
      schedule: 'daily' | 'weekly' | 'monthly';
      filters?: Record<string, any>;
    }) => {
      const { data } = await api.post('/api/v1/export/scheduled', {
        name,
        domain,
        format,
        schedule,
        filters,
      });
      return data;
    },
  });
}

export function useExportHistory() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.get('/api/v1/export/history');
      return data;
    },
  });
}

export function useReDownloadExport() {
  return useMutation({
    mutationFn: async ({ id, filename }: { id: string; filename: string }) => {
      const { data } = await api.get(`/api/v1/export/history/${id}/download`, {
        responseType: 'blob',
      });
      return { blob: data, filename };
    },
  });
}

export function useDeleteExport() {
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/export/history/${id}`);
      return id;
    },
  });
}

export function useScheduledExports() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.get('/api/v1/export/scheduled');
      return data;
    },
  });
}

export function useCreateScheduledExport() {
  return useMutation({
    mutationFn: async (scheduledExport: {
      name: string;
      exportType: string;
      schedule: string;
      filters?: Record<string, any>;
      format: string;
    }) => {
      const { data } = await api.post('/api/v1/export/scheduled', scheduledExport);
      return data;
    },
  });
}

export function useUpdateScheduledExport() {
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data } = await api.put(`/api/v1/export/scheduled/${id}`, updates);
      return data;
    },
  });
}

export function useDeleteScheduledExport() {
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/export/scheduled/${id}`);
      return id;
    },
  });
}

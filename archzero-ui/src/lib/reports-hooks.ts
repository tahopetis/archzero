/**
 * Reports Hooks
 * React Query hooks for report generation and template management
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export type ReportFormat = 'pdf' | 'powerpoint' | 'csv' | 'json';

export interface ReportSection {
  type: 'title' | 'chart' | 'table' | 'text' | 'metrics';
  title: string;
  data?: any;
}

export interface GenerateReportRequest {
  template_id?: string;
  title: string;
  sections: ReportSection[];
  format: ReportFormat;
  filters?: Record<string, any>;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  template_config: any;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduleReportRequest {
  name: string;
  report_type: string;
  format: ReportFormat;
  frequency: 'weekly' | 'monthly' | 'quarterly';
  email: string;
  filters?: Record<string, any>;
}

/**
 * Generate a custom report
 */
export function useGenerateReport() {
  return useMutation({
    mutationFn: async (request: GenerateReportRequest) => {
      const { data } = await api.post('/api/v1/reports/custom', request, {
        responseType: 'blob',
      });
      return { blob: data, format: request.format };
    },
  });
}

/**
 * Download a report blob
 */
export function useDownloadReport() {
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

/**
 * List report templates
 */
export function useReportTemplates() {
  return useQuery<ReportTemplate[]>({
    queryKey: ['reports', 'templates'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/reports/templates');
      return data.data || [];
    },
  });
}

/**
 * Create report template
 */
export function useCreateReportTemplate() {
  return useMutation({
    mutationFn: async (template: Partial<ReportTemplate>) => {
      const { data } = await api.post('/api/v1/reports/templates', template);
      return data;
    },
  });
}

/**
 * Update report template
 */
export function useUpdateReportTemplate() {
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data } = await api.put(`/api/v1/reports/templates/${id}`, updates);
      return data;
    },
  });
}

/**
 * Delete report template
 */
export function useDeleteReportTemplate() {
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/reports/templates/${id}`);
      return id;
    },
  });
}

/**
 * Schedule report generation
 */
export function useScheduleReport() {
  return useMutation({
    mutationFn: async (schedule: ScheduleReportRequest) => {
      const { data } = await api.post('/api/v1/export/scheduled', {
        name: schedule.name,
        export_type: schedule.report_type,
        format: schedule.format,
        schedule: schedule.frequency,
        filters: schedule.filters,
      });
      return data;
    },
  });
}

/**
 * Get report filename based on format
 */
export function getReportFilename(title: string, format: ReportFormat): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const extension = format === 'pdf' ? 'pdf' : format === 'powerpoint' ? 'pptx' : format === 'csv' ? 'csv' : 'json';
  return `${sanitizedTitle}-${timestamp}.${extension}`;
}

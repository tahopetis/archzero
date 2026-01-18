import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface ARBTemplate {
  id: string;
  title: string;
  description: string | null;
  request_type: string;
  card_id: string | null;
  template_data: any;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateRequest {
  title: string;
  description?: string;
  submission_id: string;
}

export interface CreateFromTemplateRequest {
  template_id: string;
  title: string;
  card_id?: string;
  additional_notes?: string;
}

export interface UpdateTemplateRequest {
  title?: string;
  description?: string;
  template_data?: any;
}

// API functions
export const arbTemplateService = {
  listTemplates: async (): Promise<ARBTemplate[]> => {
    const response = await api.get('/arb/templates');
    return response.data;
  },

  getTemplate: async (id: string): Promise<ARBTemplate> => {
    const response = await api.get(`/arb/templates/${id}`);
    return response.data;
  },

  createTemplate: async (data: CreateTemplateRequest): Promise<ARBTemplate> => {
    const response = await api.post('/arb/templates', data);
    return response.data;
  },

  updateTemplate: async (id: string, data: UpdateTemplateRequest): Promise<ARBTemplate> => {
    const response = await api.put(`/arb/templates/${id}`, data);
    return response.data;
  },

  deleteTemplate: async (id: string): Promise<void> => {
    await api.delete(`/arb/templates/${id}`);
  },

  createFromTemplate: async (data: CreateFromTemplateRequest) => {
    const response = await api.post('/arb/templates/from-template', data);
    return response.data;
  },
};

// React Query hooks
export function useTemplates() {
  return useQuery({
    queryKey: ['arb-templates'],
    queryFn: arbTemplateService.listTemplates,
  });
}

export function useTemplate(id: string) {
  return useQuery({
    queryKey: ['arb-template', id],
    queryFn: () => arbTemplateService.getTemplate(id),
    enabled: !!id,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: arbTemplateService.createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['arb-templates'] });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTemplateRequest }) =>
      arbTemplateService.updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['arb-templates'] });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: arbTemplateService.deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['arb-templates'] });
    },
  });
}

export function useCreateFromTemplate() {
  return useMutation({
    mutationFn: arbTemplateService.createFromTemplate,
  });
}

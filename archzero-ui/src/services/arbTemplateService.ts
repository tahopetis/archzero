import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
    const response = await fetch('/api/v1/arb/templates');
    if (!response.ok) throw new Error('Failed to fetch templates');
    return response.json();
  },

  getTemplate: async (id: string): Promise<ARBTemplate> => {
    const response = await fetch(`/api/v1/arb/templates/${id}`);
    if (!response.ok) throw new Error('Failed to fetch template');
    return response.json();
  },

  createTemplate: async (data: CreateTemplateRequest): Promise<ARBTemplate> => {
    const response = await fetch('/api/v1/arb/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create template');
    return response.json();
  },

  updateTemplate: async (id: string, data: UpdateTemplateRequest): Promise<ARBTemplate> => {
    const response = await fetch(`/api/v1/arb/templates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update template');
    return response.json();
  },

  deleteTemplate: async (id: string): Promise<void> => {
    const response = await fetch(`/api/v1/arb/templates/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete template');
  },

  createFromTemplate: async (data: CreateFromTemplateRequest) => {
    const response = await fetch('/api/v1/arb/templates/from-template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create submission from template');
    return response.json();
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

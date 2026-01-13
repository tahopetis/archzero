import type { CreateCardRequest, UpdateCardRequest, CardSearchParams } from '../types/api';
import api from './api';

export const cardApi = {
  list: async (params?: CardSearchParams) => {
    const response = await api.get('/cards', { params });
    return response.data;
  },

  get: async (id: string) => {
    const response = await api.get(`/cards/${id}`);
    return response.data;
  },

  create: async (data: CreateCardRequest) => {
    const response = await api.post('/cards', data);
    return response.data;
  },

  update: async (id: string, data: UpdateCardRequest) => {
    const response = await api.put(`/cards/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/cards/${id}`);
  },
};

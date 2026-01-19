import api from './api';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export const userApi = {
  list: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  get: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Create/update/delete not yet implemented in backend
};

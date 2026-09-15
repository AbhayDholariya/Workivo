import client from './client';

export const leaveApi = {
  getAll: async (params = {}) => {
    const response = await client.get('/leaves/', { params });
    return response.data;
  },
  apply: async (data) => {
    const response = await client.post('/leaves/', data);
    return response.data;
  },
  approve: async (id) => {
    const response = await client.post(`/leaves/${id}/approve/`);
    return response.data;
  },
  reject: async (id, reason) => {
    const response = await client.post(`/leaves/${id}/reject/`, { rejection_reason: reason });
    return response.data;
  },
  cancel: async (id) => {
    const response = await client.post(`/leaves/${id}/cancel/`);
    return response.data;
  },
};

import client from './client';

export const employeeApi = {
  getAll: async (params = {}) => {
    const response = await client.get('/employees/', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await client.get(`/employees/${id}/`);
    return response.data;
  },
  create: async (data) => {
    const response = await client.post('/employees/', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await client.patch(`/employees/${id}/`, data);
    return response.data;
  },
  toggleStatus: async (id) => {
    const response = await client.post(`/employees/${id}/toggle_status/`);
    return response.data;
  },
};

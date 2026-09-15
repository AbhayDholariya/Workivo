import client from './client';

export const attendanceApi = {
  getAll: async (params = {}) => {
    const response = await client.get('/attendance/', { params });
    return response.data;
  },
  getToday: async () => {
    const response = await client.get('/attendance/today/');
    return response.data;
  },
  checkIn: async () => {
    const response = await client.post('/attendance/check_in/');
    return response.data;
  },
  checkOut: async () => {
    const response = await client.post('/attendance/check_out/');
    return response.data;
  },
};

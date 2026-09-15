import client from './client';

export const authApi = {
  login: async (email, password) => {
    const response = await client.post('/auth/login/', { email, password });
    return response.data;
  },
  getMe: async () => {
    const response = await client.get('/auth/me/');
    return response.data;
  },
  logout: async () => {
    try {
      const refresh = localStorage.getItem('hrms_refresh_token');
      if (refresh) {
        await client.post('/auth/logout/', { refresh });
      }
    } finally {
      localStorage.removeItem('hrms_access_token');
      localStorage.removeItem('hrms_refresh_token');
      localStorage.removeItem('hrms_user');
    }
  },
};

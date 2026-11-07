import { apiClient } from '@/lib/apiClient';

export const authService = {
  // POST /api/auth/pi-login
  loginWithPi: (accessToken: string) => 
    apiClient('/auth/pi-login', {
      method: 'POST',
      body: JSON.stringify({ access_token: accessToken }),
    }),
};

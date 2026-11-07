import { apiClient } from '@/lib/apiClient';

export interface UserAddressData {
  id: number;
  user_id: number;
  label: string;
  recipient_name: string;
  phone_number: string;
  full_address: string;
  city?: string;
  postal_code?: string;
  area_id?: string; // Properti ID area Biteship
  is_primary: boolean;
}


export const addressService = {
  getAddresses: (): Promise<any> => apiClient.get('/addresses'),
  createAddress: (data: Partial<UserAddressData>) => apiClient.post('/addresses', data),
  setPrimaryAddress: (id: number) => apiClient.put(`/addresses/${id}/primary`),
  deleteAddress: (id: number) => apiClient.delete(`/addresses/${id}`),
};

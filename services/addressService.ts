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
  is_primary: boolean;
}

export const addressService = {
  // Ambil daftar alamat user
  getAddresses: (): Promise<any> => apiClient.get('/addresses'),

  // Tambah alamat baru
  createAddress: (data: Partial<UserAddressData>) =>
    apiClient.post('/addresses', data),

  // Set alamat sebagai alamat utama
  setPrimaryAddress: (id: number) =>
    apiClient.put(`/addresses/${id}/primary`),

  // Hapus alamat
  deleteAddress: (id: number) => apiClient.delete(`/addresses/${id}`),
};

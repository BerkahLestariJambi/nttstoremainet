import { apiClient } from '@/lib/apiClient';

export interface SellerRegisterInput {
  store_name: string;
  store_description?: string;
  phone_number: string;
  address: string;
}

export const sellerService = {
  // Pendaftaran Toko Seller
  register: (data: SellerRegisterInput) =>
    apiClient('/seller/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Cek Status Pendaftaran Seller
  getStatus: () => apiClient('/seller/status'),
};

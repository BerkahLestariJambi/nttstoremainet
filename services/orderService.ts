import { apiClient } from '@/lib/apiClient';

export const orderService = {
  // POST /api/orders (Protected)
  createOrder: (orderData: {
    recipient_name: string;
    phone_number: string;
    shipping_address: string;
    items: Array<{ product_id: number; quantity: number }>;
  }) => 
    apiClient('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }),
};

export const sellerService = {
  // POST /api/seller/register (Protected)
  registerSeller: (sellerData: {
    store_name: string;
    store_description?: string;
    phone_number: string;
    address: string;
  }) => 
    apiClient('/seller/register', {
      method: 'POST',
      body: JSON.stringify(sellerData),
    }),
};

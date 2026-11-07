import { apiClient } from '@/lib/apiClient';

export interface OrderItemInput {
  product_id: number;
  quantity: number;
}

export interface CheckoutInput {
  recipient_name: string;
  phone_number: string;
  shipping_address: string;
  items: OrderItemInput[];
}

export const orderService = {
  // 1. Buat Draft Order di Laravel
  createOrder: (data: CheckoutInput) =>
    apiClient('/orders', {
      method: 'POST',
      body: JSON.stringify(data), // ✅ Menggunakan JSON.stringify agar sesuai tipe BodyInit
    }),

  // 2. Callback Server Approval Pi SDK
  approvePayment: (paymentId: string, orderId: number) =>
    apiClient('/orders/approve', {
      method: 'POST',
      body: JSON.stringify({ payment_id: paymentId, order_id: orderId }), // ✅ Menggunakan JSON.stringify
    }),

  // 3. Callback Server Completion Pi SDK
  completePayment: (paymentId: string, txid: string, orderId: number) =>
    apiClient('/orders/complete', {
      method: 'POST',
      body: JSON.stringify({ payment_id: paymentId, txid, order_id: orderId }), // ✅ Menggunakan JSON.stringify
    }),

  // 4. Riwayat Order
  getBuyerOrders: () => apiClient('/orders/buyer'),
  getSellerOrders: () => apiClient('/orders/seller'),
};

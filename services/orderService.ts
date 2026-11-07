import { apiClient } from '@/lib/apiClient';

export interface OrderItemInput {
  product_id: number;
  quantity: number;
}

export interface CheckoutInput {
  recipient_name: string;
  phone_number: string;
  shipping_address: string;
  courier_company: string;
  courier_service: string;
  shipping_fee_pi: number;
  shipping_fee_idr: number;
  items: OrderItemInput[];
  // Fallback opsional untuk kompatibilitas data langsung
  name?: string;
  phone?: string;
  address?: string;
  product_id?: number;
  quantity?: number;
}

export const orderService = {
  // 1. Buat Draft Order di Laravel Backend
  createOrder: (data: CheckoutInput) => apiClient.post('/orders', data),

  // 2. Callback Server Approval Pi SDK
  approvePayment: (paymentId: string, orderId: number | string) =>
    apiClient.post('/orders/approve', {
      payment_id: paymentId,
      order_id: orderId,
    }),

  // 3. Callback Server Completion Pi SDK
  completePayment: (paymentId: string, txid: string, orderId: number | string) =>
    apiClient.post('/orders/complete', {
      payment_id: paymentId,
      txid: txid,
      order_id: orderId,
    }),

  // 4. Riwayat Order Buyer & Seller
  getBuyerOrders: () => apiClient.get('/orders/buyer'),
  getSellerOrders: () => apiClient.get('/orders/seller'),
  getOrders: () => apiClient.get('/orders'),
  getOrderById: (orderId: number | string) => apiClient.get(`/orders/${orderId}`),
};

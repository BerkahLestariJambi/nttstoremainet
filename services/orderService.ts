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
  area_id?: string;
  items: OrderItemInput[];
  // Fallback opsional untuk kompatibilitas data langsung
  name?: string;
  phone?: string;
  address?: string;
  product_id?: number;
  quantity?: number;
}

export const orderService = {
  // 1. Buat Draft Order di Laravel Backend (/api/orders)
  createOrder: (data: CheckoutInput) => apiClient.post('/orders', data),

  // 2. Callback Server Approval Pi SDK (/api/orders/approve)
  approvePayment: (paymentId: string, orderId: number | string) =>
    apiClient.post('/orders/approve', {
      paymentId: paymentId,
      payment_id: paymentId,
      orderId: orderId,
      order_id: orderId,
    }),

  // 3. Callback Server Completion Pi SDK (/api/orders/complete)
  completePayment: (paymentId: string, txid: string, orderId: number | string) =>
    apiClient.post('/orders/complete', {
      paymentId: paymentId,
      payment_id: paymentId,
      txid: txid,
      orderId: orderId,
      order_id: orderId,
    }),

  // 4. Batalkan & Hapus Draft Order Saat Pembayaran Dibatalkan (/api/orders/{orderId}/cancel)
  cancelOrder: (orderId: number | string, paymentId?: string) =>
    apiClient.post(`/orders/${orderId}/cancel`, {
      paymentId: paymentId || null,
      payment_id: paymentId || null,
      orderId: orderId,
      order_id: orderId,
      status: 'cancelled',
      delete_record: true,
    }),

  // 5. Riwayat Order Buyer & Seller
  getBuyerOrders: () => apiClient.get('/orders/buyer'),
  getSellerOrders: () => apiClient.get('/orders/seller'),
  getOrders: () => apiClient.get('/orders'),
  getOrderById: (orderId: number | string) => apiClient.get(`/orders/${orderId}`),

  // 6. Fitur Tambahan (Pelacakan Kurir Biteship & Selesaikan Pesanan)
  getTracking: (orderId: number | string) => apiClient.get(`/orders/${orderId}/tracking`),
  markAsDelivered: (orderId: number | string) => apiClient.post(`/orders/${orderId}/deliver`),
};

import { apiClient } from '@/lib/apiClient';

export interface CartItemData {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  selected: boolean;
  product?: {
    id: number;
    name: string;
    price_pi: number;
    image_url?: string;
  };
}

export const cartService = {
  // Ambil daftar keranjang dari DB
  getCart: () => apiClient.get<CartItemData[]>('/cart'),

  // Tambah produk ke keranjang DB
  addToCart: (productId: number, quantity: number = 1) =>
    apiClient.post('/cart', { product_id: productId, quantity }),

  // Update quantity atau status selected
  updateCartItem: (id: number, data: { quantity?: number; selected?: boolean }) =>
    apiClient.put(`/cart/${id}`, data),

  // Hapus item dari keranjang
  removeFromCart: (id: number) => apiClient.delete(`/cart/${id}`),
};

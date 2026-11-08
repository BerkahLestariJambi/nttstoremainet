import { apiClient } from '@/lib/apiClient';

export interface Product {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  price_pi: number;
  stock: number;
  sisa_stock?: number;
  sold?: number;
  image_url?: string;
  is_active?: boolean;
  seller?: {
    id: number;
    name: string;
    store_name?: string;
  };
  user?: {
    id: number;
    name: string;
    store_name?: string;
  };
  category?: {
    id: number;
    name: string;
  };
}

export const productService = {
  // Mendapatkan daftar produk dengan fallback array kosong jika terjadi error
  getProducts: async () => {
    try {
      const res: any = await apiClient.get('/products');
      // Mengakomodasi struktur response Laravel (paginated maupun standar array)
      const productsData = res?.data?.data || res?.data || res || [];
      return Array.isArray(productsData) ? productsData : [];
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  },

  getProductById: async (id: number | string) => {
    const res: any = await apiClient.get(`/products/${id}`);
    return res?.data || res;
  },
};

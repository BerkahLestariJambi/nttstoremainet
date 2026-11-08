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
  weight?: number;
  image_url?: string;
  is_active?: boolean;
  seller_id?: number;
  user_id?: number;
  category_id?: number;
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
    slug?: string;
  };
}

export const productService = {
  // 1. Mendapatkan daftar produk publik (Safe Array Extraction)
  getProducts: async (params?: { category?: string; search?: string; page?: number }) => {
    try {
      const res: any = await apiClient.get('/products', { params });
      
      // Axios mengembalikan response.data -> Laravel mengembalikan { success: true, data: [...] }
      const payload = res?.data ?? res;
      const productsData = payload?.data ?? payload;

      if (Array.isArray(productsData)) {
        return productsData;
      }

      // Jika backend melempar pagination bertingkat (payload.data.data)
      if (Array.isArray(productsData?.data)) {
        return productsData.data;
      }

      return [];
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  },

  // 2. Mendapatkan detail produk berdasarkan ID atau SLUG
  getProductById: async (idOrSlug: number | string) => {
    try {
      const res: any = await apiClient.get(`/products/${idOrSlug}`);
      const payload = res?.data ?? res;
      return payload?.data ?? payload;
    } catch (error) {
      console.error(`Error fetching product ${idOrSlug}:`, error);
      return null;
    }
  },

  // 3. Mendapatkan produk milik seller yang sedang login (/api/seller/products)
  getSellerProducts: async () => {
    try {
      const res: any = await apiClient.get('/seller/products');
      const payload = res?.data ?? res;
      const productsData = payload?.data ?? payload;
      return Array.isArray(productsData) ? productsData : [];
    } catch (error) {
      console.error('Error fetching seller products:', error);
      return [];
    }
  },

  // 4. Tambah produk baru (Mendukung Form Data / Upload File)
  createProduct: async (formData: FormData) => {
    return await apiClient.post('/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // 5. Update produk
  updateProduct: async (id: number | string, formData: FormData) => {
    return await apiClient.post(`/products/${id}?_method=PUT`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // 6. Hapus produk
  deleteProduct: async (id: number | string) => {
    return await apiClient.delete(`/products/${id}`);
  },
};

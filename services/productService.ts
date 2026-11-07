import { apiClient } from '@/lib/apiClient';

export interface ProductInput {
  name: string;
  category_id: number;
  description: string;
  price_pi: number | string;
  stock: number;
  image?: File | string;
}

export const productService = {
  // 1. GET /api/categories
  getCategories: () => apiClient('/categories'),

  // 2. GET /api/products (dengan opsional filter kategori)
  getProducts: (categorySlug?: string) => {
    const query = categorySlug ? `?category=${categorySlug}` : '';
    return apiClient(`/products${query}`);
  },

  // 3. GET /api/products/id/{id} atau /api/products/{id} (Dipakai oleh CheckoutPage)
  getProductById: (id: string | number) => apiClient(`/products/${id}`),

  // 4. GET /api/products/{slug} (Dipakai oleh Detail Product Page)
  getProductBySlug: (slug: string) => apiClient(`/products/${slug}`),

  // 5. POST /api/seller/products (Tambah produk seller)
  createProduct: (data: FormData | Record<string, any>) => {
    const isFormData = data instanceof FormData;

    return apiClient('/seller/products', {
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data),
    });
  },
};

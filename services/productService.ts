import { apiClient } from '@/lib/apiClient';

export const productService = {
  // GET /api/categories
  getCategories: () => apiClient('/categories'),

  // GET /api/products
  getProducts: (categorySlug?: string) => {
    const query = categorySlug ? `?category=${categorySlug}` : '';
    return apiClient(`/products${query}`);
  },

  // GET /api/products/{slug}
  getProductBySlug: (slug: string) => apiClient(`/products/${slug}`),

  // POST /api/seller/products (Protected)
  createProduct: (data: FormData | Record<string, any>) => {
    const isFormData = data instanceof FormData;

    return apiClient('/seller/products', {
      method: 'POST',
      // Jika FormData, kirim langsung agar browser membuat header multipart/form-data sendiri
      // Jika objek JSON biasa, stringify seperti semula
      body: isFormData ? data : JSON.stringify(data),
    });
  },
};

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
  createProduct: (data: any) => 
    apiClient('/seller/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

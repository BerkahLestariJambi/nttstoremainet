'use client';

import ProductCard from './ProductCard';
import { Product } from '@/context/CartContext';

const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Kain Tenun Ikat Sumba Original',
    category: 'Tenun Ikat',
    priceIdr: 1250000,
    pricePi: 2.5,
    image: 'https://images.unsplash.com/photo-1606760227091-3dd850d492a6?w=800',
    description: 'Kain tenun tradisional buatan tangan pengrajin Sumba Timur dengan pewarna alami.',
    stock: 5,
    rating: 4.9,
  },
  {
    id: '2',
    name: 'Kopi Flores Bajawa Specialty 500g',
    category: 'Kopi Flores',
    priceIdr: 150000,
    pricePi: 0.3,
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800',
    description: 'Biji kopi Arabika Bajawa Flores pilihan dengan aroma nutty dan asam seimbang.',
    stock: 25,
    rating: 4.8,
  },
  {
    id: '3',
    name: 'Madu Hutan Liar Timor 500ml',
    category: 'Hasil Alam',
    priceIdr: 185000,
    pricePi: 0.37,
    image: 'https://images.unsplash.com/photo-1587049352847-81a56d773cae?w=800',
    description: 'Madu murni dari hutan belantara pulau Timor tanpa pengawet.',
    stock: 12,
    rating: 4.9,
  },
];

export default function ProductGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {PRODUCTS.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

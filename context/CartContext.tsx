'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartService } from '@/services/cartService';

export interface Product {
  id: string | number;
  name: string;
  category?: string;
  priceIdr?: number;
  pricePi: number;
  price_pi?: string | number;
  image?: string;
  image_url?: string;
  description?: string;
  stock?: number;
  rating?: number;
  product_id?: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface PiUser {
  username: string;
  accessToken: string;
  uid: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: any, qty?: number) => void;
  removeFromCart: (id: string | number) => void;
  updateQuantity: (id: string | number, qty: number) => void;
  clearCart: () => void;
  fetchCart: () => Promise<void>;
  totalPi: number;
  totalIdr: number;
  totalItems: number;
  piUser: PiUser | null;
  setPiUser: (user: PiUser | null) => void;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [piUser, setPiUserInternal] = useState<PiUser | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      const res: any = await cartService.getCart();
      const cartData = res?.data || res || [];

      if (Array.isArray(cartData) && cartData.length > 0) {
        setCart(
          cartData.map((item: any) => ({
            id: String(item.id || item.product_id),
            product_id: item.product_id || item.id,
            name: item.product?.name || item.name || 'Produk',
            category: item.product?.category?.name || 'Umum',
            priceIdr: item.product?.price_idr || 0,
            pricePi: parseFloat(item.product?.price_pi || item.price_pi || item.pricePi || 0),
            image: item.product?.image_url || item.image_url || item.image || '',
            description: item.product?.description || '',
            stock: item.product?.stock || 10,
            rating: 5,
            quantity: item.quantity || 1,
          }))
        );
        return;
      }
    } catch (e) {
      console.warn('Backend Cart API fallback to localStorage:', e);
    } finally {
      setLoading(false);
    }

    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('nttstorepi_cart');
      if (savedCart) {
        try {
          const parsed = JSON.parse(savedCart);
          setCart(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          setCart([]);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('nttstorepi_user');
      if (savedUser) {
        try {
          setPiUserInternal(JSON.parse(savedUser));
        } catch (e) {
          console.error(e);
        }
      }
    }
    fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nttstorepi_cart', JSON.stringify(cart));
    }
  }, [cart]);

  const setPiUser = (user: PiUser | null) => {
    setPiUserInternal(user);
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem('nttstorepi_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('nttstorepi_user');
        localStorage.removeItem('nttstorepi_token');
      }
    }
  };

  const addToCart = (product: any, qty = 1) => {
    const targetId = String(product.id || product.product_id);
    const pricePi = parseFloat(product.price_pi || product.pricePi || 0);

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => String(item.id) === targetId);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += qty;
        return updated;
      }

      const newItem: CartItem = {
        id: targetId,
        product_id: Number(product.id || product.product_id),
        name: product.name || 'Produk',
        category: product.category || 'Umum',
        priceIdr: product.priceIdr || 0,
        pricePi: pricePi,
        image: product.image_url || product.image || '',
        description: product.description || '',
        stock: product.stock || 10,
        rating: product.rating || 5,
        quantity: qty,
      };
      return [...prev, newItem];
    });

    cartService.addToCart(Number(targetId), qty).catch(() => {});
  };

  const removeFromCart = (id: string | number) => {
    const targetId = String(id);
    setCart((prev) => prev.filter((item) => String(item.id) !== targetId));
    cartService.removeFromCart(Number(id)).catch(() => {});
  };

  const updateQuantity = (id: string | number, qty: number) => {
    if (qty <= 0) return removeFromCart(id);
    const targetId = String(id);

    setCart((prev) =>
      prev.map((item) => (String(item.id) === targetId ? { ...item, quantity: qty } : item))
    );

    cartService.updateQuantity(Number(id), qty).catch(() => {});
  };

  const clearCart = () => {
    setCart([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nttstorepi_cart');
    }
    cartService.clearCart().catch(() => {});
  };

  const totalPi = cart.reduce((sum, item) => sum + (item.pricePi || 0) * item.quantity, 0);
  const totalIdr = cart.reduce((sum, item) => sum + (item.priceIdr || 0) * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        fetchCart,
        totalPi,
        totalIdr,
        totalItems,
        piUser,
        setPiUser,
        loading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

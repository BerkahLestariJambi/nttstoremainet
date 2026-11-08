'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartService } from '@/services/cartService';



export interface CartItem {
  id: string | number;
  product_id?: number;
  name: string;
  pricePi: number;
  price_pi?: number;
  quantity: number;
  image?: string;
  image_url?: string;
}

export interface PiUser {
  username: string;
  accessToken: string;
  uid: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: any, qty?: number) => Promise<void>;
  removeFromCart: (id: string | number) => Promise<void>;
  updateQuantity: (id: string | number, qty: number) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCart: () => Promise<void>;
  totalPi: number;
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

  // 1. Fetch Cart Data langsung dari API Backend Laravel
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      const res: any = await cartService.getCart();
      const cartData = res?.data || res || [];
      
      if (Array.isArray(cartData)) {
        setCart(
          cartData.map((item: any) => ({
            id: item.id || item.product_id,
            product_id: item.product_id || item.id,
            name: item.product?.name || item.name || 'Produk',
            pricePi: parseFloat(item.product?.price_pi || item.price_pi || 0),
            quantity: item.quantity || 1,
            image: item.product?.image_url || item.image_url || '',
          }))
        );
      } else {
        setCart([]);
      }
    } catch (e) {
      console.warn('Gagal memuat keranjang dari API backend:', e);
      // Fallback ke localStorage jika user belum login API
      const savedCart = localStorage.getItem('nttstorepi_cart');
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch (err) {
          setCart([]);
        }
      } else {
        setCart([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Inisialisasi User & Keranjang saat pertama kali aplikasi dimuat
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

  // Sync state keranjang ke localStorage
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

  const addToCart = async (product: any, qty = 1) => {
    try {
      const productId = product.product_id || product.id;
      await cartService.addToCart(productId, qty);
    } catch (e) {
      console.warn('Backend cart add fallback:', e);
    } finally {
      await fetchCart();
    }
  };

  const removeFromCart = async (id: string | number) => {
    try {
      await cartService.removeFromCart(id);
    } catch (e) {
      console.warn('Backend cart remove fallback:', e);
      setCart((prev) => prev.filter((item) => item.id !== id && item.product_id !== id));
    } finally {
      await fetchCart();
    }
  };

  const updateQuantity = async (id: string | number, qty: number) => {
    if (qty <= 0) {
      await removeFromCart(id);
      return;
    }
    try {
      await cartService.updateQuantity(id, qty);
    } catch (e) {
      console.warn('Backend cart update fallback:', e);
    } finally {
      await fetchCart();
    }
  };

  const clearCart = async () => {
    try {
      await cartService.clearCart();
    } catch (e) {
      console.warn('Backend cart clear fallback:', e);
    } finally {
      setCart([]);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('nttstorepi_cart');
      }
    }
  };

  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalPi = cart.reduce((sum, item) => sum + (item.pricePi || 0) * item.quantity, 0);

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

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

  // 1. Fetch Cart Data dari API Backend Laravel dengan Fallback LocalStorage
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
            pricePi: parseFloat(item.product?.price_pi || item.price_pi || item.pricePi || 0),
            quantity: item.quantity || 1,
            image: item.product?.image_url || item.image_url || item.image || '',
          }))
        );
      } else {
        setCart([]);
      }
    } catch (e) {
      console.warn('Backend API Cart tidak merespon, menggunakan data localStorage:', e);
      if (typeof window !== 'undefined') {
        const savedCart = localStorage.getItem('nttstorepi_cart');
        if (savedCart) {
          try {
            const parsed = JSON.parse(savedCart);
            setCart(Array.isArray(parsed) ? parsed : []);
          } catch (err) {
            setCart([]);
          }
        } else {
          setCart([]);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Inisialisasi User & Keranjang saat pertama kali di-load
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

  // Sync state keranjang ke localStorage setiap kali cart berubah
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
    const targetId = product.product_id || product.id;
    const pricePi = parseFloat(product.price_pi || product.pricePi || 0);

    // 1. Simpan ke local state terlebih dahulu agar UI instan merespons
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => String(item.id) === String(targetId) || String(item.product_id) === String(targetId)
      );
      if (existingIndex > -1) {
        const newCart = [...prevCart];
        newCart[existingIndex].quantity += qty;
        return newCart;
      }
      return [
        ...prevCart,
        {
          id: targetId,
          product_id: Number(targetId),
          name: product.name || 'Produk',
          pricePi: pricePi,
          quantity: qty,
          image: product.image_url || product.image || '',
        },
      ];
    });

    // 2. Cobalah kirim perubahan ke API Server
    try {
      await cartService.addToCart(targetId, qty);
      await fetchCart();
    } catch (e) {
      console.warn('Simpan keranjang ke server gagal, menggunakan local cart state:', e);
    }
  };

  const removeFromCart = async (id: string | number) => {
    setCart((prev) => prev.filter((item) => String(item.id) !== String(id) && String(item.product_id) !== String(id)));
    try {
      await cartService.removeFromCart(id);
      await fetchCart();
    } catch (e) {
      console.warn('Hapus keranjang server gagal:', e);
    }
  };

  const updateQuantity = async (id: string | number, qty: number) => {
    if (qty <= 0) {
      await removeFromCart(id);
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        String(item.id) === String(id) || String(item.product_id) === String(id)
          ? { ...item, quantity: qty }
          : item
      )
    );

    try {
      await cartService.updateQuantity(id, qty);
      await fetchCart();
    } catch (e) {
      console.warn('Update quantity server gagal:', e);
    }
  };

  const clearCart = async () => {
    setCart([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nttstorepi_cart');
    }

    try {
      await cartService.clearCart();
    } catch (e) {
      console.warn('Clear cart server gagal:', e);
    }
  };

  const totalItems = Array.isArray(cart) ? cart.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0;
  const totalPi = Array.isArray(cart) ? cart.reduce((sum, item) => sum + (item.pricePi || 0) * (item.quantity || 0), 0) : 0;

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

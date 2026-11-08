'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Product {
  id: string;
  name: string;
  category: string;
  priceIdr: number;
  pricePi: number;
  image: string;
  description: string;
  stock: number;
  rating: number;
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
  addToCart: (product: Product) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  totalPi: number;
  totalIdr: number;
  piUser: PiUser | null;
  setPiUser: (user: PiUser | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [piUser, setPiUserInternal] = useState<PiUser | null>(null);

  // 1. Inisialisasi Data dari localStorage saat pertama kali dimuat di Client Browser
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('nttstorepi_user');
      const savedCart = localStorage.getItem('nttstorepi_cart');

      if (savedUser) {
        try {
          setPiUserInternal(JSON.parse(savedUser));
        } catch (e) {
          console.error('Gagal membaca data user dari storage:', e);
        }
      }

      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch (e) {
          console.error('Gagal membaca data keranjang dari storage:', e);
        }
      }
    }
  }, []);

  // Sync state keranjang belanja ke localStorage setiap kali ada perubahan
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nttstorepi_cart', JSON.stringify(cart));
    }
  }, [cart]);

  // Handler kustom setPiUser yang otomatis menyimpan / menghapus dari localStorage
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

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) return removeFromCart(id);
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: qty } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nttstorepi_cart');
    }
  };

  const totalPi = cart.reduce((sum, item) => sum + item.pricePi * item.quantity, 0);
  const totalIdr = cart.reduce((sum, item) => sum + item.priceIdr * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalPi,
        totalIdr,
        piUser,
        setPiUser,
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

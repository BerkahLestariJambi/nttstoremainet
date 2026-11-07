'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface PiUser {
  username: string;
  accessToken: string;
  uid?: string;
}

interface CartContextType {
  cart: any[];
  piUser: PiUser | null;
  setPiUser: (user: PiUser | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<any[]>([]);
  const [piUser, setPiUser] = useState<PiUser | null>(null);

  // 1. Muat data user dari localStorage saat pertama kali app dibuka / sesudah redirect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('nttstorepi_user');
      if (savedUser) {
        try {
          setPiUser(JSON.parse(savedUser));
        } catch (e) {
          console.error('Error parsing saved pi_user', e);
        }
      }
    }
  }, []);

  // 2. Fungsi custom setPiUser yang menyimpan ke localStorage
  const handleSetPiUser = (user: PiUser | null) => {
    setPiUser(user);
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem('nttstorepi_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('nttstorepi_user');
        localStorage.removeItem('nttstorepi_token');
      }
    }
  };

  return (
    <CartContext.Provider value={{ cart, piUser, setPiUser: handleSetPiUser }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}

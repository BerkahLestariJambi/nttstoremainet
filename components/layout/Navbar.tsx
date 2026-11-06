'use client';

import Link from 'next/link';
import { ShoppingBag, UserCheck, Wallet } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function Navbar() {
  const { cart, piUser } = useCart();
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-extrabold text-amber-700">
          NTTStore<span className="text-purple-600">Pi</span>
        </Link>

        <div className="flex items-center gap-4">
          {/* Indikator Status User Pi */}
          {piUser ? (
            <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-full text-xs font-semibold text-purple-700">
              <UserCheck className="w-4 h-4 text-purple-600" />
              <span>@{piUser.username}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
              <Wallet className="w-3.5 h-3.5 text-gray-400" />
              <span>Pi Browser</span>
            </div>
          )}

          {/* Keranjang Belanja */}
          <Link href="/checkout" className="relative p-2 text-gray-700 hover:text-purple-700 transition">
            <ShoppingBag className="w-6 h-6" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}

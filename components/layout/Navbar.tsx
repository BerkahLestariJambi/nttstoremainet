'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, 
  UserCheck, 
  Wallet, 
  PackagePlus, 
  Store, 
  LogOut, 
  ChevronDown, 
  Sparkles,
  ClipboardList,
  LayoutDashboard
} from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function Navbar() {
  const router = useRouter();
  const { cart, piUser, setPiUser } = useCart();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Close dropdown saat klik di luar area menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('nttstorepi_token');
    setPiUser(null);
    setDropdownOpen(false);
    router.push('/');
  };

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="text-2xl font-extrabold text-amber-700">
          NTTStore<span className="text-purple-600">Pi</span>
        </Link>

        {/* Action Area */}
        <div className="flex items-center gap-4">
          
          {/* Indikator Status User Pi + Dropdown Menu */}
          {piUser ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-full text-xs font-semibold text-purple-700 hover:bg-purple-100 transition cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-purple-600" />
                <span>@{piUser.username}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-purple-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Card */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Akun Terhubung</p>
                    <p className="text-xs font-bold text-gray-900 truncate flex items-center gap-1 mt-0.5">
                      <Sparkles className="w-3 h-3 text-amber-500" /> @{piUser.username}
                    </p>
                  </div>

                  <div className="p-1 space-y-0.5">
                    <Link
                      href="/orders"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition"
                    >
                      <ClipboardList className="w-4 h-4 text-purple-600" />
                      Pesanan Saya
                    </Link>

                    <Link
                      href="/seller/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition"
                    >
                      <LayoutDashboard className="w-4 h-4 text-amber-600" />
                      Dashboard Seller
                    </Link>

                    <Link
                      href="/seller/products/create"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50 rounded-xl transition"
                    >
                      <PackagePlus className="w-4 h-4 text-purple-600" />
                      Tambah Produk Baru
                    </Link>

                    <Link
                      href="/seller/register"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition"
                    >
                      <Store className="w-4 h-4 text-amber-600" />
                      Daftar Toko / Seller
                    </Link>
                  </div>

                  <div className="pt-1 border-t border-gray-100 p-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition"
                    >
                      <LogOut className="w-4 h-4" />
                      Keluar (Logout)
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
              <Wallet className="w-3.5 h-3.5 text-gray-400" />
              <span>Pi Browser</span>
            </div>
          )}

          {/* Keranjang Belanja -> Arahkan ke /cart */}
          <Link href="/cart" className="relative p-2 text-gray-700 hover:text-purple-700 transition">
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

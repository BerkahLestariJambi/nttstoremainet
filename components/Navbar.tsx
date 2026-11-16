'use client';


import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { 
  ShoppingBag, 
  Store, 
  PackagePlus, 
  User, 
  LogOut, 
  ChevronDown, 
  Sparkles,
  ShoppingBag as CartIcon 
} from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const { piUser, setPiUser, cart } = useCart();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const cartItemCount = cart ? cart.reduce((total, item) => total + item.quantity, 0) : 0;

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo NTTStorePi */}
        <Link href="/" className="flex items-center gap-2.5">
  <img
    src={logoNtt.src}
    alt="NTTStorePi Logo"
    className="w-9 h-9 rounded-xl object-contain"
  />
  <span className="text-xl font-black tracking-tight text-amber-700">
    NTTStorePi
  </span>
</Link>

          {/* Navigasi Desktop & Quick Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="/" className="hover:text-purple-700 transition">
              Beranda
            </Link>
            <Link href="/products" className="hover:text-purple-700 transition">
              Semua Produk
            </Link>
          </nav>

          {/* Right Section: User Action & Menu */}
          <div className="flex items-center gap-3">
            
            {/* Tombol Keranjang Belanja */}
            <Link
              href="/cart"
              className="relative p-3 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-2xl transition"
              title="Keranjang Belanja"
            >
              <CartIcon className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* Menu Pengguna Keren setelah Login */}
            {piUser ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-3 p-1.5 pr-3 bg-gray-50 border border-gray-200 hover:border-purple-300 rounded-2xl transition shadow-xs"
                >
                  <div className="w-9 h-9 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    {piUser.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-bold text-gray-900 leading-tight">
                      @{piUser.username}
                    </div>
                    <div className="text-[10px] text-purple-600 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Pi Pioneer
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Card */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-white border border-gray-100 rounded-3xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    
                    {/* User Header di Dropdown */}
                    <div className="px-5 py-3 border-b border-gray-100">
                      <p className="text-xs text-gray-400">Akun Terhubung</p>
                      <p className="text-sm font-bold text-gray-900 truncate">@{piUser.username}</p>
                    </div>

                    {/* Quick Access Fitur Seller */}
                    <div className="p-2 space-y-1">
                      <Link
                        href="/seller/products/create"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-purple-700 bg-purple-50/60 hover:bg-purple-100/80 rounded-2xl transition"
                      >
                        <PackagePlus className="w-4 h-4 text-purple-600" />
                        Tambah Produk Baru
                      </Link>

                      <Link
                        href="/seller/register"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-2xl transition"
                      >
                        <Store className="w-4 h-4 text-amber-600" />
                        Daftar / Profil Toko
                      </Link>

                      <Link
                        href="/orders"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-2xl transition"
                      >
                        <ShoppingBag className="w-4 h-4 text-blue-600" />
                        Riwayat Pesanan
                      </Link>
                    </div>

                    {/* Separator & Logout */}
                    <div className="pt-2 border-t border-gray-100 p-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-2xl transition"
                      >
                        <LogOut className="w-4 h-4" />
                        Keluar (Logout)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Tombol Login saat belum masuk */
              <Link
                href="/"
                className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold px-5 py-3 rounded-2xl transition shadow-md shadow-purple-200 flex items-center gap-2"
              >
                <User className="w-4 h-4" /> Sign in with Pi
              </Link>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}

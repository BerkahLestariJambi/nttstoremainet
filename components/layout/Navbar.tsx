'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
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
import { useLanguage } from '@/context/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import logoNtt from '@/app/logonttstorepi.ico';

export default function Navbar() {
  const router = useRouter();
  const { piUser, setPiUser, fetchCart } = useCart();
  const { t } = useLanguage();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Refresh data keranjang agar badge di BottomNav tetap sinkron
  useEffect(() => {
    if (fetchCart) {
      fetchCart();
    }
  }, [fetchCart]);

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
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
        
        {/* Brand Logo */}
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

        {/* Action Area (Kanan Atas: User Status + Pemilih 5 Bahasa) */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Indikator Status User Pi + Dropdown Menu */}
          {piUser ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 bg-purple-50 border border-purple-200 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold text-purple-700 hover:bg-purple-100 transition cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-purple-600 shrink-0" />
                <span className="max-w-[80px] sm:max-w-none truncate">@{piUser.username}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-purple-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Card */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{t('connectedAs')}</p>
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
                      {t('orderHistory')}
                    </Link>

                    <Link
                      href="/seller/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition"
                    >
                      <LayoutDashboard className="w-4 h-4 text-amber-600" />
                      {t('sellerDashboard')}
                    </Link>

                    <Link
                      href="/seller/products/create"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50 rounded-xl transition"
                    >
                      <PackagePlus className="w-4 h-4 text-purple-600" />
                      {t('addProduct')}
                    </Link>

                    <Link
                      href="/seller/register"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition"
                    >
                      <Store className="w-4 h-4 text-amber-600" />
                      {t('registerStoreBtn')}
                    </Link>
                  </div>

                  <div className="pt-1 border-t border-gray-100 p-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('logout')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
              <Wallet className="w-3.5 h-3.5 text-gray-400" />
              <span>Pi Browser</span>
            </div>
          )}

          {/* Pemilih 5 Bahasa di Header Paling Atas Kanan */}
          <LanguageSwitcher />
          
        </div>
      </div>
    </nav>
  );
}

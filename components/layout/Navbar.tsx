'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UserCheck,
  Wallet,
  ShieldCheck,
  PackagePlus,
  Store,
  LogOut,
  ChevronDown,
  Sparkles,
  ClipboardList,
  LayoutDashboard,
  ShoppingBag,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import { authService } from '@/services/authService';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import logoNtt from '@/app/logonttstorepi.ico';

const CLIENT_ID = 'I3j4kvxCJb0ZixCLzM5tgTV8TaKuN5oq1qQNAk14s9s';

export default function Navbar() {
  const router = useRouter();
  const { piUser, setPiUser, fetchCart } = useCart();
  const { t } = useLanguage();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isPiBrowser, setIsPiBrowser] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Deteksi & inisialisasi Pi Browser Native SDK
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = navigator.userAgent || '';
      const isPiUA = /PiBrowser/i.test(userAgent);
      if ((window as any).Pi && isPiUA) {
        try {
          (window as any).Pi.init({ version: '2.0', sandbox: false });
          setIsPiBrowser(true);
        } catch (err) {
          console.error('Pi SDK Init error:', err);
        }
      }
    }
  }, []);

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

  const handleAuthenticate = useCallback(async () => {
    setAuthLoading(true);

    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isPiUA = /PiBrowser/i.test(userAgent);

    // ALUR 1: Jika dibuka di aplikasi Pi Browser resmi (Native SDK Flow)
    if (typeof window !== 'undefined' && (window as any).Pi && isPiUA) {
      try {
        const scopes = ['username', 'payments'];
        const auth = await (window as any).Pi.authenticate(scopes, (payment: any) => {
          console.log('Incomplete payment found:', payment);
        });

        setPiUser({
          username: auth.user.username,
          accessToken: auth.accessToken,
          uid: auth.user.uid,
        });

        try {
          const apiRes = await authService.loginWithPi(auth.accessToken);
          if (apiRes.access_token) {
            localStorage.setItem('nttstorepi_token', apiRes.access_token);
          }
        } catch (backendErr: any) {
          console.warn('Gagal sync token ke backend Laravel:', backendErr.message);
        }
      } catch (error: any) {
        alert(`Autentikasi Pi Browser gagal: ${error.message}`);
      } finally {
        setAuthLoading(false);
      }
      return;
    }

    // ALUR 2: Jika dibuka di Chrome/Safari/Browser Luar (Pi OAuth Flow)
    try {
      const state =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).substring(2) + Date.now().toString(36);

      sessionStorage.setItem('pi_oauth_state', state);

      const redirectUri = `${window.location.origin}/auth/callback`;
      const authorizeUrl = new URL('https://accounts.pinet.com/oauth/authorize');
      authorizeUrl.searchParams.set('response_type', 'token');
      authorizeUrl.searchParams.set('client_id', CLIENT_ID);
      authorizeUrl.searchParams.set('redirect_uri', redirectUri);
      authorizeUrl.searchParams.set('scope', 'username wallet_address');
      authorizeUrl.searchParams.set('state', state);

      const rawOauthUrl = authorizeUrl.toString();
      const isAndroid = /Android/i.test(userAgent);

      if (isAndroid) {
        const directPiOAuthIntent = `intent://accounts.pinet.com/oauth/authorize?response_type=token&client_id=${encodeURIComponent(CLIENT_ID)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=username%20wallet_address&state=${encodeURIComponent(state)}#Intent;scheme=https;package=org.pinetwork.pi;S.browser_fallback_url=${encodeURIComponent(rawOauthUrl)};end;`;
        window.location.href = directPiOAuthIntent;
      } else {
        window.location.assign(rawOauthUrl);
      }
    } catch (err: any) {
      alert(`Gagal menginisiasi Pi Sign-in: ${err.message}`);
      setAuthLoading(false);
    }
  }, [setPiUser]);

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
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <img
            src={logoNtt.src}
            alt="NTTStorePi Logo"
            className="w-9 h-9 rounded-xl object-contain"
          />
          <span className="text-xl font-black tracking-tight text-amber-700">
            NTTStorePi
          </span>
        </Link>

        {/* Action Area (Kanan Atas: Explore + Switch Login/User Status + Pemilih 5 Bahasa) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Tombol Explore Products */}
          <Link
            href="/products"
            className="hidden md:inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-gray-900 font-bold px-3 py-1.5 rounded-full text-xs transition shadow-sm"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{t('exploreProducts')}</span>
          </Link>

          {/* Switch: Jika sudah login tampilkan dropdown @username, jika belum tampilkan tombol Login */}
          {piUser ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 bg-purple-50 border border-purple-200 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold text-purple-700 hover:bg-purple-100 transition cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-purple-600 shrink-0" />
                <span className="max-w-[80px] sm:max-w-none truncate">@{piUser.username}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-purple-500 transition-transform duration-200 ${
                    dropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown Card */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                      {t('connectedAs')}
                    </p>
                    <p className="text-xs font-bold text-gray-900 truncate flex items-center gap-1 mt-0.5">
                      <Sparkles className="w-3 h-3 text-amber-500" /> @{piUser.username}
                    </p>
                  </div>

                  <div className="p-1 space-y-0.5">
                    <Link
                      href="/products"
                      onClick={() => setDropdownOpen(false)}
                      className="md:hidden flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition"
                    >
                      <ShoppingBag className="w-4 h-4 text-amber-500" />
                      {t('exploreProducts')}
                    </Link>

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
            <button
              type="button"
              onClick={handleAuthenticate}
              disabled={authLoading}
              className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold px-3 py-1.5 rounded-full text-xs transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isPiBrowser ? (
                <Wallet className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
              )}
              <span className="truncate max-w-[110px] sm:max-w-none">
                {authLoading
                  ? t('redirecting')
                  : isPiBrowser
                  ? t('connectPiWallet')
                  : t('signInWithPi')}
              </span>
            </button>
          )}

          {/* Pemilih 5 Bahasa di Header Paling Atas Kanan */}
          <LanguageSwitcher />
        </div>
      </div>
    </nav>
  );
}

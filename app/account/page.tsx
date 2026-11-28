'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UserCheck,
  Wallet,
  MessageCircle,
  ClipboardList,
  MapPin,
  Store,
  LayoutDashboard,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Crown,
  FileText,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import { authService } from '@/services/authService';
import { apiClient } from '@/lib/apiClient';
import BottomNav from '@/components/BottomNav';

const CLIENT_ID = 'I3j4kvxCJb0ZixCLzM5tgTV8TaKuN5oq1qQNAk14s9s';
type UserRole = 'customer' | 'seller' | 'admin';

export default function AccountPage() {
  const router = useRouter();
  const { piUser, setPiUser } = useCart();
  const langCtx: any = useLanguage();
  const { t } = langCtx;
  const currentLang = String(langCtx?.language || langCtx?.lang || 'id').toLowerCase();
  const isEn = currentLang.startsWith('en');

  const tr = (key: string, idText: string, enText: string): string => {
    const val = typeof t === 'function' ? t(key) : '';
    if (val && val !== key) return val;
    return isEn ? enText : idText;
  };

  const [isPiBrowser, setIsPiBrowser] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [userRoles, setUserRoles] = useState<UserRole[]>(['customer']);

  // Helper normalisasi array roles dari response user backend
  const extractRoles = (userData: any): UserRole[] => {
    if (!userData) return ['customer'];

    if (Array.isArray(userData.roles) && userData.roles.length > 0) {
      return userData.roles;
    }
    if (typeof userData.roles === 'string') {
      try {
        const parsed = JSON.parse(userData.roles);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // fallback ke role tunggal
      }
    }
    if (userData.role) {
      return [userData.role as UserRole];
    }
    return ['customer'];
  };

  // Sinkronisasi roles terbaru dari backend (/auth/me)
  const fetchCurrentUserRoles = useCallback(async () => {
    try {
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('nttstorepi_token') : null;
      if (!token && !piUser) return;

      const meRes: any = await apiClient('/auth/me');
      const userObj = meRes?.data || meRes?.user || meRes;
      if (userObj) {
        setUserRoles(extractRoles(userObj));
      }
    } catch (err) {
      console.warn('Gagal memuat roles user terbaru:', err);
    }
  }, [piUser]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = navigator.userAgent || '';
      const isPiUA = userAgent.includes('PiBrowser');

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

  useEffect(() => {
    fetchCurrentUserRoles();
  }, [fetchCurrentUserRoles]);

  const handleAuthenticate = useCallback(async () => {
    setLoading(true);
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isPiUA = userAgent.includes('PiBrowser');

    if (typeof window !== 'undefined' && (window as any).Pi && isPiUA) {
      try {
        const scopes = ['username', 'payments'];
        const onIncompletePaymentFound = (payment: any) => {
          console.log('Incomplete payment found:', payment);
        };

        const auth = await (window as any).Pi.authenticate(scopes, onIncompletePaymentFound);
        setPiUser({
          username: auth.user.username,
          accessToken: auth.accessToken,
          uid: auth.user.uid,
        });

        try {
          const apiRes: any = await authService.loginWithPi(auth.accessToken);
          if (apiRes?.access_token) {
            localStorage.setItem('nttstorepi_token', apiRes.access_token);
          }
          if (apiRes?.user) {
            setUserRoles(extractRoles(apiRes.user));
          } else {
            await fetchCurrentUserRoles();
          }
        } catch (backendErr: any) {
          console.warn('Gagal sync token ke backend Laravel:', backendErr.message);
        }
      } catch (error: any) {
        alert(`Autentikasi Pi Browser gagal: ${error.message}`);
      } finally {
        setLoading(false);
      }
      return;
    }

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
      setLoading(false);
    }
  }, [setPiUser, fetchCurrentUserRoles]);

  const handleLogout = () => {
    localStorage.removeItem('nttstorepi_token');
    setPiUser(null);
    setUserRoles(['customer']);
    router.push('/');
  };

  // Cek hak akses berdasarkan array roles terbaru
  const isSeller = userRoles.includes('seller');
  const isAdmin = userRoles.includes('admin');

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24">
      {/* Header Kartu Profil Akun Pi */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-purple-900 text-white rounded-3xl p-6 sm:p-8 shadow-md">
        {piUser ? (
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shrink-0">
              <UserCheck className="w-7 h-7 text-yellow-300" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-yellow-400 text-gray-900 px-2.5 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3" /> {t('connectedAs')}
                </span>
                {userRoles.map((r) => (
                  <span
                    key={r}
                    className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full"
                  >
                    {r}
                  </span>
                ))}
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold truncate mt-1">
                @{piUser.username}
              </h1>
              <p className="text-xs text-white/80 mt-0.5">NTTStorePi Ecosystem</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold">{t('navProfile')}</h1>
              <p className="text-xs sm:text-sm text-white/85 mt-1">
                {t('externalBrowserHint')}
              </p>
            </div>
            <button
              type="button"
              onClick={handleAuthenticate}
              disabled={loading}
              className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-5 py-3 rounded-2xl text-xs transition shadow-md inline-flex items-center gap-2 disabled:opacity-50"
            >
              {isPiBrowser ? <Wallet className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
              <span>
                {loading
                  ? t('redirecting')
                  : isPiBrowser
                  ? t('connectPiWallet')
                  : t('signInWithPi')}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Daftar Menu Akun Sesuai Roles */}
      <div className="space-y-3">
        {/* 1. Menu Chat (Customer / Semua Role) */}
        <Link
          href="/chat"
          className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 rounded-2xl border border-gray-100 shadow-sm transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{t('navChat')}</p>
              <p className="text-xs text-gray-500">NTTStorePi</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>

        {/* 2. Riwayat Pesanan (Customer / Semua Role) */}
        <Link
          href="/orders"
          className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 rounded-2xl border border-gray-100 shadow-sm transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{t('orderHistory')}</p>
              <p className="text-xs text-gray-500">{t('navOrders')}</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>

        {/* 3. Alamat Pengiriman (Customer / Semua Role) */}
        <Link
          href="/addresses"
          className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 rounded-2xl border border-gray-100 shadow-sm transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{t('shippingAddress')}</p>
              <p className="text-xs text-gray-500">{t('selectOrAddAddress')}</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>

        {/* 4 & 5. Menu Khusus Role Seller */}
        {isSeller && (
          <>
            <Link
              href="/seller/dashboard"
              className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 rounded-2xl border border-gray-100 shadow-sm transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{t('sellerDashboard')}</p>
                  <p className="text-xs text-gray-500">{t('manageMyStore')}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>

            <Link
              href="/seller/register"
              className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 rounded-2xl border border-gray-100 shadow-sm transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{t('registerStoreBtn')}</p>
                  <p className="text-xs text-gray-500">{t('registerStoreTitle')}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>
          </>
        )}

        {/* 6. Menu Khusus Role Admin */}
        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 rounded-2xl border border-purple-200 shadow-sm transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-700 text-amber-300 flex items-center justify-center">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-purple-950">Admin Control Center</p>
                <p className="text-xs text-purple-700">
                  {tr(
                    'adminControlCenterSubtitle',
                    'Kelola pengguna, multi-role, produk, keuangan & legal',
                    'Manage users, multi-role, products, finance & legal policies'
                  )}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-purple-700" />
          </Link>
        )}

        {/* 7. Dokumen Legal & Kepatuhan (Tampil untuk Semua Pengguna & Peninjau Mainnet) */}
        <div className="pt-2 space-y-2.5">
          <p className="px-1 text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
            {tr('legalSectionTitle', 'Informasi Legal & Kepatuhan', 'Legal & Compliance')}
          </p>

          <Link
            href="/privacy-policy"
            className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 rounded-2xl border border-gray-100 shadow-sm transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">
                  {tr('privacyPolicyMenu', 'Kebijakan Privasi (Privacy Policy)', 'Privacy Policy')}
                </p>
                <p className="text-xs text-gray-500">
                  {tr(
                    'privacyPolicyMenuDesc',
                    'Perlindungan data pribadi Pi Network & UU PDP',
                    'Pi Network & personal data protection policy'
                  )}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>

          <Link
            href="/terms-of-service"
            className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 rounded-2xl border border-gray-100 shadow-sm transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">
                  {tr(
                    'termsOfServiceMenu',
                    'Syarat & Ketentuan (Terms of Service)',
                    'Terms of Service'
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  {tr(
                    'termsOfServiceMenuDesc',
                    'Aturan penggunaan layanan & transaksi NTTStorePi',
                    'Rules for using NTTStorePi services & transactions'
                  )}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>
        </div>
      </div>

      {/* Tombol Logout */}
      {piUser && (
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-2xl border border-red-100 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>{t('logout')}</span>
        </button>
      )}

      <BottomNav />
    </div>
  );
}

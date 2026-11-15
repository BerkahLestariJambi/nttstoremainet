'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import ProductGrid from '@/components/product/ProductGrid';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import { Wallet, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { authService } from '@/services/authService';
import FlashSaleBanner from '@/components/FlashSaleBanner';
declare global {
  interface Window {
    Pi: any;
  }
}


const CLIENT_ID = 'I3j4kvxCJb0ZixCLzM5tgTV8TaKuN5oq1qQNAk14s9s';

export default function HomePage() {
  const { piUser, setPiUser } = useCart();
  const { t } = useLanguage();
  const [isPiBrowser, setIsPiBrowser] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Inisialisasi Native SDK jika dibuka di dalam aplikasi Pi Browser
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = navigator.userAgent || '';
      const isPiUA = userAgent.includes('PiBrowser');

      if (window.Pi && isPiUA) {
        try {
          window.Pi.init({ version: '2.0', sandbox: false });
          setIsPiBrowser(true);
        } catch (err) {
          console.error('Pi SDK Init error:', err);
        }
      }
    }
  }, []);

  const handleAuthenticate = useCallback(async () => {
    setLoading(true);

    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isPiUA = userAgent.includes('PiBrowser');

    // ALUR 1: Jika dibuka MURNI di aplikasi Pi Browser (Native SDK Flow)
    if (typeof window !== 'undefined' && window.Pi && isPiUA) {
      try {
        const scopes = ['username', 'payments'];
        const onIncompletePaymentFound = (payment: any) => {
          console.log('Incomplete payment found:', payment);
        };

        const auth = await window.Pi.authenticate(scopes, onIncompletePaymentFound);
        
        // 1. Simpan data Pi di Client State
        setPiUser({
          username: auth.user.username,
          accessToken: auth.accessToken,
          uid: auth.user.uid,
        });

        // 2. Hubungkan ke Backend Laravel Sanctum (POST /api/auth/pi-login)
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
        setLoading(false);
      }
      return;
    }

    // ALUR 2: Jika dibuka di Chrome/Safari/Browser Luar (Standard OAuth Implicit Flow)
    try {
      // 1. Generate CSRF State acak & Simpan di sessionStorage
      const state = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : Math.random().toString(36).substring(2) + Date.now().toString(36);

      sessionStorage.setItem('pi_oauth_state', state);

      // 2. Susun URL Otorisasi Sesuai Bagian 4.2 Panduan Resmi
      const redirectUri = `${window.location.origin}/auth/callback`;

      const authorizeUrl = new URL('https://accounts.pinet.com/oauth/authorize');
      authorizeUrl.searchParams.set('response_type', 'token');
      authorizeUrl.searchParams.set('client_id', CLIENT_ID);
      authorizeUrl.searchParams.set('redirect_uri', redirectUri);
      authorizeUrl.searchParams.set('scope', 'username wallet_address'); // Valid Scope resmi
      authorizeUrl.searchParams.set('state', state);

      const rawOauthUrl = authorizeUrl.toString();
      const isAndroid = /Android/i.test(userAgent);

      if (isAndroid) {
        // Intent khusus OS Android untuk langsung membuka halaman OAuth Pi Sign-In di app org.pinetwork.pi
        const directPiOAuthIntent = `intent://accounts.pinet.com/oauth/authorize?response_type=token&client_id=${encodeURIComponent(CLIENT_ID)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=username%20wallet_address&state=${encodeURIComponent(state)}#Intent;scheme=https;package=org.pinetwork.pi;S.browser_fallback_url=${encodeURIComponent(rawOauthUrl)};end;`;

        window.location.href = directPiOAuthIntent;
      } else {
        // 3. Redirect pengguna ke server otorisasi Pi
        window.location.assign(rawOauthUrl);
      }
    } catch (err: any) {
      alert(`Gagal menginisiasi Pi Sign-in: ${err.message}`);
      setLoading(false);
    }
  }, [setPiUser]);

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-amber-700 via-amber-800 to-purple-900 text-white rounded-3xl p-8 md:p-12 shadow-lg">
        <div className="max-w-3xl space-y-4">
          <span className="bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            {isPiBrowser ? t('piBrowserNative') : t('piOauthMode')}
          </span>

          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">
            {t('welcomeTitle')}<span className="text-yellow-400">Pi TestNet</span>
          </h1>

          <p className="text-lg opacity-90 leading-relaxed">
            {t('heroSubtitle')}
          </p>

          <div className="pt-4 flex flex-wrap gap-4 items-center">
            {piUser ? (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-5 py-3 rounded-2xl font-medium">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span>{t('connectedAs')} <strong>@{piUser.username}</strong></span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAuthenticate}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3.5 rounded-2xl transition shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {isPiBrowser ? <Wallet className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5 text-yellow-300" />}
                {loading ? t('redirecting') : isPiBrowser ? t('connectPiWallet') : t('signInWithPi')}
              </button>
            )}

            <Link
              href="/products"
              className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-6 py-3.5 rounded-2xl transition shadow-md inline-block"
            >
              {t('exploreProducts')}
            </Link>
          </div>

          {!isPiBrowser && !piUser && (
            <div className="mt-2 text-xs text-yellow-200/80 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> {t('externalBrowserHint')}
            </div>
          )}
        </div>
      </section>

      {/* Katalog Produk Unggulan */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-gray-900">{t('featuredProducts')}</h2>
        <ProductGrid />
        <FlashSaleBanner />
      </section>
    </div>
  );
}

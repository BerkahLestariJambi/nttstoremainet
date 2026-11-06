'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import ProductGrid from '@/components/product/ProductGrid';
import { Wallet, CheckCircle2, ShieldCheck, ExternalLink, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';

declare global {
  interface Window {
    Pi: any;
  }
}

export default function HomePage() {
  const { piUser, setPiUser } = useCart();
  const [isPiBrowser, setIsPiBrowser] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [initDone, setInitDone] = useState<boolean>(false);

  // Inisialisasi & Deteksi Pi Browser App Native
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 10;

    const checkPiReady = () => {
      attempts++;
      if (typeof window !== 'undefined') {
        const userAgent = navigator.userAgent || '';
        const isPiUA = userAgent.includes('PiBrowser');

        if (window.Pi && isPiUA) {
          try {
            window.Pi.init({
              version: '2.0',
              sandbox: true,
            });
            setIsPiBrowser(true);
            console.log('✅ Native Pi SDK Siap');
          } catch (err) {
            console.warn('⚠️ Pi SDK Init Warning:', err);
          }
          setInitDone(true);
          return true;
        }
      }

      if (attempts >= maxAttempts) {
        setInitDone(true);
        return true;
      }
      return false;
    };

    if (!checkPiReady()) {
      const timer = setInterval(() => {
        if (checkPiReady()) clearInterval(timer);
      }, 300);
      return () => clearInterval(timer);
    }
  }, []);

  // Handler Autentikasi Dual-Mode
  const handleAuthenticate = useCallback(async () => {
    setLoading(true);

    try {
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      const isPiUA = userAgent.includes('PiBrowser');

      // ==========================================
      // METODE 1: PI BROWSER APP (NATIVE SDK)
      // ==========================================
      if (typeof window !== 'undefined' && window.Pi && isPiUA) {
        console.log('🔐 Menggunakan Native SDK Pi Browser...');
        const scopes = ['username', 'payments'];
        
        const auth = await window.Pi.authenticate(scopes, (payment: any) => {
          console.log('Incomplete payment found:', payment);
        });

        setPiUser({
          username: auth.user.username,
          accessToken: auth.accessToken,
          uid: auth.user.uid,
        });
        return;
      }

      // ==========================================
      // METODE 2: BROWSER ANDROID/EXTERNAL (DIRECT INTENT)
      // ==========================================
      console.log('🚀 Memproses Direct Intent/Redirect Browser Luar...');

      const clientId = process.env.NEXT_PUBLIC_PI_CLIENT_ID || 'I3j4kvxCJb0ZixCLzM5tgTV8TaKuN5oq1qQNAk14s9s';
      const redirectUri = `${window.location.origin}/auth/callback`;

      const state =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).substring(2) + Date.now().toString(36);

      sessionStorage.setItem('pisign_state', state);
      sessionStorage.setItem('pi_oauth_state', state);

      const rawOauthUrl = `https://accounts.pinet.com/oauth/authorize?response_type=token&client_id=${encodeURIComponent(
        clientId
      )}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=username%20payments&state=${encodeURIComponent(state)}`;

      const isAndroid = /Android/i.test(userAgent);

      if (isAndroid) {
        // 🚀 Intent Khusus Memaksa OS Android Mengatur Package Pi Browser (org.pinetwork.pi)
        const directPiOAuthIntent = `intent://accounts.pinet.com/oauth/authorize?response_type=token&client_id=${encodeURIComponent(
          clientId
        )}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=username%20payments&state=${encodeURIComponent(
          state
        )}#Intent;scheme=https;package=org.pinetwork.pi;S.browser_fallback_url=${encodeURIComponent(
          rawOauthUrl
        )};end;`;

        window.location.href = directPiOAuthIntent;
      } else {
        // Fallback Scheme untuk iOS / Desktop
        const deepLink = `pi://${window.location.host}/auth/callback`;
        window.location.href = deepLink;
      }
    } catch (err: any) {
      console.error('❌ Error Login:', err);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Autentikasi Gagal',
        text: err?.message || 'Terjadi kesalahan saat otorisasi.',
        showConfirmButton: false,
        timer: 4000,
      });
    } finally {
      // Menjamin tombol kembali dari status loading jika terjadi hambatan
      setLoading(false);
    }
  }, [setPiUser]);

  return (
    <div className="space-y-8">
      <section className="bg-gradient-to-r from-amber-700 via-amber-800 to-purple-900 text-white rounded-3xl p-8 md:p-12 shadow-lg">
        <div className="max-w-3xl space-y-4">
          <span className="bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            {isPiBrowser ? '🌐 Pi Browser Native' : '🔑 Multi-Browser Mode'}
          </span>

          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">
            Selamat Datang di NTTStore<span className="text-yellow-400">Pi</span>
          </h1>

          <p className="text-lg opacity-90 leading-relaxed">
            Pusat belanja produk khas NTT — Tenun Ikat, Kopi Flores, Hasil Alam — bayar pakai Pi Coin (π).
          </p>

          <div className="pt-4 flex flex-wrap gap-4 items-center">
            {piUser ? (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-5 py-3 rounded-2xl font-medium">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span>Terhubung sebagai <strong>@{piUser.username}</strong></span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAuthenticate}
                disabled={loading || !initDone}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3.5 rounded-2xl transition shadow-md flex items-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isPiBrowser ? (
                  <Wallet className="w-5 h-5" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-yellow-300" />
                )}
                {loading ? 'Memproses Redirect...' : isPiBrowser ? 'Hubungkan Pi Wallet' : 'Login via Pi Sign'}
              </button>
            )}

            <Link
              href="/products/1"
              className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-6 py-3.5 rounded-2xl transition shadow-md inline-block"
            >
              Jelajahi Produk
            </Link>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Produk Unggulan NTT</h2>
        <ProductGrid />
      </section>
    </div>
  );
}

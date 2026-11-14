'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import ProductGrid from '@/components/product/ProductGrid';
import BottomNav from '@/components/BottomNav';
import { useCart } from '@/context/CartContext';
import { Wallet, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { authService } from '@/services/authService';

declare global {
  interface Window {
    Pi: any;
  }
}

const CLIENT_ID = 'I3j4kvxCJb0ZixCLzM5tgTV8TaKuN5oq1qQNAk14s9s';

export default function HomePage() {
  const { piUser, setPiUser } = useCart();
  const [isPiBrowser, setIsPiBrowser] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const piInitialized = useRef<boolean>(false);

  // Inisialisasi Pi SDK HANYA SEKALI saat halaman dimuat
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initPi = () => {
      if (window.Pi && !piInitialized.current) {
        try {
          // Gunakan true jika sedang test di Sandbox Pi Developer, false untuk Mainnet
          const isSandbox = process.env.NEXT_PUBLIC_PI_SANDBOX === 'true';
          window.Pi.init({ version: '2.0', sandbox: isSandbox });
          piInitialized.current = true;
          setIsPiBrowser(true);
        } catch (err) {
          console.error('Pi SDK Init error:', err);
        }
      }
    };

    initPi();
    const timer = setInterval(() => {
      if (window.Pi) {
        initPi();
        clearInterval(timer);
      }
    }, 300);

    const timeout = setTimeout(() => clearInterval(timer), 3000);
    return () => {
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }, []);

  const handleAuthenticate = useCallback(async () => {
    setLoading(true);

    // ALUR 1: Jika dibuka di dalam aplikasi Pi Browser (window.Pi ada)
    if (typeof window !== 'undefined' && window.Pi) {
      try {
        if (!piInitialized.current) {
          const isSandbox = process.env.NEXT_PUBLIC_PI_SANDBOX === 'true';
          window.Pi.init({ version: '2.0', sandbox: isSandbox });
          piInitialized.current = true;
        }

        const scopes = ['username', 'payments'];
        const onIncompletePaymentFound = (payment: any) => {
          console.log('Incomplete payment found:', payment);
        };

        const auth = await window.Pi.authenticate(scopes, onIncompletePaymentFound);

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
        alert(`Error Pi SDK: ${error?.message || JSON.stringify(error)}`);
      } finally {
        setLoading(false);
      }
      return;
    }

    // ALUR 2: Browser Luar (Chrome/Safari) -> OAuth Redirect
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

      window.location.assign(authorizeUrl.toString());
    } catch (err: any) {
      alert(`Gagal menginisiasi Pi Sign-in: ${err.message}`);
      setLoading(false);
    }
  }, [setPiUser]);

  return (
    <div className="space-y-8 pb-24">
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-amber-700 via-amber-800 to-purple-900 text-white rounded-3xl p-8 md:p-12 shadow-lg">
        <div className="max-w-3xl space-y-4">
          <span className="bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            {isPiBrowser ? 'Pi Browser Native' : 'Pi Sign-in OAuth Mode'}
          </span>

          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">
            Selamat Datang di NTTStore<span className="text-yellow-400">Pi</span>
          </h1>

          <p className="text-lg opacity-90 leading-relaxed">
            Pusat belanja produk khas NTT — Tenun Ikat, Kopi Flores, & Hasil Alam menggunakan Pi Coin (π).
          </p>

          <div className="pt-4 flex flex-wrap gap-4 items-center">
            {piUser ? (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-5 py-3 rounded-2xl font-medium">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span>Terhubung sebagai <strong>@{piUser.username}</strong></span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAuthenticate}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3.5 rounded-2xl transition shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {isPiBrowser ? <Wallet className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5 text-yellow-300" />}
                {loading ? 'Memproses...' : isPiBrowser ? 'Hubungkan Pi Wallet' : 'Sign in with Pi'}
              </button>
            )}

            <Link
              href="/products"
              className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-6 py-3.5 rounded-2xl transition shadow-md inline-block"
            >
              Jelajahi Produk
            </Link>
          </div>

          {!isPiBrowser && !piUser && (
            <div className="mt-2 text-xs text-yellow-200/80 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> Menggunakan Browser Luar? Klik <strong>Sign in with Pi</strong> untuk masuk.
            </div>
          )}
        </div>
      </section>

      {/* Katalog Produk Unggulan */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Produk Unggulan NTT</h2>
        <ProductGrid />
      </section>

      <BottomNav />
    </div>
  );
}

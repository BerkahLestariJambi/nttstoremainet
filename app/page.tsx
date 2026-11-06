'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import ProductGrid from '@/components/product/ProductGrid';
import { Wallet, CheckCircle2, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

declare global {
  interface Window {
    Pi: any;
  }
}

// 🔑 KONFIGURASI — Sesuaikan dengan milikmu!
const CONFIG = {
  CLIENT_ID: 'I3j4kvxCJb0ZixCLzM5tgTV8TaKuN5oq1qQNAk14s9s',
  REDIRECT_URI: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '',
  SCOPE: 'username payments',
  // ✅ Gunakan endpoint resmi Pi Sandbox
  PISIGN_SANDBOX_URL: 'https://app-cdn.minepi.com/mobile-app-ui/app-auth-sandbox',
  // Gunakan ini untuk Mainnet nanti:
  // PISIGN_MAINNET_URL: 'https://app-cdn.minepi.com/mobile-app-ui/app-auth',
};

export default function HomePage() {
  const { piUser, setPiUser } = useCart();
  const [isPiBrowser, setIsPiBrowser] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [initDone, setInitDone] = useState<boolean>(false);

  // Inisialisasi Pi SDK
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 15;

    const checkPiReady = () => {
      attempts++;
      if (typeof window !== 'undefined' && window.Pi) {
        try {
          window.Pi.init({ version: '2.0', sandbox: true });
          setIsPiBrowser(true);
          console.log('✅ Pi SDK siap');
        } catch (err) {
          console.warn('Pi SDK init:', err);
        }
        setInitDone(true);
        return true;
      }
      if (attempts >= maxAttempts) {
        console.log('ℹ️ Tidak terdeteksi di Pi Browser — gunakan PiSign mode');
        setInitDone(true);
        return true;
      }
      return false;
    };

    if (!checkPiReady()) {
      const timer = setInterval(() => {
        if (checkPiReady()) clearInterval(timer);
      }, 400);
      return () => clearInterval(timer);
    }
  }, []);

  // === Autentikasi ===
  const handleAuthenticate = useCallback(async () => {
    setLoading(true);

    // 🌐 ALUR A: Di Pi Browser → Native SDK
    if (typeof window !== 'undefined' && window.Pi) {
      try {
        const auth = await window.Pi.authenticate(
          ['username', 'payments'],
          (payment: any) => console.log('Pembayaran belum selesai:', payment)
        );
        setPiUser({
          username: auth.user.username,
          accessToken: auth.accessToken,
          uid: auth.user.uid,
        });
      } catch (err: any) {
        alert(`❌ Gagal: ${err.message || 'Coba lagi'}`);
      } finally {
        setLoading(false);
      }
      return;
    }

    // 🔑 ALUR B: Browser Lain → PiSign Redirect
    try {
      // 1. Buat state anti-CSRF
      const array = new Uint8Array(16);
      window.crypto.getRandomValues(array);
      const state = Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
      
      // Simpan state untuk diverifikasi di halaman callback
      sessionStorage.setItem('pisign_state', state);

      // 2. Bangun URL dengan parameter yang BENAR
      const authUrl = new URL(CONFIG.PISIGN_SANDBOX_URL);
      authUrl.searchParams.set('client_id', CONFIG.CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', CONFIG.REDIRECT_URI);
      authUrl.searchParams.set('response_type', 'token');
      authUrl.searchParams.set('scope', CONFIG.SCOPE);
      authUrl.searchParams.set('state', state);

      console.log('➡️ Mengalihkan ke:', authUrl.toString());
      
      // 3. Redirect ke halaman login PiSign
      window.location.href = authUrl.toString();
      
    } catch (err: any) {
      alert(`❌ Gagal memulai login: ${err.message}`);
      setLoading(false);
    }
  }, [setPiUser]);

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-amber-700 via-amber-800 to-purple-900 text-white rounded-3xl p-8 md:p-12 shadow-lg">
        <div className="max-w-3xl space-y-4">
          <span className="bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            {isPiBrowser ? '🌐 Pi Browser Native' : '🔑 PiSign Multi-Browser Mode'}
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
                onClick={handleAuthenticate}
                disabled={loading || !initDone}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3.5 rounded-2xl transition shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isPiBrowser ? (
                  <Wallet className="w-5 h-5" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-yellow-300" />
                )}
                {loading ? 'Mengalihkan...' : isPiBrowser ? 'Hubungkan Pi Wallet' : 'Login via Pi Sign'}
              </button>
            )}

            <Link
              href="/products/1"
              className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-6 py-3.5 rounded-2xl transition shadow-md inline-block"
            >
              Jelajahi Produk
            </Link>
          </div>

          {!isPiBrowser && !piUser && initDone && (
            <div className="mt-3 text-sm text-yellow-200/90 flex items-center gap-2 bg-black/10 p-3 rounded-xl">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>Di Chrome/Safari? Klik <strong>"Login via Pi Sign"</strong> — akan terbuka halaman Pi untuk masuk.</span>
            </div>
          )}
        </div>
      </section>

      {/* Katalog Produk */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Produk Unggulan NTT</h2>
        <ProductGrid />
      </section>
    </div>
  );
}

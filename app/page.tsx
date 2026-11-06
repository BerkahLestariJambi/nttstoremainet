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

// ==========================================
// ⚙️ KONFIGURASI
// ==========================================
const CONFIG = {
  CLIENT_ID: 'I3j4kvxCJb0ZixCLzM5tgTV8TaKuN5oq1qQNAk14s9s',
  get REDIRECT_URI() {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/auth/callback`;
  },
  SCOPE: 'username payments',
  PISIGN_SANDBOX_URL: 'https://app-cdn.minepi.com/mobile-app-ui/app-auth-sandbox',
  IS_SANDBOX: true,
};

export default function HomePage() {
  const { piUser, setPiUser } = useCart();
  const [isPiBrowser, setIsPiBrowser] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [initDone, setInitDone] = useState<boolean>(false);

  // ==========================================
  // 🔄 INISIALISASI PI SDK
  // ==========================================
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 20;

    const checkPiReady = () => {
      attempts++;
      if (typeof window !== 'undefined' && window.Pi) {
        try {
          window.Pi.init({
            version: '2.0',
            sandbox: CONFIG.IS_SANDBOX,
          });
          setIsPiBrowser(true);
          console.log('✅ Pi SDK Siap');
        } catch (err) {
          console.warn('⚠️ Pi SDK Init Warning:', err);
        }
        setInitDone(true);
        return true;
      }
      if (attempts >= maxAttempts) {
        console.log('ℹ️ Gunakan PiSign Mode');
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

  // ==========================================
  // 🔐 FUNGSI AUTENTIKASI
  // ==========================================
  const handleAuthenticate = useCallback(async () => {
    setLoading(true);

    // 🌐 ALUR 1: PI BROWSER — NATIVE SDK
    if (typeof window !== 'undefined' && window.Pi) {
      console.log('🔐 Mulai Autentikasi Pi Browser...');
      try {
        const scopes = ['username', 'payments'];

        const authResult: any = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Waktu habis — tutup & buka ulang Pi Browser'));
          }, 20000);

          window.Pi.authenticate(
            scopes,
            (payment: any) => console.log('📌 Pembayaran belum selesai:', payment)
          )
          .then((result: any) => {
            clearTimeout(timeout);
            resolve(result);
          })
          .catch((err: any) => {
            clearTimeout(timeout);
            reject(err);
          });
        });

        console.log('✅ Login Berhasil — User:', authResult.user.username);
        setPiUser({
          username: authResult.user.username,
          accessToken: authResult.accessToken,
          uid: authResult.user.uid,
        });

      } catch (err: any) {
        console.error('❌ Error Autentikasi:', err);
        const pesan = err?.message || 'Gagal terhubung — coba lagi nanti';
        alert(`⚠️ ${pesan}`);
      } finally {
        setLoading(false);
      }
      return;
    }

    // 🔑 ALUR 2: BROWSER LAIN — PISIGN OAUTH
    try {
      console.log('🔑 Mulai PiSign OAuth...');

      const array = new Uint8Array(16);
      window.crypto.getRandomValues(array);
      const state = Array.from(array, b => b.toString(16).padStart(2, '0')).join();
      sessionStorage.setItem('pisign_state', state);

      const authUrl = new URL(CONFIG.PISIGN_SANDBOX_URL);
      authUrl.searchParams.set('client_id', CONFIG.CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', CONFIG.REDIRECT_URI);
      authUrl.searchParams.set('response_type', 'token');
      authUrl.searchParams.set('scope', CONFIG.SCOPE);
      authUrl.searchParams.set('state', state);

      console.log('➡️ Redirect ke:', authUrl.toString());
      window.location.href = authUrl.toString();

    } catch (err: any) {
      console.error('❌ Error PiSign:', err);
      alert(`❌ Gagal memulai login: ${err.message}`);
      setLoading(false);
    }
  }, [setPiUser]);

  // ==========================================
  // 🎨 TAMPILAN
  // ==========================================
  return (
    <div className="space-y-8">
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
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3.5 rounded-2xl transition shadow-md flex items-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isPiBrowser ? (
                  <Wallet className="w-5 h-5" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-yellow-300" />
                )}
                {loading ? 'Memproses...' : isPiBrowser ? 'Hubungkan Pi Wallet' : 'Login via Pi Sign'}
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
              <span>Di Chrome/Safari? Klik <strong>"Login via Pi Sign"</strong> untuk masuk dengan akun Pi.</span>
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Produk Unggulan NTT</h2>
        <ProductGrid />
      </section>
    </div>
  );
}

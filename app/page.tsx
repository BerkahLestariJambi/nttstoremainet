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

const CONFIG = {
  CLIENT_ID: process.env.NEXT_PUBLIC_PI_CLIENT_ID || 'I3j4kvxCJb0ZixCLzM5tgTV8TaKuN5oq1qQNAk14s9s',
  get REDIRECT_URI() {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/auth/callback`;
  },
  SCOPE: 'username payments',
  IS_SANDBOX: true,
};

export default function HomePage() {
  const { piUser, setPiUser } = useCart();
  const [isPiBrowser, setIsPiBrowser] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [initDone, setInitDone] = useState<boolean>(false);

  // ==========================================
  // 🔄 INISIALISASI & DETEKSI AKURAT PI BROWSER
  // ==========================================
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 10;

    const checkPiReady = () => {
      attempts++;
      if (typeof window !== 'undefined') {
        const userAgent = navigator.userAgent || '';
        // Memastikan aplikasi dibuka MURNI dari dalam Pi Browser App
        const isPiUA = userAgent.includes('PiBrowser');

        if (window.Pi && isPiUA) {
          try {
            window.Pi.init({
              version: '2.0',
              sandbox: CONFIG.IS_SANDBOX,
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
        console.log('ℹ️ Menggunakan Mode Browser Luar');
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
  // 🔐 FUNGSI AUTENTIKASI DUAL-MODE
  // ==========================================
  const handleAuthenticate = useCallback(async () => {
    setLoading(true);

    try {
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      const isPiUA = userAgent.includes('PiBrowser');

      // 🌐 ALUR 1: PI BROWSER APP — NATIVE SDK
      if (typeof window !== 'undefined' && window.Pi && isPiUA) {
        console.log('🔐 Mulai Autentikasi Native Pi SDK...');
        const scopes = ['username', 'payments'];

        const authResult: any = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Waktu habis — tutup & buka ulang Pi Browser'));
          }, 15000);

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

        setPiUser({
          username: authResult.user.username,
          accessToken: authResult.accessToken,
          uid: authResult.user.uid,
        });
        return;
      }

      // 🔑 ALUR 2: BROWSER LUAR (CHROME/SAFARI/ANDROID INTENT)
      console.log('🔑 Memproses Redirect Browser Luar...');

      // Fix .join('') agar tidak menghasilkan koma
      const array = new Uint8Array(16);
      window.crypto.getRandomValues(array);
      const state = Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');

      sessionStorage.setItem('pisign_state', state);
      sessionStorage.setItem('pi_oauth_state', state);

      const isAndroid = /Android/i.test(userAgent);
      const rawOauthUrl = `https://accounts.pinet.com/oauth/authorize?response_type=token&client_id=${encodeURIComponent(
        CONFIG.CLIENT_ID
      )}&redirect_uri=${encodeURIComponent(CONFIG.REDIRECT_URI)}&scope=${encodeURIComponent(
        CONFIG.SCOPE
      )}&state=${encodeURIComponent(state)}`;

      if (isAndroid) {
        // Direct Intent khusus Android untuk membuka package org.pinetwork.pi secara otomatis
        const directPiOAuthIntent = `intent://accounts.pinet.com/oauth/authorize?response_type=token&client_id=${encodeURIComponent(
          CONFIG.CLIENT_ID
        )}&redirect_uri=${encodeURIComponent(CONFIG.REDIRECT_URI)}&scope=${encodeURIComponent(
          CONFIG.SCOPE
        )}&state=${encodeURIComponent(
          state
        )}#Intent;scheme=https;package=org.pinetwork.pi;S.browser_fallback_url=${encodeURIComponent(
          rawOauthUrl
        )};end;`;

        window.location.href = directPiOAuthIntent;
      } else {
        // Fallback untuk iOS / Desktop
        const deepLink = `pi://${window.location.host}/auth/callback`;
        window.location.href = deepLink;
      }
    } catch (err: any) {
      console.error('❌ Error Autentikasi:', err);
      alert(`⚠️ ${err?.message || 'Gagal memulai login'}`);
    } finally {
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
                type="button"
                onClick={handleAuthenticate}
                disabled={loading || !initDone}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3.5 rounded-2xl transition shadow-md flex items-center gap-2 disabled:opacity-

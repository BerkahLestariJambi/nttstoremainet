'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import ProductGrid from '@/components/product/ProductGrid';
import { useCart } from '@/context/CartContext';
import { Wallet, CheckCircle2, ExternalLink } from 'lucide-react';

declare global {
  interface Window {
    Pi: any;
  }
}

export default function HomePage() {
  const { piUser, setPiUser } = useCart();
  const [isPiBrowser, setIsPiBrowser] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [piDeepLink, setPiDeepLink] = useState<string>('pi://nttstorepi.vercel.app');

  // Deteksi Presisi Pi Browser Native via Polling & User-Agent
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentHost = window.location.host + window.location.pathname;
      setPiDeepLink(`pi://${currentHost}`);

      let attempts = 0;
      const intervalId = setInterval(() => {
        attempts++;
        const userAgent = navigator.userAgent || '';
        // Hanya tandai sebagai Pi Browser jika UA mengandung string 'PiBrowser'
        const isPiUA = userAgent.includes('PiBrowser');

        if (window.Pi && isPiUA) {
          try {
            window.Pi.init({ version: '2.0', sandbox: true });
            setIsPiBrowser(true);
            clearInterval(intervalId);
          } catch (err) {
            console.error('Pi SDK Init error:', err);
          }
        }

        if (attempts >= 10) {
          clearInterval(intervalId);
        }
      }, 300);

      return () => clearInterval(intervalId);
    }
  }, []);

  // Handler Autentikasi Native SDK
  const handlePiAuthenticate = useCallback(async () => {
    if (typeof window !== 'undefined' && window.Pi) {
      setLoading(true);
      try {
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
      } catch (error: any) {
        alert(`Autentikasi Pi Browser gagal: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  }, [setPiUser]);

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-amber-700 via-amber-800 to-purple-900 text-white rounded-3xl p-8 md:p-12 shadow-lg">
        <div className="max-w-3xl space-y-4">
          <span className="bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            {isPiBrowser ? 'Pi Browser Ecosystem' : 'External Browser Mode'}
          </span>

          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">
            Selamat Datang di NTTStore<span className="text-yellow-400">Pi</span>
          </h1>

          <p className="text-lg opacity-90 leading-relaxed">
            Pusat belanja produk khas Nusa Tenggara Timur (Tenun Ikat, Kopi Flores, & Hasil Alam) menggunakan mata uang Pi Coin (π).
          </p>

          <div className="pt-4 flex flex-wrap gap-4 items-center">
            {piUser ? (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-5 py-3 rounded-2xl font-medium">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span>Terhubung sebagai <strong>@{piUser.username}</strong></span>
              </div>
            ) : isPiBrowser ? (
              /* Tombol Native untuk aplikasi Pi Browser */
              <button
                type="button"
                onClick={handlePiAuthenticate}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3.5 rounded-2xl transition shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                <Wallet className="w-5 h-5" />
                {loading ? 'Menghubungkan...' : 'Hubungkan Pi Wallet'}
              </button>
            ) : (
              /* Tombol Direct Link untuk Chrome / Safari biasa */
              <a
                href={piDeepLink}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3.5 rounded-2xl transition shadow-md flex items-center gap-2"
              >
                <ExternalLink className="w-5 h-5 text-yellow-300" />
                Buka di Pi Browser
              </a>
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

      {/* Katalog Produk Unggulan */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Produk Unggulan NTT</h2>
        <ProductGrid />
      </section>
    </div>
  );
}

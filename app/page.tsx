'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import ProductGrid from '@/components/product/ProductGrid';
import { useCart } from '@/context/CartContext';
import { Wallet, CheckCircle2, ShieldCheck, AlertCircle, ExternalLink } from 'lucide-react';

declare global {
  interface Window {
    Pi: any;
  }
}

export default function HomePage() {
  const { piUser, setPiUser } = useCart();
  const [isPiBrowser, setIsPiBrowser] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Polling deteksi Pi SDK Native (Memastikan window.Pi terdeteksi jika dibuka di Pi Browser)
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let attempts = 0;

    const checkAndInitPi = () => {
      attempts++;
      if (typeof window !== 'undefined') {
        const userAgent = navigator.userAgent || '';
        const isPiUA = userAgent.includes('PiBrowser') || Boolean(window.Pi);

        if (window.Pi && isPiUA) {
          try {
            window.Pi.init({ version: '2.0', sandbox: true });
            setIsPiBrowser(true);
            clearInterval(intervalId);
          } catch (err) {
            console.error('Pi SDK Init error:', err);
          }
        }
      }

      if (attempts >= 10) {
        clearInterval(intervalId);
      }
    };

    checkAndInitPi();
    intervalId = setInterval(checkAndInitPi, 300);

    return () => clearInterval(intervalId);
  }, []);

  const handleAuthenticate = useCallback(async () => {
    setLoading(true);

    // 1. ALUR NATIVE SDK: Jika dibuka dari Pi Browser App
    if (typeof window !== 'undefined' && window.Pi) {
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
      return;
    }

    // 2. ALUR DEEP LINK / FALLBACK: Jika dibuka dari Chrome/Safari biasa
    setLoading(false);
    
    // Arahkan otomatis membuka domain ini di Pi Browser App
    const targetUrl = window.location.href.replace(/^https?:\/\//, '');
    window.location.href = `pi://${targetUrl}`;
  }, [setPiUser]);

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-amber-700 via-amber-800 to-purple-900 text-white rounded-3xl p-8 md:p-12 shadow-lg">
        <div className="max-w-3xl space-y-4">
          <span className="bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            {isPiBrowser ? 'Pi Browser Native' : 'External Browser Mode'}
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
            ) : (
              <button
                type="button"
                onClick={handleAuthenticate}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3.5 rounded-2xl transition shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {isPiBrowser ? <Wallet className="w-5 h-5" /> : <ExternalLink className="w-5 h-5 text-yellow-300" />}
                {loading ? 'Menyiapkan...' : isPiBrowser ? 'Hubungkan Pi Wallet' : 'Buka di Pi Browser'}
              </button>
            )}

            <Link
              href="/products/1"
              className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-6 py-3.5 rounded-2xl transition shadow-md inline-block"
            >
              Jelajahi Produk
            </Link>
          </div>

          {!isPiBrowser && !piUser && (
            <div className="mt-2 text-xs text-yellow-200/80 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> Buka via Chrome/Safari? Klik <strong>Buka di Pi Browser</strong> di atas untuk bertransaksi.
            </div>
          )}
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

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProductGrid from '@/components/product/ProductGrid';
import { useCart } from '@/context/CartContext';
import { Wallet, CheckCircle2, AlertCircle } from 'lucide-react';

declare global {
  interface Window {
    Pi: any;
  }
}

export default function HomePage() {
  const { piUser, setPiUser } = useCart();
  const [isPiBrowser, setIsPiBrowser] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    // Inisialisasi Pi SDK saat halaman dimuat
    if (typeof window !== 'undefined' && window.Pi) {
      try {
        window.Pi.init({ version: '2.0', sandbox: true }); // Set sandbox: false untuk Mainnet
      } catch (err) {
        console.error('Pi SDK Init error:', err);
      }
    } else {
      setIsPiBrowser(false);
    }
  }, []);

  // Fungsi Autentikasi Pi User
  const handleAuthenticate = async () => {
    if (typeof window === 'undefined' || !window.Pi) {
      alert('Harap buka situs ini di dalam aplikasi Pi Browser untuk melakukan autentikasi Pi Network!');
      return;
    }

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
    } catch (error) {
      console.error('Autentikasi Pi gagal:', error);
      alert('Gagal menghubungkan ke akun Pi. Pastikan Anda mengizinkan akses di Pi Browser.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner dengan Integrasi SDK Pi */}
      <section className="bg-gradient-to-r from-amber-700 via-amber-800 to-purple-900 text-white rounded-3xl p-8 md:p-12 shadow-lg">
        <div className="max-w-3xl space-y-4">
          <span className="bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Pi Ecosystem NTT
          </span>

          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">
            Selamat Datang di NTTStore<span className="text-yellow-400">Pi</span>
          </h1>

          <p className="text-lg opacity-90 leading-relaxed">
            Pusat belanja produk lokal khas Nusa Tenggara Timur (Tenun Ikat, Kopi Flores, & Hasil Alam) menggunakan mata uang Pi Coin (π).
          </p>

          {/* Banner Status Autentikasi Pi */}
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
                <Wallet className="w-5 h-5" />
                {loading ? 'Menghubungkan...' : 'Hubungkan Pi Wallet'}
              </button>
            )}

            <Link
              href="/products/1"
              className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-6 py-3.5 rounded-2xl transition shadow-md inline-block"
            >
              Jelajahi Produk
            </Link>
          </div>

          {!isPiBrowser && (
            <div className="mt-2 text-xs text-yellow-200/80 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> Buka situs ini melalui <strong>Pi Browser</strong> untuk mengaktifkan dompet Pi secara penuh.
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

'use client';

import { useEffect, useState, useCallback } from 'react';
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
  const [isPiBrowser, setIsPiBrowser] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let attempts = 0;

    const checkAndInitPi = () => {
      attempts++;
      if (typeof window !== 'undefined' && window.Pi) {
        try {
          // Inisialisasi SDK Pi Network Mode Sandbox
          window.Pi.init({ version: '2.0', sandbox: true });
          setIsPiBrowser(true);
          clearInterval(intervalId);
        } catch (err) {
          console.error('Pi SDK Init Error:', err);
        }
      } else if (attempts >= 10) {
        clearInterval(intervalId);
      }
    };

    checkAndInitPi();
    intervalId = setInterval(checkAndInitPi, 500);

    return () => clearInterval(intervalId);
  }, []);

  const handleAuthenticate = useCallback(async () => {
    if (typeof window === 'undefined' || !window.Pi) {
      alert('Harap buka situs ini di dalam Pi Browser!');
      return;
    }

    setLoading(true);

    try {
      const scopes = ['username', 'payments'];

      // Handler pembayaran tertunda (harus mengembalikan/menyelesaikan flow agar tidak hung)
      const onIncompletePaymentFound = (payment: any) => {
        console.warn('Incomplete payment found on auth:', payment);
        // Kirim transaksi ke backend untuk di-complete/cancel jika ada yang menggantung
      };

      // Set timeout jika Pi SDK tidak merespons dalam 12 detik
      const authPromise = window.Pi.authenticate(scopes, onIncompletePaymentFound);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Waktu autentikasi habis (Timeout). Pastikan Pi Sandbox aktif di Pi Browser!')), 12000)
      );

      const auth: any = await Promise.race([authPromise, timeoutPromise]);

      if (auth && auth.user) {
        setPiUser({
          username: auth.user.username,
          accessToken: auth.accessToken,
          uid: auth.user.uid,
        });
      }
    } catch (error: any) {
      console.error('Autentikasi Pi Gagal:', error);
      alert(`Gagal terhubung: ${error.message || 'Periksa koneksi & sakelar Sandbox di Pi Browser.'}`);
    } finally {
      setLoading(false);
    }
  }, [setPiUser]);

  return (
    <div className="space-y-8">
      <section className="bg-gradient-to-r from-amber-700 via-amber-800 to-purple-900 text-white rounded-3xl p-8 md:p-12 shadow-lg">
        <div className="max-w-3xl space-y-4">
          <span className="bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Pi Ecosystem NTT
          </span>

          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">
            Selamat Datang di NTTStore<span className="text-yellow-400">Pi</span>
          </h1>

          <p className="text-lg opacity-90 leading-relaxed">
            Pusat belanja produk lokal khas Nusa Tenggara Timur menggunakan Pi Coin (π).
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
                <Wallet className="w-5 h-5" />
                {loading ? 'Proses Autentikasi...' : 'Hubungkan Pi Wallet'}
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
              <AlertCircle className="w-4 h-4" /> Buka situs ini via <strong>Pi Browser</strong> untuk otentikasi dompet.
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

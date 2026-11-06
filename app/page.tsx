'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import ProductGrid from '@/components/product/ProductGrid';
import PiSignModal from '@/components/auth/PiSignModal';
import { useCart } from '@/context/CartContext';
import { Wallet, CheckCircle2, QrCode } from 'lucide-react';

declare global {
  interface Window {
    Pi: any;
  }
}

export default function HomePage() {
  const { piUser, setPiUser } = useCart();
  const [isPiBrowser, setIsPiBrowser] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [showPiSignModal, setShowPiSignModal] = useState<boolean>(false);
  const [piSignUrl, setPiSignUrl] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Pi) {
      try {
        window.Pi.init({ version: '2.0', sandbox: true });
        setIsPiBrowser(true);
      } catch (err) {
        console.error('Pi SDK Init error:', err);
      }
    }
  }, []);

  const handleAuthenticate = useCallback(async () => {
    setLoading(true);

    // 1. OPSI A: Jika dibuka dari Pi Browser -> Gunakan Native Pi SDK
    if (typeof window !== 'undefined' && window.Pi) {
      try {
        const scopes = ['username', 'payments'];
        const onIncompletePaymentFound = (payment: any) => {
          console.warn('Incomplete payment:', payment);
        };

        const auth = await window.Pi.authenticate(scopes, onIncompletePaymentFound);
        setPiUser({
          username: auth.user.username,
          accessToken: auth.accessToken,
          uid: auth.user.uid,
        });
      } catch (error: any) {
        alert(`Autentikasi gagal: ${error.message}`);
      } finally {
        setLoading(false);
      }
      return;
    }

    // 2. OPSI B: Jika dibuka dari Chrome/Safari biasa -> Gunakan Pi Sign QR Code Flow
    try {
      // Panggil backend Laravel untuk request Sesi Auth Pi Sign
      const res = await fetch('http://localhost:8000/api/pi-sign/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      if (data.sign_url) {
        setPiSignUrl(data.sign_url);
        setShowPiSignModal(true);
        startPollingAuthStatus(data.session_id);
      }
    } catch (err) {
      alert('Gagal membuat sesi Pi Sign. Pastikan backend Laravel berjalan.');
    } finally {
      setLoading(false);
    }
  }, [setPiUser]);

  // Polling ke backend Laravel sampai user melakukan scan QR di Pi Wallet
  const startPollingAuthStatus = (sessionId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/pi-sign/check-status/${sessionId}`);
        const data = await res.json();

        if (data.authenticated) {
          setPiUser(data.user);
          setShowPiSignModal(false);
          clearInterval(interval);
        }
      } catch (e) {
        console.error('Polling error:', e);
      }
    }, 2500);
  };

  return (
    <div className="space-y-8">
      <section className="bg-gradient-to-r from-amber-700 via-amber-800 to-purple-900 text-white rounded-3xl p-8 md:p-12 shadow-lg">
        <div className="max-w-3xl space-y-4">
          <span className="bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Pi Ecosystem Multi-Browser Ready
          </span>

          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">
            Selamat Datang di NTTStore<span className="text-yellow-400">Pi</span>
          </h1>

          <p className="text-lg opacity-90 leading-relaxed">
            Belanja produk khas NTT via Pi Browser atau Browser biasa (Chrome/Safari) dengan teknologi Pi Sign QR.
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
                {isPiBrowser ? <Wallet className="w-5 h-5" /> : <QrCode className="w-5 h-5" />}
                {loading ? 'Menyiapkan...' : isPiBrowser ? 'Hubungkan Pi Wallet' : 'Login via Pi Sign (QR)'}
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

      {/* Modal QR Code Pi Sign */}
      <PiSignModal
        isOpen={showPiSignModal}
        onClose={() => setShowPiSignModal(false)}
        piSignUrl={piSignUrl}
      />
    </div>
  );
}

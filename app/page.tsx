'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import ProductGrid from '@/components/product/ProductGrid';
import { useCart } from '@/context/CartContext';
import { Wallet, CheckCircle2, ShieldCheck } from 'lucide-react';

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
    // Pengecekan apakah halaman dibuka dari dalam Pi Browser Native SDK
    let intervalId: NodeJS.Timeout;
    let attempts = 0;

    const checkAndInitPi = () => {
      attempts++;
      if (typeof window !== 'undefined' && window.Pi) {
        try {
          window.Pi.init({ version: '2.0', sandbox: true }); // Uji coba via Sandbox
          setIsPiBrowser(true);
          clearInterval(intervalId);
        } catch (err) {
          console.error('Pi SDK Init error:', err);
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
    setLoading(true);

    // ==========================================
    // ALUR 1: Jika Dibuka di Pi Browser (Native SDK)
    // ==========================================
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

    // ==========================================
    // ALUR 2: Jika Dibuka di Chrome/Safari (Pi Sign OAuth Flow)
    // ==========================================
    try {
      // 1. Generate State Acak untuk Proteksi CSRF
      const array = new Uint8Array(16);
      window.crypto.getRandomValues(array);
      const state = Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');

      // 2. Simpan State di sessionStorage untuk Diverifikasi di halaman /auth/callback
      sessionStorage.setItem('pisign_state', state);

      // 3. Konfigurasi Parameter Otorisasi Pi Sign
      const clientId = 'nttstorepi'; // Ganti dengan Client ID / App ID dari Pi Developer Portal
      const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback`);
      const scope = encodeURIComponent('username payments');

      // 4. Redirect User ke Halaman Otorisasi Pi Sign
      const piSignAuthUrl = `https://app-cdn.minepi.com/mobile-app-ui/app-auth-sandbox?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}&state=${state}`;

      window.location.href = piSignAuthUrl;
    } catch (err: any) {
      alert(`Gagal menginisiasi Pi Sign: ${err.message}`);
      setLoading(false);
    }
  }, [setPiUser]);

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-amber-700 via-amber-800 to-purple-900 text-white rounded-3xl p-8 md:p-12 shadow-lg">
        <div className="max-w-3xl space-y-4">
          <span className="bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            {isPiBrowser ? 'Pi Browser Mode' : 'Pi Sign Multi-Browser Supported'}
          </span>

          <h1 className="text

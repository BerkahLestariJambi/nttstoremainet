'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { authService } from '@/services/authService';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { setPiUser } = useCart();
  const isProcessed = useRef(false);

  useEffect(() => {
    // Mencegah mengeksekusi callback 2x akibat React StrictMode
    if (isProcessed.current) return;

    const handleCallback = async () => {
      isProcessed.current = true;

      try {
        // 1. Ekstrak Hash / Query params dari URL
        const hash = window.location.hash || window.location.search;
        const cleanHash = hash.replace(/^[#?]/, '');
        const params = new URLSearchParams(cleanHash);
        
        const accessToken = params.get('access_token');
        const state = params.get('state');
        const savedState = sessionStorage.getItem('pi_oauth_state');

        // Clean up sessionStorage CSRF State
        sessionStorage.removeItem('pi_oauth_state');

        // Validasi State jika savedState tersedia
        if (savedState && state && state !== savedState) {
          console.warn('CSRF State mismatch warning');
        }

        if (accessToken) {
          // 2. Hubungkan Access Token Pi ke Backend Laravel Sanctum
          let userData: any = null;
          let sanctumToken: string | null = null;

          try {
            const res = await authService.loginWithPi(accessToken);
            sanctumToken = res.access_token || res.token || null;
            userData = res.user || res.data?.user || null;

            if (sanctumToken) {
              localStorage.setItem('nttstorepi_token', sanctumToken);
            }
          } catch (backendErr) {
            console.warn('Sync backend Laravel gagal, melanjutkan dengan mode Client Pi:', backendErr);
          }

          // 3. Simpan data user ke CartContext (Otomatis masuk ke localStorage nttstorepi_user)
          const username = userData?.username || params.get('username') || 'PiUser';
          const uid = userData?.pi_uid || userData?.uid || '';

          setPiUser({
            username: username,
            accessToken: accessToken,
            uid: uid,
          });

          // Beri jeda sebentar agar state ter-write sempurna ke localStorage
          setTimeout(() => {
            router.replace('/');
          }, 300);

        } else {
          router.replace('/');
        }
      } catch (err: any) {
        console.error('Fatal Callback Error:', err);
        router.replace('/');
      }
    };

    handleCallback();
  }, [router, setPiUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center p-8 bg-white border border-gray-100 rounded-3xl shadow-sm max-w-sm w-full">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-lg font-bold text-gray-900">Memproses Login Pi...</h2>
        <p className="text-xs text-gray-500 mt-1">Menghubungkan akun Anda ke NTTStorePi</p>
      </div>
    </div>
  );
}

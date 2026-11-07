'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { authService } from '@/services/authService';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { setPiUser } = useCart();

  useEffect(() => {
    const handleCallback = async () => {
      // 1. Tangkap hash (#access_token=...) dari URL Pi OAuth
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.replace('#', '?'));
      const accessToken = params.get('access_token');
      const state = params.get('state');
      const savedState = sessionStorage.getItem('pi_oauth_state');

      // Validasi CSRF state
      if (state && savedState && state !== savedState) {
        alert('Invalid OAuth State');
        router.push('/');
        return;
      }

      if (accessToken) {
        try {
          // 2. Login ke Backend Laravel Sanctum untuk mendapatkan user data & JWT/Sanctum token
          const res = await authService.loginWithPi(accessToken);

          if (res.access_token) {
            localStorage.setItem('nttstorepi_token', res.access_token);
          }

          // 3. Simpan data user ke CartContext (Otomatis masuk localStorage)
          setPiUser({
            username: res.user?.username || 'PiUser',
            accessToken: accessToken,
            uid: res.user?.pi_uid || '',
          });

        } catch (err: any) {
          console.error('Callback error:', err);
        } finally {
          // 4. Kembali ke Halaman Utama dengan status terhubung
          router.push('/');
        }
      } else {
        router.push('/');
      }
    };

    handleCallback();
  }, [router, setPiUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white border border-gray-100 rounded-3xl shadow-sm">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-lg font-bold text-gray-900">Memproses Login Pi...</h2>
        <p className="text-xs text-gray-500 mt-1">Menghubungkan akun Anda ke NTTStorePi</p>
      </div>
    </div>
  );
}

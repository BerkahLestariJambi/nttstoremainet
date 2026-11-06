'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { useCart } from '@/context/CartContext';

export default function CallbackPage() {
  const router = useRouter();
  const isProcessedRef = useRef(false);
  const { setPiUser } = useCart();
  const [statusText, setStatusText] = useState('Memproses verifikasi Pi Sign-in...');

  useEffect(() => {
    if (isProcessedRef.current) return;
    isProcessedRef.current = true;

    const handleOAuthCallback = async () => {
      try {
        // 1. Ambil URL Fragment (Bagian setelah #) sesuai Bagian 5 Panduan Resmi
        const fragment = window.location.hash.slice(1);
        const params = new URLSearchParams(fragment);

        const accessToken = params.get('access_token');
        const returnedState = params.get('state');
        const error = params.get('error');

        // 2. Verifikasi State CSRF
        const expectedState = sessionStorage.getItem('pi_oauth_state');
        sessionStorage.removeItem('pi_oauth_state');

        if (returnedState && expectedState && returnedState !== expectedState) {
          throw new Error('Sesi login tidak valid (State mismatch / CSRF risk).');
        }

        // 3. Cek Error Response
        if (error) {
          const errorMessages: Record<string, string> = {
            access_denied: 'Pengguna menolak izin masuk.',
            expired: 'Waktu permintaan login telah habis.',
            cancelled: 'Login dibatalkan oleh pengguna.',
            server_error: 'Terjadi kesalahan pada server Pi Network.',
          };
          throw new Error(errorMessages[error] || `Gagal login: ${error}`);
        }

        if (!accessToken) {
          throw new Error('Access token tidak ditemukan dalam respon Pi Network.');
        }

        setStatusText('Mendapatkan identitas terverifikasi dari Pi Network...');

        // 4. Panggil Endpoint GET https://api.minepi.com/v2/me sesuai Bagian 2 Panduan Resmi
        const res = await fetch('https://api.minepi.com/v2/me', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) {
          throw new Error('Gagal mengambil data profil dari server Pi API.');
        }

        const me = await res.json(); // Mengembalikan { uid, username, wallet_address (opsional) }

        // 5. Simpan Identitas Pengguna ke App State
        const piUserData = {
          username: me.username,
          accessToken: accessToken,
          uid: me.uid,
          walletAddress: me.wallet_address || null,
        };

        setPiUser(piUserData);
        localStorage.setItem('pi_user', JSON.stringify(piUserData));
        localStorage.setItem('usernamePi', me.username);

        // Bersihkan token dari URL agar tidak tersisa di history browser (Bagian 5 Panduan)
        window.history.replaceState(null, '', window.location.pathname);

        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Login Berhasil!',
          text: `Selamat datang kembali, @${me.username}!`,
          showConfirmButton: false,
          timer: 2500,
        });

        router.push('/');
      } catch (err: any) {
        console.error('Pi Sign-in Error:', err);
        setStatusText('Gagal melakukan autentikasi.');

        Swal.fire({
          icon: 'error',
          title: 'Autentikasi Gagal',
          text: err?.message || 'Terjadi kesalahan saat memproses login.',
          confirmButtonText: 'Kembali ke Beranda',
        }).then(() => {
          router.push('/');
        });
      }
    };

    handleOAuthCallback();
  }, [router, setPiUser]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full" />
        <h2 className="text-lg font-semibold text-gray-900">{statusText}</h2>
        <p className="text-sm text-gray-500">Mohon tunggu sebentar, jangan tutup halaman ini.</p>
      </div>
    </div>
  );
}

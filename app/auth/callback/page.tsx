'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function PiSignCallbackPage() {
  const router = useRouter();
  const { setPiUser } = useCart();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // 1. Ambil URL Fragment Hash (#access_token=...&state=...)
        const hash = window.location.hash.substring(1);
        if (!hash) {
          throw new Error('Fragment otentikasi tidak ditemukan.');
        }

        const params = new URLSearchParams(hash);

        // 2. Verifikasi State untuk Mencegah Serangan CSRF
        const stateFromUrl = params.get('state');
        const savedState = sessionStorage.getItem('pisign_state');

        if (!stateFromUrl || stateFromUrl !== savedState) {
          throw new Error('State mismatch — kemungkinan serangan CSRF. Autentikasi dibatalkan.');
        }

        // Hapus state dari sessionStorage setelah diverifikasi
        sessionStorage.removeItem('pisign_state');

        // 3. Cek Error dari Response OAuth
        const error = params.get('error');
        if (error) {
          throw new Error(`Otorisasi Pi Sign ditolak/gagal: ${error}`);
        }

        const accessToken = params.get('access_token');
        if (!accessToken) {
          throw new Error('Access token tidak ditemukan di URL callback.');
        }

        // 4. Panggil API Pi Platform /v2/me Menggunakan Access Token
        const meResponse = await fetch('https://api.minepi.com/v2/me', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!meResponse.ok) {
          throw new Error('Gagal mengambil data profil dari Server Pi Network.');
        }

        const me = await meResponse.json();

        // 5. Simpan Data User ke CartContext
        setPiUser({
          username: me.username,
          accessToken: accessToken,
          uid: me.uid,
        });

        // 6. Hapus Token dari Address Bar Browser History demi Keamanan
        window.history.replaceState(null, '', window.location.pathname);

        setStatus('success');

        // Redirect Kembali ke Halaman Utam
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } catch (err: any) {
        console.error('PiSign Callback Error:', err);
        setErrorMessage(err.message || 'Terjadi kesalahan saat memverifikasi Pi Sign.');
        setStatus('error');
      }
    };

    handleCallback();
  }, [router, setPiUser]);

  return (
    <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-gray-100 shadow-sm text-center space-y-4">
      {status === 'loading' && (
        <>
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto" />
          <h2 className="text-xl font-bold text-gray-900">Memverifikasi Pi Sign...</h2>
          <p className="text-xs text-gray-500">Mohon tunggu sebentar, sedang menghubungkan dompet Pi Anda.</p>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
          <h2 className="text-xl font-bold text-gray-900">Login Pi Sign Berhasil!</h2>
          <p className="text-xs text-gray-500">Mengalihkan kembali ke toko...</p>
        </>
      )}

      {status === 'error' && (
        <>
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-gray-900">Verifikasi Gagal</h2>
          <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
            {errorMessage}
          </p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="mt-4 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition"
          >
            Kembali ke Beranda
          </button>
        </>
      )}
    </div>
  );
}

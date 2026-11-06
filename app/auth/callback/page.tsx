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
        // 1. Ambil fragment hash dari URL (misal: #access_token=...&state=...)
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);

        const stateFromUrl = params.get('state');
        const savedState = sessionStorage.getItem('pisign_state');

        // 2. Verifikasi State (Mencegah CSRF)
        if (!stateFromUrl || stateFromUrl !== savedState) {
          throw new Error('State mismatch — kemungkinan serangan CSRF. Login dibatalkan.');
        }

        // Hapus state dari storage setelah diverifikasi
        sessionStorage.removeItem('pisign_state');

        // 3. Cek apakah ada error dari Pi OAuth
        const error = params.get('error');
        if (error) {
          throw new Error(`Pi Sign Gagal: ${error}`);
        }

        const accessToken = params.get('access_token');
        if (!accessToken) {
          throw new Error('Access token tidak ditemukan di URL.');
        }

        // 4. Verifikasi Token ke Pi API /v2/me
        const res = await fetch('https://api.minepi.com/v2/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!res.ok) {
          throw new Error('Gagal mengambil data profil dari Server Pi Platform.');
        }

        const me = await res.json(); // Data me: { uid, username }

        // 5. Simpan User di Context
        setPiUser({
          username: me.username,
          accessToken: accessToken,
          uid: me.uid,
        });

        // 6. Bersihkan Token dari URL Browser History
        window.history.replaceState(null, '', window.location.pathname);

        setStatus('success');
        setTimeout(() => router.push('/'), 1500);
      } catch (err: any) {
        console.error(err);
        setErrorMessage(err.message || 'Terjadi kesalahan saat otentikasi.');
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
          <h2 className="text-xl font-bold text-gray-900">Memverifikasi Login PiSign...</h2>
          <p className="text-xs text-gray-500">Mohon tunggu sebentar.</p>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
          <h2 className="text-xl font-bold text-gray-900">Login PiSign Berhasil!</h2>
          <p className="text-xs text-gray-500">Mengalihkan ke halaman utama...</p>
        </>
      )}

      {status === 'error' && (
        <>
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-gray-900">Gagal Memverifikasi</h2>
          <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl">{errorMessage}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-xl"
          >
            Kembali ke Beranda
          </button>
        </>
      )}
    </div>
  );
}

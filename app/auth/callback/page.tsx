'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { CheckCircle, AlertTriangle, Loader2, ArrowRight, Home } from 'lucide-react';

export default function AuthCallbackPage() {
  const { setPiUser } = useCart();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Memproses login...');
  const [errorDetail, setErrorDetail] = useState('');

  // Ekstrak parameter dari URL hash
  const parseHashParams = useCallback(() => {
    if (typeof window === 'undefined') return null;
    
    const hash = window.location.hash.substring(1); // Hapus # di depan
    if (!hash) return null;

    const params = new URLSearchParams(hash);
    return {
      accessToken: params.get('access_token'),
      tokenType: params.get('token_type'),
      expiresIn: params.get('expires_in'),
      state: params.get('state'),
      error: params.get('error'),
      errorDescription: params.get('error_description'),
    };
  }, []);

  useEffect(() => {
    const processCallback = async () => {
      try {
        const params = parseHashParams();
        
        if (!params) {
          setStatus('error');
          setMessage('Tidak ada data login yang diterima');
          setErrorDetail('URL tidak berisi parameter autentikasi');
          return;
        }

        // ❌ Tangkap error dari PiSign
        if (params.error) {
          setStatus('error');
          setMessage('Login ditolak atau gagal');
          setErrorDetail(`${params.error}: ${params.errorDescription}`);
          return;
        }

        // ✅ Verifikasi state (anti-CSRF)
        const savedState = sessionStorage.getItem('pisign_state');
        if (!savedState || params.state !== savedState) {
          setStatus('error');
          setMessage('Verifikasi keamanan gagal');
          setErrorDetail('State tidak cocok — coba login ulang');
          return;
        }

        if (!params.accessToken) {
          setStatus('error');
          setMessage('Token akses tidak ditemukan');
          return;
        }

        // ✅ Bersihkan state yang sudah dipakai
        sessionStorage.removeItem('pisign_state');

        // 🔍 Ambil info user dari API Pi
        const userRes = await fetch('https://api.minepi.com/v2/me', {
          headers: { Authorization: `Bearer ${params.accessToken}` },
        });

        if (!userRes.ok) throw new Error('Gagal mengambil data pengguna');
        const userData = await userRes.json();

        // ✅ Simpan ke Context
        setPiUser({
          username: userData.username,
          uid: userData.uid,
          accessToken: params.accessToken,
        });

        setStatus('success');
        setMessage(`Selamat datang, @${userData.username}!`);

        // 🔄 Redirect ke beranda setelah 2 detik
        setTimeout(() => window.location.href = '/', 2500);

      } catch (err: any) {
        setStatus('error');
        setMessage('Terjadi kesalahan saat memproses login');
        setErrorDetail(err.message);
      }
    };

    processCallback();
  }, [parseHashParams, setPiUser]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center space-y-6">
        
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-purple-600 mx-auto animate-spin" />
            <h2 className="text-xl font-bold text-gray-800">Memproses Login</h2>
            <p className="text-gray-500">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Berhasil Masuk!</h2>
            <p className="text-green-600 font-medium">{message}</p>
            <p className="text-sm text-gray-400">Mengalihkan ke beranda...</p>
            <Link href="/" className="inline-flex items-center gap-2 text-purple-600 font-medium hover:underline">
              Kembali sekarang <ArrowRight className="w-4 h-4" />
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Login Gagal</h2>
            <p className="text-red-600">{message}</p>
            {errorDetail && (
              <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">ℹ️ {errorDetail}</p>
            )}
            <Link href="/" className="inline-flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-purple-500">
              <Home className="w-4 h-4" /> Kembali ke Beranda
            </Link>
          </>
        )}
        
      </div>
    </div>
  );
}

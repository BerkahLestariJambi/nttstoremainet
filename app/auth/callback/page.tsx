'use client';


import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { CheckCircle, AlertTriangle, Loader2, ArrowRight, Home, RefreshCw } from 'lucide-react';

export default function AuthCallbackPage() {
  const { setPiUser } = useCart();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Sedang memverifikasi login...');
  const [errorDetail, setErrorDetail] = useState('');
  const [countdown, setCountdown] = useState(3);

  // Ekstrak parameter dari URL hash
  const parseHashParams = useCallback(() => {
    if (typeof window === 'undefined') return null;
    
    const hash = window.location.hash.substring(1);
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

  // Hitung mundur redirect
  useEffect(() => {
    if (status !== 'success') return;
    if (countdown <= 0) {
      window.location.href = '/';
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [status, countdown]);

  useEffect(() => {
    const processCallback = async () => {
      try {
        const params = parseHashParams();
        
        if (!params) {
          setStatus('error');
          setMessage('Tidak ada data login yang diterima');
          setErrorDetail('Pastikan Anda tidak menutup halaman ini saat proses berjalan');
          return;
        }

        // Error dari PiSign
        if (params.error) {
          setStatus('error');
          setMessage('Login ditolak atau dibatalkan');
          setErrorDetail(`${params.error}: ${params.errorDescription || 'Coba ulangi proses login'}`);
          return;
        }

        // Verifikasi State
        const savedState = sessionStorage.getItem('pisign_state');
        if (!savedState) {
          setStatus('error');
          setMessage('Sesi login sudah habis');
          setErrorDetail('Silakan login ulang dari halaman utama');
          return;
        }
        if (params.state !== savedState) {
          setStatus('error');
          setMessage('Verifikasi keamanan gagal');
          setErrorDetail('Parameter state tidak cocok — coba login ulang');
          return;
        }

        if (!params.accessToken) {
          setStatus('error');
          setMessage('Token akses tidak ditemukan');
          setErrorDetail('Tidak dapat melanjutkan proses login');
          return;
        }

        // Bersihkan state
        sessionStorage.removeItem('pisign_state');

        // Ambil info user dari API Pi
        setMessage('Mengambil data akun...');
        const userRes = await fetch('https://api.minepi.com/v2/me', {
          headers: { Authorization: `Bearer ${params.accessToken}` },
        });

        if (!userRes.ok) throw new Error(`Server merespons dengan kode: ${userRes.status}`);
        const userData = await userRes.json();

        // Simpan ke Context
        setPiUser({
          username: userData.username,
          uid: userData.uid,
          accessToken: params.accessToken,
        });

        setMessage(`Selamat datang, @${userData.username}!`);
        setStatus('success');

      } catch (err: any) {
        console.error('❌ Callback Error:', err);
        setStatus('error');
        setMessage('Terjadi kesalahan saat memproses login');
        setErrorDetail(err.message || 'Silakan coba lagi nanti');
      }
    };

    processCallback();
  }, [parseHashParams, setPiUser]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center space-y-6">
        
        {status === 'loading' && (
          <>
            <div className="py-4">
              <Loader2 className="w-16 h-16 text-purple-600 mx-auto animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Memproses Login</h2>
            <p className="text-gray-500">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">✅ Berhasil Masuk!</h2>
            <p className="text-green-600 font-medium text-lg">{message}</p>
            <p className="text-sm text-gray-400">Mengalihkan ke beranda dalam <strong>{countdown}</strong> detik...</p>
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
            <h2 className="text-xl font-bold text-gray-800">❌ Login Gagal</h2>
            <p className="text-red-600">{message}</p>
            {errorDetail && (
              <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg text-left">ℹ️ {errorDetail}</p>
            )}
            <div className="pt-2 space-y-3">
              <Link href="/" className="inline-flex items-center justify-center gap-2 w-full bg-purple-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-purple-500">
                <Home className="w-4 h-4" /> Kembali ke Beranda
              </Link>
              <button 
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center gap-2 w-full text-gray-600 px-5 py-2 rounded-xl border border-gray-200 hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4" /> Coba Lagi
              </button>
            </div>
          </>
        )}
        
      </div>
    </div>
  );
}

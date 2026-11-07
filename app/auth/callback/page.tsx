// app/auth/callback/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace('#', '?'));
    const accessToken = params.get('access_token');
    const state = params.get('state');
    const savedState = sessionStorage.getItem('pi_oauth_state');

    if (state && state === savedState && accessToken) {
      // Login ke Backend Laravel menggunakan Access Token dari Pi
      authService.loginWithPi(accessToken)
        .then((res) => {
          if (res.access_token) {
            localStorage.setItem('nttstorepi_token', res.access_token);
          }
          router.push('/');
        })
        .catch((err) => {
          console.error(err);
          router.push('/');
        });
    } else {
      router.push('/');
    }
  }, [router]);

  return <div className="p-12 text-center">Memproses Login Pi...</div>;
}

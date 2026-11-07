// lib/apiClient.ts

// Set Base URL terpusat
export const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://nttstorepi.mejatika.com/api';

/**
 * Custom Fetch Client dengan Base URL otomatis & Otomatisasi Header Multipart/JSON
 */
export async function apiClient<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Pastikan endpoint diawali dengan slash `/`
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Ambil Token Sanctum jika tersimpan di browser
  const token = typeof window !== 'undefined' ? localStorage.getItem('nttstorepi_token') : null;

  // Cek apakah body bertipe FormData
  const isFormData = options.body instanceof FormData;

  // Susun headers dasar
  const customHeaders: Record<string, string> = {
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };

  // Hanya set Content-Type: application/json jika BUKAN FormData
  if (!isFormData) {
    customHeaders['Content-Type'] = 'application/json';
  }

  // Gabungkan dengan custom headers dari options (jika ada)
  const headers: HeadersInit = {
    ...customHeaders,
    ...(options.headers as Record<string, string>),
  };

  // Hapus Content-Type jika options.headers secara tidak sengaja membawa application/json saat FormData
  if (isFormData && (headers as Record<string, string>)['Content-Type']) {
    delete (headers as Record<string, string>)['Content-Type'];
  }

  const response = await fetch(`${BASE_URL}${formattedEndpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Terjadi kesalahan pada server');
  }

  return data;
}

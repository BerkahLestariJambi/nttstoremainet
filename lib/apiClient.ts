// lib/apiClient.ts

// Set Base URL terpusat
export const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://nttstorepi.mejatika.com/api';

/**
 * Custom Fetch Client dengan Base URL otomatis & Otomatisasi Header Multipart/JSON
 */
export async function apiClient<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Pastikan endpoint diawali dengan slash `/`
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // Ambil Token Sanctum dengan fallback key nama token yang umum digunakan
  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('nttstorepi_token') || localStorage.getItem('token') || localStorage.getItem('auth_token'))
    : null;

  // Cek apakah body bertipe FormData
  const isFormData = options.body instanceof FormData;

  // Susun header dasar
  const headersObj: Record<string, string> = {
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  // Set Content-Type: application/json jika BUKAN FormData
  if (!isFormData && !headersObj['Content-Type']) {
    headersObj['Content-Type'] = 'application/json';
  }

  // Jika FormData, pastikan Content-Type dibiarkan kosong agar browser otomatis mengatur boundary
  if (isFormData && headersObj['Content-Type']) {
    delete headersObj['Content-Type'];
  }

  const response = await fetch(`${BASE_URL}${formattedEndpoint}`, {
    ...options,
    headers: headersObj,
  });

  // Aman terhadap response error 500 HTML dari Laravel
  let data: any = {};
  try {
    data = await response.json();
  } catch (err) {
    data = { message: `HTTP Error ${response.status}: ${response.statusText}` };
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Terjadi kesalahan pada server backend');
  }

  return data as T;
}

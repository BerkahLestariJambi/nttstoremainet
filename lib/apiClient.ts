// lib/apiClient.ts

// Set Base URL terpusat
export const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://nttstorepi.mejatika.com/api';

export interface ApiClientOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
}


/**
 * Custom Fetch Client dengan Base URL otomatis & Otomatisasi Header Multipart/JSON
 */
export async function apiClient<T = any>(endpoint: string, options: ApiClientOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;

  // Pastikan endpoint diawali dengan slash `/`
  let formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // Menyusun Query Parameters jika ada
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      formattedEndpoint += `${formattedEndpoint.includes('?') ? '&' : '?'}${queryString}`;
    }
  }

  // Ambil Token Sanctum dari localStorage dengan beberapa fallback key
  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('nttstorepi_token') || localStorage.getItem('token') || localStorage.getItem('auth_token'))
    : null;

  // Cek apakah body bertipe FormData
  const isFormData = fetchOptions.body instanceof FormData;

  // Konversi custom headers dari options ke Record sederhana
  const incomingHeaders: Record<string, string> = {};
  if (fetchOptions.headers) {
    if (fetchOptions.headers instanceof Headers) {
      fetchOptions.headers.forEach((value, key) => {
        incomingHeaders[key] = value;
      });
    } else if (Array.isArray(fetchOptions.headers)) {
      fetchOptions.headers.forEach(([key, value]) => {
        incomingHeaders[key] = value;
      });
    } else {
      Object.assign(incomingHeaders, fetchOptions.headers);
    }
  }

  // Susun header dasar
  const headersObj: Record<string, string> = {
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...incomingHeaders,
  };

  // Set Content-Type: application/json jika BUKAN FormData
  if (!isFormData && !headersObj['Content-Type'] && !headersObj['content-type']) {
    headersObj['Content-Type'] = 'application/json';
  }

  // Jika FormData, hapus Content-Type agar browser otomatis mengatur boundary multipart
  if (isFormData) {
    delete headersObj['Content-Type'];
    delete headersObj['content-type'];
  }

  const response = await fetch(`${BASE_URL}${formattedEndpoint}`, {
    ...fetchOptions,
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
    // Mengekstrak detail error validasi Laravel (422) atau error server (500)
    const errorMessage =
      data.message ||
      (data.errors ? Object.values(data.errors).flat().join(', ') : null) ||
      data.error ||
      `Terjadi kesalahan pada server backend (${response.status})`;

    const error = new Error(errorMessage) as Error & { status?: number; data?: any };
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data as T;
}

// Attach helper methods ke apiClient untuk kemudahan pemanggilan API di service files
apiClient.get = <T = any>(endpoint: string, options?: ApiClientOptions) =>
  apiClient<T>(endpoint, { ...options, method: 'GET' });

apiClient.post = <T = any>(endpoint: string, body?: any, options?: ApiClientOptions) =>
  apiClient<T>(endpoint, {
    ...options,
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body),
  });

apiClient.put = <T = any>(endpoint: string, body?: any, options?: ApiClientOptions) =>
  apiClient<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: body instanceof FormData ? body : JSON.stringify(body),
  });

apiClient.delete = <T = any>(endpoint: string, options?: ApiClientOptions) =>
  apiClient<T>(endpoint, { ...options, method: 'DELETE' });

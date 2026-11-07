import { apiClient } from '@/lib/apiClient';

export interface BiteshipArea {
  id: string;
  name: string; // Nama area lengkap: Kecamatan, Kota, Provinsi, Kode Pos
  country_name: string;
  country_code: string;
  administrative_division_level_1_name: string; // Provinsi
  administrative_division_level_2_name: string; // Kota/Kabupaten
  administrative_division_level_3_name: string; // Kecamatan
  postal_code: number;
}

export interface BiteshipRate {
  company: string;
  name: string;
  service_name: string;
  courier_code: string;
  description: string;
  duration: string;
  price_idr: number;
  price_pi: number;
}

export const shippingService = {
  // Cari area / kode pos via Biteship Maps API
  searchMaps: (query: string): Promise<any> =>
    apiClient.get('/shipping/search-maps', { params: { input: query } }),

  // Hitung ongkir real-time Biteship
  checkRates: (destinationPostalCode: string, weight: number = 1000): Promise<any> =>
    apiClient.post('/shipping/check-rates', {
      destination_postal_code: destinationPostalCode,
      weight,
    }),
};

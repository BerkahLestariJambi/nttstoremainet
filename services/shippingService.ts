import { apiClient } from '@/lib/apiClient';

export interface BiteshipArea {
  id: string; // area_id (misal: IDNP6IDNC148IDND836IDZ12430)
  name: string;
  country_name: string;
  administrative_division_level_1_name: string; // Provinsi
  administrative_division_level_2_name: string; // Kota/Kabupaten
  administrative_division_level_3_name: string; // Kecamatan
  postal_code: number;
}


export interface BiteshipItemPayload {
  name: string;
  value: number;
  quantity: number;
  weight: number; // dalam gram
  category?: string;
  description?: string;
}

export interface BiteshipRate {
  company: string;
  courier_name: string;
  courier_code: string;
  courier_service_name: string;
  courier_service_code: string;
  description: string;
  duration: string;
  shipping_fee_idr: number;
  insurance_fee_idr: number;
  price_idr: number;
  price_pi: number;
}

export const shippingService = {
  // Cari Area ID & Kode Pos via Biteship Maps API
  searchMaps: (query: string): Promise<any> =>
    apiClient.get('/shipping/search-maps', { params: { input: query } }),

  // Panggil POST /v1/rates/couriers lewat Backend Laravel
  checkRates: (params: {
    destination_area_id?: string;
    destination_postal_code?: number;
    items: BiteshipItemPayload[];
    couriers?: string;
  }): Promise<any> => apiClient.post('/shipping/check-rates', params),
};

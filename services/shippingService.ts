import { apiClient } from '@/lib/apiClient';

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
  // Ambil ongkir real-time Biteship berdasarkan Kode Pos Tujuan
  checkRates: (destinationPostalCode: string, weight: number = 1000): Promise<any> =>
    apiClient.post('/shipping/check-rates', {
      destination_postal_code: destinationPostalCode,
      weight,
    }),
};

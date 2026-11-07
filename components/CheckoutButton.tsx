'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { orderService, CheckoutInput } from '@/services/orderService';

interface CheckoutButtonProps {
  checkoutData: CheckoutInput;
}

export default function CheckoutButton({ checkoutData }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCheckoutAndPay = async () => {
    setLoading(true);

    try {
      // 1. Kirim data checkout & buat Order di Laravel Backend
      const rawRes: any = await orderService.createOrder(checkoutData);

      // Safe Unwrapping Data Response dari Backend Laravel
      const res = rawRes?.data || rawRes;
      const orderData = res?.order || res?.data || res;

      // Ambil detail ID order & total Pi
      const orderId = orderData?.id || orderData?.order_id || res?.order_id;
      const totalPi =
        orderData?.total_pi ||
        orderData?.total_amount_pi ||
        res?.total_pi ||
        res?.total_amount_pi;
      const memo = res?.memo || `Pembayaran Order #${orderId}`;

      if (!orderId) {
        throw new Error(
          res?.message || 'Gagal membuat order. ID Pesanan tidak ditemukan.'
        );
      }

      // 2. Cek keberadaan SDK Pi Network di Browser
      if (typeof window !== 'undefined' && (window as any).Pi) {
        const Pi = (window as any).Pi;

        const paymentData = {
          amount: Number(totalPi),
          memo: memo,
          metadata: { orderId: orderId },
        };

        const paymentCallbacks = {
          onReadyForServerApproval: async (paymentId: string) => {
            console.log('Server approval untuk payment ID:', paymentId);
            try {
              await orderService.approvePayment(paymentId, orderId);
            } catch (approvalErr: any) {
              console.error('Approval Error:', approvalErr);
            }
          },
          onReadyForServerCompletion: async (
            paymentId: string,
            txid: string
          ) => {
            console.log('Server completion dengan TXID:', txid);
            try {
              await orderService.completePayment(paymentId, txid, orderId);
              alert('Pembayaran Pi Coin Berhasil!');
              setLoading(false);
              router.push('/orders');
            } catch (completionErr: any) {
              console.error('Completion Error:', completionErr);
              alert('Gagal menyelesaikan verifikasi pembayaran ke server.');
              setLoading(false);
            }
          },
          onCancel: (paymentId: string) => {
            console.log('Pembayaran dibatalkan:', paymentId);
            alert('Transaksi dibatalkan.');
            setLoading(false);
          },
          onError: (error: Error, payment?: unknown) => {
            console.error('Error transaksi Pi SDK:', error, payment);
            alert(`Terjadi kesalahan Pi SDK: ${error.message || 'Gagal membayar'}`);
            setLoading(false);
          },
        };

        // Eksekusi pembayaran via Pi SDK
        Pi.createPayment(paymentData, paymentCallbacks);
      } else {
        alert(
          'Fitur pembayaran Pi Coin ini hanya dapat berjalan di dalam Pi Browser!'
        );
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Error Checkout Detail:', err);

      // Tangkap pesan error dari API Response / Network Fetch Error
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        'Gagal terhubung ke server backend Laravel. Periksa jaringan/CORS.';

      alert(`Gagal Checkout: ${errorMessage}`);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckoutAndPay}
      disabled={loading}
      className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
    >
      {loading ? (
        <span className="animate-pulse">Menghubungkan ke Pi SDK...</span>
      ) : (
        <span>Bayar Sekarang via Pi Browser</span>
      )}
    </button>
  );
}

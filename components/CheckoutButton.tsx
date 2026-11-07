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
      // 1. Kirim data checkout & buat Order di Laravel
      const res = await orderService.createOrder(checkoutData);
      
      if (!res.success) {
        throw new Error(res.message || 'Gagal membuat pesanan.');
      }

      const { order, total_pi, memo } = res.data;

      // 2. Cek keberadaan SDK Pi Network di Browser
      if (typeof window !== 'undefined' && (window as any).Pi) {
        const Pi = (window as any).Pi;

        const paymentData = {
          amount: total_pi,
          memo: memo,
          metadata: { orderId: order.id },
        };

        const paymentCallbacks = {
          onReadyForServerApproval: async (paymentId: string) => {
            console.log('Server approval untuk payment:', paymentId);
            await orderService.approvePayment(paymentId, order.id);
          },
          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            console.log('Server completion dengan TXID:', txid);
            await orderService.completePayment(paymentId, txid, order.id);
            
            alert('Pembayaran Pi Coin Berhasil!');
            setLoading(false);
            router.push('/orders'); // Arahkan ke Halaman Riwayat Pesanan
          },
          onCancel: (paymentId: string) => {
            console.log('Pembayaran dibatalkan:', paymentId);
            alert('Transaksi dibatalkan.');
            setLoading(false);
          },
          onError: (error: Error, payment: any) => {
            console.error('Error transaksi Pi SDK:', error);
            alert('Terjadi kesalahan pada pembayaran Pi.');
            setLoading(false);
          },
        };

        // Eksekusi pembayaran Pi SDK
        Pi.createPayment(paymentData, paymentCallbacks);
      } else {
        alert('Fitur ini hanya dapat digunakan di dalam Pi Browser!');
        setLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Terjadi kesalahan sistem.');
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

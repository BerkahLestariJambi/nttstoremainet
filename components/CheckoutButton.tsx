'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { orderService, CheckoutInput } from '@/services/orderService';
import { Loader2, CreditCard } from 'lucide-react';

interface CheckoutButtonProps {
  checkoutData: CheckoutInput;
}

export default function CheckoutButton({ checkoutData }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCheckoutAndPay = async () => {
    setLoading(true);

    try {
      // 1. Kirim data checkout ke Laravel Backend (/api/orders)
      const rawRes: any = await orderService.createOrder(checkoutData);

      // Unwrap response dari apiClient
      const res = rawRes?.data || rawRes;
      const orderData = res?.order || res?.data || res;

      const orderId = orderData?.id || orderData?.order_id || res?.order_id;
      const totalPi =
        orderData?.total_pi ||
        orderData?.total_amount_pi ||
        res?.total_pi ||
        res?.total_amount_pi ||
        checkoutData.shipping_fee_pi;

      const memo = res?.memo || `Pembayaran Order #${orderId || 'NTTStore'}`;

      if (!orderId) {
        throw new Error(res?.message || 'Gagal membuat order: ID Pesanan tidak dikembalikan dari server.');
      }

      // 2. Cek apakah berjalan di dalam Pi Browser (Pi SDK)
      if (typeof window !== 'undefined' && (window as any).Pi) {
        const Pi = (window as any).Pi;

        const paymentData = {
          amount: Number(totalPi),
          memo: memo,
          metadata: { orderId: orderId },
        };

        const paymentCallbacks = {
          onReadyForServerApproval: async (paymentId: string) => {
            console.log('Server Approval Payment ID:', paymentId);
            try {
              await orderService.approvePayment(paymentId, orderId);
            } catch (approvalErr: any) {
              console.error('Approval Error:', approvalErr);
            }
          },
          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            console.log('Server Completion TXID:', txid);
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
            alert('Transaksi pembayaran dibatalkan.');
            setLoading(false);
          },
          onError: (error: Error, payment?: unknown) => {
            console.error('Error transaksi Pi SDK:', error, payment);
            alert(`Terjadi kesalahan pada Pi SDK: ${error.message || 'Gagal membayar'}`);
            setLoading(false);
          },
        };

        // Eksekusi pembayaran Pi SDK
        Pi.createPayment(paymentData, paymentCallbacks);
      } else {
        alert(
          `Order #${orderId} Berhasil Dibuat!\n\nUntuk menyelesaikan pembayaran dengan Pi Coin, harap buka aplikasi ini di dalam Pi Browser.`
        );
        setLoading(false);
        router.push('/orders');
      }
    } catch (err: any) {
      console.error('Checkout Detail Error:', err);

      // Tangkap error message dari apiClient (422 validation / network / 500)
      const errorMessage =
        err?.message ||
        err?.data?.message ||
        'Gagal terhubung ke server backend Laravel (CORS atau Endpoint Error).';

      alert(`Gagal Checkout: ${errorMessage}`);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckoutAndPay}
      disabled={loading}
      className="w-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-lg transition flex items-center justify-center gap-2 text-xs disabled:opacity-50"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Menghubungkan ke Pi SDK...</span>
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4" />
          <span>Bayar Sekarang via Pi Browser</span>
        </>
      )}
    </button>
  );
}

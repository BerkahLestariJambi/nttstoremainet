'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { orderService, CheckoutInput } from '@/services/orderService';
import { Loader2, CreditCard } from 'lucide-react';
import Swal from 'sweetalert2';

interface CheckoutButtonProps {
  checkoutData: CheckoutInput;
}

export default function CheckoutButton({ checkoutData }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const processCheckout = async () => {
    setLoading(true);

    try {
      // 1. Kirim data checkout ke Laravel Backend (/api/orders)
      const rawRes: any = await orderService.createOrder(checkoutData);

      const res = rawRes?.data || rawRes;
      const orderData = res?.data || res?.order || res;

      // Mendapatkan Order ID dan Total Pi dari response backend
      const orderId = orderData?.id || orderData?.order_id || res?.order_id;
      const totalPi =
        orderData?.total_amount_pi ||
        orderData?.total_pi ||
        res?.total_amount_pi ||
        res?.total_pi ||
        checkoutData.shipping_fee_pi ||
        0;

      const memo = res?.memo || `Pembayaran Order #${orderId || 'NTTStore'}`;

      if (!orderId) {
        throw new Error(res?.message || 'Gagal membuat order. ID Pesanan tidak ditemukan.');
      }

      // 2. Inisialisasi & Authenticate Pi Network SDK dengan Scope Payments
      if (typeof window !== 'undefined' && (window as any).Pi) {
        const Pi = (window as any).Pi;

        // Auto-Initialize Pi SDK jika belum dipanggil sebelumnya
        try {
          await Pi.init({ version: '2.0', sandbox: false });
        } catch (initErr) {
          console.warn('Pi SDK telah terinisialisasi:', initErr);
        }

        // Penanganan Transaksi Menggantung (Incomplete Payment)
        const onIncompletePaymentFound = async (payment: any) => {
          console.log('Incomplete payment ditemukan:', payment);
          if (payment && payment.identifier && payment.transaction?.txid) {
            const paymentId = payment.identifier;
            const txid = payment.transaction.txid;
            const pendingOrderId = payment.metadata?.orderId || orderId;

            try {
              await orderService.completePayment(paymentId, txid, pendingOrderId);
              console.log('Incomplete payment berhasil diselesaikan ke server!');
            } catch (err) {
              console.error('Gagal menyelesaikan incomplete payment:', err);
            }
          }
        };

        // Meminta Izin / Scope 'payments' dari Pengguna
        try {
          const scopes = ['username', 'payments'];
          await Pi.authenticate(scopes, onIncompletePaymentFound);
        } catch (authErr: any) {
          console.error('Pi Authenticate Error:', authErr);
        }

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
            console.log('Server Completion TXID:', txid, 'Payment ID:', paymentId);
            try {
              const completeRes: any = await orderService.completePayment(paymentId, txid, orderId);
              
              if (completeRes?.success || completeRes?.data?.success || completeRes?.status === 200) {
                Swal.fire({
                  title: 'Berhasil!',
                  text: 'Pembayaran Pi Coin Berhasil & Diverifikasi Server!',
                  icon: 'success',
                  confirmButtonColor: '#f59e0b',
                }).then(() => {
                  setLoading(false);
                  router.push('/orders');
                });
              } else {
                throw new Error(completeRes?.message || 'Verifikasi pembayaran ditolak oleh server.');
              }
            } catch (completionErr: any) {
              console.error('Completion Error:', completionErr);
              const errMsg =
                completionErr?.response?.data?.message ||
                completionErr?.message ||
                'Gagal menyelesaikan verifikasi pembayaran ke server.';

              Swal.fire('Verifikasi Gagal', errMsg, 'error');
              setLoading(false);
            }
          },
          onCancel: (paymentId: string) => {
            console.log('Pembayaran dibatalkan:', paymentId);
            Swal.fire('Dibatalkan', 'Transaksi pembayaran dibatalkan.', 'info');
            setLoading(false);
          },
          onError: (error: Error, payment?: unknown) => {
            console.error('Error transaksi Pi SDK:', error, payment);
            Swal.fire('Error Pi SDK', error.message || 'Gagal membayar', 'error');
            setLoading(false);
          },
        };

        // 3. Eksekusi Pembayaran via Pi SDK
        Pi.createPayment(paymentData, paymentCallbacks);
      } else {
        Swal.fire({
          title: `Order #${orderId} Berhasil Dibuat!`,
          text: 'Untuk menyelesaikan pembayaran dengan Pi Coin, silakan buka aplikasi ini di dalam Pi Browser.',
          icon: 'info',
          confirmButtonColor: '#f59e0b',
        }).then(() => {
          setLoading(false);
          router.push('/orders');
        });
      }
    } catch (err: any) {
      console.error('Checkout Detail Error:', err);

      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        'Gagal terhubung ke server backend Laravel.';

      Swal.fire('Gagal Checkout', errorMessage, 'error');
      setLoading(false);
    }
  };

  const handleCheckoutAndPay = () => {
    // Dialog Peringatan SSL Premium via SweetAlert2
    Swal.fire({
      title: 'Peringatan Keamanan SSL',
      html: `
        <div style="text-align: left; font-size: 14px; line-height: 1.5; color: #4b5563;">
          <p style="margin-bottom: 10px; font-weight: 600; color: #dc2626;">
            ⚠️ Fitur SSL Premium Anda belum aktif!
          </p>
          <p style="margin-bottom: 10px;">
            Apakah Anda tetap ingin melanjutkan transaksi dengan segala risiko yang dapat terjadi?
          </p>
          <p style="font-size: 12px; color: #6b7280; background-color: #f3f4f6; padding: 8px; border-radius: 8px;">
            💡 <strong>Saran:</strong> Silakan aktifkan fitur SSL Premium agar transaksi Anda lebih aman dan performa aplikasi optimal.
          </p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, Tetap Lanjutkan',
      cancelButtonText: 'Batal',
      customClass: {
        popup: 'rounded-3xl',
        confirmButton: 'rounded-xl font-bold',
        cancelButton: 'rounded-xl font-bold',
      },
    }).then((result) => {
      if (result.isConfirmed) {
        processCheckout();
      }
    });
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

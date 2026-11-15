'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { orderService, CheckoutInput } from '@/services/orderService';
import { useLanguage } from '@/context/LanguageContext';
import { Loader2, CreditCard } from 'lucide-react';
import Swal from 'sweetalert2';

interface CheckoutButtonProps {
  checkoutData: CheckoutInput;
}

export default function CheckoutButton({ checkoutData }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t } = useLanguage();

  const processCheckout = async () => {
    setLoading(true);

    try {
      // 1. Kirim data checkout ke Laravel Backend (/api/orders)
      const rawRes: any = await orderService.createOrder(checkoutData);

      const res = rawRes?.data || rawRes;
      const orderData = res?.order || res?.data || res;

      const orderId = orderData?.id || orderData?.order_id || res?.order_id;
      const totalPi =
        orderData?.total_pi ||
        orderData?.total_amount_pi ||
        res?.total_pi ||
        res?.total_amount_pi ||
        checkoutData.shipping_fee_pi ||
        0;

      const memo = res?.memo || `${t('paymentOrderMemo')} #${orderId || 'NTTStore'}`;

      if (!orderId) {
        throw new Error(res?.message || t('createOrderFailedError'));
      }

      // 2. Inisialisasi & Authenticate Pi Network SDK dengan Scope Payments
      if (typeof window !== 'undefined' && (window as any).Pi) {
        const Pi = (window as any).Pi;

        // Auto-Initialize Pi SDK jika belum dipanggil sebelumnya
        try {
          await Pi.init({ version: '2.0', sandbox: false });
        } catch (initErr) {
          console.warn('Pi SDK sudah ter-initialized:', initErr);
        }

        // Meminta Izin / Scope 'payments' dari Pengguna
        try {
          const scopes = ['username', 'payments'];
          const onIncompletePaymentFound = (payment: any) => {
            console.log('Incomplete payment found:', payment);
          };
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
            console.log('Server Completion TXID:', txid);
            try {
              await orderService.completePayment(paymentId, txid, orderId);

              Swal.fire({
                title: t('successTitle'),
                text: t('piPaymentSuccessText'),
                icon: 'success',
                confirmButtonColor: '#f59e0b',
              }).then(() => {
                setLoading(false);
                router.push('/orders');
              });
            } catch (completionErr: any) {
              console.error('Completion Error:', completionErr);
              setLoading(false);
            }
          },
          onCancel: (paymentId: string) => {
            console.log('Pembayaran dibatalkan:', paymentId);
            Swal.fire(t('paymentCancelledTitle'), t('paymentCancelledText'), 'info');
            setLoading(false);
          },
          onError: (error: Error, payment?: unknown) => {
            console.error('Error transaksi Pi SDK:', error, payment);
            Swal.fire(t('piSdkErrorTitle'), error.message || t('piPaymentFailedFallback'), 'error');
            setLoading(false);
          },
        };

        // 3. Eksekusi Pembayaran via Pi SDK
        Pi.createPayment(paymentData, paymentCallbacks);
      } else {
        Swal.fire({
          title: `${t('orderNumberLabel')} #${orderId} ${t('orderCreatedSuffix')}`,
          text: t('openInPiBrowserToPayText'),
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
        err?.message ||
        err?.data?.message ||
        t('backendConnectionFailedError');

      Swal.fire(t('checkoutFailedTitle'), errorMessage, 'error');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={processCheckout}
      disabled={loading}
      className="w-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-lg transition flex items-center justify-center gap-2 text-xs disabled:opacity-50"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{t('connectingToPiSdk')}</span>
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4" />
          <span>{t('payNowViaPiBrowser')}</span>
        </>
      )}
    </button>
  );
}

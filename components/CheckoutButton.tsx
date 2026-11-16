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

  /**
   * Deteksi ketat apakah dibuka dari dalam aplikasi Pi Browser resmi
   */
  const isOfficialPiBrowser = (): boolean => {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent || '';
    return /PiBrowser/i.test(ua);
  };

  /**
   * Munculkan SweetAlert dengan QR Code siap scan + tombol deep link ke Pi Browser
   */
  const showPiBrowserWarning = async () => {
    const currentUrl = window.location.href;
    const piDeepLink = currentUrl.replace(/^https?:\/\//i, 'pi://');
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(
      piDeepLink
    )}`;

    const title = t('openOfficialPiBrowserTitle') || 'Buka di Pi Browser Resmi';
    const message =
      t('mustOpenInPiBrowserText') ||
      'Anda harus buka link Aplikasi ini di Pi Browser resmi Pi Network Untuk bertransaksi.';

    const result = await Swal.fire({
      title,
      html: `
        <p style="font-size: 13px; color: #4b5563; margin-bottom: 14px;">
          ${message}
        </p>
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; background: #fffbeb; border: 1px solid #fde68a; border-radius: 16px; padding: 14px;">
          <img
            src="${qrImageUrl}"
            alt="QR Code Pi Browser Checkout"
            width="200"
            height="200"
            style="border-radius: 12px; background: #ffffff; padding: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);"
          />
          <span style="margin-top: 10px; font-size: 11px; font-weight: 700; color: #b45309;">
            Scan QR Code ini untuk membuka langsung di Pi Browser
          </span>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: t('openInPiBrowserBtn') || 'Buka di Pi Browser',
      cancelButtonText: t('cancel') || 'Batal',
      confirmButtonColor: '#f59e0b',
    });

    if (result.isConfirmed) {
      window.location.href = piDeepLink;
    }
  };

  const processCheckout = async () => {
    // 0. Jika bukan Pi Browser resmi, langsung tampilkan QR Code & hentikan proses
    if (!isOfficialPiBrowser()) {
      await showPiBrowserWarning();
      return;
    }

    setLoading(true);

    try {
      const Pi = (window as any).Pi;
      if (!Pi) {
        throw new Error('Pi SDK tidak terdeteksi. Pastikan Anda menggunakan Pi Browser versi terbaru.');
      }

      try {
        await Pi.init({ version: '2.0', sandbox: false });
      } catch (initErr) {
        console.warn('Pi SDK init warning:', initErr);
      }

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

      // 2. Authenticate Pi Network SDK dengan Scope 'payments'
      try {
        const scopes = ['username', 'payments'];
        const onIncompletePaymentFound = (payment: any) => {
          console.log('Incomplete payment found:', payment);
        };
        await Pi.authenticate(scopes, onIncompletePaymentFound);
      } catch (authErr: any) {
        console.error('Pi Authenticate Error:', authErr);
        throw new Error(authErr?.message || 'Gagal autentikasi Pi Wallet di Pi Browser.');
      }

      const paymentData = {
        amount: Number(totalPi),
        memo: memo,
        metadata: { orderId: orderId },
      };

      const paymentCallbacks = {
        onReadyForServerApproval: async (paymentId: string) => {
          try {
            await orderService.approvePayment(paymentId, orderId);
          } catch (approvalErr: any) {
            console.error('Approval Error:', approvalErr);
          }
        },
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
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
        onCancel: () => {
          Swal.fire(t('paymentCancelledTitle'), t('paymentCancelledText'), 'info');
          setLoading(false);
        },
        onError: (error: Error) => {
          Swal.fire(t('piSdkErrorTitle'), error.message || t('piPaymentFailedFallback'), 'error');
          setLoading(false);
        },
      };

      // 3. Eksekusi Pembayaran via Pi SDK
      Pi.createPayment(paymentData, paymentCallbacks);
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
      type="button"
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

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { sellerService } from '@/services/sellerService';
import { useLanguage } from '@/context/LanguageContext';
import {
  ArrowLeft,
  Store,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Package,
  Loader2,
  Clock,
} from 'lucide-react';

export default function RegisterSellerPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [checkingStatus, setCheckingStatus] = useState<boolean>(true);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [sellerStatus, setSellerStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    store_name: '',
    store_description: '',
    phone_number: '',
    address: '',
  });

  useEffect(() => {
    const checkExistingSeller = async () => {
      setCheckingStatus(true);
      try {
        const res: any = await sellerService.getStatus();

        // Ekstrak payload dari berbagai kemungkinan struktur JSON Laravel (/seller/status)
        const root = res?.data && typeof res.data === 'object' && !Array.isArray(res.data) ? res.data : res;
        const sellerObj =
          root?.seller ||
          root?.store ||
          root?.data ||
          (root?.store_name || root?.id ? root : null);

        const rawStatus = String(
          root?.status ||
            sellerObj?.status ||
            root?.seller_status ||
            (root?.is_approved || sellerObj?.is_approved ? 'approved' : '')
        ).toLowerCase();

        const alreadyExists = Boolean(
          root?.is_seller === true ||
            root?.registered === true ||
            root?.has_store === true ||
            sellerObj?.store_name ||
            sellerObj?.id ||
            ['approved', 'active', 'verified', 'pending', 'review'].includes(rawStatus)
        );

        if (alreadyExists) {
          setIsRegistered(true);
          setSellerStatus(rawStatus || 'approved');
          setFormData({
            store_name: sellerObj?.store_name || sellerObj?.name || '',
            store_description: sellerObj?.store_description || sellerObj?.description || '',
            phone_number: sellerObj?.phone_number || sellerObj?.phone || '',
            address: sellerObj?.address || sellerObj?.city || '',
          });
        }
      } catch (err) {
        // Jika 404 atau user belum mendaftar seller, biarkan mode daftar baru
        console.log('Belum terdaftar sebagai seller:', err);
        setIsRegistered(false);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkExistingSeller();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage(null);
    if (successMessage) setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (isRegistered) {
        // MODE UPDATE DATA TOKO
        let res: any;
        try {
          res = await sellerService.updateStore(formData);
        } catch {
          // Fallback jika backend Laravel memakai POST /seller/register untuk upsert
          res = await sellerService.register(formData);
        }

        if (res?.success || res?.message || res?.data || res) {
          setSuccessMessage(t('storeUpdateSuccessMsg'));
        }
      } else {
        // MODE PENDAFTARAN TOKO BARU
        const res: any = await sellerService.register(formData);

        if (res?.success || res?.message || res?.data) {
          alert(t('sellerRegisterSuccessAlert'));
          router.push('/seller/products/create');
        }
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message ||
          (isRegistered ? t('storeUpdateFailedError') : t('sellerRegisterFailedError'))
      );
    } finally {
      setLoading(false);
    }
  };

  const isPending = sellerStatus === 'pending' || sellerStatus === 'review';

  if (checkingStatus) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center text-gray-500 flex flex-col items-center gap-3">
        <Loader2 className="w-7 h-7 text-amber-500 animate-spin" />
        <p className="text-sm font-medium">{t('checkingStoreStatus')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <Link
          href={isRegistered ? '/seller' : '/'}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-amber-600 font-medium transition"
        >
          <ArrowLeft className="w-4 h-4" />{' '}
          {isRegistered ? t('backToSellerDashboard') : t('backToHome')}
        </Link>

        {isRegistered && !isPending && (
          <Link
            href="/seller/products/create"
            className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 px-3.5 py-2 rounded-xl transition"
          >
            <Package className="w-4 h-4" /> {t('manageStoreProductsBtn')}
          </Link>
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-10 shadow-sm">
        {/* Banner Status jika sudah terdaftar */}
        {isRegistered && (
          <div
            className={`mb-6 p-4 rounded-2xl flex items-start gap-3 text-xs sm:text-sm border ${
              isPending
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            {isPending ? (
              <Clock className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
            ) : (
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-bold">{t('storeAlreadyRegisteredBadge')}</p>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full text-white ${
                    isPending ? 'bg-amber-600' : 'bg-emerald-600'
                  }`}
                >
                  {sellerStatus || 'approved'}
                </span>
              </div>
              <p className={`mt-1 ${isPending ? 'text-amber-700' : 'text-emerald-700'}`}>
                {t('storeUpdateOnlyHint')}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl">
            {isRegistered ? <Edit3 className="w-7 h-7" /> : <Store className="w-7 h-7" />}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">
              {isRegistered ? t('updateStoreProfileTitle') : t('openStoreRegisterTitle')}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              {isRegistered ? t('updateStoreProfileSubtitle') : t('openStoreRegisterSubtitle')}
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
            <div>{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3 text-emerald-700 text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-500" />
            <div>{successMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              {t('storeNameFieldLabel')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="store_name"
              required
              placeholder={t('storeNamePlaceholder')}
              value={formData.store_name}
              onChange={handleChange}
              className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:outline-none transition text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              {t('whatsappPhoneFieldLabel')} <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone_number"
              required
              placeholder="081234567890"
              value={formData.phone_number}
              onChange={handleChange}
              className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:outline-none transition text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              {t('storeFullAddressFieldLabel')} <span className="text-red-500">*</span>
            </label>
            <textarea
              name="address"
              required
              rows={3}
              placeholder={t('storeFullAddressPlaceholder')}
              value={formData.address}
              onChange={handleChange}
              className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:outline-none transition text-sm"
            ></textarea>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              {t('storeShortDescriptionFieldLabel')}
            </label>
            <textarea
              name="store_description"
              rows={3}
              placeholder={t('storeShortDescriptionPlaceholder')}
              value={formData.store_description}
              onChange={handleChange}
              className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:outline-none transition text-sm"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 px-6 rounded-2xl transition shadow-lg shadow-amber-200 disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            {loading ? (
              isRegistered ? t('updatingStoreBtnLoading') : t('registeringStoreBtnLoading')
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />{' '}
                {isRegistered ? t('saveStoreChangesBtn') : t('registerStoreNowBtn')}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import CheckoutButton from '@/components/CheckoutButton';
import { productService, getEffectivePricePi } from '@/services/productService';
import { cartService } from '@/services/cartService';
import { addressService, UserAddressData } from '@/services/addressService';
import { shippingService, BiteshipRate, BiteshipItemPayload } from '@/services/shippingService';
import { useLanguage } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';
import { ArrowLeft, MapPin, PackageCheck, ShoppingBag, AlertCircle, Truck, CheckCircle2, Loader2, Zap } from 'lucide-react';

export const dynamic = 'force-dynamic';

function CheckoutFormContent() {
  const { t } = useLanguage();
  const { removeFromCart, fetchCart } = useCart();
  const searchParams = useSearchParams();
  const productId = searchParams.get('product_id') || searchParams.get('productId');
  const addressId = searchParams.get('address_id');
  const isDirectBuy = Boolean(productId);

  const [checkoutItems, setCheckoutItems] = useState<any[]>([]);
  const [address, setAddress] = useState<UserAddressData | null>(null);

  // State Jasa Pengiriman Biteship
  const [biteshipRates, setBiteshipRates] = useState<BiteshipRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<BiteshipRate | null>(null);
  const [loadingRates, setLoadingRates] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Fungsi Panggil API Rates Biteship
  const fetchBiteshipRates = async (selectedAddr: UserAddressData, items: any[]) => {
    if (!selectedAddr || items.length === 0) return;

    setLoadingRates(true);
    try {
      const biteshipItems: BiteshipItemPayload[] = items.map((item) => ({
        name: item.name || 'Produk NTTStorePi',
        value: Math.round(Number(item.price_pi || 1) * 1500000),
        quantity: Number(item.quantity || 1),
        weight: Number(item.weight_gram || item.weight || 500),
        category: 'others',
      }));

      const res: any = await shippingService.checkRates({
        destination_area_id: (selectedAddr as any).area_id,
        destination_postal_code: selectedAddr.postal_code ? Number(selectedAddr.postal_code) : undefined,
        items: biteshipItems,
        couriers: 'jne,jnt,pos,sicepat,tiki,wahana',
      });

      const rates = Array.isArray(res) ? res : res?.data || [];
      setBiteshipRates(rates);
      if (rates.length > 0) {
        setSelectedRate(rates[0]);
      }
    } catch (err) {
      console.error('Gagal mengambil tarif Biteship:', err);
      setBiteshipRates([]);
    } finally {
      setLoadingRates(false);
    }
  };

  useEffect(() => {
    async function initCheckout() {
      setLoading(true);

      let selectedAddr: UserAddressData | null = null;
      let loadedItems: any[] = [];

      // 1. Memuat Data Alamat Pengiriman dari API DB
      try {
        const res: any = await addressService.getAddresses();
        const list = Array.isArray(res) ? res : res?.data || [];

        selectedAddr = addressId
          ? list.find((a: UserAddressData) => String(a.id) === String(addressId))
          : list.find((a: UserAddressData) => a.is_primary) || list[0];

        setAddress(selectedAddr || null);
      } catch (err) {
        console.error('Gagal mengambil alamat pengiriman:', err);
      }

      // 2. Memuat Produk yang Akan Dibayar
      if (isDirectBuy && productId) {
        try {
          const res: any = await productService.getProductById(productId);
          const item = res?.data?.data || res?.data || res;
          if (item?.id) {
            const basePrice = Number(item.price_pi || item.price || 0);
            const finalPrice = getEffectivePricePi(item);

            loadedItems = [{
              product_id: Number(item.id),
              name: item.name,
              price_pi: finalPrice,
              original_price_pi: basePrice,
              is_promo: finalPrice < basePrice,
              is_flash_sale: Boolean(item.is_flash_sale),
              weight_gram: item.weight_gram || 500,
              quantity: Math.max(1, Number(searchParams.get('qty') || 1)),
            }];
            setCheckoutItems(loadedItems);
          }
        } catch (err) {
          console.error('Error mengambil produk beli langsung:', err);
        }
      } else {
        try {
          const res: any = await cartService.getCart();
          const list = Array.isArray(res) ? res : res?.data || [];
          const selected = list.filter((i: any) => i.selected);

          loadedItems = selected.map((i: any) => {
            const prod = i.product || i;
            const basePrice = Number(prod.price_pi || i.original_price_pi || 0);
            const finalPrice =
              Number(i.effective_price_pi) > 0
                ? Number(i.effective_price_pi)
                : getEffectivePricePi(prod);

            return {
              cart_item_id: i.id,
              product_id: i.product_id,
              name: prod.name,
              price_pi: finalPrice,
              original_price_pi: basePrice,
              is_promo: finalPrice < basePrice,
              is_flash_sale: Boolean(prod.is_flash_sale),
              weight_gram: prod.weight_gram || 500,
              quantity: Number(i.quantity || 1),
            };
          });
          setCheckoutItems(loadedItems);
        } catch (err) {
          console.error('Error membaca keranjang DB:', err);
        }
      }

      // 3. Hitung Ongkir Biteship setelah Alamat & Barang Siap
      if (selectedAddr && loadedItems.length > 0) {
        await fetchBiteshipRates(selectedAddr, loadedItems);
      }

      setLoading(false);
    }

    initCheckout();
  }, [productId, addressId, isDirectBuy, searchParams]);

  // Sinkronisasi pasca-pembayaran: hapus produk yang dibeli dari keranjang & kurangi stok UI
  const handlePaymentSuccess = async () => {
    for (const item of checkoutItems) {
      if (item.cart_item_id) {
        removeFromCart(item.cart_item_id);
      }
      removeFromCart(item.product_id);
    }

    await fetchCart();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('nttstorepi:stock-updated', {
          detail: checkoutItems.map((i) => ({
            product_id: i.product_id,
            quantity: i.quantity,
          })),
        })
      );
    }
  };

  const subtotalPi = checkoutItems.reduce((sum, item) => sum + item.price_pi * item.quantity, 0);
  const totalSavingsPi = checkoutItems.reduce(
    (sum, item) =>
      item.is_promo ? sum + (item.original_price_pi - item.price_pi) * item.quantity : sum,
    0
  );
  const shippingFeePi = selectedRate ? Number(selectedRate.price_pi) : 0;
  const totalAmountPi = subtotalPi + shippingFeePi;

  if (loading) return <div className="max-w-2xl mx-auto p-8 text-center text-gray-500">{t('loadingCheckoutDetail')}</div>;

  if (checkoutItems.length === 0) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white border border-gray-100 rounded-3xl shadow-sm text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-gray-900 mb-2">{t('noProductsSelected')}</h2>
        <p className="text-xs text-gray-500 mb-6">{t('pleaseSelectProductFirst')}</p>
        <Link href="/cart" className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-2xl text-xs transition shadow-md shadow-amber-200">
          {t('openCart')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <Link href="/addresses?select=true" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-amber-600 mb-6 transition">
        <ArrowLeft className="w-4 h-4" /> {t('changeShippingAddress')}
      </Link>

      <h1 className="text-2xl font-extrabold text-gray-900 mb-6 flex items-center gap-2">
        <ShoppingBag className="w-7 h-7 text-amber-500" /> {t('summaryAndPayment')}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {/* Ringkasan Alamat Terpilih */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-3">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-500" /> {t('destinationShippingAddress')}
              </h2>
              <Link href="/addresses?select=true" className="text-xs text-amber-600 font-bold hover:underline">
                {t('changeAddress')}
              </Link>
            </div>

            {address ? (
              <div className="bg-amber-50/40 p-4 rounded-2xl border border-amber-200/60">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-xs text-gray-900">{address.recipient_name}</span>
                  <span className="text-[10px] bg-white text-gray-600 border border-gray-200 px-2 py-0.5 rounded-full font-semibold">{address.label}</span>
                  {address.is_primary && (
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">{t('primaryLabel')}</span>
                  )}
                </div>
                <p className="text-xs text-gray-600">{address.phone_number}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {address.full_address} {address.city && `, ${address.city}`} {address.postal_code && `(${address.postal_code})`}
                </p>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-red-500 font-semibold mb-2">{t('noShippingAddressSelected')}</p>
                <Link href="/addresses?select=true" className="inline-block bg-amber-500 text-white font-bold px-4 py-2 rounded-xl text-xs">
                  {t('selectOrAddAddress')}
                </Link>
              </div>
            )}
          </div>

          {/* Opsi Jasa Ekspedisi / Kurir Biteship */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 mb-4 border-b border-gray-100 pb-3 flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-500" /> {t('courierOptionsTitle')}
            </h2>

            {loadingRates ? (
              <div className="py-6 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" /> {t('calculatingShippingRates')}
              </div>
            ) : biteshipRates.length === 0 ? (
              <div className="text-center py-4 text-xs text-gray-500">
                {!address ? (
                  <p className="text-red-500 font-semibold">
                    {t('selectAddressFirstHint')}
                  </p>
                ) : (
                  <p>{t('noCourierAvailable')}</p>
                )}
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {biteshipRates.map((rate, idx) => {
                  const isSelected = selectedRate?.courier_code === rate.courier_code && selectedRate?.courier_service_code === rate.courier_service_code;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedRate(rate)}
                      className={`p-4 rounded-2xl border cursor-pointer transition flex justify-between items-center ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/30 ring-1 ring-amber-500'
                          : 'border-gray-200 hover:border-amber-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isSelected ? (
                          <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0" />
                        ) : (
                          <div className="w-5 h-5 border border-gray-300 rounded-full shrink-0" />
                        )}
                        <div>
                          <h4 className="font-bold text-xs text-gray-900">
                            {rate.courier_name} - {rate.courier_service_name}
                          </h4>
                          <p className="text-[11px] text-gray-500">{rate.description}</p>
                          <span className="text-[10px] text-gray-400">{t('estimatedDelivery')}: {rate.duration}</span>
                        </div>
                      </div>
                      <div className="text-right whitespace-nowrap">
                        <span className="text-xs font-bold text-amber-600 block">
                          π {rate.price_pi.toFixed(6)}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          (Rp {rate.price_idr.toLocaleString('id-ID')})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Ringkasan Tagihan & Tombol Pi Payment */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4 h-fit">
          <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-amber-500" /> {t('billingSummary')}
          </h2>

          <div className="divide-y divide-gray-100 max-h-56 overflow-y-auto pr-1 space-y-2">
            {checkoutItems.map((item, idx) => (
              <div key={idx} className="pt-2 first:pt-0 flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="font-semibold text-gray-800 text-xs line-clamp-1">{item.name}</p>
                    {item.is_promo && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-black bg-red-100 text-red-600 px-1.5 py-0.2 rounded-full shrink-0">
                        <Zap className="w-2.5 h-2.5 fill-red-600" /> PROMO
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                    <span>{item.quantity} x π {item.price_pi}</span>
                    {item.is_promo && (
                      <span className="line-through text-gray-300">π {item.original_price_pi}</span>
                    )}
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-600 whitespace-nowrap">
                  π {(item.price_pi * item.quantity).toFixed(4)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-1.5 pt-2 border-t border-gray-100 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>{t('productSubtotal')}</span>
              <span className="font-medium text-gray-800">π {subtotalPi.toFixed(4)}</span>
            </div>
            {totalSavingsPi > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Hemat Promo</span>
                <span>- π {totalSavingsPi.toFixed(4)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>{t('shippingFeeLabel')} ({selectedRate ? `${selectedRate.courier_name} ${selectedRate.courier_service_name}` : '-'})</span>
              <span className="font-medium text-amber-600">π {shippingFeePi.toFixed(6)}</span>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
            <span className="text-xs font-bold text-gray-700">{t('totalPayment')}</span>
            <span className="text-base font-extrabold text-amber-600">π {totalAmountPi.toFixed(6)}</span>
          </div>

          {address && selectedRate ? (
            <CheckoutButton
              onSuccess={handlePaymentSuccess}
              checkoutData={{
                recipient_name: address.recipient_name,
                phone_number: address.phone_number,
                shipping_address: `${address.full_address}, Kode Pos: ${address.postal_code}`,
                courier_company: selectedRate.company,
                courier_service: selectedRate.courier_service_name,
                shipping_fee_pi: shippingFeePi,
                shipping_fee_idr: selectedRate.price_idr,
                items: checkoutItems.map((item) => ({
                  product_id: item.product_id,
                  quantity: item.quantity,
                })),
                name: address.recipient_name,
                phone: address.phone_number,
                address: address.full_address,
                product_id: checkoutItems[0]?.product_id,
                quantity: checkoutItems[0]?.quantity,
              } as any}
            />
          ) : (
            <button disabled className="w-full bg-gray-200 text-gray-400 font-bold py-3.5 px-6 rounded-2xl cursor-not-allowed text-xs">
              {!address ? t('selectAddressBtnDisabled') : t('selectCourierBtnDisabled')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CheckoutSuspenseFallback() {
  const { t } = useLanguage();
  return <div className="max-w-2xl mx-auto p-8 text-center text-gray-500">{t('loadingCheckout')}</div>;
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutSuspenseFallback />}>
      <CheckoutFormContent />
    </Suspense>
  );
}

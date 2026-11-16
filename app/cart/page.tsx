'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cartService, CartItemData } from '@/services/cartService';
import { getEffectivePricePi } from '@/services/productService';
import { useLanguage } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag, ArrowRight, CheckSquare, Square, Zap } from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { fetchCart: syncGlobalCart } = useCart();
  const [cartItems, setCartItems] = useState<CartItemData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCart = async () => {
    try {
      const res: any = await cartService.getCart();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setCartItems(list);
      await syncGlobalCart();
    } catch (err) {
      console.error('Gagal memuat keranjang:', err);
      setCartItems([]);
      await syncGlobalCart();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleSelect = async (item: CartItemData) => {
    try {
      await cartService.updateCartItem(item.id, { selected: !item.selected });
      await fetchCart();
    } catch (err) {
      console.error('Gagal update status pilihan:', err);
    }
  };

  const handleUpdateQty = async (item: CartItemData, delta: number) => {
    const newQty = item.quantity + delta;
    if (newQty < 1) return;
    try {
      await cartService.updateCartItem(item.id, { quantity: newQty });
      await fetchCart();
    } catch (err) {
      console.error('Gagal ubah quantity:', err);
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await cartService.removeFromCart(id);
      await fetchCart();
    } catch (err) {
      console.error('Gagal menghapus item:', err);
    }
  };

  const resolveUnitPrice = (item: any): number => {
    if (Number(item?.effective_price_pi) > 0) {
      return Number(item.effective_price_pi);
    }
    return getEffectivePricePi(item?.product || item);
  };

  const selectedItems = cartItems.filter((i) => i.selected);
  const totalAmountPi = selectedItems.reduce(
    (sum, i) => sum + resolveUnitPrice(i) * i.quantity,
    0
  );
  const totalSavingsPi = selectedItems.reduce((sum, i: any) => {
    const basePrice = Number(i.product?.price_pi ?? i.original_price_pi ?? 0);
    const effectivePrice = resolveUnitPrice(i);
    return effectivePrice < basePrice ? sum + (basePrice - effectivePrice) * i.quantity : sum;
  }, 0);

  const handleProceedToCheckout = () => {
    if (selectedItems.length === 0) return;
    router.push('/addresses?select=true');
  };

  if (loading) {
    return <div className="max-w-2xl mx-auto p-8 text-center text-gray-500">{t('loadingCart')}</div>;
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white border border-gray-100 rounded-3xl shadow-sm text-center">
        <ShoppingBag className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-gray-900 mb-2">{t('emptyCartTitle')}</h2>
        <p className="text-xs text-gray-500 mb-6">{t('emptyCart')}</p>
        <Link href="/" className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-2xl text-xs transition shadow-md shadow-amber-200">
          {t('startShopping')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-amber-600 font-medium mb-6 transition">
        <ArrowLeft className="w-4 h-4" /> {t('continueShopping')}
      </Link>

      <h1 className="text-2xl font-extrabold text-gray-900 mb-6 flex items-center gap-2">
        <ShoppingBag className="w-7 h-7 text-amber-500" /> {t('shoppingCart')}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {cartItems.map((item: any) => {
            const basePrice = Number(item.product?.price_pi ?? item.original_price_pi ?? 0);
            const effectivePrice = resolveUnitPrice(item);
            const isPromo = effectivePrice > 0 && effectivePrice < basePrice;

            return (
              <div key={item.id} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <button onClick={() => handleToggleSelect(item)} className="text-amber-500">
                  {item.selected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-gray-300" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-gray-800 text-sm truncate">{item.product?.name}</h3>
                    {isPromo && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full shrink-0">
                        <Zap className="w-2.5 h-2.5 fill-red-600" /> PROMO
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-2 mt-0.5">
                    <p className={`text-xs font-bold ${isPromo ? 'text-red-600' : 'text-amber-600'}`}>
                      π {effectivePrice}
                    </p>
                    {isPromo && (
                      <span className="text-[11px] text-gray-400 line-through">
                        π {basePrice}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center border border-gray-200 rounded-xl px-2 py-1 gap-3">
                  <button onClick={() => handleUpdateQty(item, -1)} className="text-gray-500 hover:text-amber-600">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-bold text-gray-800">{item.quantity}</span>
                  <button onClick={() => handleUpdateQty(item, 1)} className="text-gray-500 hover:text-amber-600">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button onClick={() => handleRemove(item.id)} className="text-gray-400 hover:text-red-500 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4 h-fit">
          <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">{t('orderSummary')}</h2>
          <div className="flex justify-between items-center text-xs text-gray-600">
            <span>{t('selectedProducts')} ({selectedItems.length})</span>
            <span className="font-bold text-gray-800">π {totalAmountPi.toFixed(4)}</span>
          </div>
          {totalSavingsPi > 0 && (
            <div className="flex justify-between items-center text-xs text-emerald-600 font-semibold">
              <span>Hemat Promo</span>
              <span>- π {totalSavingsPi.toFixed(4)}</span>
            </div>
          )}
          <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
            <span className="text-xs font-bold text-gray-700">{t('totalPayment')}</span>
            <span className="text-base font-extrabold text-amber-600">π {totalAmountPi.toFixed(4)}</span>
          </div>

          <button
            onClick={handleProceedToCheckout}
            disabled={selectedItems.length === 0}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 text-xs"
          >
            {t('selectShippingAddress')} ({selectedItems.length}) <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

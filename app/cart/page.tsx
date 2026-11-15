'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cartService, CartItemData } from '@/services/cartService';
import { useLanguage } from '@/context/LanguageContext';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag, ArrowRight, CheckSquare, Square } from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [cartItems, setCartItems] = useState<CartItemData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCart = async () => {
    try {
      const res: any = await cartService.getCart();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setCartItems(list);
    } catch (err) {
      console.error('Gagal memuat keranjang:', err);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleToggleSelect = async (item: CartItemData) => {
    try {
      await cartService.updateCartItem(item.id, { selected: !item.selected });
      fetchCart();
    } catch (err) {
      console.error('Gagal update status pilihan:', err);
    }
  };

  const handleUpdateQty = async (item: CartItemData, delta: number) => {
    const newQty = item.quantity + delta;
    if (newQty < 1) return;
    try {
      await cartService.updateCartItem(item.id, { quantity: newQty });
      fetchCart();
    } catch (err) {
      console.error('Gagal ubah quantity:', err);
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await cartService.removeFromCart(id);
      fetchCart();
    } catch (err) {
      console.error('Gagal menghapus item:', err);
    }
  };

  const selectedItems = cartItems.filter((i) => i.selected);
  const totalAmountPi = selectedItems.reduce(
    (sum, i) => sum + Number(i.product?.price_pi || 0) * i.quantity,
    0
  );

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
          {cartItems.map((item) => (
            <div key={item.id} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <button onClick={() => handleToggleSelect(item)} className="text-amber-500">
                {item.selected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-gray-300" />}
              </button>

              <div className="flex-1">
                <h3 className="font-bold text-gray-800 text-sm">{item.product?.name}</h3>
                <p className="text-xs font-semibold text-amber-600 mt-0.5">π {item.product?.price_pi}</p>
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
          ))}
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4 h-fit">
          <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">{t('orderSummary')}</h2>
          <div className="flex justify-between items-center text-xs text-gray-600">
            <span>{t('selectedProducts')} ({selectedItems.length})</span>
            <span className="font-bold text-gray-800">π {totalAmountPi.toFixed(4)}</span>
          </div>
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

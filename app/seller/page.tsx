'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Store,
  Package,
  Plus,
  Trash2,
  Edit3,
  MapPin,
  ShieldCheck,
  Loader2,
  ArrowLeft,
  LayoutDashboard,
  ImagePlus,
  X,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import BottomNav from '@/components/BottomNav';
import Swal from 'sweetalert2';

interface SellerStore {
  id: number;
  store_name: string;
  description?: string;
  city?: string;
  address?: string;
  status?: string;
}

interface SellerProduct {
  id: number;
  name: string;
  slug?: string;
  description: string;
  price_pi: string;
  stock: number;
  image_url?: string;
}

export default function SellerPage() {
  const router = useRouter();
  const { piUser } = useCart();
  const { t } = useLanguage();

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'https://nttstorepi.mejatika.com/api';
  const DOMAIN_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

  const [store, setStore] = useState<SellerStore | null>(null);
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form Registrasi Toko Baru
  const [storeName, setStoreName] = useState<string>('');
  const [storeDesc, setStoreDesc] = useState<string>('');
  const [storeCity, setStoreCity] = useState<string>('');

  // Modal Tambah / Edit Produk
  const [showProductModal, setShowProductModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<SellerProduct | null>(null);
  const [prodName, setProdName] = useState<string>('');
  const [prodDesc, setProdDesc] = useState<string>('');
  const [prodPricePi, setProdPricePi] = useState<string>('');
  const [prodStock, setProdStock] = useState<string>('10');
  const [prodImageFile, setProdImageFile] = useState<File | null>(null);

  const getAuthHeaders = (isFormData = false): Record<string, string> => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('nttstorepi_token') : null;
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const getFullImageUrl = (url?: string | null) => {
    if (!url || typeof url !== 'string' || url.trim() === '') return '';
    let cleanUrl = url.trim();
    if (cleanUrl.includes('localhost') || cleanUrl.includes('127.0.0.1')) {
      const pathOnly = cleanUrl.replace(/^https?:\/\/[^\/]+/, '');
      return `${DOMAIN_BASE_URL}${pathOnly}`;
    }
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      return cleanUrl;
    }
    cleanUrl = cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;
    if (!cleanUrl.startsWith('/public')) {
      cleanUrl = `/public${cleanUrl}`;
    }
    return `${DOMAIN_BASE_URL}${cleanUrl}`;
  };

  const fetchSellerData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/seller/dashboard`, {
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        const json = await res.json();
        const sellerData = json?.seller || json?.data?.seller || json?.data || null;
        const productList = json?.products || json?.data?.products || [];

        if (sellerData && sellerData.id) {
          setStore(sellerData);
          setProducts(Array.isArray(productList) ? productList : []);
        } else {
          setStore(null);
        }
      } else {
        setStore(null);
      }
    } catch (err) {
      console.error('Gagal mengambil data seller:', err);
      setStore(null);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchSellerData();
  }, [fetchSellerData]);

  // Registrasi Toko Baru
  const handleRegisterStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/seller/register`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          store_name: storeName.trim(),
          description: storeDesc.trim(),
          city: storeCity.trim() || 'Kupang, NTT',
          address: storeCity.trim() || 'Kupang, NTT',
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.message || 'Gagal mendaftarkan toko.');
      }

      Swal.fire({
        title: t('successTitle'),
        text: t('registerStoreTitle'),
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });

      fetchSellerData();
    } catch (err: any) {
      Swal.fire(t('failedTitle'), err.message || 'Error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Buka Modal Tambah / Edit Produk
  const openAddModal = () => {
    setEditingProduct(null);
    setProdName('');
    setProdDesc('');
    setProdPricePi('');
    setProdStock('10');
    setProdImageFile(null);
    setShowProductModal(true);
  };

  const openEditModal = (prod: SellerProduct) => {
    setEditingProduct(prod);
    setProdName(prod.name);
    setProdDesc(prod.description || '');
    setProdPricePi(String(prod.price_pi));
    setProdStock(String(prod.stock ?? 10));
    setProdImageFile(null);
    setShowProductModal(true);
  };

  // Simpan Produk (Tambah atau Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim() || !prodPricePi) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', prodName.trim());
      formData.append('description', prodDesc.trim());
      formData.append('price_pi', prodPricePi);
      formData.append('stock', prodStock || '10');
      if (prodImageFile) {
        formData.append('image', prodImageFile);
      }

      const url = editingProduct
        ? `${API_BASE_URL}/seller/products/${editingProduct.id}`
        : `${API_BASE_URL}/seller/products`;

      if (editingProduct) {
        formData.append('_method', 'PUT');
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.message || 'Gagal menyimpan produk.');
      }

      Swal.fire({
        title: t('successTitle'),
        text: t('saveProduct'),
        icon: 'success',
        timer: 1400,
        showConfirmButton: false,
      });

      setShowProductModal(false);
      fetchSellerData();
    } catch (err: any) {
      Swal.fire(t('failedTitle'), err.message || 'Error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Hapus Produk
  const handleDeleteProduct = async (id: number) => {
    const confirm = await Swal.fire({
      title: t('deleteProduct') + '?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: t('deleteProduct'),
      cancelButtonText: t('cancel'),
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`${API_BASE_URL}/seller/products/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error('Gagal menghapus produk.');
      }

      fetchSellerData();
    } catch (err: any) {
      Swal.fire(t('failedTitle'), err.message || 'Error', 'error');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-gray-500 flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <p className="text-xs font-medium">{t('sellerDashboard')}...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/stores"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-amber-700 transition"
        >
          <ArrowLeft className="w-4 h-4" /> {t('navStores')}
        </Link>

        <Link
          href="/seller/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:underline"
        >
          <LayoutDashboard className="w-4 h-4" /> {t('sellerDashboard')}
        </Link>
      </div>

      {/* Jika Belum Punya Toko -> Form Buka Toko */}
      {!store ? (
        <div className="max-w-xl mx-auto bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">
                {t('registerStoreTitle')}
              </h1>
              <p className="text-xs text-gray-500">
                {piUser ? `@${piUser.username}` : t('signInWithPi')}
              </p>
            </div>
          </div>

          <form onSubmit={handleRegisterStore} className="space-y-4 mt-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                {t('storeName')} *
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Tenun Ikat Maumere Official"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                {t('storeAddress')} *
              </label>
              <input
                type="text"
                required
                value={storeCity}
                onChange={(e) => setStoreCity(e.target.value)}
                placeholder="Kupang / Labuan Bajo / Ende / Maumere"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                {t('storeDescription')}
              </label>
              <textarea
                rows={3}
                value={storeDesc}
                onChange={(e) => setStoreDesc(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 rounded-2xl text-xs transition shadow-md shadow-amber-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Store className="w-4 h-4" />
              )}
              <span>{t('registerStoreBtn')}</span>
            </button>
          </form>
        </div>
      ) : (
        <>
          {/* Header Profil Toko Terdaftar */}
          <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-purple-900 text-white rounded-3xl p-6 sm:p-8 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-green-400" />
                <span>{t('verifiedSeller')}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black">{store.store_name}</h1>
              <p className="text-xs sm:text-sm text-white/85">
                {store.description || t('defaultStoreDesc')}
              </p>
              <div className="flex items-center gap-2 text-xs text-yellow-300 pt-1">
                <MapPin className="w-4 h-4" />
                <span>{store.city || store.address || 'Nusa Tenggara Timur'}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={openAddModal}
              className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-5 py-3 rounded-2xl text-xs transition shadow-md inline-flex items-center justify-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{t('addProduct')}</span>
            </button>
          </div>

          {/* Daftar Produk Milik Toko */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-500" />
                <span>
                  {t('myProducts')} ({products.length})
                </span>
              </h2>
            </div>

            {products.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-medium">{t('noProductsFound')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((prod) => {
                  const imgUrl = getFullImageUrl(prod.image_url);
                  return (
                    <div
                      key={prod.id}
                      className="border border-gray-100 rounded-2xl p-4 flex flex-col justify-between hover:shadow-sm transition"
                    >
                      <div>
                        <div className="h-40 rounded-xl bg-gray-50 overflow-hidden mb-3 flex items-center justify-center border border-gray-100 relative">
                          {imgUrl ? (
                            <img
                              src={imgUrl}
                              alt={prod.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-8 h-8 text-gray-300" />
                          )}
                        </div>
                        <h3 className="font-bold text-sm text-gray-900 line-clamp-1">
                          {prod.name}
                        </h3>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                          {prod.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <div>
                          <span className="text-sm font-extrabold text-amber-600 block">
                            π {prod.price_pi}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {t('stock')}: {prod.stock}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(prod)}
                            title={t('editProduct')}
                            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(prod.id)}
                            title={t('deleteProduct')}
                            className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal Tambah / Edit Produk */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-extrabold text-gray-900">
                {editingProduct ? t('editProduct') : t('addProduct')}
              </h3>
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t('productName')} *
                </label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {t('productPricePi')} *
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    required
                    value={prodPricePi}
                    onChange={(e) => setProdPricePi(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {t('productStock')} *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t('productDescription')}
                </label>
                <textarea
                  rows={3}
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t('productImage')}
                </label>
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-3 px-4 text-xs text-gray-500 hover:border-amber-400 cursor-pointer transition">
                  <ImagePlus className="w-4 h-4 text-amber-500" />
                  <span className="truncate">
                    {prodImageFile ? prodImageFile.name : t('productImage')}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      setProdImageFile(e.target.files?.[0] || null)
                    }
                  />
                </label>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{t('saveProduct')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import {
  Package,
  Plus,
  ShoppingBag,
  Coins,
  TrendingUp,
  Edit,
  Trash2,
  Search,
  Loader2,
  Image as ImageIcon,
  CheckCircle2,
  X,
  Zap,
  Tag,
  Clock,
  Layers,
  Upload,
} from 'lucide-react';
import { productService } from '@/services/productService';
import Swal from 'sweetalert2';

interface SellerProduct {
  id: number;
  name: string;
  slug: string;
  description: string;
  price_pi: string | number;
  discount_price_pi?: string | number | null;
  is_flash_sale?: boolean;
  flash_sale_ends_at?: string | null;
  flash_sale_quota?: number | null;
  stock: number;
  sisa_stock?: number;
  sold?: number;
  image_url: string;
  images?: string[];
  category_id?: number;
  category?: { id?: number; name: string };
}

interface NewImageItem {
  file: File;
  preview: string;
}

// Helper format datetime dari API ke format input datetime-local (YYYY-MM-DDTHH:mm)
const toDateTimeLocal = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
};

export default function SellerDashboard() {
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // State Modal (Bisa untuk Tambah maupun Edit)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<SellerProduct | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // State Multi-Gambar (foto lama yang dipertahankan + foto baru yang diunggah)
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<NewImageItem[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_pi: '',
    discount_price_pi: '',
    is_flash_sale: false,
    flash_sale_ends_at: '',
    flash_sale_quota: '',
    stock: '',
    category_id: '1',
  });

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'https://nttstorepi.mejatika.com/api';
  const DOMAIN_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

  const resolveProductImageUrl = (url?: string | null): string => {
    if (!url || typeof url !== 'string' || url.trim() === '') return '';
    const clean = url.trim().replace(/\\/g, '/');
    if (
      (clean.startsWith('http://') || clean.startsWith('https://')) &&
      !clean.includes('nttstorepi.mejatika.com')
    ) {
      return clean;
    }
    const fileName = clean.split('/').filter(Boolean).pop();
    if (!fileName) return '';
    return `${DOMAIN_BASE_URL}/public/products/${fileName}`;
  };

  const formatPiPrice = (rawVal?: string | number | null): string => {
    if (rawVal === null || rawVal === undefined || rawVal === '') return '0';
    const str = String(rawVal).trim();
    const parts = str.split('.');
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.length > 1 ? `${intPart}.${parts[1]}` : intPart;
  };

  const loadSellerProducts = async () => {
    try {
      setLoading(true);
      const res: any = await productService.getSellerProducts();
      const productList = res?.data?.data || res?.data || res || [];
      setProducts(Array.isArray(productList) ? productList : []);
    } catch (err) {
      console.error('Gagal memuat produk seller:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSellerProducts();
  }, []);

  const cleanupNewPreviews = (items: NewImageItem[]) => {
    items.forEach((item) => URL.revokeObjectURL(item.preview));
  };

  // Buka Modal Mode Tambah
  const openAddModal = () => {
    cleanupNewPreviews(newImages);
    setEditingProduct(null);
    setExistingImages([]);
    setNewImages([]);
    setFormData({
      name: '',
      description: '',
      price_pi: '',
      discount_price_pi: '',
      is_flash_sale: false,
      flash_sale_ends_at: '',
      flash_sale_quota: '',
      stock: '',
      category_id: '1',
    });
    setIsModalOpen(true);
  };

  // Buka Modal Mode Edit (Mengisi form dengan data produk + promo/flash sale + galeri foto)
  const openEditModal = (product: SellerProduct) => {
    cleanupNewPreviews(newImages);
    setEditingProduct(product);

    const gallery =
      Array.isArray(product.images) && product.images.length > 0
        ? product.images.map(resolveProductImageUrl).filter(Boolean)
        : product.image_url
        ? [resolveProductImageUrl(product.image_url)].filter(Boolean)
        : [];

    setExistingImages(gallery);
    setNewImages([]);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price_pi: String(product.price_pi || ''),
      discount_price_pi:
        product.discount_price_pi && Number(product.discount_price_pi) > 0
          ? String(product.discount_price_pi)
          : '',
      is_flash_sale: Boolean(product.is_flash_sale),
      flash_sale_ends_at: toDateTimeLocal(product.flash_sale_ends_at),
      flash_sale_quota:
        product.flash_sale_quota !== null && product.flash_sale_quota !== undefined
          ? String(product.flash_sale_quota)
          : '',
      stock: String(product.stock ?? 0),
      category_id: String(product.category_id || product.category?.id || '1'),
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    cleanupNewPreviews(newImages);
    setNewImages([]);
    setIsModalOpen(false);
  };

  const handleToggleFlashSale = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      is_flash_sale: checked,
      flash_sale_ends_at: checked ? prev.flash_sale_ends_at : '',
      flash_sale_quota: checked ? prev.flash_sale_quota : '',
    }));
  };

  // Handler Pilih Multi-Foto (Maksimal total 8 foto)
  const handleSelectMultiImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    const totalCurrent = existingImages.length + newImages.length;
    if (totalCurrent + selected.length > 8) {
      Swal.fire('Maksimal 8 Foto', 'Total foto produk maksimal 8 gambar.', 'warning');
      e.target.value = '';
      return;
    }

    const added: NewImageItem[] = [];
    for (const file of selected) {
      if (file.size > 10 * 1024 * 1024) {
        Swal.fire(
          'Ukuran Terlalu Besar',
          `File "${file.name}" melebihi batas 10MB.`,
          'warning'
        );
        e.target.value = '';
        return;
      }
      added.push({
        file,
        preview: URL.createObjectURL(file),
      });
    }

    setNewImages((prev) => [...prev, ...added]);
    e.target.value = '';
  };

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSetPrimaryExistingImage = (index: number) => {
    if (index === 0) return;
    setExistingImages((prev) => {
      const copy = [...prev];
      const [picked] = copy.splice(index, 1);
      copy.unshift(picked);
      return copy;
    });
  };

  const handleRemoveNewImage = (index: number) => {
    setNewImages((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const handleSetPrimaryNewImage = (index: number) => {
    if (index === 0 && existingImages.length === 0) return;
    setNewImages((prev) => {
      const copy = [...prev];
      const [picked] = copy.splice(index, 1);
      copy.unshift(picked);
      return copy;
    });
  };

  // Handler Hapus Produk
  const handleDeleteProduct = async (id: number) => {
    const result = await Swal.fire({
      title: 'Hapus Produk?',
      text: 'Produk yang dihapus tidak dapat dikembalikan!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    });

    if (result.isConfirmed) {
      try {
        await productService.deleteProduct(id);
        setProducts((prev) => prev.filter((p) => p.id !== id));
        Swal.fire('Terhapus!', 'Produk berhasil dihapus.', 'success');
      } catch (err: any) {
        Swal.fire('Gagal', err.message || 'Gagal menghapus produk.', 'error');
      }
    }
  };

  // Kalkulasi preview diskon di modal
  const normalPrice = parseFloat(formData.price_pi) || 0;
  const discountPrice = parseFloat(formData.discount_price_pi) || 0;
  const hasValidDiscount = discountPrice > 0 && discountPrice < normalPrice;
  const discountPercentage = hasValidDiscount
    ? Math.round(((normalPrice - discountPrice) / normalPrice) * 100)
    : 0;

  // Handler Submit (Tambah Baru ATAU Update Produk)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.discount_price_pi && discountPrice >= normalPrice) {
      Swal.fire('Validasi Gagal', 'Harga diskon harus lebih kecil dari harga normal.', 'warning');
      return;
    }

    if (formData.is_flash_sale && (!formData.discount_price_pi || discountPrice <= 0)) {
      Swal.fire(
        'Validasi Gagal',
        'Isi Harga Flash Sale terlebih dahulu jika mengaktifkan Flash Sale.',
        'warning'
      );
      return;
    }

    if (
      formData.is_flash_sale &&
      formData.flash_sale_quota &&
      parseInt(formData.flash_sale_quota, 10) > parseInt(formData.stock || '0', 10)
    ) {
      Swal.fire(
        'Validasi Gagal',
        'Kuota Flash Sale tidak boleh melebihi total stok produk.',
        'warning'
      );
      return;
    }

    setSubmitting(true);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('price_pi', formData.price_pi);
      data.append('stock', formData.stock);
      data.append('category_id', formData.category_id);

      // Kirim field Promo & Flash Sale
      data.append(
        'discount_price_pi',
        formData.discount_price_pi && discountPrice > 0 ? formData.discount_price_pi : ''
      );
      data.append('is_flash_sale', formData.is_flash_sale ? '1' : '0');
      data.append(
        'flash_sale_ends_at',
        formData.is_flash_sale && formData.flash_sale_ends_at ? formData.flash_sale_ends_at : ''
      );
      data.append(
        'flash_sale_quota',
        formData.is_flash_sale && formData.flash_sale_quota ? formData.flash_sale_quota : ''
      );

      // Kirim galeri multi-foto
      if (editingProduct) {
        existingImages.forEach((url) => {
          data.append('existing_images[]', url);
        });
      }

      newImages.forEach((item) => {
        data.append('images[]', item.file);
      });

      if (editingProduct) {
        data.append('_method', 'PUT');
        await productService.updateProduct(editingProduct.id, data);
        Swal.fire('Berhasil!', 'Data produk berhasil diperbarui.', 'success');
      } else {
        await productService.createProduct(data);
        Swal.fire('Berhasil!', 'Produk baru telah ditambahkan.', 'success');
      }

      cleanupNewPreviews(newImages);
      setNewImages([]);
      setIsModalOpen(false);
      setEditingProduct(null);
      loadSellerProducts();
    } catch (err: any) {
      console.error('Error save product:', err);
      Swal.fire(
        'Gagal',
        err?.response?.data?.message || err.message || 'Terjadi kesalahan saat menyimpan produk.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper hitung sisa stok aktual per produk
  const getRemainingStock = (p: SellerProduct) =>
    p.sisa_stock !== undefined && p.sisa_stock !== null
      ? Number(p.sisa_stock)
      : Math.max(0, (Number(p.stock) || 0) - (Number(p.sold) || 0));

  const totalStock = products.reduce((sum, p) => sum + getRemainingStock(p), 0);
  const totalValuePi = products.reduce((sum, p) => {
    const activePrice =
      p.discount_price_pi && Number(p.discount_price_pi) > 0
        ? parseFloat(String(p.discount_price_pi))
        : parseFloat(String(p.price_pi)) || 0;
    return sum + activePrice * getRemainingStock(p);
  }, 0);

  const totalGalleryCount = existingImages.length + newImages.length;

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Dashboard */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Dashboard Penjual NTTStorePi
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Kelola katalog produk, promo flash sale, stok barang, dan pendapatan Pi Network Anda.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-3 rounded-2xl shadow-sm transition active:scale-95 text-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Produk</span>
          </button>
          <Link
  href="/seller/live"
  className="inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 py-3 rounded-2xl shadow-sm transition text-sm"
>
  <Radio className="w-5 h-5" />
  <span>Mulai Live</span>
</Link>
        </div>

        {/* Card Statistik */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Total Produk
              </span>
              <h3 className="text-2xl font-extrabold text-gray-900">{products.length}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Nilai Pi Sisa Stok
              </span>
              <h3 className="text-2xl font-extrabold text-amber-600">
                π {totalValuePi.toFixed(2)}
              </h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Total Sisa Stok
              </span>
              <h3 className="text-2xl font-extrabold text-gray-900">{totalStock} Unit</h3>
            </div>
          </div>
        </div>

        {/* Tabel Produk */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-500" /> Daftar Katalog Produk
            </h2>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              <span className="text-xs font-medium">Memuat katalog toko...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Belum ada produk yang cocok atau katalog masih kosong.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 text-[11px] uppercase tracking-wider text-gray-400 border-b border-gray-100">
                    <th className="p-4 pl-6">Produk</th>
                    <th className="p-4">Harga (Pi)</th>
                    <th className="p-4">Stok & Terjual</th>
                    <th className="p-4">Kategori</th>
                    <th className="p-4 pr-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredProducts.map((p) => {
                    const sisa = getRemainingStock(p);
                    const thumbUrl = resolveProductImageUrl(p.image_url);
                    const photoCount = Array.isArray(p.images) ? p.images.length : thumbUrl ? 1 : 0;
                    const hasPromo =
                      p.discount_price_pi !== null &&
                      p.discount_price_pi !== undefined &&
                      Number(p.discount_price_pi) > 0 &&
                      Number(p.discount_price_pi) < Number(p.price_pi);

                    return (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition">
                        <td className="p-4 pl-6 flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100 flex items-center justify-center">
                            {thumbUrl ? (
                              <img
                                src={thumbUrl}
                                alt={p.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-gray-400" />
                            )}
                            {photoCount > 1 && (
                              <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[9px] font-bold px-1 rounded">
                                +{photoCount - 1}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-bold text-gray-900 line-clamp-1">{p.name}</h4>
                              {p.is_flash_sale && (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-100 text-orange-700">
                                  <Zap className="w-2.5 h-2.5" /> Flash Sale
                                </span>
                              )}
                              {!p.is_flash_sale && hasPromo && (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600">
                                  Promo
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-400 line-clamp-1">
                              {p.description || '-'}
                            </p>
                          </div>
                        </td>
                        <td className="p-4">
                          {hasPromo ? (
                            <div className="flex flex-col">
                              <span className="font-extrabold text-orange-600">
                                π {formatPiPrice(p.discount_price_pi)}
                              </span>
                              <span className="text-[10px] text-gray-400 line-through">
                                π {formatPiPrice(p.price_pi)}
                              </span>
                            </div>
                          ) : (
                            <span className="font-bold text-amber-600">
                              π {formatPiPrice(p.price_pi)}
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-block w-fit px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                sisa > 0
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-red-50 text-red-700'
                              }`}
                            >
                              Sisa: {sisa} / {p.stock}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              Terjual: {Number(p.sold ?? 0)} Unit
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-gray-500 font-medium">
                          {p.category?.name || 'Umum'}
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => openEditModal(p)}
                              className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition"
                              title="Edit Produk & Flash Sale"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                              title="Hapus Produk"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL TAMBAH / EDIT PRODUK */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-gray-100 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                {editingProduct ? (
                  <>
                    <Edit className="w-5 h-5 text-amber-500" /> Edit Produk & Promo
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 text-amber-500" /> Tambah Produk Baru
                  </>
                )}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Nama Produk</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Tenun NTT Asli"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Harga Normal (π Pi)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    value={formData.price_pi}
                    onChange={(e) => setFormData({ ...formData, price_pi: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Total Stok Awal
                    {editingProduct && (
                      <span className="font-normal text-gray-400 ml-1">
                        (Terjual: {Number(editingProduct.sold ?? 0)})
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    required
                    min={editingProduct ? Number(editingProduct.sold ?? 0) : 0}
                    placeholder="10"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Pengaturan Promo & Flash Sale */}
              <div className="border border-amber-200 bg-amber-50/50 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-xs">Promo & Flash Sale</h4>
                      <p className="text-[11px] text-gray-500">
                        Atur harga diskon atau etalase Flash Sale
                      </p>
                    </div>
                  </div>

                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.is_flash_sale}
                      onChange={(e) => handleToggleFlashSale(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="relative w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                    <span className="text-[11px] font-bold text-gray-700">
                      {formData.is_flash_sale ? 'Aktif' : 'Off'}
                    </span>
                  </label>
                </div>

                <div>
                  <label className="flex items-center justify-between font-bold text-gray-700 mb-1">
                    <span className="inline-flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-orange-600" />
                      {formData.is_flash_sale ? 'Harga Flash Sale (π Pi) *' : 'Harga Diskon (π Pi)'}
                    </span>
                    {hasValidDiscount && (
                      <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-extrabold rounded-full">
                        -{discountPercentage}%
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required={formData.is_flash_sale}
                    placeholder="Kosongkan jika tidak ada promo"
                    value={formData.discount_price_pi}
                    onChange={(e) =>
                      setFormData({ ...formData, discount_price_pi: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-orange-700"
                  />
                </div>

                {formData.is_flash_sale && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-amber-200/70">
                    <div>
                      <label className="flex items-center gap-1 font-bold text-gray-700 mb-1">
                        <Clock className="w-3.5 h-3.5 text-orange-600" />
                        Berakhir Pada
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.flash_sale_ends_at}
                        onChange={(e) =>
                          setFormData({ ...formData, flash_sale_ends_at: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-1 font-bold text-gray-700 mb-1">
                        <Layers className="w-3.5 h-3.5 text-orange-600" />
                        Kuota Flash Sale
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={formData.stock || undefined}
                        placeholder="Opsional"
                        value={formData.flash_sale_quota}
                        onChange={(e) =>
                          setFormData({ ...formData, flash_sale_quota: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Deskripsi</label>
                <textarea
                  rows={3}
                  placeholder="Deskripsi singkat produk..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                ></textarea>
              </div>

              {/* Upload & Kelola Multi-Foto Produk */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-bold text-gray-700">
                    Foto Produk (Maks. 8 Foto)
                  </label>
                  <span className="text-[11px] font-semibold text-amber-700">
                    {totalGalleryCount}/8 foto
                  </span>
                </div>

                {totalGalleryCount > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mb-2">
                    {/* Foto lama dari server (saat mode Edit) */}
                    {existingImages.map((url, idx) => {
                      const isPrimary = idx === 0;
                      return (
                        <div
                          key={`existing-${idx}`}
                          className={`relative aspect-square rounded-xl overflow-hidden border-2 bg-gray-100 ${
                            isPrimary ? 'border-amber-500' : 'border-gray-200'
                          }`}
                        >
                          <img
                            src={url}
                            alt={`Foto Produk ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {isPrimary ? (
                            <span className="absolute bottom-1 left-1 bg-amber-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                              Utama
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryExistingImage(idx)}
                              className="absolute bottom-1 left-1 bg-black/70 hover:bg-amber-600 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full cursor-pointer"
                            >
                              Utama
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingImage(idx)}
                            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full shadow hover:bg-red-700 cursor-pointer"
                            title="Hapus foto"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}

                    {/* Foto baru yang baru dipilih dari perangkat */}
                    {newImages.map((item, idx) => {
                      const isPrimary = existingImages.length === 0 && idx === 0;
                      return (
                        <div
                          key={`new-${idx}`}
                          className={`relative aspect-square rounded-xl overflow-hidden border-2 bg-gray-100 ${
                            isPrimary ? 'border-amber-500' : 'border-emerald-300'
                          }`}
                        >
                          <img
                            src={item.preview}
                            alt={`Foto Baru ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {isPrimary ? (
                            <span className="absolute bottom-1 left-1 bg-amber-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                              Utama
                            </span>
                          ) : (
                            existingImages.length === 0 && (
                              <button
                                type="button"
                                onClick={() => handleSetPrimaryNewImage(idx)}
                                className="absolute bottom-1 left-1 bg-black/70 hover:bg-amber-600 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full cursor-pointer"
                              >
                                Utama
                              </button>
                            )
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveNewImage(idx)}
                            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full shadow hover:bg-red-700 cursor-pointer"
                            title="Hapus foto"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}

                    {totalGalleryCount < 8 && (
                      <label className="aspect-square border-2 border-dashed border-gray-200 hover:border-amber-500 bg-gray-50 hover:bg-amber-50/40 rounded-xl flex flex-col items-center justify-center cursor-pointer transition p-2 text-center">
                        <Plus className="w-5 h-5 text-amber-600 mb-0.5" />
                        <span className="text-[10px] font-bold text-gray-700">Tambah</span>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg, image/webp"
                          multiple
                          onChange={handleSelectMultiImages}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-gray-200 hover:border-amber-500 bg-gray-50/60 hover:bg-amber-50/30 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition">
                    <Upload className="w-5 h-5 text-amber-600 mb-1" />
                    <span className="text-xs font-bold text-gray-700">
                      Pilih beberapa foto produk (PNG, JPG, WEBP)
                    </span>
                    <span className="text-[10px] text-gray-400 mt-0.5">
                      Maksimal 8 foto (@10MB per foto)
                    </span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      multiple
                      onChange={handleSelectMultiImages}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>{editingProduct ? 'Simpan Perubahan' : 'Simpan Produk'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

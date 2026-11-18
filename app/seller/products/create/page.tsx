'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { productService } from '@/services/productService';
import {
  ArrowLeft,
  PackagePlus,
  Upload,
  X,
  AlertCircle,
  CheckCircle2,
  Zap,
  Tag,
  Clock,
  Layers,
  Plus,
} from 'lucide-react';

interface Category {
  id: number;
  name: string;
}

interface ImageItem {
  file: File;
  preview: string;
}

export default function CreateProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchingCategories, setFetchingCategories] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // State untuk Preview & File Multi-Gambar (maksimal 8 foto, foto pertama jadi sampul utama)
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    description: '',
    price_pi: '',
    stock: '',
    discount_price_pi: '',
    is_flash_sale: false,
    flash_sale_ends_at: '',
    flash_sale_quota: '',
  });

  useEffect(() => {
    productService
      .getCategories()
      .then((res) => {
        const catList = res.data || res;
        setCategories(catList);
      })
      .catch((err) => {
        console.error('Gagal memuat kategori:', err);
        setErrorMessage('Gagal memuat daftar kategori dari server.');
      })
      .finally(() => setFetchingCategories(false));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage(null);
  };

  const handleToggleFlashSale = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      is_flash_sale: checked,
      // Reset field khusus flash sale jika dimatikan
      flash_sale_ends_at: checked ? prev.flash_sale_ends_at : '',
      flash_sale_quota: checked ? prev.flash_sale_quota : '',
    }));
    if (errorMessage) setErrorMessage(null);
  };

  // Handler Pilih Multi File Gambar (Maksimal 8 foto, @10MB)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    if (imageItems.length + selectedFiles.length > 8) {
      setErrorMessage('Maksimal 8 foto produk yang dapat diunggah.');
      e.target.value = '';
      return;
    }

    const newItems: ImageItem[] = [];
    for (const file of selectedFiles) {
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage(`Ukuran file "${file.name}" melebihi batas maksimal 10MB.`);
        e.target.value = '';
        return;
      }
      newItems.push({
        file,
        preview: URL.createObjectURL(file),
      });
    }

    setImageItems((prev) => [...prev, ...newItems]);
    setErrorMessage(null);
    e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setImageItems((prev) => {
      const target = prev[index];
      if (target) {
        URL.revokeObjectURL(target.preview);
      }
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const handleSetPrimaryImage = (index: number) => {
    if (index === 0) return;
    setImageItems((prev) => {
      const copy = [...prev];
      const [selected] = copy.splice(index, 1);
      copy.unshift(selected);
      return copy;
    });
  };

  // Hitung persentase diskon untuk preview UI
  const normalPrice = parseFloat(formData.price_pi) || 0;
  const discountPrice = parseFloat(formData.discount_price_pi) || 0;
  const hasValidDiscount = discountPrice > 0 && discountPrice < normalPrice;
  const discountPercentage = hasValidDiscount
    ? Math.round(((normalPrice - discountPrice) / normalPrice) * 100)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validasi Frontend untuk Promo & Flash Sale
    if (formData.discount_price_pi && discountPrice >= normalPrice) {
      setErrorMessage('Harga diskon/promo harus lebih kecil dari harga normal.');
      return;
    }

    if (formData.is_flash_sale && (!formData.discount_price_pi || discountPrice <= 0)) {
      setErrorMessage('Isi Harga Flash Sale (harga diskon) terlebih dahulu jika mengaktifkan Flash Sale.');
      return;
    }

    if (
      formData.is_flash_sale &&
      formData.flash_sale_quota &&
      parseInt(formData.flash_sale_quota, 10) > parseInt(formData.stock || '0', 10)
    ) {
      setErrorMessage('Kuota Flash Sale tidak boleh melebihi total stok produk.');
      return;
    }

    setLoading(true);

    try {
      const bodyFormData = new FormData();
      bodyFormData.append('name', formData.name);
      bodyFormData.append('category_id', formData.category_id);
      bodyFormData.append('description', formData.description);
      bodyFormData.append('price_pi', formData.price_pi);
      bodyFormData.append('stock', formData.stock);

      // Data Promo & Flash Sale
      if (formData.discount_price_pi && discountPrice > 0) {
        bodyFormData.append('discount_price_pi', formData.discount_price_pi);
      }

      bodyFormData.append('is_flash_sale', formData.is_flash_sale ? '1' : '0');

      if (formData.is_flash_sale) {
        if (formData.flash_sale_ends_at) {
          bodyFormData.append('flash_sale_ends_at', formData.flash_sale_ends_at);
        }
        if (formData.flash_sale_quota) {
          bodyFormData.append('flash_sale_quota', formData.flash_sale_quota);
        }
      }

      if (imageItems.length > 0) {
        imageItems.forEach((item) => {
          bodyFormData.append('images[]', item.file);
        });
      }

      const res = await productService.createProduct(bodyFormData);

      if (res.success || res.data) {
        imageItems.forEach((item) => URL.revokeObjectURL(item.preview));
        alert('Produk berhasil ditambahkan!');
        router.push('/');
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Gagal menambahkan produk. Pastikan Anda sudah terdaftar sebagai Seller dan akun disetujui.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-purple-700 font-medium mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
      </Link>

      <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-10 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-purple-100 text-purple-700 rounded-2xl">
            <PackagePlus className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Tambah Produk Baru</h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Unggah produk lokal khas NTT Anda untuk dijual menggunakan Pi Coin (π).
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
            <div>{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nama Produk */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Nama Produk <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="Contoh: Kain Tenun Ikat Sumba Motifs Pasola"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-600 focus:outline-none transition text-sm"
            />
          </div>

          {/* Grid Kategori & Stok */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Kategori Produk <span className="text-red-500">*</span>
              </label>
              <select
                name="category_id"
                required
                value={formData.category_id}
                onChange={handleChange}
                disabled={fetchingCategories}
                className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white transition text-sm disabled:bg-gray-50"
              >
                <option value="">
                  {fetchingCategories ? 'Memuat kategori...' : '-- Pilih Kategori --'}
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Stok Produk <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="stock"
                required
                min="1"
                placeholder="10"
                value={formData.stock}
                onChange={handleChange}
                className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-600 focus:outline-none transition text-sm"
              />
            </div>
          </div>

          {/* Harga Normal Pi Coin */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Harga Normal Produk (π Pi Coin) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-700 font-extrabold text-base">
                π
              </span>
              <input
                type="number"
                step="any"
                name="price_pi"
                required
                placeholder="0.05"
                value={formData.price_pi}
                onChange={handleChange}
                className="w-full pl-9 pr-4 py-3.5 border border-purple-200 bg-purple-50/30 rounded-2xl focus:ring-2 focus:ring-purple-600 focus:outline-none font-bold text-purple-900 transition text-sm"
              />
            </div>
          </div>

          {/* Pengaturan Promo & Flash Sale */}
          <div className="border border-amber-200 bg-gradient-to-br from-amber-50/70 to-orange-50/40 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-gray-900">
                    Promo & Flash Sale (Opsional)
                  </h2>
                  <p className="text-xs text-gray-500">
                    Berikan harga diskon atau ikutkan produk ke etalase Flash Sale.
                  </p>
                </div>
              </div>

              {/* Switch Toggle Flash Sale */}
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.is_flash_sale}
                  onChange={(e) => handleToggleFlashSale(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                <span className="text-xs font-bold text-gray-700">
                  {formData.is_flash_sale ? 'Flash Sale Aktif' : 'Flash Sale'}
                </span>
              </label>
            </div>

            {/* Input Harga Promo / Flash Sale */}
            <div>
              <label className="flex items-center justify-between text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                <span className="inline-flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-orange-600" />
                  {formData.is_flash_sale ? (
                    <>
                      Harga Flash Sale (π Pi Coin) <span className="text-red-500">*</span>
                    </>
                  ) : (
                    'Harga Diskon / Promo Reguler (π Pi Coin)'
                  )}
                </span>

                {hasValidDiscount && (
                  <span className="px-2 py-0.5 bg-red-600 text-white text-[11px] font-extrabold rounded-full">
                    Hemat -{discountPercentage}%
                  </span>
                )}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-600 font-extrabold text-base">
                  π
                </span>
                <input
                  type="number"
                  step="any"
                  name="discount_price_pi"
                  required={formData.is_flash_sale}
                  placeholder={
                    normalPrice > 0
                      ? `Lebih kecil dari ${normalPrice}`
                      : 'Kosongkan jika tidak ada diskon'
                  }
                  value={formData.discount_price_pi}
                  onChange={handleChange}
                  className="w-full pl-9 pr-4 py-3 border border-amber-200 bg-white rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none font-bold text-orange-700 transition text-sm"
                />
              </div>
              {formData.discount_price_pi && discountPrice >= normalPrice && normalPrice > 0 && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">
                  Harga diskon harus lebih rendah dari harga normal (π {normalPrice}).
                </p>
              )}
            </div>

            {/* Detail Durasi & Kuota Khusus saat Flash Sale Aktif */}
            {formData.is_flash_sale && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-amber-200/70">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    <Clock className="w-3.5 h-3.5 text-orange-600" />
                    Berakhir Pada (Opsional)
                  </label>
                  <input
                    type="datetime-local"
                    name="flash_sale_ends_at"
                    value={formData.flash_sale_ends_at}
                    onChange={handleChange}
                    className="w-full px-3.5 py-3 border border-amber-200 bg-white rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm"
                  />
                  <p className="mt-1 text-[11px] text-gray-500">
                    Kosongkan jika flash sale berlangsung sampai kuota habis.
                  </p>
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    <Layers className="w-3.5 h-3.5 text-orange-600" />
                    Kuota Flash Sale (Opsional)
                  </label>
                  <input
                    type="number"
                    name="flash_sale_quota"
                    min="1"
                    max={formData.stock || undefined}
                    placeholder={formData.stock ? `Maks. ${formData.stock}` : 'Contoh: 5'}
                    value={formData.flash_sale_quota}
                    onChange={handleChange}
                    className="w-full px-3.5 py-3 border border-amber-200 bg-white rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm"
                  />
                  <p className="mt-1 text-[11px] text-gray-500">
                    Flash sale otomatis berakhir saat jumlah terjual mencapai kuota.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Area Upload Multi-File Gambar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Foto Produk (Bisa Lebih dari 1, Maks. 8 Foto)
              </label>
              <span className="text-[11px] font-semibold text-purple-700">
                {imageItems.length}/8 foto dipilih
              </span>
            </div>

            {imageItems.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {imageItems.map((item, idx) => (
                    <div
                      key={idx}
                      className={`relative aspect-square rounded-2xl overflow-hidden border-2 group bg-gray-50 ${
                        idx === 0 ? 'border-purple-600' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={item.preview}
                        alt={`Preview Produk ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />

                      {idx === 0 ? (
                        <span className="absolute bottom-2 left-2 bg-purple-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                          Foto Utama
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryImage(idx)}
                          className="absolute bottom-2 left-2 bg-black/70 hover:bg-purple-700 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full transition cursor-pointer"
                        >
                          Jadikan Utama
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition shadow-md cursor-pointer"
                        title="Hapus Gambar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {imageItems.length < 8 && (
                    <label className="aspect-square border-2 border-dashed border-gray-200 hover:border-purple-500 bg-gray-50/60 hover:bg-purple-50/30 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition p-3 text-center">
                      <Plus className="w-6 h-6 text-purple-600 mb-1" />
                      <span className="text-[11px] font-bold text-gray-700">Tambah Foto</span>
                      <span className="text-[10px] text-gray-400">Maks 10MB</span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            ) : (
              <label className="border-2 border-dashed border-gray-200 hover:border-purple-500 bg-gray-50/50 hover:bg-purple-50/30 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition">
                <div className="p-3 bg-white rounded-full shadow-xs mb-2">
                  <Upload className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-xs font-bold text-gray-700 mb-1">
                  Klik untuk pilih beberapa foto produk sekaligus
                </span>
                <span className="text-[10px] text-gray-400">
                  Format: PNG, JPG, WEBP (Maksimal 8 foto, @10MB per foto)
                </span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Deskripsi Produk */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Deskripsi Produk <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              required
              rows={4}
              placeholder="Jelaskan detail produk, seperti ukuran kain, asal daerah (misal: Sumba/Flores/Timor), dan keunikannya..."
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-600 focus:outline-none transition text-sm"
            ></textarea>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-4 px-6 rounded-2xl transition shadow-lg shadow-purple-200 disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            {loading ? (
              'Mengunggah & Menyimpan Produk...'
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" /> Terbitkan Produk ke Marketplace
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

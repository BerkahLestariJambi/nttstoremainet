'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  CheckCircle2
} from 'lucide-react';
import { productService } from '@/services/productService';
import Swal from 'sweetalert2';

interface SellerProduct {
  id: number;
  name: string;
  slug: string;
  description: string;
  price_pi: string | number;
  stock: number;
  image_url: string;
  category?: { name: string };
}

export default function SellerDashboard() {
  const router = useRouter();
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State Tambah Produk
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_pi: '',
    stock: '',
    category_id: '1',
    image: null as File | null,
  });

  // Fetch Produk milik Seller
  const loadSellerProducts = async () => {
    try {
      setLoading(true);
      const res: any = await productService.getProducts();
      const productList = res.data || res || [];
      setProducts(Array.isArray(productList) ? productList : []);
    } catch (err) {
      console.error('Gagal memuat produk seller:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSellerProducts();
  }, []);

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

  // Handler Form Tambah Produk
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('price_pi', formData.price_pi);
      data.append('stock', formData.stock);
      data.append('category_id', formData.category_id);
      if (formData.image) {
        data.append('image', formData.image);
      }

      await productService.createProduct(data);
      Swal.fire('Berhasil!', 'Produk baru telah ditambahkan.', 'success');
      setIsModalOpen(false);
      setFormData({ name: '', description: '', price_pi: '', stock: '', category_id: '1', image: null });
      loadSellerProducts();
    } catch (err: any) {
      console.error('Error create product:', err);
      Swal.fire('Gagal', err.message || 'Gagal menambah produk.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter produk berdasarkan pencarian
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Kalkulasi statistik sederhana
  const totalStock = products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
  const totalValuePi = products.reduce(
    (sum, p) => sum + (parseFloat(String(p.price_pi)) || 0) * (Number(p.stock) || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Dashboard */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Dashboard Penjual NTTStorePi 🏪
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Kelola katalog produk, stok barang, dan pendapatan Pi Network Anda.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-3 rounded-2xl shadow-sm transition active:scale-95 text-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Produk</span>
          </button>
        </div>

        {/* Card Statistik */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Produk</span>
              <h3 className="text-2xl font-extrabold text-gray-900">{products.length}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nilai Pi Katalog</span>
              <h3 className="text-2xl font-extrabold text-amber-600">π {totalValuePi.toFixed(2)}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Unit Stok</span>
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

            {/* Input Search */}
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
                    <th className="p-4">Stok</th>
                    <th className="p-4">Kategori</th>
                    <th className="p-4 pr-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition">
                      <td className="p-4 pl-6 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100 flex items-center justify-center">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 line-clamp-1">{p.name}</h4>
                          <p className="text-[11px] text-gray-400 line-clamp-1">{p.description || '-'}</p>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-amber-600">π {p.price_pi}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${Number(p.stock) > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                          {p.stock} Unit
                        </span>
                      </td>
                      <td className="p-4 text-gray-500 font-medium">{p.category?.name || 'Umum'}</td>
                      <td className="p-4 pr-6 text-right space-x-2">
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                          title="Hapus Produk"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* MODAL TAMBAH PRODUK */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-gray-100 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="text-amber-500" /> Tambah Produk Baru
            </h3>

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
                  <label className="block font-bold text-gray-700 mb-1">Harga (π Pi)</label>
                  <input
                    type="number"
                    step="0.00000001"
                    required
                    placeholder="0.00"
                    value={formData.price_pi}
                    onChange={(e) => setFormData({ ...formData, price_pi: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Stok Jumlah</label>
                  <input
                    type="number"
                    required
                    placeholder="10"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
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

              <div>
                <label className="block font-bold text-gray-700 mb-1">Foto Produk</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, image: e.target.files ? e.target.files[0] : null })}
                  className="w-full text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Simpan Produk</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

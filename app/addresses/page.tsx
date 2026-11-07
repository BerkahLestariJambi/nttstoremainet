'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { addressService, UserAddressData } from '@/services/addressService';
import { shippingService, BiteshipArea } from '@/services/shippingService';
import { ArrowLeft, MapPin, Plus, CheckCircle2, Trash2, ArrowRight, Search, Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

function AddressListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSelectMode = searchParams.get('select') === 'true';

  const [addresses, setAddresses] = useState<UserAddressData[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showForm, setShowForm] = useState<boolean>(false);

  // Form State Alamat
  const [form, setForm] = useState({
    label: 'Rumah',
    recipient_name: '',
    phone_number: '',
    full_address: '',
    city: '',
    postal_code: '',
  });

  // Biteship Maps Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [areaResults, setAreaResults] = useState<BiteshipArea[]>([]);
  const [searchingArea, setSearchingArea] = useState(false);
  const [selectedAreaName, setSelectedAreaName] = useState('');

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res: any = await addressService.getAddresses();
      const list = Array.isArray(res) ? res : res?.data || [];
      setAddresses(list);

      const primary = list.find((a: UserAddressData) => a.is_primary);
      if (primary) {
        setSelectedAddressId(primary.id);
      } else if (list.length > 0) {
        setSelectedAddressId(list[0].id);
      } else {
        setShowForm(true);
      }
    } catch (err) {
      console.error('Gagal mengambil daftar alamat:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  // Handler Pencarian Lokasi Biteship dengan Debounce Sederhana
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setAreaResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingArea(true);
      try {
        const res: any = await shippingService.searchMaps(searchQuery);
        const areas = Array.isArray(res) ? res : res?.data || [];
        setAreaResults(areas);
      } catch (err) {
        console.error('Gagal cari lokasi Biteship:', err);
      } finally {
        setSearchingArea(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

// Di dalam app/addresses/page.tsx pada handler pilih area:
const handleSelectArea = (area: BiteshipArea) => {
  setForm({
    ...form,
    city: `${area.administrative_division_level_3_name}, ${area.administrative_division_level_2_name}`,
    postal_code: String(area.postal_code),
    // Simpan area_id Biteship untuk presisi ongkir tertinggi
    area_id: area.id, 
  });
  setSelectedAreaName(area.name);
  setAreaResults([]);
  setSearchQuery('');
};

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.postal_code) {
      alert('Silakan pilih lokasi dari hasil pencarian Biteship terlebih dahulu.');
      return;
    }

    try {
      const res: any = await addressService.createAddress({
        ...form,
        is_primary: addresses.length === 0,
      });
      const created = res?.data || res;
      await fetchAddresses();
      if (created?.id) setSelectedAddressId(created.id);
      setShowForm(false);
      setForm({ label: 'Rumah', recipient_name: '', phone_number: '', full_address: '', city: '', postal_code: '' });
      setSelectedAreaName('');
    } catch (err) {
      console.error('Gagal menambah alamat:', err);
    }
  };

  const handleSetPrimary = async (id: number) => {
    try {
      await addressService.setPrimaryAddress(id);
      setSelectedAddressId(id);
      fetchAddresses();
    } catch (err) {
      console.error('Gagal set alamat utama:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus alamat ini?')) return;
    try {
      await addressService.deleteAddress(id);
      fetchAddresses();
    } catch (err) {
      console.error('Gagal menghapus alamat:', err);
    }
  };

  const handleProceedToCheckout = () => {
    if (!selectedAddressId) return;
    router.push(`/checkout?address_id=${selectedAddressId}`);
  };

  if (loading) return <div className="max-w-2xl mx-auto p-8 text-center text-gray-500">Memuat data alamat...</div>;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
      <Link href={isSelectMode ? '/cart' : '/'} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-amber-600 font-medium mb-6 transition">
        <ArrowLeft className="w-4 h-4" /> {isSelectMode ? 'Kembali ke Keranjang' : 'Kembali ke Beranda'}
      </Link>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          <MapPin className="w-7 h-7 text-amber-500" /> {isSelectMode ? 'Pilih Alamat Pengiriman' : 'Daftar Alamat Saya'}
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded-xl text-xs transition flex items-center gap-1.5 shadow-md shadow-amber-200"
        >
          <Plus className="w-4 h-4" /> Tambah Alamat
        </button>
      </div>

      {/* Form Tambah Alamat Integrasi Biteship */}
      {showForm && (
        <form onSubmit={handleCreateAddress} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm mb-6 space-y-4">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Tambah Alamat (Biteship Location Verified)</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Label Alamat</label>
              <input
                type="text"
                placeholder="Rumah / Kantor"
                required
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Nama Penerima *</label>
              <input
                type="text"
                placeholder="Nama Lengkap"
                required
                value={form.recipient_name}
                onChange={(e) => setForm({ ...form, recipient_name: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Nomor Telepon / WA *</label>
            <input
              type="tel"
              placeholder="081234567890"
              required
              value={form.phone_number}
              onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* AUTOCOMPLETE BITESHIP MAPS SEARCH */}
          <div className="relative">
            <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Cari Kecamatan / Kota / Kode Pos (Biteship API) *</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ketik min 3 karakter, misal: Kupang, Oebobo, 85111..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-3 pl-9 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              {searchingArea && <Loader2 className="w-4 h-4 text-amber-500 animate-spin absolute right-3 top-3.5" />}
            </div>

            {/* Dropdown Hasil Pencarian Biteship */}
            {areaResults.length > 0 && (
              <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-48 overflow-y-auto divide-y divide-gray-100">
                {areaResults.map((area) => (
                  <div
                    key={area.id}
                    onClick={() => handleSelectArea(area)}
                    className="p-3 text-xs text-gray-700 hover:bg-amber-50 cursor-pointer transition"
                  >
                    <p className="font-semibold text-gray-900">{area.name}</p>
                    <span className="text-[10px] text-gray-500">Kode Pos: {area.postal_code}</span>
                  </div>
                ))}
              </div>
            )}

            {selectedAreaName && (
              <div className="mt-2 p-2.5 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800">
                <span className="font-bold">Lokasi Terpilih:</span> {selectedAreaName} (Kode Pos: {form.postal_code})
              </div>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Alamat Detail (Jalan, No. Rumah, RT/RW) *</label>
            <textarea
              rows={2}
              placeholder="Jl. El Tari No. 12, RT 01 / RW 02..."
              required
              value={form.full_address}
              onChange={(e) => setForm({ ...form, full_address: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            {addresses.length > 0 && (
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700"
              >
                Batal
              </button>
            )}
            <button type="submit" className="px-5 py-2.5 bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md hover:bg-amber-600 transition">
              Simpan Alamat Terverifikasi
            </button>
          </div>
        </form>
      )}

      {/* Lista Cards Alamat */}
      {addresses.length === 0 && !showForm ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 p-6">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-600">Belum ada alamat tersimpan.</p>
          <button onClick={() => setShowForm(true)} className="mt-3 text-xs text-amber-600 font-bold underline">
            Tambah Alamat Sekarang
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              onClick={() => isSelectMode && setSelectedAddressId(addr.id)}
              className={`bg-white border rounded-3xl p-5 transition shadow-sm relative ${
                selectedAddressId === addr.id ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-gray-100'
              } ${isSelectMode ? 'cursor-pointer' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-sm text-gray-900">{addr.recipient_name}</span>
                  <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold">{addr.label}</span>
                  {addr.is_primary && (
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">Utama</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {!addr.is_primary && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetPrimary(addr.id);
                      }}
                      className="text-[10px] text-amber-600 font-bold hover:underline"
                    >
                      Jadikan Utama
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(addr.id);
                    }}
                    className="text-gray-400 hover:text-red-500 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-xs font-semibold text-gray-700">{addr.phone_number}</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                {addr.full_address} {addr.city && `, ${addr.city}`} {addr.postal_code && `(Kode Pos: ${addr.postal_code})`}
              </p>

              {isSelectMode && selectedAddressId === addr.id && (
                <div className="absolute top-5 right-12">
                  <CheckCircle2 className="w-5 h-5 text-amber-500" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isSelectMode && (
        <div className="mt-8">
          <button
            onClick={handleProceedToCheckout}
            disabled={!selectedAddressId}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 text-xs"
          >
            Lanjut ke Checkout Pembayaran <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function AddressPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto p-8 text-center text-gray-500">Memuat halaman alamat...</div>}>
      <AddressListContent />
    </Suspense>
  );
}

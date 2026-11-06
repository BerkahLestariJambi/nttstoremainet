import Link from 'next/link';
import ProductGrid from '@/components/product/ProductGrid';
export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-amber-700 to-purple-800 text-white rounded-2xl p-8 md:p-12 text-center md:text-left">
        <h1 className="text-3xl md:text-5xl font-extrabold mb-4">
          Selamat Datang di NTTStore<span className="text-yellow-400">Pi</span>
        </h1>
        <p className="text-lg opacity-90 max-w-2xl mb-6">
          Dapatkan produk lokal khas Nusa Tenggara Timur seperti Kain Tenun Ikat, dan Kerajinan Tangan terbaik lainnya.
        </p>
        <Link 
          href="/products" 
          className="inline-block bg-yellow-400 text-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-yellow-300 transition"
        >
          Jelajahi Produk
        </Link>
      </section>

      {/* Grid Produk */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Produk Unggulan</h2>
        <ProductGrid />
      </section>
    </div>
  );
}

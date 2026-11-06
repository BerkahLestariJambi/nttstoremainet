import { use } from 'react';

export default function ProductDetailPage({ params }) {
  const { id } = use(params);

  
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border max-w-4xl mx-auto mt-6">
      <h1 className="text-2xl font-bold mb-2">Detail Produk ID: {id}</h1>
      <p className="text-gray-600">
        Informasi detail produk tenun/kopi khas NTT akan dimuat dari API berdasarkan ID produk.
      </p>
    </div>
  );
}

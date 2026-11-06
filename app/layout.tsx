import '@/app/globals.css';
import Navbar from '@/components/layout/Navbar';
import { CartProvider } from '@/context/CartContext';

export const metadata = {
  title: 'NTTStorePi - Toko Online Khas NTT',
  description: 'Belanja Tenun Ikat, Kopi Flores, dan Kerajinan NTT dengan Pi Network',
};

// Tambahkan tipe data React.ReactNode untuk prop children
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-gray-50 text-gray-900 font-sans">
        <CartProvider>
          <Navbar />
          <main className="min-h-screen max-w-7xl mx-auto px-4 py-6">
            {children}
          </main>
        </CartProvider>
      </body>
    </html>
  );
}

import '@/app/globals.css';
import Script from 'next/script';
import Navbar from '@/components/layout/Navbar';
import { CartProvider } from '@/context/CartContext';

export const metadata = {
  title: 'NTTStorePi - Toko Online Khas NTT',
  description: 'Belanja Tenun Ikat & Kopi Flores dengan Pi Coin',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        {/* Mengisi Script Pi SDK secara global */}
        <Script 
          src="https://sdk.minepi.com/pi-sdk.js" 
          strategy="beforeInteractive"
        />
      </head>
      <body className="bg-gray-50 text-gray-900 font-sans">
        <CartProvider>
          <Navbar />
          <main className="min-h-screen max-w-7xl mx-auto px-4 py-6">{children}</main>
        </CartProvider>
      </body>
    </html>
  );
}

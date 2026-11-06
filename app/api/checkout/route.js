import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.json();
    const { items, paymentMethod, totalPi } = data;

    // Logika simpan transaksi ke database & verifikasi SDK Pi Network
    
    return NextResponse.json({
      success: true,
      message: 'Transaksi berhasil diproses',
      orderId: `NTT-PI-${Date.now()}`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Gagal memproses pembayaran' },
      { status: 500 }
    );
  }
}

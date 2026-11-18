'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Room,
  RoomEvent,
  createLocalTracks,
  LocalVideoTrack,
  LocalAudioTrack,
  VideoPresets,
} from 'livekit-client';
import {
  Radio,
  Video,
  VideoOff,
  Mic,
  MicOff,
  SwitchCamera,
  Pin,
  Send,
  Users,
  X,
  Loader2,
  ShoppingBag,
  ArrowLeft,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import Swal from 'sweetalert2';
import { productService } from '@/services/productService';

interface SellerProduct {
  id: number;
  name: string;
  price_pi: string | number;
  discount_price_pi?: string | number | null;
  is_promo_active?: boolean;
  image_url?: string | null;
  sisa_stock?: number;
  stock?: number;
}

interface LiveComment {
  id: number;
  sender_name: string;
  message: string;
}

interface ActiveViewer {
  identity: string;
  name: string;
  joinedAt: string;
}

export default function SellerLiveBroadcastPage() {
  const router = useRouter();

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'https://nttstorepi.mejatika.com/api';
  const DOMAIN_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

  // Form persiapan live
  const [title, setTitle] = useState<string>('');
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [pinnedProductId, setPinnedProductId] = useState<number | null>(null);

  // Status Live & LiveKit Room
  const [isLive, setIsLive] = useState<boolean>(false);
  const [starting, setStarting] = useState<boolean>(false);
  const [streamId, setStreamId] = useState<number | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [camEnabled, setCamEnabled] = useState<boolean>(true);
  const [micEnabled, setMicEnabled] = useState<boolean>(true);

  // Daftar Penonton Aktif Real-time dari LiveKit
  const [activeViewers, setActiveViewers] = useState<ActiveViewer[]>([]);
  const [showViewersModal, setShowViewersModal] = useState<boolean>(false);

  // Chat komentar
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const lastCommentIdRef = useRef<number>(0);

  // Refs LiveKit
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const roomRef = useRef<Room | null>(null);
  const videoTrackRef = useRef<LocalVideoTrack | null>(null);
  const audioTrackRef = useRef<LocalAudioTrack | null>(null);

  const getAuthToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    for (const store of [window.localStorage, window.sessionStorage]) {
      for (let i = 0; i < store.length; i++) {
        const key = store.key(i);
        if (!key) continue;
        const val = store.getItem(key);
        if (!val) continue;
        if (/^\d+\|[A-Za-z0-9]{20,}$/.test(val.trim()) || val.trim().startsWith('eyJ')) {
          return val.replace(/^Bearer\s+/i, '').trim();
        }
        if (val.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(val);
            const tok =
              parsed?.token ||
              parsed?.access_token ||
              parsed?.api_token ||
              parsed?.data?.token;
            if (typeof tok === 'string' && tok.length > 10) {
              return tok.replace(/^Bearer\s+/i, '').trim();
            }
          } catch {}
        }
      }
    }
    return null;
  };

  const resolveProductImg = (url?: string | null) => {
    if (!url) return '';
    const clean = url.trim().replace(/\\/g, '/');
    if (
      (clean.startsWith('http://') || clean.startsWith('https://')) &&
      !clean.includes('nttstorepi.mejatika.com')
    ) {
      return clean;
    }
    const fileName = clean.split('/').filter(Boolean).pop();
    return fileName ? `${DOMAIN_BASE_URL}/public/products/${fileName}` : '';
  };

  const formatPiPrice = (rawVal?: string | number | null): string => {
    if (rawVal === null || rawVal === undefined || rawVal === '') return '0';
    const str = String(rawVal).trim();
    const parts = str.split('.');
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.length > 1 ? `${intPart}.${parts[1]}` : intPart;
  };

  // Sinkronkan daftar pembeli yang sedang menonton secara real-time dari LiveKit
  const syncActiveViewers = (room: Room) => {
    const nowTime = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });

    setActiveViewers((prev) => {
      const prevMap = new Map(prev.map((v) => [v.identity, v]));
      const list: ActiveViewer[] = [];

      room.remoteParticipants.forEach((participant) => {
        const existing = prevMap.get(participant.identity);
        list.push({
          identity: participant.identity,
          name: participant.name || participant.identity || 'Pembeli Pi',
          joinedAt: existing?.joinedAt || nowTime,
        });
      });

      return list;
    });
  };

  // Muat produk milik seller untuk etalase live
  useEffect(() => {
    productService
      .getSellerProducts()
      .then((res: any) => {
        const list = res?.data?.data || res?.data || res || [];
        const arr = Array.isArray(list) ? list : [];
        setProducts(arr);
        if (arr.length > 0) {
          setPinnedProductId(arr[0].id);
        }
      })
      .catch((err) => console.error('Gagal memuat produk toko:', err));

    return () => {
      cleanupLiveKit();
    };
  }, []);

  const cleanupLiveKit = () => {
    if (videoTrackRef.current) {
      videoTrackRef.current.stop();
      videoTrackRef.current = null;
    }
    if (audioTrackRef.current) {
      audioTrackRef.current.stop();
      audioTrackRef.current = null;
    }
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    setActiveViewers([]);
  };

  // Mulai Live Streaming
  const handleStartLive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      Swal.fire('Judul Wajib Diisi', 'Masukkan judul siaran langsung Anda.', 'warning');
      return;
    }

    setStarting(true);
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/live/start`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          title: title.trim(),
          pinned_product_id: pinnedProductId,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || 'Gagal memulai siaran langsung.');
      }

      const { id, ws_url, token: lkToken } = json.data;

      // Buat track kamera & mikrofon lokal
      const tracks = await createLocalTracks({
        audio: true,
        video: {
          facingMode,
          resolution: VideoPresets.h720.resolution,
        },
      });

      const vTrack = tracks.find((t) => t.kind === 'video') as LocalVideoTrack;
      const aTrack = tracks.find((t) => t.kind === 'audio') as LocalAudioTrack;

      videoTrackRef.current = vTrack;
      audioTrackRef.current = aTrack;

      // Hubungkan ke LiveKit Cloud
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });
      roomRef.current = room;

      // Pantau pembeli yang bergabung & keluar secara real-time
      room.on(RoomEvent.ParticipantConnected, () => syncActiveViewers(room));
      room.on(RoomEvent.ParticipantDisconnected, () => syncActiveViewers(room));

      await room.connect(ws_url, lkToken);
      syncActiveViewers(room);

      if (vTrack) await room.localParticipant.publishTrack(vTrack);
      if (aTrack) await room.localParticipant.publishTrack(aTrack);

      setStreamId(id);
      setIsLive(true);

      // Tempelkan kamera ke elemen <video>
      setTimeout(() => {
        if (videoRef.current && vTrack) {
          vTrack.attach(videoRef.current);
        }
      }, 100);
    } catch (err: any) {
      cleanupLiveKit();
      Swal.fire(
        'Gagal Mulai Live',
        err?.message || 'Pastikan izin kamera & mikrofon aktif di browser.',
        'error'
      );
    } finally {
      setStarting(false);
    }
  };

  // Polling komentar saat sedang LIVE
  useEffect(() => {
    if (!isLive || !streamId) return;

    const pollState = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/live/${streamId}/state?after_id=${lastCommentIdRef.current}`,
          { headers: { Accept: 'application/json' } }
        );
        const json = await res.json();
        if (json?.success && Array.isArray(json.comments) && json.comments.length > 0) {
          setComments((prev) => {
            const merged = [...prev];
            for (const item of json.comments) {
              if (!merged.some((c) => c.id === item.id)) {
                merged.push(item);
              }
            }
            return merged.slice(-50);
          });
          lastCommentIdRef.current = Math.max(
            lastCommentIdRef.current,
            Number(json.comments[json.comments.length - 1].id)
          );
        }
      } catch {}
    };

    pollState();
    const timer = setInterval(pollState, 2500);
    return () => clearInterval(timer);
  }, [isLive, streamId]);

  // Toggle Kamera
  const toggleCamera = async () => {
    if (!videoTrackRef.current) return;
    if (camEnabled) {
      await videoTrackRef.current.mute();
      setCamEnabled(false);
    } else {
      await videoTrackRef.current.unmute();
      setCamEnabled(true);
    }
  };

  // Toggle Mikrofon
  const toggleMic = async () => {
    if (!audioTrackRef.current) return;
    if (micEnabled) {
      await audioTrackRef.current.mute();
      setMicEnabled(false);
    } else {
      await audioTrackRef.current.unmute();
      setMicEnabled(true);
    }
  };

  // Ganti Kamera Depan / Belakang
  const handleSwitchCamera = async () => {
    if (!videoTrackRef.current) return;
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    try {
      await videoTrackRef.current.restartTrack({ facingMode: nextMode });
      setFacingMode(nextMode);
    } catch {
      Swal.fire('Info', 'Perangkat hanya memiliki satu kamera aktif.', 'info');
    }
  };

  // Sematkan Produk di Layar Penonton
  const handlePinProduct = async (productId: number) => {
    setPinnedProductId(productId);
    if (!streamId) return;

    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch(`${API_BASE_URL}/live/${streamId}/pin-product`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ product_id: productId }),
      });
    } catch (err) {
      console.error('Gagal menyematkan produk:', err);
    }
  };

  // Kirim Komentar dari Penjual
  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamId || !chatInput.trim()) return;

    const text = chatInput.trim();
    setChatInput('');

    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/live/${streamId}/comments`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          sender_name: 'Penjual (Host)',
          message: text,
        }),
      });

      const json = await res.json();
      if (json?.success && json?.data) {
        setComments((prev) => {
          if (prev.some((c) => c.id === json.data.id)) return prev;
          return [...prev, json.data].slice(-50);
        });
        lastCommentIdRef.current = Math.max(lastCommentIdRef.current, Number(json.data.id));
      }
    } catch {}
  };

  // Akhiri Siaran Langsung (tanpa menyimpan rekaman)
  const handleEndLive = async () => {
    const confirm = await Swal.fire({
      title: 'Akhiri Siaran Langsung?',
      text: 'Video live akan langsung dihentikan dan tidak disimpan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Akhiri Live',
      cancelButtonText: 'Lanjut Live',
    });

    if (!confirm.isConfirmed) return;

    try {
      if (streamId) {
        const token = getAuthToken();
        const headers: Record<string, string> = { Accept: 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        await fetch(`${API_BASE_URL}/live/${streamId}/end`, {
          method: 'POST',
          headers,
          credentials: 'include',
        });
      }
    } catch {}

    cleanupLiveKit();
    setIsLive(false);
    setStreamId(null);
    router.push('/seller');
  };

  // TAMPILAN PERSIAPAN SEBELUM LIVE
  if (!isLive) {
    return (
      <div className="max-w-xl mx-auto py-8 px-4">
        <Link
          href="/seller"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-amber-600 mb-5"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard Penjual
        </Link>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">Mulai Live Shopping</h1>
              <p className="text-xs text-gray-500">
                Siaran langsung real-time tanpa rekaman. Pembeli bisa langsung checkout saat Anda live.
              </p>
            </div>
          </div>

          <form onSubmit={handleStartLive} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Judul Siaran Langsung *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Spill Kain Tenun Sumba Asli & Promo Flash Sale!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Pilih Produk Utama yang Disematkan Awal
              </label>
              <select
                value={pinnedProductId ?? ''}
                onChange={(e) => setPinnedProductId(Number(e.target.value) || null)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">-- Pilih Produk Etalase --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (π {formatPiPrice(p.discount_price_pi || p.price_pi)})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={starting}
              className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm shadow-lg shadow-rose-200 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              {starting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Radio className="w-5 h-5" />
              )}
              <span>{starting ? 'Menghubungkan Kamera...' : 'Mulai Siaran Langsung Sekarang'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // TAMPILAN STUDIO LIVE PENJUAL (LAYAR PENUH)
  return (
    <div className="fixed inset-0 z-[70] h-[100dvh] bg-black flex flex-col lg:flex-row">
      {/* Layar Kamera Penyiar */}
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
        />

        {/* Bar Atas Status Live & Tombol Lihat Penonton */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 z-20">
          <div className="flex items-center gap-2 bg-black/65 backdrop-blur-md px-3 py-1.5 rounded-full text-white">
            <span className="inline-flex items-center gap-1 bg-red-600 text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
              <Radio className="w-3 h-3" /> LIVE
            </span>
            <span className="text-xs font-bold truncate max-w-[130px] sm:max-w-xs">{title}</span>
            <button
              type="button"
              onClick={() => setShowViewersModal(true)}
              title="Lihat daftar pembeli yang sedang menonton"
              className="inline-flex items-center gap-1 text-[11px] text-amber-300 hover:text-amber-200 font-extrabold pl-2 border-l border-white/20 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>{activeViewers.length}</span>
              <Eye className="w-3 h-3 ml-0.5 opacity-85" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleEndLive}
            className="bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold px-3.5 py-2 rounded-full shadow-lg flex items-center gap-1 cursor-pointer"
          >
            <X className="w-4 h-4" /> Akhiri Live
          </button>
        </div>

        {/* Kontrol Kamera & Mic di Samping */}
        <div className="absolute right-4 top-20 flex flex-col gap-2.5 z-20">
          <button
            type="button"
            onClick={handleSwitchCamera}
            title="Balik Kamera"
            className="p-3 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md cursor-pointer"
          >
            <SwitchCamera className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={toggleCamera}
            title="Kamera On/Off"
            className={`p-3 rounded-full backdrop-blur-md cursor-pointer ${
              camEnabled ? 'bg-black/60 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {camEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>
          <button
            type="button"
            onClick={toggleMic}
            title="Mikrofon On/Off"
            className={`p-3 rounded-full backdrop-blur-md cursor-pointer ${
              micEnabled ? 'bg-black/60 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>
        </div>

        {/* Overlay Komentar di Bawah Kamera (Mobile) */}
        <div className="lg:hidden absolute bottom-20 left-4 right-16 max-h-40 overflow-y-auto space-y-1.5 z-20 pointer-events-none">
          {comments.slice(-6).map((c) => (
            <div
              key={c.id}
              className="bg-black/55 backdrop-blur-xs text-white text-xs px-3 py-1.5 rounded-2xl w-fit max-w-full"
            >
              <span className="font-bold text-amber-300">{c.sender_name}: </span>
              <span>{c.message}</span>
            </div>
          ))}
        </div>

        {/* Input Chat Penjual di Bawah */}
        <form
          onSubmit={handleSendComment}
          className="lg:hidden absolute bottom-4 left-4 right-4 flex items-center gap-2 z-20"
        >
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Sapa penonton Anda..."
            className="flex-1 bg-black/60 backdrop-blur-md text-white placeholder-white/60 text-xs px-4 py-2.5 rounded-full border border-white/20 focus:outline-none"
          />
          <button
            type="submit"
            className="p-2.5 rounded-full bg-amber-500 text-white cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Panel Kontrol Etalase Produk, Daftar Penonton & Chat (Sidebar) */}
      <div className="w-full lg:w-96 bg-white flex flex-col max-h-[45vh] lg:max-h-full border-t lg:border-t-0 lg:border-l border-gray-200">
        {/* Bar Penonton Aktif Real-time */}
        <div className="px-4 py-2.5 bg-amber-50/80 border-b border-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Users className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-xs font-extrabold text-gray-900">
              Sedang Menonton ({activeViewers.length})
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowViewersModal(true)}
            className="text-[11px] font-bold text-amber-700 hover:underline cursor-pointer shrink-0"
          >
            Lihat Pembeli
          </button>
        </div>

        {/* Daftar Produk untuk Disematkan ke Layar Pembeli */}
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
            <ShoppingBag className="w-4 h-4 text-amber-500" /> Sematkan Produk di Layar Pembeli
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {products.map((prod) => {
              const isPinned = pinnedProductId === prod.id;
              const img = resolveProductImg(prod.image_url);
              const price = formatPiPrice(prod.discount_price_pi || prod.price_pi);
              return (
                <div
                  key={prod.id}
                  className={`flex items-center justify-between gap-2 p-2 rounded-xl border text-xs ${
                    isPinned
                      ? 'border-amber-500 bg-amber-50/70'
                      : 'border-gray-100 bg-gray-50/60'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {img && (
                      <img
                        src={img}
                        alt={prod.name}
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate">{prod.name}</p>
                      <p className="text-[11px] font-extrabold text-amber-600">π {price}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePinProduct(prod.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer ${
                      isPinned
                        ? 'bg-amber-500 text-white'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-amber-50'
                    }`}
                  >
                    <Pin className="w-3 h-3" /> {isPinned ? 'Disematkan' : 'Sematkan'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Chat Panel (Desktop) */}
        <div className="hidden lg:flex flex-col flex-1 p-4 overflow-hidden">
          <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider mb-2">
            Live Chat Penonton
          </h3>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {comments.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">
                Belum ada komentar masuk...
              </p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="bg-gray-50 px-3 py-2 rounded-xl text-xs">
                  <span className="font-bold text-purple-700">{c.sender_name}: </span>
                  <span className="text-gray-700">{c.message}</span>
                </div>
              ))
            )}
          </div>
          <form onSubmit={handleSendComment} className="mt-3 flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Balas komentar..."
              className="flex-1 px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Modal Daftar Pembeli yang Sedang Menonton Live */}
      {showViewersModal && (
        <div
          onClick={() => setShowViewersModal(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-extrabold text-gray-900">
                  Pembeli Menonton ({activeViewers.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowViewersModal(false)}
                className="p-1.5 rounded-full bg-gray-100 text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeViewers.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-6">
                Belum ada pembeli yang bergabung di siaran ini.
              </p>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {activeViewers.map((viewer) => (
                  <div
                    key={viewer.identity}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-gray-50 border border-gray-100"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-extrabold text-xs flex items-center justify-center shrink-0 uppercase">
                        {viewer.name.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">
                          @{viewer.name}
                        </p>
                        <p className="text-[10px] text-emerald-600 font-semibold">
                          ● Sedang menonton ({viewer.joinedAt})
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Room,
  RoomEvent,
  Track,
  RemoteVideoTrack,
  LocalVideoTrack,
  LocalAudioTrack,
  createLocalTracks,
  VideoPresets,
} from 'livekit-client';
import {
  Radio,
  Users,
  Store,
  ShoppingBag,
  ShoppingCart,
  Send,
  X,
  Loader2,
  Volume2,
  VolumeX,
  Video,
  VideoOff,
  Mic,
  MicOff,
  UserPlus,
  PhoneOff,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { useCart } from '@/context/CartContext';

interface LiveProduct {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price_pi: string | number;
  discount_price_pi?: string | number | null;
  effective_price_pi?: number;
  is_promo_active?: boolean;
  image_url?: string | null;
  stock?: number;
  sisa_stock?: number;
}

interface LiveComment {
  id: number;
  sender_name: string;
  message: string;
}

export default function LiveViewerPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();

  const roomName = String(params?.roomName || '');

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'https://nttstorepi.mejatika.com/api';
  const DOMAIN_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

  const [loading, setLoading] = useState<boolean>(true);
  const [ended, setEnded] = useState<boolean>(false);
  const [streamInfo, setStreamInfo] = useState<any>(null);
  const [pinnedProduct, setPinnedProduct] = useState<LiveProduct | null>(null);
  const [catalogProducts, setCatalogProducts] = useState<LiveProduct[]>([]);
  const [showCatalogDrawer, setShowCatalogDrawer] = useState<boolean>(false);
  const [viewerCount, setViewerCount] = useState<number>(1);
  const [muted, setMuted] = useState<boolean>(false);
  const [audioBlocked, setAudioBlocked] = useState<boolean>(false);

  // Track Video Penjual & Co-Host Lain
  const [sellerVideoTrack, setSellerVideoTrack] = useState<RemoteVideoTrack | null>(null);
  const [otherCohostVideoTrack, setOtherCohostVideoTrack] = useState<RemoteVideoTrack | null>(null);
  const [otherCohostName, setOtherCohostName] = useState<string>('');

  // State Join Live (Co-Host untuk Pembeli Ini)
  const viewerIdentityRef = useRef<string>('');
  const [cohostStatus, setCohostStatus] = useState<'idle' | 'pending' | 'active'>('idle');
  const [localCamOn, setLocalCamOn] = useState<boolean>(true);
  const [localMicOn, setLocalMicOn] = useState<boolean>(true);
  const localVideoTrackRef = useRef<LocalVideoTrack | null>(null);
  const localAudioTrackRef = useRef<LocalAudioTrack | null>(null);
  const localVideoElRef = useRef<HTMLVideoElement | null>(null);
  const isSwitchingRoomRef = useRef<boolean>(false);

  // Chat
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [sendingChat, setSendingChat] = useState<boolean>(false);
  const lastCommentIdRef = useRef<number>(0);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Refs LiveKit
  const sellerVideoRef = useRef<HTMLVideoElement | null>(null);
  const otherCohostVideoRef = useRef<HTMLVideoElement | null>(null);
  const audioContainerRef = useRef<HTMLDivElement | null>(null);
  const roomRef = useRef<Room | null>(null);

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

  const getViewerName = (): string => {
    if (typeof window === 'undefined') return 'Pembeli Pi';
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (!k) continue;
      const v = window.localStorage.getItem(k);
      if (!v) continue;
      if (k.toLowerCase().includes('username') && !v.startsWith('{')) return v;
      if (v.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(v);
          const u = parsed?.user || parsed;
          if (u?.username) return String(u.username);
          if (u?.name) return String(u.name);
        } catch {}
      }
    }
    return 'Pembeli Pi';
  };

  const cleanupLocalCohostTracks = () => {
    if (localVideoTrackRef.current) {
      localVideoTrackRef.current.stop();
      localVideoTrackRef.current = null;
    }
    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.stop();
      localAudioTrackRef.current = null;
    }
  };

  // Pasang Video Penjual
  useEffect(() => {
    const videoEl = sellerVideoRef.current;
    if (!videoEl || !sellerVideoTrack) return;

    sellerVideoTrack.attach(videoEl);
    videoEl.muted = true;
    videoEl.play().catch(() => {});

    return () => {
      sellerVideoTrack.detach(videoEl);
    };
  }, [sellerVideoTrack, loading, cohostStatus, otherCohostVideoTrack]);

  // Pasang Video Tamu Lain (jika penonton lain sedang join live)
  useEffect(() => {
    const videoEl = otherCohostVideoRef.current;
    if (!videoEl || !otherCohostVideoTrack) return;

    otherCohostVideoTrack.attach(videoEl);
    videoEl.muted = true;
    videoEl.play().catch(() => {});

    return () => {
      otherCohostVideoTrack.detach(videoEl);
    };
  }, [otherCohostVideoTrack, loading]);

  // Helper mengikat event LiveKit pada instance Room
  const bindRoomListeners = (room: Room, isMountedFlag: () => boolean) => {
    const updateLiveViewerCount = () => {
      const totalInRoom = room.remoteParticipants.size + 1;
      setViewerCount(Math.max(1, totalInRoom - 1));
    };

    const attachAudioTrack = (track: Track) => {
      if (!audioContainerRef.current) return;
      const audioEl = track.attach() as HTMLAudioElement;
      audioEl.autoplay = true;
      audioEl.muted = false;
      audioEl.volume = 1.0;
      audioContainerRef.current.appendChild(audioEl);

      audioEl
        .play()
        .then(() => {
          if (isMountedFlag()) setAudioBlocked(false);
        })
        .catch(() => {
          if (isMountedFlag()) setAudioBlocked(true);
        });
    };

    room.on(RoomEvent.ParticipantConnected, updateLiveViewerCount);
    room.on(RoomEvent.ParticipantDisconnected, (participant) => {
      updateLiveViewerCount();
      if (participant.identity.startsWith('cohost-')) {
        setOtherCohostVideoTrack(null);
        setOtherCohostName('');
      }
    });

    room.on(RoomEvent.AudioPlaybackStatusChanged, () => {
      if (!isMountedFlag()) return;
      setAudioBlocked(!room.canPlaybackAudio);
    });

    room.on(RoomEvent.TrackSubscribed, (track, _pub, participant) => {
      if (!isMountedFlag()) return;
      if (track.kind === Track.Kind.Video) {
        if (participant.identity.startsWith('cohost-')) {
          setOtherCohostVideoTrack(track as RemoteVideoTrack);
          setOtherCohostName(participant.name || 'Tamu Live');
        } else {
          setSellerVideoTrack(track as RemoteVideoTrack);
        }
      } else if (track.kind === Track.Kind.Audio) {
        attachAudioTrack(track);
      }
    });

    room.on(RoomEvent.TrackUnsubscribed, (track, _pub, participant) => {
      if (track.kind === Track.Kind.Video) {
        if (participant.identity.startsWith('cohost-')) {
          setOtherCohostVideoTrack(null);
          setOtherCohostName('');
        } else {
          setSellerVideoTrack(null);
        }
      }
      track.detach();
    });

    room.on(RoomEvent.Disconnected, () => {
      if (isMountedFlag() && !isSwitchingRoomRef.current) {
        setEnded(true);
      }
    });

    return { updateLiveViewerCount, attachAudioTrack };
  };

  // Koneksi awal sebagai penonton
  useEffect(() => {
    if (!roomName) return;
    let isMounted = true;

    const joinRoom = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/live/${roomName}/join`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username: getViewerName() }),
        });

        const json = await res.json();
        if (!res.ok || !json?.success) {
          if (isMounted) setEnded(true);
          return;
        }

        const { stream, identity, ws_url, token, pinned_product, products } = json.data;
        if (!isMounted) return;

        viewerIdentityRef.current = identity;
        setStreamInfo(stream);
        setViewerCount(Number(stream?.viewer_count ?? 1));
        setPinnedProduct(pinned_product || null);
        setCatalogProducts(Array.isArray(products) ? products : []);

        const room = new Room({ adaptiveStream: true, dynacast: true });
        roomRef.current = room;

        const { updateLiveViewerCount, attachAudioTrack } = bindRoomListeners(
          room,
          () => isMounted
        );

        await room.connect(ws_url, token);
        updateLiveViewerCount();

        room.remoteParticipants.forEach((participant) => {
          participant.videoTrackPublications.forEach((pub) => {
            if (pub.track && pub.track.kind === Track.Kind.Video) {
              if (participant.identity.startsWith('cohost-')) {
                setOtherCohostVideoTrack(pub.track as RemoteVideoTrack);
                setOtherCohostName(participant.name || 'Tamu Live');
              } else {
                setSellerVideoTrack(pub.track as RemoteVideoTrack);
              }
            }
          });
          participant.audioTrackPublications.forEach((pub) => {
            if (pub.track && pub.track.kind === Track.Kind.Audio) {
              attachAudioTrack(pub.track);
            }
          });
        });

        room.startAudio().catch(() => {
          if (isMounted) setAudioBlocked(true);
        });
      } catch (err) {
        console.error('Gagal bergabung ke room live:', err);
        if (isMounted) setEnded(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    joinRoom();

    return () => {
      isMounted = false;
      cleanupLocalCohostTracks();
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
    };
  }, [roomName]);

  // Naik ke layar Split-Screen saat penjual menyetujui Join Live
  const promoteToCoHost = async (wsUrl: string, cohostToken: string) => {
    if (cohostStatus === 'active' || isSwitchingRoomRef.current) return;
    isSwitchingRoomRef.current = true;

    try {
      const tracks = await createLocalTracks({
        audio: true,
        video: {
          facingMode: 'user',
          resolution: VideoPresets.h540.resolution,
        },
      });

      const vTrack = tracks.find((t) => t.kind === 'video') as LocalVideoTrack;
      const aTrack = tracks.find((t) => t.kind === 'audio') as LocalAudioTrack;
      localVideoTrackRef.current = vTrack;
      localAudioTrackRef.current = aTrack;

      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
      if (audioContainerRef.current) {
        audioContainerRef.current.innerHTML = '';
      }

      const newRoom = new Room({ adaptiveStream: true, dynacast: true });
      roomRef.current = newRoom;

      const { updateLiveViewerCount, attachAudioTrack } = bindRoomListeners(
        newRoom,
        () => true
      );

      await newRoom.connect(wsUrl, cohostToken);
      updateLiveViewerCount();

      if (vTrack) await newRoom.localParticipant.publishTrack(vTrack);
      if (aTrack) await newRoom.localParticipant.publishTrack(aTrack);

      newRoom.remoteParticipants.forEach((participant) => {
        participant.videoTrackPublications.forEach((pub) => {
          if (pub.track && pub.track.kind === Track.Kind.Video) {
            setSellerVideoTrack(pub.track as RemoteVideoTrack);
          }
        });
        participant.audioTrackPublications.forEach((pub) => {
          if (pub.track && pub.track.kind === Track.Kind.Audio) {
            attachAudioTrack(pub.track);
          }
        });
      });

      setCohostStatus('active');
      setLocalCamOn(true);
      setLocalMicOn(true);

      setTimeout(() => {
        if (localVideoElRef.current && vTrack) {
          vTrack.attach(localVideoElRef.current);
        }
      }, 100);
    } catch (err: any) {
      cleanupLocalCohostTracks();
      setCohostStatus('idle');
      Swal.fire(
        'Izin Kamera/Mic Ditolak',
        err?.message || 'Aktifkan izin kamera & mikrofon untuk Join Live.',
        'error'
      );
    } finally {
      isSwitchingRoomRef.current = false;
    }
  };

  // Turun dari Join Live (kembali jadi penonton biasa)
  const handleLeaveCoHost = async (notifyBackend = true) => {
    cleanupLocalCohostTracks();
    setCohostStatus('idle');

    if (notifyBackend && streamInfo?.id) {
      fetch(`${API_BASE_URL}/live/${streamInfo.id}/cohost/leave`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identity: viewerIdentityRef.current }),
      }).catch(() => {});
    }
  };

  // Ajukan permintaan Join Live ke Penjual
  const handleRequestCoHost = async () => {
    if (!streamInfo?.id || cohostStatus !== 'idle') return;
    setCohostStatus('pending');

    try {
      const res = await fetch(`${API_BASE_URL}/live/${streamInfo.id}/cohost/request`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identity: viewerIdentityRef.current,
          name: getViewerName(),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        setCohostStatus('idle');
        Swal.fire('Info', json?.message || 'Gagal mengajukan Join Live.', 'info');
      } else {
        Swal.fire({
          icon: 'info',
          title: 'Permintaan Terkirim',
          text: 'Menunggu penjual menyetujui Anda naik ke layar live...',
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch {
      setCohostStatus('idle');
    }
  };

  // Polling komentar, produk disematkan, & status persetujuan Join Live
  useEffect(() => {
    if (!streamInfo?.id || ended) return;

    const pollState = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/live/${streamInfo.id}/state?after_id=${lastCommentIdRef.current}`,
          { headers: { Accept: 'application/json' } }
        );
        const json = await res.json();
        if (json?.success) {
          if (json.status === 'ended') {
            setEnded(true);
            return;
          }
          if (json.pinned_product) {
            setPinnedProduct(json.pinned_product);
          }
          if (Array.isArray(json.comments) && json.comments.length > 0) {
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

          // Cek apakah permintaan Join Live pembeli ini disetujui penjual
          const activeCohost = json.cohost_active;
          if (
            activeCohost &&
            activeCohost.viewer_identity === viewerIdentityRef.current &&
            cohostStatus !== 'active'
          ) {
            await promoteToCoHost(activeCohost.ws_url, activeCohost.token);
          } else if (
            cohostStatus === 'active' &&
            (!activeCohost || activeCohost.viewer_identity !== viewerIdentityRef.current)
          ) {
            // Penjual menurunkan tamu dari layar
            await handleLeaveCoHost(false);
          } else if (
            cohostStatus === 'pending' &&
            !json.cohost_request &&
            (!activeCohost || activeCohost.viewer_identity !== viewerIdentityRef.current)
          ) {
            setCohostStatus('idle');
          }
        }
      } catch {}
    };

    pollState();
    const timer = setInterval(pollState, 2500);
    return () => clearInterval(timer);
  }, [streamInfo?.id, ended, cohostStatus]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleUnlockAudio = async () => {
    setMuted(false);
    setAudioBlocked(false);
    if (roomRef.current) {
      await roomRef.current.startAudio().catch(() => {});
    }
    if (audioContainerRef.current) {
      audioContainerRef.current.querySelectorAll('audio').forEach((el) => {
        el.muted = false;
        el.volume = 1.0;
        el.play().catch(() => {});
      });
    }
  };

  const handleToggleMute = async () => {
    if (audioBlocked || muted) {
      await handleUnlockAudio();
      return;
    }
    setMuted(true);
    if (audioContainerRef.current) {
      audioContainerRef.current.querySelectorAll('audio').forEach((el) => {
        el.muted = true;
      });
    }
  };

  const toggleLocalCamera = async () => {
    if (!localVideoTrackRef.current) return;
    if (localCamOn) {
      await localVideoTrackRef.current.mute();
      setLocalCamOn(false);
    } else {
      await localVideoTrackRef.current.unmute();
      setLocalCamOn(true);
    }
  };

  const toggleLocalMic = async () => {
    if (!localAudioTrackRef.current) return;
    if (localMicOn) {
      await localAudioTrackRef.current.mute();
      setLocalMicOn(false);
    } else {
      await localAudioTrackRef.current.unmute();
      setLocalMicOn(true);
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamInfo?.id || !chatInput.trim() || sendingChat) return;

    const text = chatInput.trim();
    const sender = getViewerName() || 'Pembeli Pi';
    setChatInput('');
    setSendingChat(true);

    try {
      const res = await fetch(`${API_BASE_URL}/live/${streamInfo.id}/comments`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender_name: sender,
          message: text,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || 'Gagal mengirim pesan.');
      }

      if (json.data) {
        setComments((prev) => {
          if (prev.some((c) => c.id === json.data.id)) return prev;
          return [...prev, json.data].slice(-50);
        });
        lastCommentIdRef.current = Math.max(lastCommentIdRef.current, Number(json.data.id));
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Pesan Gagal Terkirim',
        text: err?.message || 'Periksa koneksi Anda.',
        timer: 2000,
        showConfirmButton: false,
      });
    } finally {
      setSendingChat(false);
    }
  };

  const handleBuyProduct = async (product: LiveProduct, goToCart: boolean) => {
    const remaining =
      product.sisa_stock !== undefined && product.sisa_stock !== null
        ? Number(product.sisa_stock)
        : Number(product.stock ?? 1);

    if (remaining <= 0) {
      Swal.fire('Stok Habis', 'Maaf, stok produk ini baru saja habis.', 'warning');
      return;
    }

    const activeRaw =
      product.discount_price_pi && Number(product.discount_price_pi) > 0
        ? product.discount_price_pi
        : product.price_pi;

    try {
      await addToCart(
        {
          id: String(product.id),
          product_id: product.id,
          name: product.name,
          category: 'Live Shopping',
          priceIdr: 0,
          pricePi: Number(activeRaw ?? product.effective_price_pi ?? 0) || 0,
          image: product.image_url || '',
          image_url: product.image_url || '',
          description: product.description || '',
          stock: remaining,
          sisa_stock: remaining,
          rating: 5,
        },
        1
      );

      if (goToCart) {
        router.push('/cart');
      } else {
        Swal.fire({
          icon: 'success',
          title: 'Masuk Keranjang!',
          text: `${product.name} ditambahkan ke keranjang.`,
          timer: 1400,
          showConfirmButton: false,
        });
      }
    } catch (err: any) {
      Swal.fire('Gagal', err?.message || 'Gagal menambahkan produk ke keranjang.', 'error');
    }
  };

  if (ended) {
    return (
      <div className="fixed inset-0 z-[70] bg-gray-950 flex flex-col items-center justify-center text-white p-6 text-center space-y-4">
        <Radio className="w-12 h-12 text-gray-500" />
        <h2 className="text-lg font-extrabold">Siaran Langsung Telah Berakhir</h2>
        <p className="text-xs text-gray-400 max-w-xs">
          Terima kasih telah menonton! Anda tetap dapat melihat produk toko di katalog utama.
        </p>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold cursor-pointer"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  const pinnedImg = resolveProductImg(pinnedProduct?.image_url);
  const pinnedPrice = pinnedProduct
    ? formatPiPrice(
        pinnedProduct.discount_price_pi && Number(pinnedProduct.discount_price_pi) > 0
          ? pinnedProduct.discount_price_pi
          : pinnedProduct.price_pi
      )
    : '0';

  const isSplitScreen = cohostStatus === 'active' || Boolean(otherCohostVideoTrack);

  return (
    <div
      onClick={() => {
        if (audioBlocked) handleUnlockAudio();
      }}
      className="fixed inset-0 z-[70] h-[100dvh] bg-black flex items-center justify-center overflow-hidden"
    >
      <div
        ref={audioContainerRef}
        className="fixed bottom-0 left-0 w-0 h-0 overflow-hidden pointer-events-none"
      />

      {loading && (
        <div className="absolute inset-0 z-40 bg-black flex flex-col items-center justify-center text-white gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
          <p className="text-xs font-semibold">Menghubungkan ke siaran langsung...</p>
        </div>
      )}

      <div className="relative w-full max-w-md h-[100dvh] bg-black overflow-hidden flex flex-col justify-between">
        {/* Layer Video: Fullscreen jika solo, atau Split-Screen Atas-Bawah jika ada Tamu Join Live */}
        <div
          className={`absolute inset-0 grid ${
            isSplitScreen ? 'grid-rows-2' : 'grid-rows-1'
          } bg-black pointer-events-none`}
        >
          {/* Layar Penjual (Host) */}
          <div className="relative w-full h-full overflow-hidden">
            <video
              ref={sellerVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {isSplitScreen && (
              <span className="absolute bottom-2 left-3 bg-black/60 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                Host: {streamInfo?.store_name}
              </span>
            )}
          </div>

          {/* Layar Tamu Join Live (Co-Host) */}
          {cohostStatus === 'active' ? (
            <div className="relative w-full h-full overflow-hidden border-t-2 border-amber-400">
              <video
                ref={localVideoElRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
              <span className="absolute bottom-2 left-3 bg-amber-500 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                Anda (Co-Host)
              </span>
            </div>
          ) : otherCohostVideoTrack ? (
            <div className="relative w-full h-full overflow-hidden border-t-2 border-amber-400">
              <video
                ref={otherCohostVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-2 left-3 bg-purple-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                Tamu: @{otherCohostName}
              </span>
            </div>
          ) : null}
        </div>

        {/* Banner Ketuk untuk Nyalakan Suara */}
        {(audioBlocked || muted) && !loading && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30">
            <button
              type="button"
              onClick={handleUnlockAudio}
              className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold px-4 py-2 rounded-full shadow-lg animate-bounce cursor-pointer"
            >
              <Volume2 className="w-4 h-4" /> Ketuk untuk Nyalakan Suara
            </button>
          </div>
        )}

        {/* Header Info Toko & Penonton */}
        <div className="relative z-20 shrink-0 p-3.5 flex items-center justify-between gap-2 bg-gradient-to-b from-black/75 to-transparent">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center gap-1 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse shrink-0">
              <Radio className="w-3 h-3" /> LIVE
            </span>
            <div className="min-w-0 text-white">
              <p className="text-xs font-extrabold truncate flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                {streamInfo?.store_name}
              </p>
              <p className="text-[11px] text-white/80 truncate">{streamInfo?.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="inline-flex items-center gap-1 bg-black/55 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
              <Users className="w-3 h-3 text-amber-400" /> {viewerCount}
            </span>
            <button
              type="button"
              onClick={handleToggleMute}
              className="p-2 rounded-full bg-black/55 text-white cursor-pointer"
              title={muted || audioBlocked ? 'Nyalakan Suara' : 'Matikan Suara'}
            >
              {muted || audioBlocked ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                if (cohostStatus === 'active') handleLeaveCoHost(true);
                router.push('/');
              }}
              className="p-2 rounded-full bg-black/55 text-white cursor-pointer"
              title="Keluar Live"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Kontrol Kamera/Mic Tamu jika sedang aktif Join Live */}
        {cohostStatus === 'active' && (
          <div className="relative z-20 self-end mr-3.5 flex flex-col gap-2">
            <button
              type="button"
              onClick={toggleLocalCamera}
              className={`p-2.5 rounded-full text-white shadow cursor-pointer ${
                localCamOn ? 'bg-black/60' : 'bg-red-600'
              }`}
              title="Kamera Saya"
            >
              {localCamOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={toggleLocalMic}
              className={`p-2.5 rounded-full text-white shadow cursor-pointer ${
                localMicOn ? 'bg-black/60' : 'bg-red-600'
              }`}
              title="Mic Saya"
            >
              {localMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => handleLeaveCoHost(true)}
              className="p-2.5 rounded-full bg-rose-600 text-white shadow cursor-pointer"
              title="Turun dari Join Live"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Area Bawah: Live Chat + Pinned Product Card + Input Chat & Tombol Join Live */}
        <div className="relative z-20 shrink-0 p-3.5 pb-5 space-y-2 bg-gradient-to-t from-black/90 via-black/55 to-transparent">
          <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
            {comments.length === 0 ? (
              <div className="bg-black/45 text-white/80 text-[11px] px-3 py-1.5 rounded-2xl w-fit">
                Selamat datang di Live {streamInfo?.store_name}! Silakan tanya produk atau klik Join Live.
              </div>
            ) : (
              comments.map((c) => (
                <div
                  key={c.id}
                  className="bg-black/55 backdrop-blur-xs text-white text-xs px-3 py-1.5 rounded-2xl w-fit max-w-full"
                >
                  <span className="font-bold text-amber-300">{c.sender_name}: </span>
                  <span>{c.message}</span>
                </div>
              ))
            )}
            <div ref={chatBottomRef} />
          </div>

          {pinnedProduct && (
            <div className="bg-white rounded-2xl p-2.5 shadow-xl flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                {pinnedImg && (
                  <img
                    src={pinnedImg}
                    alt={pinnedProduct.name}
                    className="w-11 h-11 rounded-xl object-cover border border-gray-100 shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <span className="text-[9px] font-extrabold uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                    Produk Live
                  </span>
                  <h4 className="text-xs font-extrabold text-gray-900 truncate mt-0.5">
                    {pinnedProduct.name}
                  </h4>
                  <p className="text-xs font-black text-amber-600">π {pinnedPrice}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleBuyProduct(pinnedProduct, false)}
                  className="p-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 cursor-pointer"
                  title="Tambah ke Keranjang"
                >
                  <ShoppingCart className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleBuyProduct(pinnedProduct, true)}
                  className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold cursor-pointer"
                >
                  Beli
                </button>
              </div>
            </div>
          )}

          {/* Bar Bawah: Etalase + Join Live + Chat */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => setShowCatalogDrawer(true)}
              className="relative p-2.5 rounded-full bg-amber-500 text-white shrink-0 shadow cursor-pointer"
              title="Etalase Produk Live"
            >
              <ShoppingBag className="w-4 h-4" />
              {catalogProducts.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {catalogProducts.length}
                </span>
              )}
            </button>

            {/* Tombol Minta Join Live */}
            {cohostStatus === 'idle' && !otherCohostVideoTrack && (
              <button
                type="button"
                onClick={handleRequestCoHost}
                className="inline-flex items-center gap-1 px-3 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-extrabold shrink-0 shadow cursor-pointer"
                title="Minta Gabung Live (Video/Suara)"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Join</span>
              </button>
            )}

            {cohostStatus === 'pending' && (
              <button
                type="button"
                onClick={() => handleLeaveCoHost(true)}
                className="inline-flex items-center gap-1 px-3 py-2.5 rounded-full bg-amber-600 text-white text-[11px] font-bold shrink-0 animate-pulse cursor-pointer"
                title="Klik untuk membatalkan permintaan"
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Menunggu</span>
              </button>
            )}

            <form onSubmit={handleSendComment} className="flex-1 flex items-center gap-1.5 min-w-0">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Tulis komentar..."
                className="flex-1 min-w-0 bg-white/20 backdrop-blur-md text-white placeholder-white/80 text-xs px-3.5 py-2.5 rounded-full border border-white/30 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={sendingChat || !chatInput.trim()}
                className="p-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 shrink-0 cursor-pointer"
                title="Kirim Pesan"
              >
                {sendingChat ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Drawer Etalase Semua Produk Toko */}
        {showCatalogDrawer && (
          <div
            onClick={() => setShowCatalogDrawer(false)}
            className="absolute inset-0 z-30 bg-black/60 flex items-end"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-white rounded-t-3xl p-5 max-h-[65vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-sm font-extrabold text-gray-900">
                  Etalase Produk ({catalogProducts.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCatalogDrawer(false)}
                  className="p-1.5 rounded-full bg-gray-100 text-gray-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto space-y-2.5 py-3 flex-1">
                {catalogProducts.map((prod) => {
                  const img = resolveProductImg(prod.image_url);
                  const price = formatPiPrice(
                    prod.discount_price_pi && Number(prod.discount_price_pi) > 0
                      ? prod.discount_price_pi
                      : prod.price_pi
                  );
                  return (
                    <div
                      key={prod.id}
                      className="flex items-center justify-between gap-2.5 p-2.5 rounded-2xl border border-gray-100 bg-gray-50/70"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {img && (
                          <img
                            src={img}
                            alt={prod.name}
                            className="w-12 h-12 rounded-xl object-cover shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-gray-900 truncate">{prod.name}</h4>
                          <p className="text-xs font-extrabold text-amber-600 mt-0.5">
                            π {price}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleBuyProduct(prod, false)}
                          className="p-2 rounded-xl bg-amber-100 text-amber-800 cursor-pointer"
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBuyProduct(prod, true)}
                          className="px-3 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold cursor-pointer"
                        >
                          Beli
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

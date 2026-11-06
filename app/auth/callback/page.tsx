"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Swal from "sweetalert2"
import { useStore } from "@/lib/store"
import { useCart } from "@/context/CartContext"
import { useTranslation } from "@/lib/i18n"

export default function CallbackPage() {
  const router = useRouter()
  const isProcessedRef = useRef(false)
  const { setPiUser } = useCart()

  // --- DUKUNGAN MULTI BAHASA (I18N) ---
  const language = useStore((state: any) => state.language) || 'id'
  const { t } = useTranslation(language)

  const tRef = useRef(t)
  useEffect(() => {
    tRef.current = t
  }, [t])

  const [statusText, setStatusText] = useState(
    t("processing") || "Memproses otorisasi Pi Network..."
  )

  const setAuthToken = useStore((state: any) => state.setAuthToken)
  const updateUser = useStore((state: any) => state.updateUser)

  useEffect(() => {
    if (!isProcessedRef.current) {
      setStatusText(t("processing") || "Memproses otorisasi Pi Network...")
    }
  }, [language, t])

  useEffect(() => {
    if (isProcessedRef.current) return
    isProcessedRef.current = true

    const handleOAuthCallback = async () => {
      try {
        // 1. Tangkap fragmen URL (#access_token=...) atau Query Params (?access_token=...)
        const hash = window.location.hash.substring(1)
        const search = window.location.search.substring(1)

        const params = new URLSearchParams(hash || search)
        const accessToken = params.get("access_token")
        const returnedState = params.get("state")
        const errorParam = params.get("error")

        if (errorParam) {
          throw new Error(`Otorisasi dibatalkan oleh pengguna atau sistem: ${errorParam}`)
        }

        // 2. Cek & Bersihkan State CSRF
        sessionStorage.removeItem("pi_oauth_state")
        sessionStorage.removeItem("pisign_state")

        if (!accessToken) {
          throw new Error(
            tRef.current("tokenNotFoundError") ||
              "Token otorisasi dari Pi Network tidak ditemukan."
          )
        }

        setStatusText(
          tRef.current("verified") || "Mendapatkan profil pengguna dari Pi Network..."
        )

        // 3. Panggil API Resmi Pi Network Langsung dari Browser Client
        let userData = null
        try {
          const res = await fetch("https://api.minepi.com/v2/me", {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          })

          if (res.ok) {
            userData = await res.json()
          } else {
            console.warn("Gagal mengambil profil dari Pi API, menggunakan data fallback.")
          }
        } catch (fetchErr) {
          console.warn("Fetch error ke Pi API (CORS/Network):", fetchErr)
        }

        // Set nama pengguna fallback jika fetch API terhalang CORS
        const username = userData?.username || "PiPioneer"
        const uid = userData?.uid || `pi_${Date.now()}`

        // 4. Simpan Data Pengguna ke Context App & LocalStorage
        const piUserData = {
          username: username,
          accessToken: accessToken,
          uid: uid,
        }

        setPiUser(piUserData)

        if (setAuthToken) setAuthToken(accessToken)
        if (updateUser) updateUser({ username, uid })

        localStorage.setItem("usernamePi", username)
        localStorage.setItem("pisign_access_token", accessToken)
        localStorage.setItem("pi_user", JSON.stringify(piUserData))

        // Bersihkan Hash URL
        window.history.replaceState(null, "", window.location.pathname)

        // 5. Notifikasi Berhasil
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: tRef.current("loginSuccess") || "Login Berhasil!",
          text: `${tRef.current("welcome") || "Selamat datang kembali"}, @${username}!`,
          showConfirmButton: false,
          timer: 2500,
        })

        // 6. Kembalikan Pengguna ke Beranda
        router.push("/")
      } catch (err: any) {
        console.error("Callback Error:", err)
        setStatusText(tRef.current("failedAuth") || "Gagal melakukan autentikasi.")

        Swal.fire({
          icon: "error",
          title: tRef.current("authFailedTitle") || "Autentikasi Gagal",
          text:
            err?.message ||
            tRef.current("genericError") ||
            "Terjadi kesalahan saat memproses login.",
          confirmButtonText: tRef.current("backToHome") || "Kembali ke Beranda",
        }).then(() => {
          router.push("/")
        })
      }
    }

    handleOAuthCallback()
  }, [router, setAuthToken, updateUser, setPiUser])

  const isRtl = language === "ar"

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 bg-background"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
        <h2 className="text-lg font-semibold text-foreground">{statusText}</h2>
        <p className="text-sm text-muted-foreground">
          {t("pleaseWait") || "Mohon tunggu sebentar, jangan tutup halaman ini."}
        </p>
      </div>
    </div>
  )
}

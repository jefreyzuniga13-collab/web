/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { AppRouter } from "@/Routers/AppRouter";
import ReLoginModal from "@/Components/Common/ReLoginModal";
import OfflineBanner from "@/Components/Common/OfflineBanner";
import { useOnline } from "@/Hooks/Auth/useOnline";
import { SignalRProvider } from "@/Context/SignalRContext";
import { useNotificationsHub } from "@/Hooks/Hub/useNotificationsHub";
import { useDispatch } from "react-redux";
import { enqueuePopup } from "@/Context/Slices/Chat/popupSlice";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "@/Utils/materialTheme";
import "@/App.css";
import "react-toastify/dist/ReactToastify.css";
import type { AuthData } from "@/Interfaces/Auth/AuthInterface";

function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function sanitizeExternalUrl(url: string): string {
  // Si ya viene con http(s)://, la devolvemos igual; si no, le anteponemos https://
  if (isExternalUrl(url)) return url;
  return `https://${String(url).replace(/^\/+/, "")}`;
}

export default function App() {
  const online = useOnline();

  const authRaw = localStorage.getItem("auth") ?? "{}";
  const { accessToken } = JSON.parse(authRaw) as AuthData;
  const dispatch = useDispatch();
  const lastEvent = useNotificationsHub();
  const navigate = useNavigate();

  // Registro del SW (una sola vez)
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    }
  }, []);

  // Pedir permiso de notificaciones (una sola vez idealmente)
  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Vigilar token (logout si desaparece)
  useEffect(() => {
    if (!accessToken) return;

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "auth") {
        const token = JSON.parse(e.newValue || "{}").accessToken;
        if (!token) navigate("/login", { replace: true });
      }
    };

     const checkToken = () => {
      const token = JSON.parse(localStorage.getItem("auth") || "{}").accessToken;
      if (!token) navigate("/login", { replace: true });
    };

    window.addEventListener("storage", handleStorage);
    const interval = setInterval(checkToken, 3000);

    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, [accessToken, navigate]);

  function shouldShowDesktopNotification() {
    return document.visibilityState === "hidden" || !document.hasFocus();
  } 

  // Escucha y muestra notificaciones emitidas internamente
  useEffect(() => {
    const onDesktopNotify = (e: Event) => {

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const evt = (e as CustomEvent).detail as any;
      if (shouldShowDesktopNotification()) {
        showDesktopNotification(evt).catch(() => {});
      }
    };

    window.addEventListener("DesktopNotify", onDesktopNotify);
    return () => window.removeEventListener("DesktopNotify", onDesktopNotify);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  function mapNotificationPayload(evt: any) {

    const title = evt?.title ?? "Nueva notificación";
    const body =
      evt?.body ??
      (evt?.content && String(evt.content).trim()) ??
      "Tienes una nueva notificación";

    // Prioriza url del evento; si no, fallback EXTERNO (sanitizado)
    const rawUrl =
      evt?.url ??
      "https://staging.dsujq9sb48iiw.amplifyapp.com/chat/"; // tu staging
    
    const url = sanitizeExternalUrl(String(rawUrl));

    return { title, body, url };
  }


  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function showDesktopNotification(evt: any) {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const { title, body, url } = mapNotificationPayload(evt);

    const reg = await navigator.serviceWorker.getRegistration();

        await reg?.showNotification(title, {
          body,
          icon: "/logopcg.png",
          badge: "/logopcg.png",
          requireInteraction: true,
          tag: "latest-message",
          renotify: true,
          data: { url },
        } as NotificationOptions & { renotify: boolean });
  }


  // Mensajes desde el SW (fallback si el SW decide postMessage en vez de abrir él mismo)
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "NAVIGATE" && e.data?.url) {
        const url = String(e.data.url);
        if (isExternalUrl(url)) {
          //  abrir externas con window.open
          window.open(sanitizeExternalUrl(url), "_blank", "noopener,noreferrer");
        } else {
          navigate(url);
        }
      }
    };
    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, [navigate]);

  useEffect(() => {
    if (!lastEvent) return;

    dispatch(enqueuePopup(lastEvent));

    if (shouldShowDesktopNotification()) {
      showDesktopNotification(lastEvent).catch(() => {});
    }
  }, [lastEvent, dispatch]);

  // Sonido
  useEffect(() => {
    if (!lastEvent) return;
    try {
      const audio = new Audio("/notification.mp3");
      audio.play().catch(() => {});
    // eslint-disable-next-line no-empty
    } catch {}
  }, [lastEvent]);

  return (
     <ThemeProvider theme={theme}>
      <ToastContainer
        position="top-right"
        autoClose={500}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
      />

      {accessToken ? (
        <SignalRProvider>
          {!online && <OfflineBanner onRetry={() => window.location.reload()} />}
          <ReLoginModal />
          <AppRouter />
        </SignalRProvider>
      ) : (
        // Rutas públicas (login, cart, checkout, etc.)
        <AppRouter />
      )}
    </ThemeProvider>
  );
}
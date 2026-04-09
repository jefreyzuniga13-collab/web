/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AppRouter } from "@/Routers/AppRouter";
import ReLoginModal from "@/Components/Common/ReLoginModal";
import OfflineBanner from "@/Components/Common/OfflineBanner";
import { useOnline } from "@/Hooks/Auth/useOnline";
import { SignalRProvider } from "@/Context/SignalRContext";
import { useNotificationsHub } from "@/Hooks/Hub/useNotificationsHub";
import { enqueuePopup } from "@/Context/Slices/Chat/popupSlice";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "@/Utils/materialTheme";
import type { RootState } from "@/Context";
import "react-toastify/dist/ReactToastify.css";
import "@/App.css";

function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function sanitizeExternalUrl(url: string): string {
  if (isExternalUrl(url)) return url;
  return `https://${String(url).replace(/^\/+/, "")}`;
}

export default function App() {
  const online = useOnline();
  const dispatch = useDispatch();
  const lastEvent = useNotificationsHub();
  const navigate = useNavigate();

  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );

  function shouldShowDesktopNotification() {
    return document.visibilityState === "hidden" || !document.hasFocus();
  }

  function mapNotificationPayload(evt: any) {
    const title = evt?.title ?? "Nueva notificación";
    const body =
      evt?.body ??
      (evt?.content && String(evt.content).trim()) ??
      "Tienes una nueva notificación";

    const rawUrl =
      evt?.url ?? "https://staging.dsujq9sb48iiw.amplifyapp.com/chat/";

    const url = sanitizeExternalUrl(String(rawUrl));

    return { title, body, url };
  }

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

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onDesktopNotify = (e: Event) => {
      const evt = (e as CustomEvent).detail;
      if (shouldShowDesktopNotification()) {
        showDesktopNotification(evt).catch(() => {});
      }
    };

    window.addEventListener("DesktopNotify", onDesktopNotify);
    return () => window.removeEventListener("DesktopNotify", onDesktopNotify);
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handler = (e: MessageEvent) => {
      if (e.data?.type === "NAVIGATE" && e.data?.url) {
        const url = String(e.data.url);

        if (isExternalUrl(url)) {
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

  useEffect(() => {
    if (!lastEvent) return;

    try {
      const audio = new Audio("/notification.mp3");
      audio.play().catch(() => {});
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

      {isAuthenticated ? (
        <SignalRProvider>
          {!online && <OfflineBanner onRetry={() => window.location.reload()} />}
          <ReLoginModal />
          <AppRouter />
        </SignalRProvider>
      ) : (
        <AppRouter />
      )}
    </ThemeProvider>
  );
}
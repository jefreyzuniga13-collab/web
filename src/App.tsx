/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect } from "react";
import { ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ThemeProvider } from "@mui/material/styles";

import { AppRouter } from "@/Routers/AppRouter";
import ReLoginModal from "@/Components/Common/ReLoginModal";
import OfflineBanner from "@/Components/Common/OfflineBanner";
import SessionBootstrap from "@/Components/Auth/SessionBootstrap";
import { useOnline } from "@/Hooks/Auth/useOnline";
import { SignalRProvider } from "@/Context/SignalRContext";
import { useNotificationsHub } from "@/Hooks/Hub/useNotificationsHub";
import { enqueuePopup } from "@/Context/Slices/Chat/popupSlice";
import type { RootState } from "@/Context";
import { theme } from "@/Utils/materialTheme";
import { LicenseExpiredModalWatcher } from "@/Components/Auth/LicenseExpiredModalWatcher";

import "react-toastify/dist/ReactToastify.css";
import "@/App.css";

const BASE_URL = import.meta.env.BASE_URL || "/";

function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function normalizeInternalUrl(url?: string | null): string {
  const rawUrl = String(url ?? "").trim();

  if (!rawUrl) {
    return "/chat";
  }

  if (isExternalUrl(rawUrl)) {
    return rawUrl;
  }

  if (rawUrl.startsWith(BASE_URL)) {
    const withoutBase = rawUrl.slice(BASE_URL.length - 1);
    return withoutBase.startsWith("/") ? withoutBase : `/${withoutBase}`;
  }

  if (rawUrl.startsWith("/")) {
    return rawUrl;
  }

  return `/${rawUrl}`;
}

function sanitizeExternalUrl(url?: string | null): string {
  const rawUrl = String(url ?? "").trim();

  if (!rawUrl) {
    return "/chat";
  }

  if (isExternalUrl(rawUrl)) {
    return rawUrl;
  }

  if (rawUrl.startsWith("/")) {
    return rawUrl;
  }

  return `https://${rawUrl.replace(/^\/+/, "")}`;
}

function getPublicAssetUrl(fileName: string): string {
  return `${BASE_URL}${fileName}`.replace(/\/{2,}/g, "/");
}

function shouldShowDesktopNotification() {
  return document.visibilityState === "hidden" || !document.hasFocus();
}

function AppRealtimeEffects() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const lastEvent = useNotificationsHub();

  const mapNotificationPayload = useCallback((evt: any) => {
    const title = evt?.title ?? "Nueva notificación";

    const body =
      evt?.body ??
      (evt?.content && String(evt.content).trim()) ??
      "Tienes una nueva notificación";

    const url = normalizeInternalUrl(evt?.url ?? "/chat");

    return { title, body, url };
  }, []);

  const showDesktopNotification = useCallback(
    async (evt: any) => {
      if (!("Notification" in window)) return;
      if (!("serviceWorker" in navigator)) return;
      if (Notification.permission !== "granted") return;

      const { title, body, url } = mapNotificationPayload(evt);

      const reg = await navigator.serviceWorker.ready;

      await reg.showNotification(title, {
        body,
        icon: getPublicAssetUrl("icono.jpeg"),
        badge: getPublicAssetUrl("icono.jpeg"),
        requireInteraction: true,
        tag: "latest-message",
        renotify: true,
        data: { url },
      } as NotificationOptions & { renotify: boolean });
    },
    [mapNotificationPayload]
  );

  useEffect(() => {
    const onDesktopNotify = (e: Event) => {
      const evt = (e as CustomEvent).detail;

      if (shouldShowDesktopNotification()) {
        showDesktopNotification(evt).catch(() => {});
      }
    };

    window.addEventListener("DesktopNotify", onDesktopNotify);

    return () => {
      window.removeEventListener("DesktopNotify", onDesktopNotify);
    };
  }, [showDesktopNotification]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handler = (e: MessageEvent) => {
      if (e.data?.type !== "NAVIGATE" || !e.data?.url) {
        return;
      }

      const url = String(e.data.url);

      if (isExternalUrl(url)) {
        window.open(sanitizeExternalUrl(url), "_blank", "noopener,noreferrer");
        return;
      }

      navigate(normalizeInternalUrl(url));
    };

    navigator.serviceWorker.addEventListener("message", handler);

    return () => {
      navigator.serviceWorker.removeEventListener("message", handler);
    };
  }, [navigate]);

  useEffect(() => {
    if (!lastEvent) return;

    dispatch(enqueuePopup(lastEvent));

    if (shouldShowDesktopNotification()) {
      showDesktopNotification(lastEvent).catch(() => {});
    }
  }, [lastEvent, dispatch, showDesktopNotification]);

  useEffect(() => {
    if (!lastEvent) return;

    try {
      const audio = new Audio(getPublicAssetUrl("notification.mp3"));
      audio.play().catch(() => {});
    } catch {}
  }, [lastEvent]);

  return null;
}

function AuthenticatedAppContent() {
  const online = useOnline();

  return (
    <SignalRProvider>
      <AppRealtimeEffects />

      {!online && <OfflineBanner onRetry={() => window.location.reload()} />}

      <ReLoginModal />
      <LicenseExpiredModalWatcher />
      <AppRouter />
    </SignalRProvider>
  );
}

export default function App() {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );

  useEffect(() => {
    if (!("Notification" in window)) return;

    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <SessionBootstrap>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          draggable
          theme="colored"
          toastClassName="custom-toast"
          className="custom-toast-body"
        />

        {isAuthenticated ? <AuthenticatedAppContent /> : <AppRouter />}
      </SessionBootstrap>
    </ThemeProvider>
  );
}
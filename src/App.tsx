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

  // Error: Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons: 1. You might have mismatching versions of React and the renderer (such as React DOM) 2. You might be breaking the Rules of Hooks 3. You might have more than one copy of React in the same app See https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem.
  const mapNotificationPayload = useCallback((evt: any) => {
    const title = evt?.title ?? "Nueva notificación";
    const body =
      evt?.body ??
      (evt?.content && String(evt.content).trim()) ??
      "Tienes una nueva notificación";

    const rawUrl = evt?.url;
    const url = sanitizeExternalUrl(String(rawUrl));

    return { title, body, url };
  }, []);

  const showDesktopNotification = useCallback(async (evt: any) => {
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
  }, [mapNotificationPayload]);
    
    // Registrar service worker
    useEffect(() => {
      if ("serviceWorker" in navigator) {
        // navigator.serviceWorker.register("/sw.js").catch(() => {});
        navigator.serviceWorker
        .register(`${import.meta.env.BASE_URL}sw.js`)
        .catch(() => {});
      }
    }, []);

  // Permiso de notificaciones
  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Escuchar eventos de notificación
  useEffect(() => {
    const onDesktopNotify = (e: Event) => {
      const evt = (e as CustomEvent).detail;
      if (shouldShowDesktopNotification()) {
        showDesktopNotification(evt).catch(() => {});
      }
    };

    window.addEventListener("DesktopNotify", onDesktopNotify);
    return () => window.removeEventListener("DesktopNotify", onDesktopNotify);
  }, [showDesktopNotification]);

  // Manejo de navegación desde SW
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
    return () =>
      navigator.serviceWorker.removeEventListener("message", handler);
  }, [navigate]);


  /**ERROR
   * 
   * installHook.js:1 The final argument passed to useEffect changed size between renders. The order and size of this array must remain constant.

Previous: [, (action) => {
    if (isActionCreator2(action)) {
      console.warn(getMessage(action.type));
    }
    return next(action);
  }, async function showDesktopNotification(evt) {
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
      data: { url }
    });
  }]
Incoming: [, (action) => {
    if (isActionCreator2(action)) {
      console.warn(getMessage(action.type));
    }
    return next(action);
  }]
overrideMethod	@	installHook.js:1
(anonymous)	@	App.tsx:129
S.scheduleRefresh	@	installHook.js:1
(anonymous)	@	@react-refresh:228
performReactRefresh	@	@react-refresh:217
(anonymous)	@	@react-refresh:586

   */
  // Notificaciones en tiempo real
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
      // const audio = new Audio("/notification.mp3");
      const audio = new Audio(`${import.meta.env.BASE_URL}notification.mp3`);
      audio.play().catch(() => {});
    } catch {}
  }, [lastEvent]);

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

        {isAuthenticated ? (
          <SignalRProvider>
            {!online && (
              <OfflineBanner onRetry={() => window.location.reload()} />
            )}
            <ReLoginModal />
            <AppRouter />
          </SignalRProvider>
        ) : (
          <AppRouter />
        )}
      </SessionBootstrap>
    </ThemeProvider>
  );
}
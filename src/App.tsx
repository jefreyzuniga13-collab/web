/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ThemeProvider } from "@mui/material/styles";

import { AppRouter } from "@/Routers/AppRouter";
import ReLoginModal from "@/Components/Common/ReLoginModal";
import OfflineBanner from "@/Components/Common/OfflineBanner";
import { useOnline } from "@/Hooks/Auth/useOnline";
import { SignalRProvider } from "@/Context/SignalRContext";
import { useNotificationsHub } from "@/Hooks/Hub/useNotificationsHub";
import { enqueuePopup } from "@/Context/Slices/Chat/popupSlice";
import { theme } from "@/Utils/materialTheme";
import { selectIsAuthenticated } from "@/Context/Slices/Auth/authSlice";

import "@/App.css";
import "react-toastify/dist/ReactToastify.css";

function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function sanitizeExternalUrl(url: string): string {
  if (isExternalUrl(url)) return url;
  return `https://${String(url).replace(/^\/+/, "")}`;
}

type NotificationEventPayload = {
  title?: string;
  body?: string;
  content?: string;
  url?: string;
};

type HubNotificationEvent = {
  type: string;
  payload?: Record<string, unknown>;
};

export default function App() {
  const online = useOnline();
  const dispatch = useDispatch();
  const lastEvent = useNotificationsHub();
  const navigate = useNavigate();
const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    }
  }, []);

  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  function shouldShowDesktopNotification() {
    return document.visibilityState === "hidden" || !document.hasFocus();
  }

  function mapNotificationPayload(evt: NotificationEventPayload) {
    const title = evt.title ?? "Nueva notificación";
    const body =
      evt.body ??
      (evt.content ? String(evt.content).trim() : "") ??
      "Tienes una nueva notificación";

    const rawUrl =
      evt.url ?? "https://staging.dsujq9sb48iiw.amplifyapp.com/chat/";

    const url = sanitizeExternalUrl(String(rawUrl));

    return { title, body, url };
  }

  function buildDesktopNotificationPayload(
    evt: HubNotificationEvent
  ): NotificationEventPayload {
    const payload = evt.payload ?? {};

    switch (evt.type) {
      case "SupportRequested":
        return {
          title: "Nueva solicitud de soporte",
          body:
            String(payload["message"] ?? payload["content"] ?? "").trim() ||
            "Se ha solicitado soporte",
          url: "/chat"
        };

      case "ConversationAssigned":
        return {
          title: "Conversación asignada",
          body:
            String(payload["message"] ?? payload["content"] ?? "").trim() ||
            "Se te ha asignado una conversación",
          url: "/chat"
        };

      case "AssignmentResponse":
        return {
          title: "Respuesta de asignación",
          body:
            String(payload["message"] ?? payload["content"] ?? "").trim() ||
            "Hay una actualización de asignación",
          url: "/chat"
        };

      case "AssignmentForced":
      case "AssignmentForcedAdmin":
        return {
          title: "Asignación forzada",
          body:
            String(payload["message"] ?? payload["content"] ?? "").trim() ||
            "Se realizó una asignación forzada",
          url: "/chat"
        };

      case "Notification":
        return {
          title: String(payload["title"] ?? "Nueva notificación"),
          body:
            String(payload["body"] ?? payload["content"] ?? "").trim() ||
            "Tienes una nueva notificación",
          url: String(payload["url"] ?? "/chat")
        };

      default:
        return {
          title: "Nueva notificación",
          body:
            String(payload["message"] ?? payload["content"] ?? "").trim() ||
            "Tienes una nueva notificación",
          url: "/chat"
        };
    }
  }

  async function showDesktopNotification(evt: NotificationEventPayload) {
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
    } as NotificationOptions & { renotify: boolean });
  }

  useEffect(() => {
    const onDesktopNotify = (e: Event) => {
      const evt = (e as CustomEvent<NotificationEventPayload>).detail;

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
          return;
        }

        navigate(url);
      }
    };

    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, [navigate]);

  useEffect(() => {
    if (!lastEvent) return;

    dispatch(enqueuePopup(lastEvent));

    if (shouldShowDesktopNotification()) {
      const desktopPayload = buildDesktopNotificationPayload(
        lastEvent as HubNotificationEvent
      );

      showDesktopNotification(desktopPayload).catch(() => {});
    }
  }, [lastEvent, dispatch]);

  useEffect(() => {
    if (!lastEvent) return;

    const audio = new Audio("/notification.mp3");
    audio.play().catch(() => {});
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
import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { ToastContainer } from "react-toastify";

import type { AppDispatch, RootState } from "@/Context";

import { AppRouter } from "@/Routers/AppRouter";
import { SignalRProvider } from "@/Context/SignalRContext";
import { enqueuePopup } from "@/Context/Slices/Chat/popupSlice";

import SessionBootstrap from "@/Components/Auth/SessionBootstrap";
import { LicenseExpiredModalWatcher } from "@/Components/Auth/LicenseExpiredModalWatcher";
import OfflineBanner from "@/Components/Common/OfflineBanner";
import ReLoginModal from "@/Components/Common/ReLoginModal";

import { useForceLogoutListener } from "@/Hooks/Auth/useForceLogoutListener";
import { useOnline } from "@/Hooks/Auth/useOnline";
import { useNotificationsHub } from "@/Hooks/Hub/useNotificationsHub";

import { theme } from "@/Utils/materialTheme";

import "react-toastify/dist/ReactToastify.css";
import "@/App.css";

const BASE_URL = import.meta.env.BASE_URL || "/";

interface NotificationEventPayload {
  title?: string | null;
  body?: string | null;
  content?: string | null;
  url?: string | null;
  [key: string]: unknown;
}

interface ServiceWorkerNavigateMessage {
  type?: string;
  url?: string;
}

/**
 * Indica si una URL utiliza un protocolo externo permitido.
 */
function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

/**
 * Normaliza rutas internas para trabajar correctamente
 * con el basename configurado, por ejemplo /crm/.
 */
function normalizeInternalUrl(url?: string | null): string {
  const rawUrl = String(url ?? "").trim();

  if (!rawUrl) {
    return "/chat";
  }

  if (isExternalUrl(rawUrl)) {
    return rawUrl;
  }

  const normalizedBase = BASE_URL.endsWith("/")
    ? BASE_URL
    : `${BASE_URL}/`;

  if (rawUrl.startsWith(normalizedBase)) {
    const withoutBase = rawUrl.slice(normalizedBase.length);

    return withoutBase
      ? `/${withoutBase.replace(/^\/+/, "")}`
      : "/";
  }

  if (rawUrl.startsWith("/")) {
    return rawUrl;
  }

  return `/${rawUrl}`;
}

/**
 * Evita abrir direcciones externas con un formato inválido.
 */
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

/**
 * Construye la URL de un recurso público respetando BASE_URL.
 */
function getPublicAssetUrl(fileName: string): string {
  const normalizedBase = BASE_URL.endsWith("/")
    ? BASE_URL
    : `${BASE_URL}/`;

  return `${normalizedBase}${fileName.replace(/^\/+/, "")}`;
}

/**
 * Solo muestra notificaciones del sistema cuando
 * la aplicación no tiene el foco.
 */
function shouldShowDesktopNotification(): boolean {
  return (
    document.visibilityState === "hidden" ||
    !document.hasFocus()
  );
}

/**
 * Maneja efectos globales relacionados con notificaciones,
 * sonido y navegación desde el service worker.
 */
function AppRealtimeEffects() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const lastEvent = useNotificationsHub();

  const mapNotificationPayload = useCallback(
    (event: NotificationEventPayload) => {
      const title =
        typeof event?.title === "string" && event.title.trim()
          ? event.title.trim()
          : "Nueva notificación";

      const content =
        typeof event?.content === "string"
          ? event.content.trim()
          : "";

      const body =
        typeof event?.body === "string" && event.body.trim()
          ? event.body.trim()
          : content || "Tienes una nueva notificación";

      const url = normalizeInternalUrl(
        typeof event?.url === "string"
          ? event.url
          : "/chat",
      );

      return {
        title,
        body,
        url,
      };
    },
    [],
  );

  const showDesktopNotification = useCallback(
    async (event: NotificationEventPayload) => {
      if (
        !("Notification" in window) ||
        !("serviceWorker" in navigator) ||
        Notification.permission !== "granted"
      ) {
        return;
      }

      const { title, body, url } =
        mapNotificationPayload(event);

      const registration =
        await navigator.serviceWorker.ready;

      await registration.showNotification(title, {
        body,
        icon: getPublicAssetUrl("icono.jpeg"),
        badge: getPublicAssetUrl("icono.jpeg"),
        requireInteraction: true,
        tag: "latest-message",
        renotify: true,
        data: {
          url,
        },
      } as NotificationOptions & {
        renotify: boolean;
      });
    },
    [mapNotificationPayload],
  );

  useEffect(() => {
    const handleDesktopNotification = (event: Event) => {
      const detail = (
        event as CustomEvent<NotificationEventPayload>
      ).detail;

      if (!shouldShowDesktopNotification()) {
        return;
      }

      void showDesktopNotification(detail).catch((error) => {
        console.warn(
          "[App] No se pudo mostrar la notificación.",
          error,
        );
      });
    };

    window.addEventListener(
      "DesktopNotify",
      handleDesktopNotification,
    );

    return () => {
      window.removeEventListener(
        "DesktopNotify",
        handleDesktopNotification,
      );
    };
  }, [showDesktopNotification]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    const handleServiceWorkerMessage = (
      event: MessageEvent<ServiceWorkerNavigateMessage>,
    ) => {
      if (
        event.data?.type !== "NAVIGATE" ||
        !event.data.url
      ) {
        return;
      }

      const url = String(event.data.url).trim();

      if (!url) {
        return;
      }

      if (isExternalUrl(url)) {
        window.open(
          sanitizeExternalUrl(url),
          "_blank",
          "noopener,noreferrer",
        );

        return;
      }

      navigate(normalizeInternalUrl(url));
    };

    navigator.serviceWorker.addEventListener(
      "message",
      handleServiceWorkerMessage,
    );

    return () => {
      navigator.serviceWorker.removeEventListener(
        "message",
        handleServiceWorkerMessage,
      );
    };
  }, [navigate]);

  useEffect(() => {
    if (!lastEvent) {
      return;
    }

    dispatch(enqueuePopup(lastEvent));

    if (!shouldShowDesktopNotification()) {
      return;
    }

    void showDesktopNotification(
      lastEvent as NotificationEventPayload,
    ).catch((error) => {
      console.warn(
        "[App] No se pudo mostrar la notificación recibida.",
        error,
      );
    });
  }, [
    dispatch,
    lastEvent,
    showDesktopNotification,
  ]);

  useEffect(() => {
    if (!lastEvent) {
      return;
    }

    const audio = new Audio(
      getPublicAssetUrl("notification.mp3"),
    );

    void audio.play().catch(() => {
      /*
       * Algunos navegadores bloquean reproducción automática
       * hasta que el usuario interactúa con la página.
       */
    });

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [lastEvent]);

  return null;
}

/**
 * Contenido disponible únicamente cuando
 * el usuario ya está autenticado.
 */
function AuthenticatedAppContent() {
  const online = useOnline();

  /*
   * Único punto donde se escucha ForceLogout.
   * No debe repetirse en RequireAuth.
   */
  useForceLogoutListener();

  return (
    <SignalRProvider>
      <AppRealtimeEffects />

      {!online && (
        <OfflineBanner
          onRetry={() => window.location.reload()}
        />
      )}

      <ReLoginModal />
      <LicenseExpiredModalWatcher />
      <AppRouter />
    </SignalRProvider>
  );
}

export default function App() {
  const isAuthenticated = useSelector(
    (state: RootState) =>
      state.auth.isAuthenticated,
  );

  useEffect(() => {
    if (
      !("Notification" in window) ||
      Notification.permission !== "default"
    ) {
      return;
    }

    void Notification.requestPermission().catch((error) => {
      console.warn(
        "[App] No se pudo solicitar permiso de notificaciones.",
        error,
      );
    });
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

        {isAuthenticated ? (
          <AuthenticatedAppContent />
        ) : (
          <AppRouter />
        )}
      </SessionBootstrap>
    </ThemeProvider>
  );
}
import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { AppRouter } from "@/Routers/AppRouter";
import ReLoginModal from "@/Components/Common/ReLoginModal";
// import OfflineBanner from "@/Components/Common/OfflineBanner";
// import { useOnline } from "@/Hooks/useOnline";
import { SignalRProvider } from "@/Context/SignalRContext";
import { useNotificationsHub } from "@/Hooks/Hub/useNotificationsHub";
import { useDispatch } from "react-redux";
import { enqueuePopup } from "@/Context/Slices/popupSlice";
import {ThemeProvider } from '@mui/material/styles';
import {theme} from '@/Utils/materialTheme'

import "@/App.css";
import "@/i18n";
import "react-toastify/dist/ReactToastify.css";
import type { AuthData } from "@/Interfaces/Auth/AuthInterface";

export default function App() {
  // const online = useOnline();
  const authRaw = localStorage.getItem("auth") ?? "{}";
  const { accessToken } = JSON.parse(authRaw) as AuthData;
  const dispatch = useDispatch();
  const lastEvent = useNotificationsHub();
  const navigate = useNavigate();
  
    useEffect(() => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/src/Utils/sw.js').catch(console.error);
      }
    }, []);
  
    // Pedir permiso de notificaciones (una sola vez idealmente)
    useEffect(() => {
      if (!('Notification' in window)) return;
      if (Notification.permission === 'default') {
        // Muestra tu propio modal antes, si quieres, y luego:
        Notification.requestPermission().catch(() => {});
      }
    }, []);

  useEffect(() => {
    if (lastEvent) {
      dispatch(enqueuePopup(lastEvent));
    }
  }, [lastEvent, dispatch]);

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
    const interval = setInterval(checkToken, 1000);

    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, [accessToken, navigate]);

function shouldShowDesktopNotification() {
  return document.visibilityState === 'hidden' || !document.hasFocus();
}
// listener único para cualquier notificación “de escritorio”
useEffect(() => {
  const onDesktopNotify = (e: Event) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const evt = (e as CustomEvent).detail as any;
    if (shouldShowDesktopNotification()) {
      showDesktopNotification(evt).catch(() => {});
    }
  };

  window.addEventListener('DesktopNotify', onDesktopNotify);
    return () => window.removeEventListener('DesktopNotify', onDesktopNotify);
  }, []);

  // Mapea tu evento a un título, cuerpo e URL (ajústalo a tu modelo)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  function mapNotificationPayload(evt: any) {
    // EJEMPLO: ajusta campos reales de tu evento
    const title = evt.title ?? 'Nuevo mensaje';
    const body  = evt.body ?? 'Tienes una nueva notificación';
    const url   = evt.url ?? `http://localhost:5173/chat`; // o la ruta que corresponda

    return { title, body, url };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
async function showDesktopNotification(evt: any) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

      console.log("El evento recibido es antes de llamar a mapNotificationPayload: ", evt);
  const { title, body, url } = mapNotificationPayload(evt);
  const reg = await navigator.serviceWorker.getRegistration();

    if (reg?.showNotification) {
      await reg.showNotification(title, {
        body,
        icon: 'https://www.pcgroupsa.com/assets/images/logopcg.png',
        badge: 'https://www.pcgroupsa.com/assets/images/logopcg.png',
        tag: `conv-${evt?.conversationId ?? 'general'}`,
        requireInteraction: true,
        data: { url },
      });
    } else {
      new Notification(title, { body }); // fallback
    }
  }

  // Escucha mensajes del SW (cuando el usuario hace clic en la notificación)
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'NAVIGATE' && e.data?.url) {
        navigate(e.data.url);
      }
    };
    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, [navigate]);

  // Donde ya procesas lastEvent:
  useEffect(() => {
    if (!lastEvent) return;

    // 1) Tu popup interno (toast/Redux)
    dispatch(enqueuePopup(lastEvent));

    // 2) Notificación de escritorio si está en otra pestaña/ventana/minimizado
    if (shouldShowDesktopNotification()) {
      showDesktopNotification(lastEvent).catch(() => {});
    }
  }, [lastEvent, dispatch]);

  // Sonido (coloca un mp3 corto en /public/sounds/)
  useEffect(() => {
    if (!lastEvent) return;
    try {
      const audio = new Audio('/src/assets/audio/bellnotification.mp3');
      // iOS requiere interacción previa del usuario para permitir audio
      audio.play().catch(() => {});
    // eslint-disable-next-line no-empty
    } catch {}
  }, [lastEvent]);
  
  if (!accessToken) {
    return <AppRouter />;
  }

  return (
    <SignalRProvider token={accessToken}>
      <ThemeProvider theme={theme}>

      {/* {!online && <OfflineBanner onRetry={() => window.location.reload()} />} */}

      <ReLoginModal />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
      />

      <AppRouter />
      </ThemeProvider>
    </SignalRProvider>
  );
}
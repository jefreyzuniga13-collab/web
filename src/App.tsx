import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { AppRouter } from "@/Routers/AppRouter";
import ReLoginModal from "@/Components/Common/ReLoginModal";
import OfflineBanner from "@/Components/Common/OfflineBanner";
import { useOnline } from "@/Hooks/useOnline";
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
  const online = useOnline();
  const authRaw = localStorage.getItem("auth") ?? "{}";
  const { accessToken } = JSON.parse(authRaw) as AuthData;
  const dispatch = useDispatch();
  const lastEvent = useNotificationsHub();
  const navigate = useNavigate();

  // useForceLogoutListener();

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

  if (!accessToken) {
    return <AppRouter />;
  }

  return (
    <SignalRProvider token={accessToken}>
      <ThemeProvider theme={theme}>

      {!online && <OfflineBanner onRetry={() => window.location.reload()} />}

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
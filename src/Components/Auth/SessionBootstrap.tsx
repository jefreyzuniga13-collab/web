import type { AppDispatch, RootState } from "@/Context";
import { checkSessionThunk } from "@/Context/Slices/Auth/authSlice";
import CustomLoader from "@/Components/Common/CustomLoader";
import { enablePwa } from "@/Utils/pwaLifecycle";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";

interface Props {
  children: React.ReactNode;
}

const PUBLIC_ROUTES = new Set([
  "/cart",
  "/checkout",
  "/payment-result",
  "/payment-hosted",
  "/successOrder",
  "/login",
  "/signup",
  "/check-email",
  "/forgot-password",
  "/reset-password",
  "/verify-account",
  "/privacy-policy",
  "/unauthorized",
  "/",
]);

function normalizePath(pathname: string) {
  if (!pathname) return "/";
  const normalized = pathname.replace(/\/+$/, "");
  return normalized === "" ? "/" : normalized;
}

export default function SessionBootstrap({ children }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );

  const normalizedPath = useMemo(
    () => normalizePath(location.pathname),
    [location.pathname]
  );

  const isPublicRoute = PUBLIC_ROUTES.has(normalizedPath);
  const [bootstrapping, setBootstrapping] = useState(
    !isPublicRoute && !isAuthenticated
  );

  useEffect(() => {
    if (isPublicRoute) {
      setBootstrapping(false);
      return;
    }

    if (isAuthenticated) {
      setBootstrapping(false);
      enablePwa();
      return;
    }

    let cancelled = false;
    setBootstrapping(true);

    if (normalizedPath === "/chat") {
      void import("@/Pages/Chat/SupportPage");
    }

    void dispatch(checkSessionThunk()).finally(() => {
      if (!cancelled) {
        setBootstrapping(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [dispatch, isAuthenticated, isPublicRoute, normalizedPath]);

  if (!isPublicRoute && bootstrapping) {
    return <CustomLoader />;
  }

  return <>{children}</>;
}
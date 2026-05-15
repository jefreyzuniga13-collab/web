import type { AppDispatch, RootState } from "@/Context";
import { checkSessionThunk } from "@/Context/Slices/Auth/authSlice";
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import Spinner from "@/Components/Common/Spinner";

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
  "/login/",
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
  const checkingSession = useSelector(
    (state: RootState) => state.auth.checkingSession
  );

  const normalizedPath = useMemo(
    () => normalizePath(location.pathname),
    [location.pathname]
  );

  const isPublicRoute = PUBLIC_ROUTES.has(normalizedPath);

  
  useEffect(() => {
    if (isPublicRoute) return;
    dispatch(checkSessionThunk());
  }, [dispatch, isPublicRoute]);

  if (!isPublicRoute && checkingSession) {
    return <Spinner />;
  }

  return <>{children}</>;
}
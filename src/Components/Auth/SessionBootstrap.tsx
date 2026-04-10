import type { AppDispatch, RootState } from "@/Context";
import { checkSessionThunk } from "@/Context/Slices/Auth/authSlice";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import Spinner from "@/Components/Common/Spinner";

interface Props {
  children: React.ReactNode;
}

const PUBLIC_ECOMMERCE_ROUTES = new Set([
  "/cart",
  "/checkout",
  "/payment-result",
  "/payment-hosted",
  "/successOrder",
]);

export default function SessionBootstrap({ children }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const checkingSession = useSelector(
    (state: RootState) => state.auth.checkingSession
  );

  const isPublicEcommerceRoute = PUBLIC_ECOMMERCE_ROUTES.has(location.pathname);

  useEffect(() => {
    if (isPublicEcommerceRoute) return;
    dispatch(checkSessionThunk());
  }, [dispatch, isPublicEcommerceRoute]);

  if (!isPublicEcommerceRoute && checkingSession) {
    return <Spinner />;
  }

  return <>{children}</>;
}
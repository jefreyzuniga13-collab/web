import type { AppDispatch, RootState } from "@/Context";
import { checkSessionThunk } from "@/Context/Slices/Auth/authSlice";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

interface Props {
  children: React.ReactNode;
}

export default function SessionBootstrap({ children }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const checkingSession = useSelector((state: RootState) => state.auth.checkingSession);

  useEffect(() => {
    dispatch(checkSessionThunk());
  }, [dispatch]);

  if (checkingSession) {
    return null; // o loader
  }

  return <>{children}</>;
}
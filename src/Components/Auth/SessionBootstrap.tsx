import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/Context';
import { checkSessionThunk } from '@/Context/Slices/Auth/authSlice';

interface SessionBootstrapProps {
  children: React.ReactNode;
}

export default function SessionBootstrap({ children }: SessionBootstrapProps) {
  const dispatch = useDispatch<AppDispatch>();
  const checkingSession = useSelector((state: RootState) => state.auth.checkingSession);

  useEffect(() => {
    dispatch(checkSessionThunk());
  }, [dispatch]);

  if (checkingSession) {
    return null;
  }

  return <>{children}</>;
}
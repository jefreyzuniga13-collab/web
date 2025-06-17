import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
//import { logout } from '@/Context/Slices/authSlice';
import { useNavigate } from 'react-router-dom';

export function useForceLogoutListener() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const onStorageChange = (e: StorageEvent) => {
      if (e.key === 'forceLogout') {
       // dispatch(logout()); // Limpia Redux o contexto de sesión
        //localStorage.removeItem('auth');
        navigate('/login');
      }
    };

    window.addEventListener('storage', onStorageChange);
    return () => {
      window.removeEventListener('storage', onStorageChange);
    };
  }, [dispatch, navigate]);
}
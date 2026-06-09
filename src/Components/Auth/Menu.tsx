import React, { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import { useMenus } from '@/Hooks/Auth/useMenus';
import MenuItem from '@/Components/Auth/MenuItem';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import '@/Styles/Auth/Navbar.css';
import { SquareArrowLeft, SquareArrowRight } from 'lucide-react';
import { useUsers } from '@/Hooks/Auth/useUsers';
import { presenceConnection } from '@/Services/signalr';
import { markOffline } from '@/Hooks/Auth/useUserPresence';
import type { AuthData } from '@/Interfaces/Auth/AuthInterface';
import { useAuth } from '@/Hooks/Auth/useAuth'
import Profile from '@/assets/img/profile.png'
import { logoutThunk } from '@/Context/Slices/Auth/authThunks';
import type { AppDispatch } from '@/Context';
import { selectActiveCompanyImage, selectActiveCompanyName, selectActiveCompanyWhPhone } from '@/Context/Slices/Auth/companySlice';
import { selectCompanyImageUrl } from '@/Context/Slices/Auth/authSlice';
interface NavbarProps {
  id: number;
}
export const useAppDispatch: () => AppDispatch = useDispatch;

const Navbar: React.FC<NavbarProps> = ({ id }) => {
  const { menus, error } = useMenus();
  const [collapsed, setCollapsed] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const activeCompanyImage = useSelector(selectActiveCompanyImage);
  const activeCompanyName = useSelector(selectActiveCompanyName);
  const activeCompanyWhPhone = useSelector(selectActiveCompanyWhPhone);
  const CompanyImageUrl = useSelector(selectCompanyImageUrl);

  const { currentUser, loading: userLoading, fetchOne } = useUsers();

  const { logout: logoutAuth } = useAuth()

    const authRaw = localStorage.getItem('auth') || '{}';
    const { userId } = JSON.parse(authRaw) as AuthData;

  useEffect(() => {
    if (!currentUser) {
      fetchOne(id);
    }
  }, [currentUser, fetchOne, id]);

  const selectedUrl = location.pathname.replace(/^\//, '');

 const onClick = async (url: string, text: string) => {
    if (text.toLowerCase().includes('cerrar')) {
      try { await markOffline(Number(userId)); } catch (e) { console.warn(e); }
      // eslint-disable-next-line no-empty
      try { await presenceConnection?.stop(); } catch {}

      await logoutAuth();
      // dispatch(logout());
      dispatch(logoutThunk());
      navigate('/login', { replace: true });
    } else {
      navigate(`/${url}`);
    }
  };
  if (error) return <div className="navbar__error">Error cargando menú.</div>;

  const companyImageSrc = activeCompanyImage || CompanyImageUrl;
  return (
    <nav className={`navbar ${collapsed ? 'navbar--collapsed' : ''}`}>
      <div className="navbar__header">
       <div className='navbar__header-container'>
         {companyImageSrc && (
            <img
              src={companyImageSrc}
              alt="Logo de la empresa"
            className="navbar__logo"
            />
          )}
        <p className='navbar__header__text'>{activeCompanyName + ' - ' + activeCompanyWhPhone}</p>
       </div>
        <button 
          className="navbar__collapse-btn" 
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed
            ? <SquareArrowRight size={20} />
            : <SquareArrowLeft size={20} />}
        </button>

      </div>

      <ul className={`navbar__menu`}>
        {menus.map(m => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const Icon = (Icons as any)[m.icon] ?? Icons.Menu;
          const isSelected = selectedUrl === m.url;
      
          return (
                 <MenuItem
                    key={m.menuId}
                    icon={<Icon size={20} />}
                    text={m.name}
                    onClick={() => onClick(m.url, m.name)}
                    selected={isSelected}
                    className = {collapsed ? 'collapsed-styles' : ''}
                    collapsed={collapsed}
                  />
          );
        })}
      </ul>
      
        {userLoading ? (
          <div className="navbar__profile">
            <div className="navbar__profile-loading">Cargando usuario...</div>
          </div>
        ) : currentUser && (
          <div className="navbar__profile">
            <img 
               src={currentUser?.imageUrl && currentUser.imageUrl !== "" ? currentUser.imageUrl : Profile} 
              alt="Foto de perfil" 
              className="navbar__profile-photo"
           />
            <span className="navbar__profile-name">{currentUser.fullName}</span>
          </div>
        )}
        
        <p className="navbar__copyright">© {new Date().getFullYear()} PC Group S.A.</p>

    </nav>
  );
};

export default Navbar;
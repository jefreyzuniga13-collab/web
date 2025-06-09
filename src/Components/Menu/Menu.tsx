import React, { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import { useMenus } from '@/Hooks/useMenus';
import MenuItem from '@/Components/Menu/MenuItem';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '@/Context/Slices/authSlice';
import { useNotifications } from '@/Hooks/useNotifications';
import '@/Styles/Menu/Navbar.css';
import { ThreeDot } from 'react-loading-indicators';
import { SquareArrowLeft, SquareArrowRight } from 'lucide-react';
import { useUsers } from '@/Hooks/User/useUsers';

interface NavbarProps {
  id: number;
}

const Navbar: React.FC<NavbarProps> = ({ id }) => {
  const { menus, loading, error } = useMenus();
  const { unreadCount } = useNotifications();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser, loading: userLoading, getUserById } = useUsers();

  useEffect(() => {
    if (!currentUser) {
      getUserById(id);
    }
  }, [currentUser, getUserById, id]);

  const selectedUrl = location.pathname.replace(/^\//, '');

  const onClick = (url: string, text: string) => {
    if (text.toLowerCase().includes('cerrar')) {
      dispatch(logout());
      navigate('/login', { replace: true });
    } else {
      navigate(`/${url}`);
    }
  };

  if (loading) return (
    <div className="navbar__loading">
      <div className="navbar__loader">
        <ThreeDot color="#356ace" size="medium" />
      </div>
    </div>
  );
  
  if (error) return <div className="navbar__error">Error cargando menú.</div>;

  return (
    <nav className={`navbar ${collapsed ? 'navbar--collapsed' : ''}`}>
      <div className="navbar__header">
        <img
          src="https://i.ibb.co/B5tvT539/logopcg.webp"
          alt="PC Group S.A logo"
          className="navbar__logo"
        />
        <button 
          className="navbar__collapse-btn" 
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed
            ? <SquareArrowRight size={20} />
            : <SquareArrowLeft size={20} />}
        </button>
        <button 
          className="navbar__mobile-toggle" 
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <Icons.Menu size={24} />
        </button>
      </div>

      <ul className={`navbar__menu ${mobileOpen ? 'navbar__menu--open' : ''}`}>
        {menus.map(m => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const Icon = (Icons as any)[m.icon] ?? Icons.Menu;
          const isSelected = selectedUrl === m.url;
          const showBadge = m.url === 'notifications' && unreadCount > 0;

          return (
            <MenuItem
              key={m.menuId}
              icon={<Icon size={20} />}
              text={m.name}
              onClick={() => onClick(m.url, m.name)}
              selected={isSelected}
              badge={showBadge ? unreadCount : undefined}
            />
          );
        })}
      </ul>

      <div className="navbar__footer">
        {userLoading ? (
          <div className="navbar__profile">
            <div className="navbar__profile-loading">Cargando usuario...</div>
          </div>
        ) : currentUser && (
          <div className="navbar__profile">
            <img 
              src={currentUser.imageUrl || '/placeholder-avatar.png'} 
              alt="Foto de perfil" 
              className="navbar__profile-photo"
            />
            <span className="navbar__profile-name">{currentUser.fullName}</span>
          </div>
        )}
        
        <p className="navbar__copyright">© 2025 PC Group S.A.</p>
      </div>
    </nav>
  );
};

export default Navbar;
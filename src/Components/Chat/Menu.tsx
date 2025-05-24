import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { useMenus } from '@/Hooks/useMenus';
import MenuItem from '@/Components/Chat/MenuItem';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '@/Context/Slices/authSlice';
import { useNotifications } from '@/Hooks/useNotifications';
import '@/Styles/Chat/Navbar.css';
import { ThreeDot } from 'react-loading-indicators';
import { SquareArrowLeft, SquareArrowRight } from 'lucide-react';

const Navbar: React.FC = () => {
  const { menus, loading, error } = useMenus();
  const { unreadCount } = useNotifications();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Marcar como seleccionado el menú según la ruta actual
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
    <div className="navbar-loading">
      <div className="loader-container">
        <ThreeDot color="#3142cc" size="medium" />
      </div>
    </div>
  );
  if (error) return <div className="navbar-error">Error cargando menú.</div>;

  return (
    <nav className={`navbar ${collapsed ? 'collapsed' : ''}`}>
      <div className="menu-header">
        <img
          src="https://i.ibb.co/B5tvT539/logopcg.webp"
          alt="PC Group S.A logo"
          className="menu-logo"
        />
        <button className="collapse-button" onClick={() => setCollapsed(!collapsed)}>
          {collapsed
            ? <SquareArrowRight size={20}/>
            : <SquareArrowLeft size={20}/>}
        </button>
        <button className="mobile-menu-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
          <Icons.Menu size={24}/>
        </button>
      </div>

      <ul className={`menu-items ${mobileOpen ? 'open' : ''}`}>
        {menus.map(m => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const Icon = (Icons as any)[m.icon] ?? Icons.Menu;
          const isSelected = selectedUrl === m.url;
          const showBadge = m.url === 'notifications' && unreadCount > 0;

          return (
            <MenuItem
              key={m.menuId}
              icon={<Icon size={20}/>}
              text={m.name}
              onClick={() => onClick(m.url, m.name)}
              selected={isSelected}
              badge={ showBadge ? unreadCount : undefined }
            />
          );
        })}
      </ul>

      <div className="navbar-footer">
        <p>© 2025 PC Group S.A.</p>
      </div>
    </nav>
  );
};

export default Navbar;
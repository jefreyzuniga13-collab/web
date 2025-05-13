import React, { useState } from 'react';
import { Menu as MenuIcon, LayoutDashboard, MessageSquare,BellRing, Users, User, LogOut } from 'lucide-react';
import '@/Styles/Chat/Navbar.css';
import MenuItem from '@/Components/Chat/MenuItem'
import {useNavigate} from 'react-router-dom'
import { LuSquareArrowDownRight, LuSquareArrowDownLeft } from "react-icons/lu";
import {toast} from 'react-toastify'
import {logout} from '@/Context/Slices/authSlice'
import { useDispatch } from 'react-redux';

const Menu: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState<string>('Dashboard');
  const dispatch = useDispatch()
  const handleOptionClick = (optionId: string) => {
    setSelectedOption(optionId);
    navigate(`/${optionId}`)

    if(optionId === "Cerrar sesión") {
      navigate("/login");
      toast.success("Sesion Cerrada con Exito.");
      dispatch(logout());
    }

  };
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };


  return (
    <nav className={`navbar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="menu-header">
        <img 
          src="https://i.ibb.co/B5tvT539/logopcg.webp" 
          alt="PC Group S.A logo" 
          className="menu-logo" 
        />
        <button className="collapse-button" onClick={toggleCollapse}>
          {isCollapsed ? <LuSquareArrowDownRight size={20} /> :<LuSquareArrowDownLeft size={20} />}
        </button>
      </div>
      
      <div className="mobile-menu-toggle" onClick={toggleMenu}>
        <MenuIcon />
      </div>

      <ul className={`menu-items ${isMenuOpen ? 'open' : ''}`}>
        <MenuItem 
          icon={<LayoutDashboard size={20} />} 
          text="Dashboard" 
           onClick={()=> handleOptionClick(`Dashboard`)}
          selectedOption={selectedOption}
        />
        <MenuItem 
          icon={<MessageSquare size={20} />} 
          text="Chat" 
          onClick={()=> handleOptionClick(`Chat`)}
          selectedOption={selectedOption}
        />
        <MenuItem 
          icon={<Users size={20} />} 
          text="Usuarios" 
           onClick={()=> handleOptionClick(`Usuarios`)}
           selectedOption={selectedOption}
        />
        <MenuItem 
          icon={<BellRing size={20} />} 
          text="Notificaciones" 
           onClick={()=> handleOptionClick(`Notificaciones`)}
           selectedOption={selectedOption}
        />
        <MenuItem 
          icon={<User size={20} />} 
          text="Perfil" 
           onClick={()=> handleOptionClick(`Perfil`)}
           selectedOption={selectedOption}

        />
        <MenuItem 
          icon={<LogOut size={20} />} 
          text="Cerrar sesión" 
          onClick={()=> handleOptionClick(`Cerrar sesión`)}
          selectedOption={selectedOption}
        />
      </ul>
      <p className="derechos-container end" >©<span  className="navbar.collapsed derechos">2025 PC Group S.A. Todos los derechos reservados.</span></p>
    </nav>
  );
};

export default Menu;
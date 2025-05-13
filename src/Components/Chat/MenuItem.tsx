import type { MenuItemProps } from '@/Interfaces/Chat/ChatInterfaces';

const MenuItem: React.FC<MenuItemProps> = ({ icon, text, onClick, selectedOption}) => {
  return (
    <li className={`menu-item ${selectedOption === text? 'selected' : ''}`} onClick={onClick}>

      <div className="menu-item-content">
        {icon}
        <span className={`menu-item-text ${text == "Cerrar sesión" ? "cerrar-sesion" : ''}`}>{text}</span>
      </div>
    </li>
  );
};
export default MenuItem;

import Tooltip from '@mui/material/Tooltip';
import React from 'react';

export interface MenuItemProps {
  icon: React.ReactNode;
  text: string;
  onClick?: () => void;
  selected?: boolean;
  badge?: number;
  className: string;
  collapsed: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  text,
  onClick,
  selected,
  badge,
  className,
  collapsed
}) => (
  <li
    className={`menu-item ${className} ${selected ? 'menu-item--selected' : ''}`}
    onClick={onClick}
  >
    <Tooltip title={collapsed ? text : ""} slotProps={{ tooltip: { sx: { fontSize: '10px' } } }} >
        <div className={`menu-item__content ${text.includes("Cerrar") ? 'menu-item__content--logout' : ''}`}>
      <span className="menu-item__icon">
        {icon}
      </span>
      <span className="menu-item__text">
        {text}
      </span>
      {badge != null && (
        <span className="menu-item__badge">{badge}</span>
      )}
    </div>
    </Tooltip>
  </li>
);

export default MenuItem;
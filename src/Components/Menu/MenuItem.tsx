
import React from 'react';

export interface MenuItemProps {
  icon: React.ReactNode;
  text: string;
  onClick?: () => void;
  selected?: boolean;
  badge?: number;
  className: string;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  text,
  onClick,
  selected,
  badge,
  className
}) => (
  <li
    className={`menu-item ${className} ${selected ? 'menu-item--selected' : ''}`}
    onClick={onClick}
  >
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
  </li>
);

export default MenuItem;
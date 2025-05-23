import React from 'react';

export interface MenuItemProps {
  icon: React.ReactNode;
  text: string;
  onClick?: () => void;
  selected?: boolean;
  badge?: number;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  text,
  onClick,
  selected,
  badge
}) => (
  <li
    className={`menu-item ${selected ? 'selected' : ''}`}
    onClick={onClick}
  >
    <div className="menu-item-content">
      {icon}
      <span className="menu-item-text">
        {text}
      </span>
      {badge != null && (
        <span className="menu-item-badge">{badge}</span>
      )}
    </div>
  </li>
);

export default MenuItem;
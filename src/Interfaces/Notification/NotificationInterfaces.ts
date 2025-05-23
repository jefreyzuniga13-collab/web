export interface MenuItemProps {
  icon: React.ReactNode;
  text: string;
  onClick?: () => void;
  selected?: boolean;
  badge?: number;
}
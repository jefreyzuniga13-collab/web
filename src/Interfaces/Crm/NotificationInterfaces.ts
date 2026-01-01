import type { RoleResponseDto } from "../Auth/AuthInterface";

  export type TypeTranslation =
  | 'NewContact'
  | 'SupportRequested'
  | 'ConversationAssigned'
  | 'ConversationClosed'

export interface MenuItemProps {
  icon: React.ReactNode;
  text: string;
  onClick?: () => void;
  selected?: boolean;
  badge?: number;
}

type NotificationType =
  | 'NewContact'
  | 'SupportRequested'
  | 'ConversationAssigned'
  | 'ConversationClosed'

export interface NotificationRequestDto{
  id: number;
  name: string;
  description: string;
  type: NotificationType;
  payload: string;
  isActive: boolean;
  rolesId: number[],
}

export interface NotificationResponseDto{
  id: number;
   name: string;
  description: string;
  type: string;
  payload: string;
  isActive: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
  rolesId: RoleResponseDto,
}
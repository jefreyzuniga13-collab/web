
export type MessageType = 'Text' | 'Media' | 'Bot';
export type MessageStatus = 'Sent' | 'Delivered' | 'Read' | 'Failed';
export type ConversationStatus = 'New' | 'Bot' | 'WaitingHuman' | 'Human' | 'Closed';
export type NotificationType = 'NewContact' | 'HumanSupport' | 'ConversationAssigned' | 'MessageReceived';

export interface ConversationDto {
  conversationId: number;
  companyId?: number;
  clientContactId?: number;
  priority?: string;
  assignedAgentId?: number;
  assignedByUserId?: number;
  assignedAt?: string;
  status: ConversationStatus;
  initialized?: boolean;
  createdAt: string;
  firstResponseAt?: string;
  updatedAt?: string;
  closedAt?: string;
  isArchived?: boolean;
  totalMessages?: number;
  lastActivity?: string;
  duration?: string;
  timeToFirstResponse?: string;
  isClosed?: boolean;
  // Propiedades adicionales para UI
  contactName?: string;
  contactNumber?: string;
  profilePhoto?: string;
  totalMensajes?: number;
  ultimaActividad?: string;
  duracion?: string;
  unreadCount?: number;
  assignedAgentName?: string;
}

export interface AttachmentDto {
  attachmentId: number;
  messageId: number;
  mediaId: string;
  fileName?: string;
  mimeType?: string;
  mediaUrl?: string;
  createdAt?: string;
}

export interface MessageDto {
  messageId: number;
  conversationId: number;
  senderId: number;
  senderUserId?: number;
  senderContactId?: number;
  senderName: string;
  content?: string;
  caption?: string;
  externalId?: string;
  messageType: string;
  createdAt: string;
  status?: MessageStatus;
  deliveredAt?: string;
  readAt?: string;
  attachments: AttachmentDto[];
}

export interface AgentDto {
  userId: string;
  fullName: string;
  email: string;
}

export interface CompanyDto {
  companyId: number;
  name: string;
  createdAt: string;
}

export interface NotificationDto {
  notificationRecipientId: number;
  notificationId: number;
  type: NotificationType;
  payload: string;
  createdAt: string;
  isRead: boolean;
}

export interface NotificationsResponse {
  items: NotificationDto[];
  meta: {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface MenuItemProps {
  icon: React.ReactNode;
  text: string;
  onClick?: () => void;
  selectedOption: string;
}

export interface MenuDto {
  menuId: number;
  name: string;
  description: string;
  url: string;
  index: string;
  icon: string;
}

export interface SentMessage {
  conversationId: number;
  senderId: number;
  content: string;
  messageType: string;
  caption?: string;
}

export interface TagDto {
  tagId: number;
  name: string;
}
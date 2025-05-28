export type MessageType =
  | 'Text'
  | 'Image'
  | 'Video'
  | 'Audio'
  | 'Sticker'
  | 'Document'
  | 'Interactive'
  | 'Bot'

export type MessageStatus = 'Sent' | 'Delivered' | 'Read' | 'Failed'
export type ConversationStatus = 'New' | 'Bot' | 'Waiting' | 'Human' | 'Closed'
export type NotificationType = 'NewContact' | 'HumanSupport' | 'ConversationAssigned' | 'MessageReceived'

export interface ConversationDto {
  contactNumber: string
  conversationId: number
  companyId?: number
  clientContactId: number
  clientContactName?: string
  priority: string
  assignedAgentId?: number
  assignedAgentName?: string
  assignedByUserId?: number
  assignedByUserName?: string
  assignedAt?: string
  status: ConversationStatus
  initialized: boolean
  createdAt: string
  firstResponseAt?: string
  updatedAt?: string
  closedAt?: string
  isArchived: boolean
  totalMessages: number
  lastActivity: string
  duration: string
  timeToFirstResponse?: string
  isClosed: boolean
  unreadCount?: number
  messages?: MessageDto[]
  tags: string[];
}
export interface UpdateConversationRequest {
  conversationId: number
  priority?: string;
  initialized?: boolean
  status?: ConversationStatus
  assignedAgentId?: number
  tags?: string[]
  isArchived?: boolean
}
export interface MessageDto {
  messageId: number;
  conversationId: number;
  senderUserId?: number;
  senderUserName?: string;
  senderContactId?: number;
  senderContactName?: string;
  isIncoming: boolean;
  content?: string;
  externalId: string;
  messageType: MessageType;
  interactiveId?: string;
  interactiveTitle?: string;
  status: MessageStatus;
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  attachments: AttachmentDto[];
}

export interface SentMessage {
  conversationId: number;
  senderId: number;
  content: string;
  messageType: MessageType;
  caption?: string;
  file?: File;
}

export interface SentMedia {
  conversationId: number;
  file: File;
  caption?: string;
}
export interface AttachmentDto {
  attachmentId: number
  messageId: number
  mediaId: string
  fileName?: string
  mimeType?: string
  mediaUrl?: string
  createdAt: string
}

export interface AgentDto {
  userId: number
  fullName: string
  email: string
}

export interface CompanyDto {
  companyId: number
  name: string
  createdAt: string
}

export interface NotificationDto {
  notificationRecipientId: number
  notificationId: number
  type: NotificationType
  payload: string
  createdAt: string
  isRead: boolean
}

export interface NotificationsResponse {
  items: NotificationDto[]
  meta: {
    currentPage: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
}

export interface TagDto {
  tagId: number
  name: string
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

export interface MessageWithAttachmentsDto {
  messageId: number;
  senderUserId?: number;
  senderUserName?: string;
  senderContactId?: number;
  senderContactName?: string;
  content?: string;
  sentAt: string;
  messageType: string;
  attachments: AttachmentDto[];
}

export interface ConversationHistoryDto {
  conversationId: number;
  createdAt: string;
  status: string;
  messages: MessageWithAttachmentsDto[];
}
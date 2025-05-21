export type MessageType = 'Text' | 'Media' | 'Interactive' | 'Bot';
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
  tags?: TagDto[]
}

export interface MessageDto {
  messageId: number;
  conversationId: number;
  senderUserId?: number;
  SenderUserName?: string;
  senderContactId?: number;
  SenderContactName?: string;
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
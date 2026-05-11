export type MessageType =
  | 'Text'
  | 'Image'
  | 'Video'
  | 'Audio'
  | 'Sticker'
  | 'Document'
  | 'Interactive'
  | 'Bot'
  | 'Contact'

export type MessageStatus = 'Sent' | 'Delivered' | 'Read' | 'Failed'
export type ConversationStatus = 'New' | 'Bot' | 'Waiting' | 'Human' | 'Closed' | 'Incomplete' | "Paused"
export type NotificationType = 'NewContact' | 'HumanSupport' | 'ConversationAssigned' | 'MessageReceived'

export interface ConversationDto {
  contactNumber: string
  conversationId: number
  companyId?: number
  clientContactId: number
  systemDefinedCompanyName?: string;
  clientContactName?: string
  clientName?: string
  priority: string
  assignedAgentId?: number | null
  assignedAgentName?: string
  assignedByUserId?: number
  assignedByUserName?: string
  status: ConversationStatus
  initialized: boolean
  createdAt: string
  assignedAt?: string
  firstResponseAt?: string
  agentRequestAt?: string
  clientFirstMessage: string;
  clientLastMessageAt?: string;
  agentFirstMessageAt: string;
  agentLastMessageAt: string;
  requestedAgentAt: string
  updatedAt?: string
  closedAt?: string
  incompletedAt?: string;
  clientLastMessage: string;
  isArchived: boolean
  totalMessages: number
  lastActivity: string
  duration: string
  timeToFirstResponse?: string
  isClosed: boolean
  unreadCount?: number
  messages?: MessageDto[]
  tags: string[];
  assignmentStatus?: 'Assigned' | 'Unassigned' | 'Rejected';
  agentLastReadMessageId?: number
  assignerLastReadMessageId?: number
  unreadForAgent?:      number
  unreadForAssigner?:   number
  tone?: string;
  rating: number | null;
  ratingSubmittedAt: string | null;
  ratingReceivedAt: string | null;
  SystemDefinedCompanyName?: string;
  isHalted?: boolean; 
  isItemsInCart?: boolean


  // Whatsapp = 1, messenger = 2, instagrams = 3
   metaChannelId: number;
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
  senderClientName?: string;
  incognitoMode?: boolean;
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
  waTemplateId?: number | null;
  templateName?: string | null;
  templateLanguage?: string | null;
  templateBodyVars?: string[] | null;

  //relacion recursiva para respuestas
  repliedMessageId?: number;
  repliedMessage?: MessageDto | null;


  messageSourceId?: number | null
  messageSourceName?: string | null
  messageSourceColor?: string | null

  //contacto
  contact: WhatsAppContact[];
}


export interface SendInteractiveMessajeRequestDto{
  conversationId: number;
  contactId: number;
  body: string;
}

export interface WhatsAppContact {
  name?: WhatsAppContactName;
  phones?: WhatsAppContactPhone[];
  birthday?: string;
}
export interface WhatsAppContactName {
  formatted_name: string;
  first_name?: string;
}
export interface WhatsAppContactPhone {
  phone?: string;
  type?: string;
}

export interface SendMediaFromUrlDto {
  mediaUrl: string
  caption?: string | null
  externalId?: string | null
  repliedParentMessageId?: number | null
}

export interface SentMessage {
  conversationId: number;
  senderId: number;
  content: string;
  messageType: MessageType;
  caption?: string;
  file?: File;
  externalId?: string | null;
  repliedParentMessageId: number | null
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
  imageUrl: string
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
  nenuId: number;
  menu: MenuDto;
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


export interface ConversationClientFilter {
  clientCode: string
  from?: string     // Fecha inicial (ISO string)
  to?: string       // Fecha final (ISO string)
  searchConversation?: string // Texto de búsqueda
}

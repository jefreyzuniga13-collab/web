import type { ReactNode } from "react"

export type MessageType =
  | "Text"
  | "Image"
  | "Video"
  | "Audio"
  | "Sticker"
  | "Document"
  | "Interactive"
  | "Bot"
  | "Contact"

export type MessageStatus = "Sent" | "Delivered" | "Read" | "Failed"

export type LocalMessageStatus = "sending" | "sent" | "error"

export type ConversationStatus =
  | "New"
  | "Bot"
  | "Waiting"
  | "Human"
  | "Closed"
  | "Incomplete"
  | "Paused"

export type NotificationType =
  | "NewContact"
  | "HumanSupport"
  | "ConversationAssigned"
  | "MessageReceived"

export interface ConversationDto {
  contactNumber: string
  conversationId: number
  companyId?: number
  clientContactId: number
  systemDefinedCompanyName?: string
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
  clientFirstMessage: string
  clientLastMessageAt?: string
  agentFirstMessageAt: string
  agentLastMessageAt: string
  requestedAgentAt: string
  updatedAt?: string
  closedAt?: string
  incompletedAt?: string
  clientLastMessage: string
  isArchived: boolean
  totalMessages: number
  lastActivity: string
  duration: string
  timeToFirstResponse?: string
  isClosed: boolean
  unreadCount?: number
  messages?: MessageDto[]
  tags: string[]
  assignmentStatus?: "Assigned" | "Unassigned" | "Rejected"
  agentLastReadMessageId?: number
  assignerLastReadMessageId?: number
  unreadForAgent?: number
  unreadForAssigner?: number
  tone?: string
  rating: number | null
  ratingSubmittedAt: string | null
  ratingReceivedAt: string | null
  SystemDefinedCompanyName?: string
  isHalted?: boolean
  isItemsInCart?: boolean

  // Whatsapp = 1, Messenger = 2, Instagram = 3
  metaChannelId: number

  isBlocked: boolean

  contactClassification?: string
  contactClassificationId?: number
  contactClassificationName?: string
  contactClassificationIcono?: string
  contactClassificationBgColor?: string
}

export interface UpdateConversationRequest {
  conversationId: number
  priority?: string
  initialized?: boolean
  status?: ConversationStatus
  assignedAgentId?: number
  tags?: string[]
  isArchived?: boolean
}

export interface MetaAdReferralDto {
  sourceId?: string | null
  sourceType?: string | null
  sourceUrl?: string | null
  headline?: string | null
  body?: string | null
  mediaType?: string | null
  imageUrl?: string | null
  videoUrl?: string | null
  thumbnailUrl?: string | null
  clickId?: string | null
}

export interface MessageDto {
  messageId: number
  conversationId: number

  senderUserId?: number | null
  senderUserName?: string | null
  senderContactId?: number | null
  senderContactName?: string | null
  senderClientName?: string | null
  incognitoMode?: boolean | null

  isIncoming: boolean
  isAutoSend: boolean

  content?: string | null
  externalId: string
  messageType: MessageType

  interactiveId?: string | null
  interactiveTitle?: string | null

  status: MessageStatus
  sentAt: string
  deliveredAt?: string | null
  readAt?: string | null

  attachments: AttachmentDto[]

  waTemplateId?: number | null
  templateName?: string | null
  templateLanguage?: string | null
  templateBodyVars?: string[] | null

  // Relación recursiva para respuestas.
  repliedMessageId?: number | null
  repliedMessage?: MessageDto | null

  messageSourceId?: number | null
  messageSourceName?: string | null
  messageSourceColor?: string | null

  // Contactos compartidos.
  contact: WhatsAppContact[]

  // Anuncio desde el cual inició el contacto.
  referral?: MetaAdReferralDto | null

  // Campos locales para mensajes optimistas.
  clientTempId?: string
  localStatus?: LocalMessageStatus
  localError?: string
  isLocal?: boolean
}

export interface SendInteractiveMessajeRequestDto {
  conversationId: number
  contactId: number
  body: string
}

export interface WhatsAppContact {
  name?: WhatsAppContactName
  phones?: WhatsAppContactPhone[]
  birthday?: string
}

export interface WhatsAppContactName {
  formatted_name: string
  first_name?: string
}

export interface WhatsAppContactPhone {
  phone?: string
  wa_id?: string
  type?: string
}

export interface SendMediaFromUrlDto {
  mediaUrl: string
  caption?: string | null
  externalId?: string | null
  repliedParentMessageId?: number | null
}

export interface SentMessage {
  conversationId: number
  senderId: number
  content: string
  messageType: MessageType
  caption?: string
  file?: File
  externalId?: string | null
  repliedParentMessageId: number | null
}

export interface SentMedia {
  conversationId: number
  file: File
  caption?: string
}

export interface AttachmentDto {
  attachmentId: number
  messageId: number
  mediaId?: string | null
  fileName?: string | null
  mimeType?: string | null
  mediaUrl?: string | null
  createdAt?: string | null
}

export interface AgentDto {
  imageUrl: string
  userId: number
  fullName: string
  email: string
  isActive?: boolean
  isOnline?: boolean
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
  icon: ReactNode
  text: string
  onClick?: () => void
  selectedOption: string
}

export interface MenuDto {
  menuId: number
  name: string
  description: string
  nenuId: number
  menu: MenuDto
  url: string
  index: string
  icon: string
}

export interface MessageWithAttachmentsDto {
  messageId: number
  senderUserId?: number | null
  senderUserName?: string | null
  senderContactId?: number | null
  senderContactName?: string | null
  content?: string | null
  sentAt: string
  messageType: string
  attachments: AttachmentDto[]
  referral?: MetaAdReferralDto | null
}

export interface ConversationHistoryDto {
  conversationId: number
  createdAt: string
  status: string
  messages: MessageWithAttachmentsDto[]
}

export interface ConversationClientFilter {
  clientCode: string
  from?: string
  to?: string
  searchConversation?: string
}
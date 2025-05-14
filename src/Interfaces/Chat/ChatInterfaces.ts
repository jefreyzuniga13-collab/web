export interface ConversationDto {
  conversationId: number;
  companyId?: number;
  clientUserId?: number;
  assignedAgent?: number;
  status: string;
  createdAt: string;
  assignedAt?: string;
  contactName: string;
  totalMensajes: number;
  ultimaActividad: string;
  duracion: number;
}

export interface AttachmentDto {
  attachmentId: number;
  messageId: number;
  mediaId: string;
  fileName?: string;
  mimeType?: string;
  mediaUrl?: string;
  createdAt: string;
}

export interface MessageDto {
  messageId: number
  conversationId: number
  senderId: number
  senderName: string        // nombre del remitente (Bot o usuario)
  content?: string
  caption?: string         // pie de foto para media
  externalId?: string
  messageType: string
  createdAt: string
  attachments: AttachmentDto[]
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

export interface MenuItemProps {
  icon: React.ReactNode;
  text: string;
  onClick?: () => void;
  selectedOption:string;
}
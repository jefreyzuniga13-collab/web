export interface ConversationDto {
  conversationId: number;
  companyId?: number;
  clientUserId?: number;
  assignedAgent?: number;
  assignedAgentName?: string;
  status: string;
  createdAt: string;
  assignedAt?: string;
  assignedAtName?: string;
  contactName?: string;
  contactNumber: string;
  profilePhoto: string;
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
  senderName: string 
  content?: string
  caption?: string         
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
export interface MenuDto{
  menuId: number;
  name: string;
  description: string;
  url: string;
  index: string;
  icon: string;
}

export interface SentMessage{
  conversationId: number;
  senderId: number;
  content:string;
  messageType: string;
  caption:string;
}
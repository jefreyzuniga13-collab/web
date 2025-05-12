export interface AttachmentDto {
  attachmentId: number;
  messageId: number;
  mediaId: string;
  fileName?: string;
  mimeType?: string;
  mediaUrl?: string;
}

export type MessageType = 'Text' | 'Media' | 'Bot';

export interface MessageDto {
  messageId: number;
  conversationId: number;
  senderId: string;
  senderName: string;        // nombre del remitente (bot, cliente o agente)
  content?: string;
  caption?: string;
  messageType: MessageType;
  externalId?: string;
  createdAt: string;
  updatedAt?: string;
  attachments: AttachmentDto[];
}

export interface ConversationDto {
  updatedAt: string;
  conversationId: number;
  companyId?: number;
  clientUserId?: number;
  contactName: string;
  contactEmail?: string;
  assignedAgent?: string;
  status: 'Bot' | 'AwaitingHumanConfirmation' | 'WaitingHuman' | 'Human' | 'Closed';
  createdAt: string;
  assignedAt?: string;
  totalMensajes: number;
  ultimaActividad: string;
  duracion: string;        // p. ej. "00:12:34"
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
import type * as signalR from "@microsoft/signalr";
import type {
    AttachmentDto,
    ConversationDto,
    MessageDto,
    NotificationDto,
} from "@/Interfaces/Chat/ChatInterfaces";
import type { ContactLog } from "@/Interfaces/Auth/UserInterfaces";

// Definir tipos compartidos de SignalR.
export type SignalRConnections = {
  chatConnection: signalR.HubConnection | null;
  notificationsConnection: signalR.HubConnection | null;
  presenceConnection: signalR.HubConnection | null;
  userConnection: signalR.HubConnection | null;
};

export type ReceiveMessagePayload = {
  message: MessageDto;
  attachments: AttachmentDto[];
};

export type SupportRequestedPayload = {
  conversationId: number;
  requestedAt: string;
  clientContactName: string;
  clientName: string;
};

export type AssignmentResponsePayload = {
  conversationId: number;
  assignedAgentName: string;
  accepted: boolean;
  comment?: string;
  clientContactName: string;
  clientName: string;
};

export type AssignmentForcedPayload = {
  conversationId: number;
  comment: string;
  clientContactName: string;
  clientName: string;
};

export type AssignmentForcedAdminPayload = {
  conversationId: number;
  targetAgentId: number;
  comment: string;
  clientContactName: string;
  clientName: string;
};

export type NewHumanRequestPayload = {
  conversationId: number;
  fromPhone: string;
};

export type CartUpdatedPayload = {
  contactId: number;
  orderId: number;
};

export type CartClearedPayload = {
  contactId: number;
  orderId: number;
  conversationId: number;
};

export type NewContactValidationPayload = {
  contactLog: ContactLog;
};

export type ConversationHandler = (dto: ConversationDto) => void;
export type NotificationHandler = (dto: NotificationDto) => void;
export type MessageHandler = (dto: MessageDto) => void;
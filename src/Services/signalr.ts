import * as signalR from '@microsoft/signalr';
import type { MessageDto, AttachmentDto, ConversationDto } from '@/Interfaces/Chat/ChatInterfaces';
import { toast } from 'react-toastify';

const API_URL =
  import.meta.env.VITE_API_URL?.replace(/\/+$/, '') ??
  'http://localhost:7108/api/v1';
const HUB_BASE = API_URL.replace(/\/api\/v1$/, '');

let chatConnection: signalR.HubConnection | null = null;
let notificationsConnection: signalR.HubConnection | null = null;

export async function createHubConnection(token: string) {
  chatConnection = new signalR.HubConnectionBuilder()
    .withUrl(`${HUB_BASE}/hubs/chat`, {
      accessTokenFactory: () => token
    })
    .withAutomaticReconnect()
    .build();

  chatConnection.onreconnecting(error => {
    console.warn('Reconnecting to Chat Hub...', error);
  });

  chatConnection.onreconnected(() => {
    console.info('Reconnected to Chat Hub');
  });

  chatConnection.onclose(error => {
    console.error('Chat Hub connection closed', error);
    toast.warn("La conexión al chat ha finalizado. Por favor inicia sesión nuevamente.");
  });

  notificationsConnection = new signalR.HubConnectionBuilder()
    .withUrl(`${HUB_BASE}/hubs/notifications`, {
      accessTokenFactory: () => token
    })
    .withAutomaticReconnect()
    .build();

  notificationsConnection.onreconnecting(error => {
    console.warn('Reconnecting to Notifications Hub...', error);
  });

  notificationsConnection.onreconnected(() => {
    console.info('Reconnected to Notifications Hub');
  });

  notificationsConnection.onclose(error => {
    console.error('Notifications Hub connection closed', error);
  });

  try {
    await chatConnection.start();
    // await notificationsConnection.start();
    return { chatConnection, notificationsConnection };
  } catch (error) {
    console.error("Error starting SignalR connections:", error);
    throw error;
  }
}

export function joinConversation(conversationId: number) {
  if (chatConnection?.state === signalR.HubConnectionState.Connected) {
    chatConnection.invoke('JoinConversation', conversationId.toString());
  }
}

export function leaveConversation(conversationId: number) {
  if (chatConnection?.state === signalR.HubConnectionState.Connected) {
    chatConnection.invoke('LeaveConversation', conversationId.toString());
  }
}

export function onNewMessage(
  handler: (payload: { message: MessageDto; attachments: AttachmentDto[] }) => void
) {
  chatConnection?.on(
    'ReceiveMessage',
    (message: MessageDto, attachments: AttachmentDto[]) => {
      handler({ message, attachments });
    }
  );
}

export function offNewMessage() {
  chatConnection?.off('ReceiveMessage');
}

export function onConversationCreated(
  handler: (convo: ConversationDto) => void
) {
  chatConnection?.on('ConversationCreated', handler);
}

export function onConversationUpdated(
  handler: (c: ConversationDto) => void
) {
  chatConnection?.on('ConversationUpdated', handler);
}

export function offConversationUpdated(
  handler: (c: ConversationDto) => void
) {
  chatConnection?.off('ConversationUpdated', handler);
}

export function offConversationCreated(
  handler: (convo: ConversationDto) => void
) {
  chatConnection?.off('ConversationCreated', handler);
}

export function onNewHumanRequest(
  handler: (payload: { conversationId: number; fromPhone: string }) => void
) {
  notificationsConnection?.on('NewHumanRequest', handler);
}

export function offNewHumanRequest(
  handler: (payload: { conversationId: number; fromPhone: string }) => void
) {
  notificationsConnection?.off('NewHumanRequest', handler);
}

export function onMessageStatusChanged(
  handler: (msg: MessageDto) => void
) {
  notificationsConnection?.on('MessageStatusChanged', handler);
}

export function offMessageStatusChanged(
  handler: (msg: MessageDto) => void
) {
  notificationsConnection?.off('MessageStatusChanged', handler);
}

export function onNewNotification(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (payload: { type: string; data: any }) => void
) {
  notificationsConnection?.on('ReceiveNotification', handler);
}

export function offNewNotification(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (payload: { type: string; data: any }) => void
) {
  notificationsConnection?.off('ReceiveNotification', handler);
}
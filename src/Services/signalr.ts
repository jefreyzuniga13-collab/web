import * as signalR from '@microsoft/signalr'
import type {
  MessageDto,
  AttachmentDto,
  ConversationDto,
  NotificationDto
} from '@/Interfaces/Chat/ChatInterfaces'
import { toast } from 'react-toastify'

const API_URL =
  import.meta.env.VITE_API_URL?.replace(/\/+$/, '') ??
  'https://localhost:7108/api/v1'
const HUB_BASE = API_URL.replace(/\/api\/v1$/, '')

// Conexiones internas
let chatConnection: signalR.HubConnection | null = null

// Exportamos las conexiones que necesitaremos fuera
export let notificationsConnection: signalR.HubConnection | null = null
export let presenceConnection: signalR.HubConnection | null = null

export async function createHubConnection(token: string) {
  // Chat hub
  chatConnection = new signalR.HubConnectionBuilder()
    .withUrl(`${HUB_BASE}/hubs/chat`, { accessTokenFactory: () => token })
    .withAutomaticReconnect()
    .build()

  chatConnection.onreconnecting(err =>
    console.warn('Reconnecting to Chat Hub...', err)
  )
  chatConnection.onreconnected(() =>
    console.info('Reconnected to Chat Hub')
  )
  chatConnection.onclose(err => {
    console.error('Chat Hub connection closed', err)
    toast.warn(
      'La conexión al chat ha finalizado. Por favor inicia sesión nuevamente.'
    )
  })

  // Notifications hub
  notificationsConnection = new signalR.HubConnectionBuilder()
    .withUrl(`${HUB_BASE}/hubs/notifications`, { accessTokenFactory: () => token })
    .withAutomaticReconnect()
    .build()

  notificationsConnection.onreconnecting(err =>
    console.warn('Reconnecting to Notifications Hub...', err)
  )
  notificationsConnection.onreconnected(() =>
    console.info('Reconnected to Notifications Hub')
  )
  notificationsConnection.onclose(err =>
    console.error('Notifications Hub connection closed', err)
  )

  // Presence hub
presenceConnection = new signalR.HubConnectionBuilder()
    .withUrl(`${HUB_BASE}/hubs/presence`, {
      accessTokenFactory: () => token
    })
    .withAutomaticReconnect()
    .build();

  // Register presence events broadcast from server
  presenceConnection.on('UserIsOnline', (userId: number) => {
    console.log('Usuario en línea:', userId)
    // Aquí despacha a tu store o actualiza contexto
  })
  presenceConnection.on('UserIsOffline', (userId: number) => {
    console.log('Usuario desconectado:', userId)
    // Aquí despacha a tu store o actualiza contexto
  })

  presenceConnection.onreconnecting(err =>
    console.warn('Reconnecting to Presence Hub...', err)
  )
  presenceConnection.onreconnected(() =>
    console.info('Reconnected to Presence Hub')
  )
  presenceConnection.onclose(err =>
    console.warn('Presence Hub connection closed', err)
  )

  // Arrancamos todas en paralelo
  try {
    await Promise.all([
      chatConnection.start(),
      notificationsConnection.start(),
      presenceConnection.start()
    ])
    return { chatConnection, notificationsConnection, presenceConnection }
  } catch (error) {
    console.error('Error starting SignalR connections:', error)
    throw error
  }
}

// --- Métodos públicos para chat ---
export function joinConversation(conversationId: number) {
  if (chatConnection?.state === signalR.HubConnectionState.Connected) {
    chatConnection.invoke('JoinConversation', conversationId.toString())
  }
}

export function leaveConversation(conversationId: number) {
  if (chatConnection?.state === signalR.HubConnectionState.Connected) {
    chatConnection.invoke('LeaveConversation', conversationId.toString())
  }
}

export function onNewMessage(
  handler: (payload: { message: MessageDto; attachments: AttachmentDto[] }) => void
) {
  chatConnection?.on('ReceiveMessage', (message, attachments) => {
    handler({ message, attachments })
  })
}

export function offNewMessage() {
  chatConnection?.off('ReceiveMessage')
}

export function onConversationCreated(handler: (convo: ConversationDto) => void) {
  chatConnection?.on('ConversationCreated', handler)
}

export function offConversationCreated(handler: (convo: ConversationDto) => void) {
  chatConnection?.off('ConversationCreated', handler)
}

export function onConversationUpdated(handler: (c: ConversationDto) => void) {
  chatConnection?.on('ConversationUpdated', handler)
}

export function offConversationUpdated(handler: (c: ConversationDto) => void) {
  chatConnection?.off('ConversationUpdated', handler)
}

export function onConversationassigned(handler: (c: ConversationDto) => void) {
  chatConnection?.on('Conversationassigned', handler)
}

export function offConversationassigned(handler: (c: ConversationDto) => void) {
  chatConnection?.off('Conversationassigned', handler)
}

// --- Métodos públicos para notifications ---
export function onNewHumanRequest(
  handler: (payload: { conversationId: number; fromPhone: string }) => void
) {
  notificationsConnection?.on('NewHumanRequest', handler)
}

export function offNewHumanRequest(
  handler: (payload: { conversationId: number; fromPhone: string }) => void
) {
  notificationsConnection?.off('NewHumanRequest', handler)
}

export function onMessageStatusChanged(handler: (msg: MessageDto) => void) {
  notificationsConnection?.on('MessageStatusChanged', handler)
}

export function offMessageStatusChanged(handler: (msg: MessageDto) => void) {
  notificationsConnection?.off('MessageStatusChanged', handler)
}

export function onNewNotification(handler: (dto: NotificationDto) => void) {
  notificationsConnection?.on('Notification', handler)
}

export function offNewNotification(handler: (dto: NotificationDto) => void) {
  notificationsConnection?.off('Notification', handler)
}
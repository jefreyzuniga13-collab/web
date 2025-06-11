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

let chatConnection: signalR.HubConnection | null = null
export let notificationsConnection: signalR.HubConnection | null = null
export let presenceConnection: signalR.HubConnection | null = null

export async function createHubConnection(token: string) {
  chatConnection = new signalR.HubConnectionBuilder()
    .withUrl(`${HUB_BASE}/hubs/chat`, { accessTokenFactory: () => token })
    .withAutomaticReconnect()
    .build()

  chatConnection.onreconnecting(err => console.warn('Reconnecting to Chat Hub...', err))
  chatConnection.onreconnected(() => console.info('Reconnected to Chat Hub'))
  chatConnection.onclose(err => {
    console.error('Chat Hub connection closed', err)
    toast.warn('La conexión al chat ha finalizado. Por favor inicia sesión nuevamente.')
  })

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

  presenceConnection = new signalR.HubConnectionBuilder()
    .withUrl(`${HUB_BASE}/hubs/presence`, { accessTokenFactory: () => token })
    .withAutomaticReconnect()
    .build()

  presenceConnection.on('UserIsOnline', (userId: number) => {
    console.log('Usuario en línea:', userId)
  })
  presenceConnection.on('UserIsOffline', (userId: number) => {
    console.log('Usuario desconectado:', userId)
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

  // notifications handlers
  notificationsConnection.on(
    'SupportRequested',
    (payload: { conversationId: number; clientName: string; requestedAt: string }) => {
      window.dispatchEvent(new CustomEvent('SupportRequested', { detail: payload }))
    }
  )

  notificationsConnection.on(
    'ConversationAssigned',
    (dto: ConversationDto) => {
      window.dispatchEvent(new CustomEvent('ConversationAssigned', { detail: dto }))
    }
  )

  notificationsConnection.on(
    'AssignmentResponse',
    (payload: { conversationId: number; accepted: boolean; comment?: string }) => {
      window.dispatchEvent(new CustomEvent('AssignmentResponse', { detail: payload }))
    }
  )

  notificationsConnection.on(
    'AssignmentForced',
    (payload: { conversationId: number; comment: string }) => {
      window.dispatchEvent(new CustomEvent('AssignmentForced', { detail: payload }))
    }
  )

  notificationsConnection.on(
    'AssignmentForcedAdmin',
    (payload: { conversationId: number; targetAgentId: number; comment: string }) => {
      window.dispatchEvent(new CustomEvent('AssignmentForcedAdmin', { detail: payload }))
    }
  )

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

// --- chat methods ---
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

// --- notifications methods ---
export function onSupportRequested(
  handler: (payload: { conversationId: number; clientName: string; requestedAt: string }) => void
) {
  notificationsConnection?.on('SupportRequested', handler)
}
export function offSupportRequested(
  handler: (payload: { conversationId: number; clientName: string; requestedAt: string }) => void
) {
  notificationsConnection?.off('SupportRequested', handler)
}

export function onConversationAssigned(
  handler: (dto: ConversationDto) => void
) {
  notificationsConnection?.on('ConversationAssigned', handler)
}
export function offConversationAssigned(
  handler: (dto: ConversationDto) => void
) {
  notificationsConnection?.off('ConversationAssigned', handler)
}

export function onAssignmentResponse(
  handler: (payload: { conversationId: number; accepted: boolean; comment?: string }) => void
) {
  notificationsConnection?.on('AssignmentResponse', handler)
}
export function offAssignmentResponse(
  handler: (payload: { conversationId: number; accepted: boolean; comment?: string }) => void
) {
  notificationsConnection?.off('AssignmentResponse', handler)
}

export function onAssignmentForced(
  handler: (payload: { conversationId: number; comment: string }) => void
) {
  notificationsConnection?.on('AssignmentForced', handler)
}
export function offAssignmentForced(
  handler: (payload: { conversationId: number; comment: string }) => void
) {
  notificationsConnection?.off('AssignmentForced', handler)
}

export function onAssignmentForcedAdmin(
  handler: (payload: { conversationId: number; targetAgentId: number; comment: string }) => void
) {
  notificationsConnection?.on('AssignmentForcedAdmin', handler)
}
export function offAssignmentForcedAdmin(
  handler: (payload: { conversationId: number; targetAgentId: number; comment: string }) => void
) {
  notificationsConnection?.off('AssignmentForcedAdmin', handler)
}
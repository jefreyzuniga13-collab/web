import * as signalR from '@microsoft/signalr'
import type { MessageDto, AttachmentDto, ConversationDto } from '@/Interfaces/Chat/ChatInterfaces'

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, '') ?? 'http://localhost:7108/api/v1'
const HUB_BASE = API_URL.replace(/\/api\/v1$/, '')

let connection: signalR.HubConnection | null = null

export async function createHubConnection(token: string) {
  connection = new signalR.HubConnectionBuilder()
    .withUrl(`${HUB_BASE}/chatHub`, {
      accessTokenFactory: () => token
    })
    .withAutomaticReconnect()
    .build()

  connection.onreconnecting(error => {
    console.warn('Reconnecting to SignalR...', error)
  })

  connection.onreconnected(() => {
    console.info('Reconnected to SignalR')
  })

  connection.onclose(error => {
    console.error('SignalR connection closed', error)
  })

  await connection.start()
  return connection
}

export function joinConversation(conversationId: number) {
  // Invoca al método del Hub que añade esta conexión al grupo de la conversación
  connection?.invoke('JoinConversation', conversationId.toString())
}

export function leaveConversation(conversationId: number) {
  // Para limpiar grupos al salir de la ventana de chat
  connection?.invoke('LeaveConversation', conversationId.toString())
}

/**
 * Cuando la API notifica un nuevo mensaje dentro de una conversación
 * payload: {
 *   Message: { messageId, conversationId, senderId, content, messageType, createdAt, ... },
 *   Attachments: AttachmentDto[]
 * }
 */
export function onReceiveMessage(
  handler: (payload: { Message: MessageDto; Attachments: AttachmentDto[] }) => void
) {
  connection?.on('ReceiveMessage', handler)
}

/**
 * Cuando un cliente solicita ser transferido a humano,
 * los agentes en el grupo "Admins" reciben este evento
 * payload: { conversationId: number, fromPhone: string }
 */
export function onNewHumanRequest(
  handler: (payload: { conversationId: number; fromPhone: string }) => void
) {
  connection?.on('NewHumanRequest', handler)
}

export function offReceiveMessage(
  handler: (payload: { Message: MessageDto; Attachments: AttachmentDto[] }) => void
) {
  connection?.off('ReceiveMessage', handler)
}

export function onConversationCreated(
  handler: (convo: ConversationDto) => void
) {
  connection?.on('ConversationCreated', handler)
}

export function offConversationCreated(
  handler: (convo: ConversationDto) => void
) {
  connection?.off('ConversationCreated', handler)
}
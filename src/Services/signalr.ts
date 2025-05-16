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
  connection?.invoke('JoinConversation', conversationId.toString())
}

export function leaveConversation(conversationId: number) {
  connection?.invoke('LeaveConversation', conversationId.toString())
}

export function onNewMessage(
  handler: (payload: { message: MessageDto; attachments: AttachmentDto[] }) => void
) {
  connection?.on('ReceiveMessage', handler)
}

export function offNewMessage(
  handler: (payload: { message: MessageDto; attachments: AttachmentDto[] }) => void
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

export function onNewHumanRequest(
  handler: (payload: { conversationId: number; fromPhone: string }) => void
) {
  connection?.on('NewHumanRequest', handler)
}

export function offNewHumanRequest(
  handler: (payload: { conversationId: number; fromPhone: string }) => void
) {
  connection?.off('NewHumanRequest', handler)
}

export function onMessageStatusChanged(
  handler: (msg: MessageDto) => void
) {
  connection?.on('MessageStatusChanged', handler)
}

export function offMessageStatusChanged(
  handler: (msg: MessageDto) => void
) {
  connection?.off('MessageStatusChanged', handler)
}
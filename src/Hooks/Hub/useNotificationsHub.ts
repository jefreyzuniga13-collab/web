import { useState, useEffect } from 'react'
import type { ConversationDto } from '@/Interfaces/Chat/ChatInterfaces'
import { notificationsConnection } from '@/Services/signalr'
import type { ContactLog } from '@/Interfaces/User/UserInterfaces';

type SupportRequestedPayload = { conversationId: number; clientName: string; requestedAt: string }
type AssignmentResponsePayload = { conversationId: number; AssignedAgentName?: string, accepted: boolean; comment?: string; justification?: string }
type AssignmentForcedPayload = { conversationId: number; assignmentComment: string }
type AssignmentForcedAdminPayload = { conversationId: number; targetAgentId: number; comment: string }

export type NotificationEvent =
  | { type: 'SupportRequested'; payload: SupportRequestedPayload }
  | { type: 'ConversationAssigned'; payload: ConversationDto }
  | { type: 'AssignmentResponse'; payload: AssignmentResponsePayload }
  | { type: 'AssignmentForced'; payload: AssignmentForcedPayload }
  | { type: 'AssignmentForcedAdmin'; payload: AssignmentForcedAdminPayload }
  | {type: "newContactValidation", payload: ContactLog}

export function useNotificationsHub(): NotificationEvent | null {
  const [lastEvent, setLastEvent] = useState<NotificationEvent | null>(null)

  useEffect(() => {
    const conn = notificationsConnection
    if (!conn) return

    const supportRequestedHandler = (payload: SupportRequestedPayload) =>
      setLastEvent({ type: 'SupportRequested', payload })

    const conversationAssignedHandler = (payload: ConversationDto) =>
      setLastEvent({ type: 'ConversationAssigned', payload })

    const assignmentResponseHandler = (payload: AssignmentResponsePayload) =>
      setLastEvent({ type: 'AssignmentResponse', payload })

    const assignmentForcedHandler = (payload: AssignmentForcedPayload) =>
      setLastEvent({ type: 'AssignmentForced', payload })

    const assignmentForcedAdminHandler = (payload: AssignmentForcedAdminPayload) =>
      setLastEvent({ type: 'AssignmentForcedAdmin', payload })

    const newContactValidationHanlder = (payload: ContactLog)=>
      setLastEvent({type: 'newContactValidation', payload})

    conn.on('SupportRequested', supportRequestedHandler)
    conn.on('ConversationAssigned', conversationAssignedHandler)
    conn.on('AssignmentResponse', assignmentResponseHandler)
    conn.on('AssignmentForced', assignmentForcedHandler)
    conn.on('AssignmentForcedAdmin', assignmentForcedAdminHandler)
    conn.on('newContactValidation', newContactValidationHanlder)

    return () => {
      conn.off('SupportRequested', supportRequestedHandler)
      conn.off('ConversationAssigned', conversationAssignedHandler)
      conn.off('AssignmentResponse', assignmentResponseHandler)
      conn.off('AssignmentForced', assignmentForcedHandler)
      conn.off('AssignmentForcedAdmin', assignmentForcedAdminHandler)
      conn.off("newContactValidation", newContactValidationHanlder)
    }
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationsConnection])

  return lastEvent
}
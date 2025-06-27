import { useState, useEffect } from 'react'
import type { ConversationDto } from '@/Interfaces/Chat/ChatInterfaces'
import { notificationsConnection } from '@/Services/signalr'
import type { ContactLog } from '@/Interfaces/User/UserInterfaces';
import { notificationSound } from '@/Utils/sound';

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
  const [lastEvent, setLastEvent] = useState<NotificationEvent | null>(null);

  useEffect(() => {
    const conn = notificationsConnection;
    if (!conn) return;

    const play = () => {
      if (!notificationSound.playing()) {
        notificationSound.play();
      }
    };

    const supportRequested = (payload: SupportRequestedPayload) => {
      setLastEvent({ type: 'SupportRequested', payload });
      play();
    };
    const conversationAssigned = (payload: ConversationDto) => {
      setLastEvent({ type: 'ConversationAssigned', payload });
      play();
    };
    const assignmentResponse = (payload: AssignmentResponsePayload) => {
      setLastEvent({ type: 'AssignmentResponse', payload });
      play();
    };
    const assignmentForced = (payload: AssignmentForcedPayload) => {
      setLastEvent({ type: 'AssignmentForced', payload });
      play();
    };
    const assignmentForcedAdmin = (payload: AssignmentForcedAdminPayload) => {
      setLastEvent({ type: 'AssignmentForcedAdmin', payload });
      play();
    };
    const newContactValidation = (payload: ContactLog) => {
      setLastEvent({ type: 'newContactValidation', payload });
      play();
    };

    conn.on('SupportRequested', supportRequested);
    conn.on('ConversationAssigned', conversationAssigned);
    conn.on('AssignmentResponse', assignmentResponse);
    conn.on('AssignmentForced', assignmentForced);
    conn.on('AssignmentForcedAdmin', assignmentForcedAdmin);
    conn.on('newContactValidation', newContactValidation);

    return () => {
      conn.off('SupportRequested', supportRequested);
      conn.off('ConversationAssigned', conversationAssigned);
      conn.off('AssignmentResponse', assignmentResponse);
      conn.off('AssignmentForced', assignmentForced);
      conn.off('AssignmentForcedAdmin', assignmentForcedAdmin);
      conn.off('newContactValidation', newContactValidation);
    };
  }, [notificationsConnection]);

  return lastEvent;
}
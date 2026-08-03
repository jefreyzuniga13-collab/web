import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type { ConversationDto } from "@/Interfaces/Chat/ChatInterfaces";
import type { ContactLog } from "@/Interfaces/Auth/UserInterfaces";

import {
  onSupportRequested,
  onConversationAssigned,
  onAssignmentResponse,
  onAssignmentForced,
  onAssignmentForcedAdmin,
  onNewContactValidation,
} from "@/Services/signalr";

import { useSignalR } from "@/Context/SignalRContext";

type SupportRequestedPayload = {
  conversationId: number;
  requestedAt: string;
  clientContactName: string;
  systemDefinedCompanyName: string;
};

type AssignmentResponsePayload = {
  conversationId: number;
  AssignedAgentName?: string;
  accepted: boolean;
  comment?: string;
  justification?: string;
  clientContactName?: string;
  systemDefinedCompanyName?: string;
};

type AssignmentForcedPayload = {
  conversationId: number;
  assignmentComment: string;
  clientContactName: string;
  systemDefinedCompanyName: string;
};

type AssignmentForcedAdminPayload = {
  conversationId: number;
  targetAgentId: number;
  comment: string;
  clientContactName: string;
  systemDefinedCompanyName: string;
};

export type NotificationEvent =
  | {
      type: "SupportRequested";
      payload: SupportRequestedPayload;
    }
  | {
      type: "ConversationAssigned";
      payload: ConversationDto;
    }
  | {
      type: "AssignmentResponse";
      payload: AssignmentResponsePayload;
    }
  | {
      type: "AssignmentForced";
      payload: AssignmentForcedPayload;
    }
  | {
      type: "AssignmentForcedAdmin";
      payload: AssignmentForcedAdminPayload;
    }
  | {
      type: "newContactValidation";
      payload: ContactLog;
    };

const DUPLICATE_WINDOW_MS = 10_000;

export function useNotificationsHub(): NotificationEvent | null {
  const { ready } = useSignalR();

  const [lastEvent, setLastEvent] =
    useState<NotificationEvent | null>(null);

  /**
   * Guarda temporalmente los eventos procesados para impedir
   * que una entrega duplicada de SignalR genere dos modales.
   */
  const processedEventsRef = useRef<Map<string, number>>(
    new Map()
  );

  const publishEvent = useCallback(
    (
      event: NotificationEvent,
      entityId: number
    ): void => {
      const eventKey = `${event.type}:${entityId}`;
      const now = Date.now();

      const previousTime =
        processedEventsRef.current.get(eventKey);

      if (
        previousTime !== undefined &&
        now - previousTime < DUPLICATE_WINDOW_MS
      ) {
        console.warn(
          "[NotificationsHub] Evento duplicado ignorado:",
          eventKey
        );

        return;
      }

      processedEventsRef.current.set(eventKey, now);

      /**
       * Limpia registros antiguos para evitar que
       * el Map crezca indefinidamente.
       */
      for (const [key, processedAt] of processedEventsRef.current) {
        if (now - processedAt >= DUPLICATE_WINDOW_MS) {
          processedEventsRef.current.delete(key);
        }
      }

      setLastEvent(event);
    },
    []
  );

  useEffect(() => {
    if (!ready) {
      return;
    }

    const unsubscribeSupportRequested =
      onSupportRequested((payload) => {
        publishEvent(
          {
            type: "SupportRequested",
            payload: {
              conversationId: payload.conversationId,
              requestedAt: payload.requestedAt,
              clientContactName:
                payload.clientContactName,
              systemDefinedCompanyName:
                payload.clientName,
            },
          },
          payload.conversationId
        );
      });

    const unsubscribeConversationAssigned =
      onConversationAssigned((conversation) => {
        publishEvent(
          {
            type: "ConversationAssigned",
            payload: conversation,
          },
          Number(conversation.conversationId)
        );
      });

    const unsubscribeAssignmentResponse =
      onAssignmentResponse((payload) => {
        publishEvent(
          {
            type: "AssignmentResponse",
            payload: {
              conversationId:
                payload.conversationId,
              AssignedAgentName:
                payload.assignedAgentName,
              accepted: payload.accepted,
              comment: payload.comment,
              justification: payload.comment,
              clientContactName:
                payload.clientContactName,
              systemDefinedCompanyName:
                payload.clientName,
            },
          },
          payload.conversationId
        );
      });

    const unsubscribeAssignmentForced =
      onAssignmentForced((payload) => {
        publishEvent(
          {
            type: "AssignmentForced",
            payload: {
              conversationId:
                payload.conversationId,
              assignmentComment:
                payload.comment,
              clientContactName:
                payload.clientContactName,
              systemDefinedCompanyName:
                payload.clientName,
            },
          },
          payload.conversationId
        );
      });

    const unsubscribeAssignmentForcedAdmin =
      onAssignmentForcedAdmin((payload) => {
        publishEvent(
          {
            type: "AssignmentForcedAdmin",
            payload: {
              conversationId:
                payload.conversationId,
              targetAgentId:
                payload.targetAgentId,
              comment: payload.comment,
              clientContactName:
                payload.clientContactName,
              systemDefinedCompanyName:
                payload.clientName,
            },
          },
          payload.conversationId
        );
      });

    const unsubscribeNewContactValidation =
      onNewContactValidation(({ contactLog }) => {
        const contactId = Number(
          contactLog.id ?? 0
        );

        publishEvent(
          {
            type: "newContactValidation",
            payload: contactLog,
          },
          contactId
        );
      });

    return () => {
      unsubscribeSupportRequested();
      unsubscribeConversationAssigned();
      unsubscribeAssignmentResponse();
      unsubscribeAssignmentForced();
      unsubscribeAssignmentForcedAdmin();
      unsubscribeNewContactValidation();
    };
  }, [publishEvent, ready]);

  return lastEvent;
}
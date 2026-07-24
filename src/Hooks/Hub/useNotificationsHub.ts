import { useEffect, useState } from "react";

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

export function useNotificationsHub(): NotificationEvent | null {
  const { ready } = useSignalR();

  const [lastEvent, setLastEvent] =
    useState<NotificationEvent | null>(null);

  useEffect(() => {
    if (!ready) {
      return;
    }

    const unsubscribeSupportRequested =
      onSupportRequested((payload) => {
        setLastEvent({
          type: "SupportRequested",
          payload: {
            conversationId: payload.conversationId,
            requestedAt: payload.requestedAt,
            clientContactName: payload.clientContactName,
            systemDefinedCompanyName: payload.clientName,
          },
        });
      });

    const unsubscribeConversationAssigned =
      onConversationAssigned((conversation) => {
        setLastEvent({
          type: "ConversationAssigned",
          payload: conversation,
        });
      });

    const unsubscribeAssignmentResponse =
      onAssignmentResponse((payload) => {
        setLastEvent({
          type: "AssignmentResponse",
          payload: {
            conversationId: payload.conversationId,
            AssignedAgentName: payload.assignedAgentName,
            accepted: payload.accepted,
            comment: payload.comment,
            justification: payload.comment,
            clientContactName: payload.clientContactName,
            systemDefinedCompanyName: payload.clientName,
          },
        });
      });

    const unsubscribeAssignmentForced =
      onAssignmentForced((payload) => {
        setLastEvent({
          type: "AssignmentForced",
          payload: {
            conversationId: payload.conversationId,
            assignmentComment: payload.comment,
            clientContactName: payload.clientContactName,
            systemDefinedCompanyName: payload.clientName,
          },
        });
      });

    const unsubscribeAssignmentForcedAdmin =
      onAssignmentForcedAdmin((payload) => {
        setLastEvent({
          type: "AssignmentForcedAdmin",
          payload: {
            conversationId: payload.conversationId,
            targetAgentId: payload.targetAgentId,
            comment: payload.comment,
            clientContactName: payload.clientContactName,
            systemDefinedCompanyName: payload.clientName,
          },
        });
      });

    const unsubscribeNewContactValidation =
      onNewContactValidation(({ contactLog }) => {
        setLastEvent({
          type: "newContactValidation",
          payload: contactLog,
        });
      });

    return () => {
      unsubscribeSupportRequested();
      unsubscribeConversationAssigned();
      unsubscribeAssignmentResponse();
      unsubscribeAssignmentForced();
      unsubscribeAssignmentForcedAdmin();
      unsubscribeNewContactValidation();
    };
  }, [ready]);

  return lastEvent;
}
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/hooks/useAssignmentEvents.ts
import { useState, useEffect } from 'react';
//import type { ConversationDto } from '@/Interfaces/Chat/ChatInterfaces';

export interface AssignmentResponsePayload {
  conversationId: number;
  accepted: boolean;
  comment?: string;
}

export interface ForcedAdminPayload {
  conversationId: number;
  targetAgentId: number;
  comment: string;
}

export function useAssignmentEvents() {
  const [requestedConv, setRequestedConv] = useState<number | null>(null);
  const [responsePayload, setResponsePayload] = useState<AssignmentResponsePayload | null>(null);
  const [forcedConv, setForcedConv] = useState<number | null>(null);
  const [forcedAdminPayload, setForcedAdminPayload] = useState<ForcedAdminPayload | null>(null);

  useEffect(() => {
    const onRequested = (e: CustomEvent<{ conversationId: number }>) => {
          console.log("Valor de request", requestedConv);
      setRequestedConv(e.detail.conversationId);
    };
    const onResponse = (e: CustomEvent<AssignmentResponsePayload>) => {
      setResponsePayload(e.detail);
    };
    const onForced = (e: CustomEvent<{ conversationId: number }>) => {
      setForcedConv(e.detail.conversationId);
    };
    const onForcedAdmin = (e: CustomEvent<ForcedAdminPayload>) => {
      setForcedAdminPayload(e.detail);
    };

    window.addEventListener('AssignmentRequested', onRequested as any);
    window.addEventListener('AssignmentResponse', onResponse as any);
    window.addEventListener('AssignmentForced', onForced as any);
    window.addEventListener('AssignmentForcedAdmin', onForcedAdmin as any);

    return () => {
      window.removeEventListener('AssignmentRequested', onRequested as any);
      window.removeEventListener('AssignmentResponse', onResponse as any);
      window.removeEventListener('AssignmentForced', onForced as any);
      window.removeEventListener('AssignmentForcedAdmin', onForcedAdmin as any);
    };
  }, []);

  return {
    // Para mostrar/ocultar los modales
    requestedConv,
    clearRequested: () => setRequestedConv(null),

    responsePayload,
    clearResponse: () => setResponsePayload(null),

    forcedConv,
    clearForced: () => setForcedConv(null),

    forcedAdminPayload,
    clearForcedAdmin: () => setForcedAdminPayload(null),
  };
}
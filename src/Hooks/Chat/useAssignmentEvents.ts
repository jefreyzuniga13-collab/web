import { useState, useEffect, useCallback } from 'react';

interface AssignmentResponsePayload {
  conversationId: number;
  accepted: boolean;
  comment?: string;
}

interface ForcedAdminPayload {
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
    const handleRequested = (e: Event) => {
      const detail = (e as CustomEvent<{ conversationId: number }>).detail;
      setRequestedConv(detail.conversationId);
    };

    const handleResponse = (e: Event) => {
      const detail = (e as CustomEvent<AssignmentResponsePayload>).detail;
      setResponsePayload(detail);
    };

    const handleForced = (e: Event) => {
      const detail = (e as CustomEvent<{ conversationId: number }>).detail;
      setForcedConv(detail.conversationId);
    };

    const handleForcedAdmin = (e: Event) => {
      const detail = (e as CustomEvent<ForcedAdminPayload>).detail;
      setForcedAdminPayload(detail);
    };

    window.addEventListener('AssignmentRequested', handleRequested);
    window.addEventListener('AssignmentResponse', handleResponse);
    window.addEventListener('AssignmentForced', handleForced);
    window.addEventListener('AssignmentForcedAdmin', handleForcedAdmin);

    return () => {
      window.removeEventListener('AssignmentRequested', handleRequested);
      window.removeEventListener('AssignmentResponse', handleResponse);
      window.removeEventListener('AssignmentForced', handleForced);
      window.removeEventListener('AssignmentForcedAdmin', handleForcedAdmin);
    };
  }, []);

  const clearRequested = useCallback(() => setRequestedConv(null), []);
  const clearResponse = useCallback(() => setResponsePayload(null), []);
  const clearForced = useCallback(() => setForcedConv(null), []);
  const clearForcedAdmin = useCallback(() => setForcedAdminPayload(null), []);

  return {
    requestedConv,
    clearRequested,
    responsePayload,
    clearResponse,
    forcedConv,
    clearForced,
    forcedAdminPayload,
    clearForcedAdmin
  };
}
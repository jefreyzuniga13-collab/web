/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useState } from "react";
import { TicketService } from "@/Services/Crm/TicketService";
import type { ApiResponse } from "@/Interfaces/Auth/AuthInterface";
import type { TicketCreateResult, CrearTicketArgs } from "@/Interfaces/Crm/TicketInterfaces";

interface UseTicketDetailResult {
  loading: boolean;
  error: Error | null;
  lastResponse: ApiResponse<TicketCreateResult> | null;
  createTicket: (args: CrearTicketArgs) => Promise<ApiResponse<TicketCreateResult> | null>;
}

export function useTicketDetail(): UseTicketDetailResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastResponse, setLastResponse] = useState<ApiResponse<TicketCreateResult> | null>(null);

  const createTicket = useCallback(
    async (args: CrearTicketArgs): Promise<ApiResponse<TicketCreateResult> | null> => {
      try {
        setLoading(true);
        setError(null);

        const res = await TicketService.createTicketForConversation(
          args.conversationId,
          {
            dueDate: args.DueDate,
            codCliente: args.codCliente,
            contactId: args.contactId,
            titulo: args.titulo,
            descripcion: args.descripcion,
            prioridad: args.prioridad,
            archivos: args.archivos,
            responsibleId: args.responsibleId,
          }
        );

        setLastResponse(res);
        return res;
      } catch (err: any) {
        const e = err instanceof Error ? err : new Error("Error al crear el ticket.");
        setError(e);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    lastResponse,
    createTicket,
  };
}
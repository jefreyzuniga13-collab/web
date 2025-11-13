import type { ApiResponse } from "@/Interfaces/Auth/AuthInterface";

export interface CreateTicketPayload {
  dueDate: Date;
  codCliente: string;
  contactId: number;
  titulo: string;
  descripcion: string;
  prioridad: number;
  archivos: File[];
  responsibleId: number | null;
  // selectedColor: string;
}

export interface TicketCreateResult {
  success: boolean;
  message: string;
  ticketId?: string;
}

export interface Option {
  id: number;
  text: string;
}


export type CrearTicketArgs = {
  conversationId: number
  codCliente: string
  contactId: number
  titulo: string
  descripcion: string
  prioridad: number
  archivos: File[]
  responsibleId: number | null
  DueDate: Date
  // selectedColor: string;
}

export interface UseTicketDetailResult {
  loading: boolean;
  error: Error | null;
  lastResponse: ApiResponse<TicketCreateResult> | null;
  createTicket: (args: CrearTicketArgs) => Promise<ApiResponse<TicketCreateResult> | null>;
}
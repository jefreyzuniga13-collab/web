import type { ApiResponse } from "@/Interfaces/Auth/AuthInterface";

export interface CreateTicketPayload {
  dueDate: Date;
  codCliente: string;
  contactId: number;
  titulo: string;
  descripcion: string;
  prioridad: string;
  archivos: File[];
  responsibleId: number | null;
}

export interface TicketCreateResult {
  success: boolean;
  message: string;
  ticketId?: string;
}

export type Prioridad = 'Alta' | 'Media' | 'Baja'

export type CrearTicketArgs = {
  conversationId: number
  codCliente: string
  contactId: number
  titulo: string
  descripcion: string
  prioridad: Prioridad
  archivos: File[]
  responsibleId: number | null
  DueDate: Date
}

export interface UseTicketDetailResult {
  loading: boolean;
  error: Error | null;
  lastResponse: ApiResponse<TicketCreateResult> | null;
  createTicket: (args: CrearTicketArgs) => Promise<ApiResponse<TicketCreateResult> | null>;
}
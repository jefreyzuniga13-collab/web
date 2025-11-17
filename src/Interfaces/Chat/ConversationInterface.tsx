export type GetConvArgs = {
  from?: string | Date | null
  to?: string | Date | null
  contactId?: number
  q?: string | null
  page?: number
  pageSize?: number
}

export type exportPDFArgs ={
    contactId: number;
    conversationId?: number | null;
    from: Date | string | null;
    to: Date | string | null;
    title: string;
    subtitle: string;
}

export interface TicketRequestDto{
  title: string;
  description: string;
  // Quien lo crea y asigna se hace en la API.
  
}
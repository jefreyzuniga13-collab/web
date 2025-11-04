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
    from: Date | string | null;
    to: Date | string | null;
    title: string;
    subtitle: string;
}
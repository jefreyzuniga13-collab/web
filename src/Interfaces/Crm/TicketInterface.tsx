export type Prioridad = 'Alta' | 'Media' | 'Baja'

export type CrearTicketArgs = {
  conversationId: number
  codCliente: string
  contactId: number
  titulo: string
  descripcion: string
  prioridad: Prioridad
  archivos: File[]
}
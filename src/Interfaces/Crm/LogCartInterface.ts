export interface LogCartResponseDto {
  id: number
  orderId: number
  userId: number
  userName: string
  contactId: number
  contactName: string
  createdAt: string
  updatedAt: string | null
  conversationId: number
  createdById: number
  createdByName: string
  updatedById: number | null
  updatedByName: string | null
  statusId: number
  statusName: string
  branch: string;
  branchName?: string;
  
  addressId?: number
  transCost?: number;

  //validar datos
  Exonerado?: string
  DescuentoPantalla?: number
  totalEnPantalla?: number;
  ivaPantalla?: number
  subTotal?: number
  propina?: number
  retiraSucursal?: string;
  observacion?: string;
  wherehouse?: string;
}

export interface LogCartRequestDto {
  orderId: number
  contactId: number
  conversationId: number
  statusId: number
  branch?: string;
    branchName?: string;
  
  addressId?: number
  transCost?: number;

  //validar datos
  Exonerado?: string
  DescuentoPantalla?: number
  totalEnPantalla?: number;
  ivaPantalla?: number
  subTotal?: number
  propina?: number

  retiraSucursal?: string;
    observacion?: string
     wherehouse?: string;
}

export interface LogCartFormValues {
  orderId: number
  contactId: number
  conversationId: number
  statusId: number
  branch?: string
  branchName?: string;
  
  addressId?: number
  transCost?: number;

  //validar datos
  Exonerado?: string
  DescuentoPantalla?: number
  totalEnPantalla?: number;
  ivaPantalla?: number
  subTotal?: number
  propina?: number

  retiraSucursal?: string;
    observacion?: string
     wherehouse?: string;
}
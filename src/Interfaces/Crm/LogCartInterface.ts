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
  serie?: string;

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
  wherehouseCode?: string;
  destinationBranchCode?: string
  destinationWherehouseCode?: string
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

  serie?: string;
  retiraSucursal?: string;
  observacion?: string
  wherehouse?: string;
  wherehouseCode?: string;
  destinationBranchCode?: string
  destinationWherehouseCode?: string
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

    serie?: string;
  retiraSucursal?: string;
  observacion?: string
  wherehouse?: string;
  wherehouseCode?: string;
  destinationBranchCode?: string
  destinationWherehouseCode?: string
}


// Actualizar
// export interface LogCartUpdateRequestDto {
//   orderId: number
//   contactId: number
//   userId: number
//   conversationId: number
//   statusId: number
//   branch?: string | null
//   branchName?: string | null
//   serie?: string;
//   addressId?: number | null
//   transCost?: number | null
//   wherehouse?: string | null
//   wherehouseCode?: string | null
//   totalEnPantalla?: number | null
//   descuentoPantalla?: number | null
//   ivaPantalla?: number | null
//   exonerado?: string | null
//   propina?: number | null
//   subTotal?: number | null
//   observacion?: string | null
//   retiraSucursal?: "S" | "N" | null
//   destinationBranchCode?: string
//   destinationWherehouseCode?: string
// }



export type LogCartUpdateRequestDto = {
  orderId: number
  contactId: number
  userId: number
  conversationId: number
  statusId: number
  branch?: string | null
  branchName?: string | null
  addressId?: number | null
  transCost?: number | null
  wherehouse?: string | null
  wherehouseCode?: string | null
  totalEnPantalla?: number | null
  descuentoPantalla?: number | null
  ivaPantalla?: number | null
  exonerado?: string | null
  propina?: number | null
  subTotal?: number | null
  observacion?: string | null
  retiraSucursal?: "S" | "N" | null
  destinationBranchCode?: string
  destinationWherehouseCode?: string
  serie?: string;
}

export type Payload = {
  fullName: string;
  email: string;
  ecommerceUserId: number;
  expiresAtUtc: string;
  orderId: number;
  conversationId: number;
  contactId: number;
  userId: number;
};

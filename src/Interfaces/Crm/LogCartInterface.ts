import type {
  CarDto,
  InvoiceTotalsDto,
  ListDetalleCarrito
} from "@/Interfaces/Crm/CartPCGInterface"
import type { SINO } from "../Ecommerce/FacturaTempo"

export interface LogCartResponseDto {
  id: number
  orderId: number

  /**
   * Usuario relacionado al carrito.
   */
  userId: number
  userName: string

  /**
   * Contacto asociado al pedido.
   */
  contactId: number
  contactName: string

  /**
   * Teléfono del contacto.
   *
   * Se utiliza especialmente en el PDF cuando el cliente
   * completa el checkout sin una sesión activa.
   */
  contactPhone?: string | null

  /**
   * Empresa asociada al carrito.
   */
  companyId?: number

  /**
   * Nombre de la empresa.
   *
   * Debe venir desde backend para que el checkout público
   * no dependa del estado Redux.
   */
  companyName?: string | null

  /**
   * Usuario o agente que creó el carrito.
   */
  createdById: number
  createdByName: string

  /**
   * Nombre completo del agente que creó el carrito.
   */
  createdByFullName?: string | null

  /**
   * Nickname del agente.
   *
   * Se usa como respaldo cuando createdByFullName está vacío.
   */
  createdByNickname?: string | null

  createdAt: string
  updatedAt: string | null

  conversationId: number

  updatedById: number | null
  updatedByName: string | null

  statusId: number
  statusName: string

  branch: string
  branchName?: string | null
  serie?: string | null

  addressId?: number | null
  transCost?: number | null

  /**
   * Validación de datos y totales.
   */
  Exonerado?: string | null
  DescuentoPantalla?: number | null
  totalEnPantalla?: number | null
  ivaPantalla?: number | null
  subTotal?: number | null
  propina?: number | null

  retiraSucursal?: string | null
  observacion?: string | null

  wherehouse?: string | null
  wherehouseCode?: string | null

  destinationBranchCode?: string | null
  destinationWherehouseCode?: string | null

  codPrecio: string

    /**
   * Nombre indicado por el agente para generar la factura.
   * Se usa para evitar que la factura salga con nickname o "Cliente".
   */
  invoiceName?: string | null


    onlyTextAddress:boolean
}

export interface LogCartRequestDto {
  orderId: number
  contactId: number
  conversationId: number
  statusId: number

  branch?: string | null
  branchName?: string | null
  addressId?: number | null
  transCost?: number | null

  Exonerado?: string | null
  DescuentoPantalla?: number | null
  totalEnPantalla?: number | null
  ivaPantalla?: number | null
  subTotal?: number | null
  propina?: number | null

  serie?: string | null
  retiraSucursal?: string | null
  observacion?: string | null

  wherehouse?: string | null
  wherehouseCode?: string | null

  destinationBranchCode?: string | null
  destinationWherehouseCode?: string | null

  codPrecio: string

    invoiceName?: string | null
}

export interface LogCartFormValues {
  orderId: number
  contactId: number
  conversationId: number
  statusId: number

  branch?: string | null
  branchName?: string | null

  addressId?: number | null
  transCost?: number | null

  Exonerado?: string | null
  DescuentoPantalla?: number | null
  totalEnPantalla?: number | null
  ivaPantalla?: number | null
  subTotal?: number | null
  propina?: number | null

  serie?: string | null
  retiraSucursal?: string | null
  observacion?: string | null

  wherehouse?: string | null
  wherehouseCode?: string | null

  destinationBranchCode?: string | null
  destinationWherehouseCode?: string | null

  codPrecio: string

    invoiceName?: string | null
}

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
  retiraSucursal?: SINO | null

  destinationBranchCode?: string | null
  destinationWherehouseCode?: string | null

  serie?: string | null
    invoiceName?: string | null

    onlyTextAddress:boolean
}

/**
 * Datos incluidos en el enlace temporal del checkout.
 *
 * No se deben incluir datos sensibles de sesión.
 */
export type Payload = {
  fullName: string
  email: string

  /**
   * Teléfono del contacto.
   */
  phone?: string

  ecommerceUserId: number
  expiresAtUtc: string
  orderId: number
  conversationId: number
  contactId: number

  /**
   * Usuario/agente que preparó el pedido.
   */
  userId: number

  /**
   * Nombre del agente.
   *
   * Es útil como respaldo cuando el LogCart no devuelve
   * el nombre del vendedor.
   */
  sellerName?: string

  /**
   * Nombre de la empresa.
   */
  companyName?: string

  /**
   * Empresa asociada al pedido.
   */
  companyId?: number


  OolyTextAddress: boolean
}

/**
 * Estado temporal del panel del carrito.
 */
export type DraftState = {
  addDescription: string
  retiraSucursal: SINO
  transCost: number
  selectedAddressId: number | null
  observation: string
  invoiceName: string
  onlyTextAddress:boolean
}

export type CartDetailView = {
  cart: CarDto
  detail: ListDetalleCarrito
}

export type AddressPayload = {
  addressId: number | null
  retiraSucursal: SINO
  transCost: number
}

export type BuildLogUpdateParams = {
  log: LogCartResponseDto
  contactId: number
  conversationId: number
  addressPayload: AddressPayload
  totals?: InvoiceTotalsDto | null
  observation: string
  invoiceName?: string | null
  onlyTextAddress:boolean
}
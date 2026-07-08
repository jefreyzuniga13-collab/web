import type { NavigateFunction } from "react-router-dom"
import type { AppDispatch } from "@/Context"

import type { FacturaTempo } from "@/Interfaces/Ecommerce/FacturaTempo"
import type {
  LogCartResponseDto,
  Payload
} from "@/Interfaces/Crm/LogCartInterface"
import type { ApiResponse } from "@/Interfaces/Auth/AuthInterface"

import { procesarVentaCheckout } from "@/Utils/ECommerce/procesarVentaCheckout"

type ProcesarCheckoutExitosoParams = {
  /**
   * Request final de factura.
   */
  invoiceReqFinal: FacturaTempo

  /**
   * Payload del carrito/log.
   */
  payload: Payload

  /**
   * Número de pedido temporal.
   */
  orderId: number

  /**
   * Identificador de transacción de PowerTranz.
   *
   * Este archivo mantiene compatibilidad con el checkout anterior,
   * por eso se asume que este flujo viene desde pasarela.
   */
  transactionIdentifier: string

  /**
   * Define si se debe generar recibo adicional de pago electrónico.
   */
  usarPdfPagoElectronico: boolean

  /**
   * Código de sucursal de factura.
   */
  codSucursalFactura: string

  /**
   * Consecutivo de factura.
   */
  consecutivo: number

  /**
   * Obtiene el LogCart actual por contacto.
   */
  fetchByContactId: (contactId: number) => Promise<LogCartResponseDto | null>

  /**
   * Actualiza estado del LogCart.
   */
  updatedStatus: (
    id: number,
    status: number
  ) => Promise<LogCartResponseDto | null>

  /**
   * Inserta factura.
   */
  insertaFacturaAsync: (
    invoice: FacturaTempo
  ) => Promise<ApiResponse<unknown>>

  /**
   * Dispatch de Redux.
   */
  dispatch: AppDispatch

  /**
   * Navegación del checkout.
   */
  navigate: NavigateFunction
}

/**
 * Compatibilidad con el flujo anterior de CheckoutPage.
 *
 * Esta función ya no contiene lógica propia de venta.
 * Solo delega al procesador genérico procesarVentaCheckout.
 *
 * Para pagos del agente desde CartTab se debe llamar directamente
 * procesarVentaCheckout con source: "agent" y paymentMethod según corresponda.
 */
export async function procesarCheckoutExitoso({
  invoiceReqFinal,
  payload,
  orderId,
  transactionIdentifier,
  usarPdfPagoElectronico = false,
  codSucursalFactura,
  consecutivo,
  fetchByContactId,
  updatedStatus,
  insertaFacturaAsync,
  dispatch,
  navigate
}: ProcesarCheckoutExitosoParams): Promise<void> {
  await procesarVentaCheckout({
    source: "customerLink",
    paymentMethod: "gatewayCard",
    invoiceReqFinal,
    payload,
    orderId,
    transactionIdentifier,
    usarPdfPagoElectronico,
    codSucursalFactura,
    consecutivo,
    fetchByContactId,
    updatedStatus,
    insertaFacturaAsync,
    dispatch,
    navigate
  })
}
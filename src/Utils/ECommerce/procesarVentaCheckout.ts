import dayjs from "dayjs"
import type { NavigateFunction } from "react-router-dom"
import type { AppDispatch } from "@/Context"

import { setContactCartBadge } from "@/Context/Slices/Ecommerce/cartBadgeSlice"
import { UserSessionService } from "@/Services/auth/UserSessionService"
import { CartService } from "@/Services/Ecommerce/CarPCGService"
import { InvoiceOrderService } from "@/Services/Ecommerce/InvoiceOrderService"
import { sendMediaEcommerce } from "@/Services/chat/MessageService"
import { powertranzService } from "@/Services/Ecommerce/PowerTranzService"

import { generateOrdeFacPDFFile } from "@/Utils/Pdf/PrintDetFac"
import { generatePagoElectronicoPDFFile } from "@/Utils/Pdf/generateReciboPasarelaPDFFile"

import { GENERAL_STATUS } from "@/Constants/status"
import { PCG_SERVICES } from "@/Constants/pcgservices"

import type { FacturaTempo } from "@/Interfaces/Ecommerce/FacturaTempo"
import type {
  LogCartResponseDto,
  Payload
} from "@/Interfaces/Crm/LogCartInterface"
import type { ApiResponse } from "@/Interfaces/Auth/AuthInterface"
import type {
  PowertranzVoidRequestDto
} from "@/Interfaces/Ecommerce/powertranzInterface"

import type {
  CheckoutPaymentMethod,
  CheckoutPaymentState,
  PaymentSource
} from "@/Interfaces/Ecommerce/PaymentCheckoutInterface"

type ProcesarVentaCheckoutParams = {
  /**
   * Indica desde dónde se procesa la venta.
   *
   * agent:
   * Venta procesada directamente por el agente desde el CartTab.
   *
   * customerLink:
   * Venta procesada por el cliente desde el link de checkout.
   */
  source: PaymentSource

  /**
   * Método de pago utilizado.
   *
   * gatewayCard es el único método que puede requerir anulación
   * en PowerTranz si la factura no se logra insertar.
   */
  paymentMethod: CheckoutPaymentMethod

  /**
   * Estado normalizado del pago.
   *
   * No es obligatorio para procesar la venta, pero se recibe para que
   * el flujo tenga disponible la información del pago en un solo objeto.
   */
  paymentState?: CheckoutPaymentState

  /**
   * Request final de factura que se enviará al backend.
   */
  invoiceReqFinal: FacturaTempo

  /**
   * Payload del carrito/log usado para limpiar, finalizar y enviar PDF.
   */
  payload: Payload

  /**
   * Número de pedido temporal.
   */
  orderId: number

  /**
   * Identificador de transacción de PowerTranz.
   *
   * Solo aplica cuando paymentMethod es gatewayCard.
   */
  transactionIdentifier?: string

  /**
   * Indica si se debe generar PDF adicional de pago electrónico.
   *
   * Normalmente solo aplica para gatewayCard.
   */
  usarPdfPagoElectronico?: boolean

  /**
   * Sucursal donde se generó la factura.
   */
  codSucursalFactura: string

  /**
   * Consecutivo de factura generado por backend.
   */
  consecutivo: number

  /**
   * Obtiene el LogCart actual por contacto.
   */
  fetchByContactId: (contactId: number) => Promise<LogCartResponseDto | null>

  /**
   * Actualiza el estado del LogCart.
   */
  updatedStatus: (
    id: number,
    status: number
  ) => Promise<LogCartResponseDto | null>

  /**
   * Inserta la factura final.
   */
  insertaFacturaAsync: (
    invoice: FacturaTempo
  ) => Promise<ApiResponse<unknown>>

  /**
   * Dispatch de Redux para actualizar badge del carrito.
   */
  dispatch: AppDispatch

  /**
   * Navegación opcional.
   *
   * En CheckoutPage normalmente se navega a successOrder.
   * En CartTab del agente puede no usarse y en su lugar resetear UI.
   */
  navigate?: NavigateFunction

  /**
   * Callback opcional que se ejecuta al finalizar correctamente.
   *
   * Útil para resetear el CartTab sin depender de navigate.
   */
  onSuccess?: () => void
}

/**
 * Valida que un Blob generado sea realmente un PDF válido.
 *
 * Esto evita enviar archivos vacíos o respuestas HTML con extensión PDF.
 */
const validarPdf = async (pdfBlob: Blob, fileName: string): Promise<File> => {
  if (!(pdfBlob instanceof Blob) || pdfBlob.size < 100) {
    throw new Error(`El PDF ${fileName} está vacío o inválido.`)
  }

  const head = new Uint8Array(await pdfBlob.slice(0, 5).arrayBuffer())
  const magic = String.fromCharCode(...head)

  if (magic !== "%PDF-") {
    throw new Error(
      `El archivo ${fileName} no parece PDF válido (magic=${magic}).`
    )
  }

  return new File([pdfBlob], fileName, {
    type: pdfBlob.type || "application/pdf"
  })
}

/**
 * Intenta anular una transacción de PowerTranz.
 *
 * Solo debe ejecutarse para pagos con pasarela.
 */
const intentarVoidPowertranz = async ({
  transactionIdentifier,
  orderId
}: {
  transactionIdentifier: string
  orderId: number
}) => {
  const voidReq: PowertranzVoidRequestDto = {
    transactionIdentifier,
    externalIdentifier: orderId.toString()
  }

  const voidRes = await powertranzService.void(voidReq)

  if (voidRes?.data?.approved) {
    throw new Error(
      voidRes.data.responseMessage ??
        "La factura no se insertó y la transacción fue anulada. Intente procesar el pago nuevamente."
    )
  }

  throw new Error(
    voidRes?.data?.responseMessage ??
      "La factura no se insertó y no fue posible anular la transacción."
  )
}

/**
 * Procesa la venta completa después de confirmar el pago.
 *
 * Esta función no depende de CheckoutPage ni de CartTab.
 * Por eso puede reutilizarse tanto para el cliente como para el agente.
 */
export async function procesarVentaCheckout({
  source,
  paymentMethod,
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
  navigate,
  onSuccess
}: ProcesarVentaCheckoutParams): Promise<void> {
  const isGatewayPayment = paymentMethod === "gatewayCard"

  const insertFacRes = await insertaFacturaAsync(invoiceReqFinal)

  /**
   * Si falla la inserción de factura y el pago fue por pasarela,
   * se debe intentar anular la transacción.
   *
   * Para efectivo, transferencia y tarjeta manual no existe transacción
   * PowerTranz que anular.
   */
  if (!insertFacRes?.success) {
    if (isGatewayPayment && transactionIdentifier) {
      await intentarVoidPowertranz({
        transactionIdentifier,
        orderId
      })
    }

    throw new Error(
      insertFacRes?.message ?? "No fue posible insertar la factura."
    )
  }

  const existingLog = await fetchByContactId(payload.contactId)

  /**
   * La venta ya fue facturada correctamente, por eso se finaliza el LogCart.
   */
  if (existingLog?.id) {
    await updatedStatus(existingLog.id, GENERAL_STATUS.Finalizada)
  }

  /**
   * Se revoca el link temporal si existe.
   *
   * En flujo agente puede existir porque el carrito también se pudo preparar
   * con orderId temporal.
   */
  await UserSessionService.revokeCartTempLink(orderId)

  /**
   * Se limpia la factura temporal del carrito.
   */
  const limpiarRes = await CartService.LimpiarFacturaTempo(
    String(payload.contactId),
    `CRM-${payload.contactId}`
  )

  if (!limpiarRes.success) {
    throw new Error(limpiarRes.message)
  }

  dispatch(
    setContactCartBadge({
      contactId: payload.contactId,
      hasCart: false,
      count: 0
    })
  )

  /**
   * Se obtiene la información de factura para imprimir el PDF.
   */
  const date = dayjs().format("YYYYMMDD")

  const resPrintPDF = await InvoiceOrderService.PrintDetFac(
    codSucursalFactura,
    date,
    consecutivo,
    PCG_SERVICES.CRM
  )

  if (resPrintPDF) {
    const archivos: File[] = []

    const noFactura = String(
      resPrintPDF.data.DatosGenerales?.NoFactura ?? ""
    ).trim()

    const nombreBase = `Pedido-${noFactura || "SN"}`

    const pdfPedido = generateOrdeFacPDFFile(resPrintPDF.data, existingLog)

    archivos.push(await validarPdf(pdfPedido, `${nombreBase}.pdf`))

    /**
     * El PDF de pago electrónico normalmente solo aplica para pasarela.
     */
    if (usarPdfPagoElectronico && transactionIdentifier) {
      const pdfPagoElectronico = generatePagoElectronicoPDFFile({
        orderFac: resPrintPDF.data,
        transactionIdentifier,
        telefono: "+505 7545 4150",
        existingLog
      })

      archivos.push(
        await validarPdf(
          pdfPagoElectronico,
          `${nombreBase}-PagoElectronico.pdf`
        )
      )
    }

    /**
     * Se envían los PDFs generados al chat ecommerce.
     */
    for (const archivo of archivos) {
      await sendMediaEcommerce(payload.conversationId, archivo, "")
    }
  }

  onSuccess?.()

  /**
   * La navegación queda opcional para que el CartTab del agente
   * pueda reutilizar esta función sin cambiar de página.
   */
  if (source === "customerLink" && navigate) {
    navigate("/successOrder", { replace: true })
  }
}
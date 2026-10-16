import dayjs from "dayjs"
import type { NavigateFunction } from "react-router-dom"

import type { AppDispatch } from "@/Context"
import { setContactCartBadge } from "@/Context/Slices/Ecommerce/cartBadgeSlice"

import { GENERAL_STATUS } from "@/Constants/status"
import { PCG_SERVICES } from "@/Constants/pcgservices"

import { UserSessionService } from "@/Services/auth/UserSessionService"
import { sendMediaEcommerce } from "@/Services/chat/MessageService"
// import { CartService } from "@/Services/Ecommerce/CarPCGService"
import { InvoiceOrderService } from "@/Services/Ecommerce/InvoiceOrderService"
import { powertranzService } from "@/Services/Ecommerce/PowerTranzService"

import type { ApiResponse } from "@/Interfaces/Auth/AuthInterface"
import type { LogCartResponseDto, Payload } from "@/Interfaces/Crm/LogCartInterface"
import type { FacturaTempo } from "@/Interfaces/Ecommerce/FacturaTempo"
import type { CheckoutPaymentMethod, CheckoutPaymentState, PaymentSource } from "@/Interfaces/Ecommerce/PaymentCheckoutInterface"
import type { PowertranzVoidRequestDto } from "@/Interfaces/Ecommerce/powertranzInterface"

import { generatePagoElectronicoPDFFile } from "@/Utils/Pdf/generateReciboPasarelaPDFFile"
import { generateOrdeFacPDFFile, type OrderPdfContext } from "@/Utils/Pdf/PrintDetFac"

type ProcesarVentaCheckoutParams = {
  source: PaymentSource
  paymentMethod: CheckoutPaymentMethod
  paymentState?: CheckoutPaymentState
  invoiceReqFinal: FacturaTempo
  payload: Payload
  orderId: number
  transactionIdentifier?: string
  usarPdfPagoElectronico?: boolean
  codSucursalFactura: string
  consecutivo: number
  pdfContext?: OrderPdfContext
  fetchByContactId: (contactId: number) => Promise<LogCartResponseDto | null>
  updatedStatus: (id: number, status: number) => Promise<LogCartResponseDto | null>
  insertaFacturaAsync: (invoice: FacturaTempo) => Promise<ApiResponse<unknown>>
  dispatch: AppDispatch
  navigate?: NavigateFunction
  onSuccess?: () => void
}

const safeText = (value?: string | number | null): string => {
  return String(value ?? "").trim()
}

/**
 * Limpia un valor para utilizarlo dentro del nombre de un archivo.
 */
const safeFileName = (
  value?: string | number | null,
  fallback = "Cliente"
): string => {
  const text = String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  const withoutControlCharacters = Array.from(text)
    .filter((character) => {
      const code = character.charCodeAt(0)
      return code >= 32 && code !== 127
    })
    .join("")

  const cleaned = withoutControlCharacters
    .replace(/[<>:"/\\|?*]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .trim()

  return cleaned || fallback
}

/**
 * Valida que el Blob generado corresponda realmente a un PDF.
 */
const validarPdf = async (pdfBlob: Blob, fileName: string): Promise<File> => {
  if (!(pdfBlob instanceof Blob) || pdfBlob.size < 100) {
    throw new Error(`El PDF ${fileName} está vacío o es inválido.`)
  }

  const head = new Uint8Array(await pdfBlob.slice(0, 5).arrayBuffer())
  const magic = String.fromCharCode(...head)

  if (magic !== "%PDF-") {
    throw new Error(
      `El archivo ${fileName} no parece un PDF válido (magic=${magic}).`
    )
  }

  return new File([pdfBlob], fileName, {
    type: pdfBlob.type || "application/pdf"
  })
}

/**
 * Intenta anular la transacción cuando PowerTranz aprobó el pago,
 * pero la factura no pudo insertarse.
 */
const intentarVoidPowertranz = async ({
  transactionIdentifier,
  orderId
}: {
  transactionIdentifier: string
  orderId: number
}): Promise<never> => {
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
 * Procesa la venta después de confirmar el pago.
 *
 * Este método es compartido por:
 * - El pago directo realizado por el agente.
 * - El pago realizado por el cliente mediante el enlace de checkout.
 *
 * Cada flujo debe resolver previamente sus datos particulares y enviarlos
 * mediante invoiceReqFinal, payload y pdfContext.
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
  pdfContext,
  fetchByContactId,
  updatedStatus,
  insertaFacturaAsync,
  dispatch,
  navigate,
  onSuccess
}: ProcesarVentaCheckoutParams): Promise<void> {
  const isGatewayPayment = paymentMethod === "gatewayCard"

  const insertFacRes = await insertaFacturaAsync(invoiceReqFinal)

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

  /**
   * Se obtiene antes de finalizar el LogCart porque todavía contiene
   * los datos asociados al pedido, incluyendo invoiceName.
   */
  const existingLog = await fetchByContactId(payload.contactId)

  if (existingLog?.id) {
    await updatedStatus(existingLog.id, GENERAL_STATUS.Finalizada)
  }

  await UserSessionService.revokeCartTempLink(orderId)

  // const limpiarRes = await CartService.LimpiarFacturaTempo(
  //   String(payload.contactId),
  //   `CRM-${payload.contactId}`
  // )

  // if (!limpiarRes.success) {
  //   throw new Error(
  //     limpiarRes.message || "No fue posible limpiar la factura temporal."
  //   )
  // }

  dispatch(
    setContactCartBadge({
      contactId: payload.contactId,
      hasCart: false,
      count: 0
    })
  )

  const date = dayjs().format("YYYYMMDD")

  const resPrintPDF = await InvoiceOrderService.PrintDetFac(
    codSucursalFactura,
    date,
    consecutivo,
    PCG_SERVICES.CRM
  )

  if (resPrintPDF?.data) {
    const archivos: File[] = []

    const noFactura = safeText(
      resPrintPDF.data.DatosGenerales?.NoFactura
    )

    const numeroPedido = safeFileName(
      noFactura,
      orderId.toString()
    )

    /**
     * El método compartido respeta primero el contexto resuelto por
     * el flujo que lo llamó.
     *
     * Agent:
     * useAgentCartPayment envía invoiceName como contactName.
     *
     * CustomerLink:
     * CheckoutPage resuelve el nombre desde LogCart, payload o formulario.
     */
  const finalPdfContext: OrderPdfContext = {
  sellerName:
    safeText(existingLog?.createdByFullName) ||
    safeText(existingLog?.createdByNickname) ||
    safeText(existingLog?.createdByName) ||
    safeText(existingLog?.userName) ||
    safeText(payload.sellerName) ||
    safeText(pdfContext?.sellerName) ||
    (source === "customerLink" ? "Venta en línea" : "Agente"),

  contactName:
    safeText(pdfContext?.contactName) ||
    safeText(existingLog?.invoiceName) ||
    safeText(payload.fullName) ||
    safeText(existingLog?.contactName) ||
    safeText(resPrintPDF.data.DatosGenerales?.Nombrede) ||
    "Cliente",

  contactPhone:
    safeText(pdfContext?.contactPhone) ||
    safeText(existingLog?.contactPhone) ||
    safeText(payload.phone),

  companyName:
    safeText(existingLog?.companyName) ||
    safeText(payload.companyName) ||
    safeText(pdfContext?.companyName) ||
    "Empresa"
}

    /**
     * El nombre del archivo se obtiene del mismo nombre que se mostrará
     * como cliente dentro del PDF.
     */
    const nombreClienteArchivo = safeFileName(
      finalPdfContext.contactName,
      "Cliente"
    )

    const nombrePedido =
      `pedido_${numeroPedido}_${nombreClienteArchivo}`

    const nombreComprobantePago =
      `comprobante_pago_${numeroPedido}_${nombreClienteArchivo}`

    const pdfPedido = generateOrdeFacPDFFile(
      resPrintPDF.data,
      existingLog,
      finalPdfContext
    )

    archivos.push(
      await validarPdf(
        pdfPedido,
        `${nombrePedido}.pdf`
      )
    )

    // PENDIENTE: PAGO.
    if (usarPdfPagoElectronico && transactionIdentifier) {
      const pdfPagoElectronico = generatePagoElectronicoPDFFile({
        orderFac: resPrintPDF.data,
        transactionIdentifier,
        telefono: existingLog?.companyPhone ?? "",
        existingLog
      })

      archivos.push(
        await validarPdf(
          pdfPagoElectronico,
          `${nombreComprobantePago}.pdf`
        )
      )
    }

    for (const archivo of archivos) {
      await sendMediaEcommerce(
        payload.conversationId,
        archivo,
        ""
      )
    }
  }

  onSuccess?.()

  if (source === "customerLink" && navigate) {
    navigate("/successOrder", {
      replace: true
    })
  }
}

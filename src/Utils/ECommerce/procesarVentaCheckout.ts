import dayjs from "dayjs"
import type { NavigateFunction } from "react-router-dom"
import type { AppDispatch } from "@/Context"

import { setContactCartBadge } from "@/Context/Slices/Ecommerce/cartBadgeSlice"

import { UserSessionService } from "@/Services/auth/UserSessionService"
import { CartService } from "@/Services/Ecommerce/CarPCGService"
import { InvoiceOrderService } from "@/Services/Ecommerce/InvoiceOrderService"
import { sendMediaEcommerce } from "@/Services/chat/MessageService"
import { powertranzService } from "@/Services/Ecommerce/PowerTranzService"

import {
  generateOrdeFacPDFFile,
  type OrderPdfContext
} from "@/Utils/Pdf/PrintDetFac"

import { generatePagoElectronicoPDFFile } from "@/Utils/Pdf/generateReciboPasarelaPDFFile"

import { GENERAL_STATUS } from "@/Constants/status"
import { PCG_SERVICES } from "@/Constants/pcgservices"

import type { FacturaTempo } from "@/Interfaces/Ecommerce/FacturaTempo"

import type {
  LogCartResponseDto,
  Payload
} from "@/Interfaces/Crm/LogCartInterface"

import type {
  ApiResponse
} from "@/Interfaces/Auth/AuthInterface"

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
   */
  paymentMethod: CheckoutPaymentMethod

  /**
   * Estado normalizado del pago.
   */
  paymentState?: CheckoutPaymentState

  /**
   * Request final de factura enviado al backend.
   */
  invoiceReqFinal: FacturaTempo

  /**
   * Payload del carrito o LogCart.
   */
  payload: Payload

  /**
   * Número del pedido temporal.
   */
  orderId: number

  /**
   * Identificador de transacción PowerTranz.
   */
  transactionIdentifier?: string

  /**
   * Genera también el comprobante electrónico.
   */
  usarPdfPagoElectronico?: boolean

  /**
   * Sucursal donde se genera la factura.
   */
  codSucursalFactura: string

  /**
   * Consecutivo generado por backend.
   */
  consecutivo: number

  /**
   * Información adicional que aparecerá en el PDF.
   *
   * En el flujo del agente puede obtenerse desde Redux.
   * En el checkout debe obtenerse desde payload, contacto o LogCart.
   */
  pdfContext?: OrderPdfContext

  /**
   * Obtiene el LogCart actual por contacto.
   */
  fetchByContactId: (
    contactId: number
  ) => Promise<LogCartResponseDto | null>

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
   * Dispatch de Redux.
   */
  dispatch: AppDispatch

  /**
   * Navegación opcional.
   */
  navigate?: NavigateFunction

  /**
   * Callback ejecutado cuando finaliza correctamente.
   */
  onSuccess?: () => void
}

/**
 * Limpia texto sin aplicar restricciones especiales.
 *
 * La limpieza de caracteres no compatibles con jsPDF se realiza
 * dentro de generateOrdeFacPDFFile.
 */
const safeText = (
  value?: string | number | null
): string => {
  return String(value ?? "").trim()
}

/**
 * Valida que un Blob generado sea realmente un PDF válido.
 */
const validarPdf = async (
  pdfBlob: Blob,
  fileName: string
): Promise<File> => {
  if (
    !(pdfBlob instanceof Blob) ||
    pdfBlob.size < 100
  ) {
    throw new Error(
      `El PDF ${fileName} está vacío o inválido.`
    )
  }

  const head = new Uint8Array(
    await pdfBlob
      .slice(0, 5)
      .arrayBuffer()
  )

  const magic = String.fromCharCode(...head)

  if (magic !== "%PDF-") {
    throw new Error(
      `El archivo ${fileName} no parece PDF válido (magic=${magic}).`
    )
  }

  return new File(
    [pdfBlob],
    fileName,
    {
      type: pdfBlob.type || "application/pdf"
    }
  )
}

/**
 * Intenta anular una transacción PowerTranz.
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

  const voidRes =
    await powertranzService.void(voidReq)

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
 * Puede utilizarse tanto desde el CartTab del agente como desde
 * el checkout público del cliente.
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
  const isGatewayPayment =
    paymentMethod === "gatewayCard"

  /**
   * Primero se inserta la factura.
   */
  const insertFacRes =
    await insertaFacturaAsync(invoiceReqFinal)

  /**
   * Si falla y fue pago por pasarela, intenta anularlo.
   */
  if (!insertFacRes?.success) {
    if (
      isGatewayPayment &&
      transactionIdentifier
    ) {
      await intentarVoidPowertranz({
        transactionIdentifier,
        orderId
      })
    }

    throw new Error(
      insertFacRes?.message ??
        "No fue posible insertar la factura."
    )
  }

  /**
   * Recupera el LogCart antes de finalizarlo.
   *
   * También se utiliza para obtener sucursal y otros datos
   * necesarios para imprimir el PDF.
   */
  const existingLog =
    await fetchByContactId(payload.contactId)

  /**
   * La venta ya fue facturada, por lo que se finaliza el LogCart.
   */
  if (existingLog?.id) {
    await updatedStatus(
      existingLog.id,
      GENERAL_STATUS.Finalizada
    )
  }

  /**
   * Revoca el enlace temporal del checkout.
   */
  await UserSessionService.revokeCartTempLink(
    orderId
  )

  /**
   * Limpia la factura temporal.
   */
  const limpiarRes =
    await CartService.LimpiarFacturaTempo(
      String(payload.contactId),
      `CRM-${payload.contactId}`
    )

  if (!limpiarRes.success) {
    throw new Error(
      limpiarRes.message ||
        "No fue posible limpiar la factura temporal."
    )
  }

  /**
   * Limpia el badge del carrito.
   */
  dispatch(
    setContactCartBadge({
      contactId: payload.contactId,
      hasCart: false,
      count: 0
    })
  )

  /**
   * Obtiene la factura definitiva para generar los PDFs.
   */
  const date = dayjs().format("YYYYMMDD")

  const resPrintPDF =
    await InvoiceOrderService.PrintDetFac(
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

    const nombreBase =
      `Pedido-${noFactura || "SN"}`

    /**
     * Contexto final del PDF.
     *
     * Los valores enviados explícitamente tienen prioridad.
     * El nombre del contacto puede respaldarse con payload.fullName.
     */
    const finalPdfContext: OrderPdfContext = {
      sellerName:
        safeText(pdfContext?.sellerName) ||
        (
          source === "customerLink"
            ? "Venta en línea"
            : "Agente"
        ),

      contactName:
        safeText(pdfContext?.contactName) ||
        safeText(payload.fullName) ||
        safeText(
          resPrintPDF.data.DatosGenerales?.Nombrede
        ) ||
        "Cliente",

      contactPhone:
        safeText(pdfContext?.contactPhone),

      companyName:
        safeText(pdfContext?.companyName) ||
        "Empresa"
    }

    /**
     * PDF principal del pedido.
     */
    const pdfPedido =
      generateOrdeFacPDFFile(
        resPrintPDF.data,
        existingLog,
        finalPdfContext
      )

    archivos.push(
      await validarPdf(
        pdfPedido,
        `${nombreBase}.pdf`
      )
    )

    /**
     * PDF adicional de pago electrónico.
     */
    if (
      usarPdfPagoElectronico &&
      transactionIdentifier
    ) {
      const pdfPagoElectronico =
        generatePagoElectronicoPDFFile({
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
     * Envía todos los PDFs al chat.
     */
    for (const archivo of archivos) {
      await sendMediaEcommerce(
        payload.conversationId,
        archivo,
        ""
      )
    }
  }

  /**
   * Ejecuta el callback propio del flujo.
   */
  onSuccess?.()

  /**
   * El checkout público navega a la página de éxito.
   *
   * El CartTab del agente solamente reinicia su interfaz.
   */
  if (
    source === "customerLink" &&
    navigate
  ) {
    navigate(
      "/successOrder",
      {
        replace: true
      }
    )
  }
}
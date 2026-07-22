import type { LogCartResponseDto } from "@/Interfaces/Crm/LogCartInterface"
import type { PrintOrdenFactInterfaceRaw } from "@/Interfaces/Ecommerce/InvoiceOrderInterface"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { safeNumber } from "@/Utils/ECommerce/utils"

type AutoTableDoc = jsPDF & {
  lastAutoTable?: {
    finalY: number
  }
}

type ProductRow = [string, string, string, string, string]
type PaymentRow = [string, string]

export type OrderPdfContext = {
  sellerName?: string | null
  contactName?: string | null
  contactPhone?: string | null
  companyName?: string | null
}

type GeneratePagoElectronicoPDFParams = {
  orderFac: PrintOrdenFactInterfaceRaw
  transactionIdentifier?: string
  telefono?: string
  existingLog: LogCartResponseDto | null
}

/**
 * Formatea cantidades monetarias en córdobas (NIO).
 */
const money = (value?: number | string | null): string => {
  return new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency: "NIO",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeNumber(value))
}

/**
 * Formatea la fecha de la factura.
 */
const fmtDate = (isoOrText?: string | null): string => {
  const rawValue = String(isoOrText ?? "").trim()
  if (!rawValue) return ""

  const date = new Date(rawValue)
  if (Number.isNaN(date.getTime())) return rawValue

  return new Intl.DateTimeFormat("es-NI", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

/**
 * Limpia texto para evitar errores de codificación en jsPDF.
 */
const safePdfText = (value?: string | number | null, fallback = ""): string => {
  const text = String(value ?? "").normalize("NFC").trim()
  if (!text) return fallback

  const cleaned = Array.from(text)
    .map((character) => {
      const codePoint = character.codePointAt(0) ?? 0

      if (codePoint < 32 && codePoint !== 9 && codePoint !== 10 && codePoint !== 13) return ""
      if (codePoint === 127) return ""
      if ((codePoint >= 32 && codePoint <= 126) || (codePoint >= 160 && codePoint <= 591)) return character

      if ([8211, 8212, 8216, 8217, 8220, 8221, 8226, 8364].includes(codePoint)) {
        return character
      }

      return " "
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim()

  return cleaned || fallback
}

/**
 * Revisa si existe suficiente espacio en la página de un PDF standard.
 */
const ensurePageSpace = (
  doc: jsPDF,
  currentY: number,
  requiredHeight: number,
  marginTop = 20,
  marginBottom = 20
): number => {
  const pageHeight = doc.internal.pageSize.getHeight()
  if (currentY + requiredHeight <= pageHeight - marginBottom) {
    return currentY
  }
  doc.addPage()
  return marginTop
}

/**
 * Dibuja una fila label/value en PDFs standard.
 */
const drawInfoRow = ({
  doc,
  label,
  value,
  x,
  y,
  maxWidth,
  labelWidth = 26,
}: {
  doc: jsPDF
  label: string
  value: string
  x: number
  y: number
  maxWidth: number
  labelWidth?: number
}): number => {
  doc.setFont("helvetica", "bold")
  doc.text(label, x, y)

  doc.setFont("helvetica", "normal")
  const valueLines = doc.splitTextToSize(value || "No especificado", Math.max(maxWidth - labelWidth, 20))
  doc.text(valueLines, x + labelWidth, y)

  return y + Math.max(valueLines.length, 1) * 5 + 2
}

/**
 * 1. Genera el PDF completo del pedido facturado (Formato A4).
 */
export const generateOrdeFacPDFFile = (
  orderFac: PrintOrdenFactInterfaceRaw,
  existingLog: LogCartResponseDto | null,
  context: OrderPdfContext = {}
): Blob => {
  const doc = new jsPDF({
    unit: "mm",
    format: "a4",
    orientation: "portrait",
  }) as AutoTableDoc

  const marginX = 18
  const marginTop = 18
  const pageWidth = doc.internal.pageSize.getWidth()
  const usableWidth = pageWidth - marginX * 2

  /* Datos generales */
  const invoiceNumber = safePdfText(orderFac.DatosGenerales?.NoFactura, "S/N")
  const invoiceCustomerName = safePdfText(orderFac.DatosGenerales?.Nombrede, "Cliente")
  const contactPhone = safePdfText(context.contactPhone)
  const sellerName = safePdfText(context.sellerName, "Venta en línea")
  const companyName = safePdfText(context.companyName, "No especificada")
  const branchName = safePdfText(existingLog?.branchName, safePdfText(existingLog?.branch, "No especificada"))
  const invoiceDate = fmtDate(orderFac.DatosGenerales?.FechaFactura)

  /* Encabezado */
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text(`Detalle Pedido ${invoiceNumber}`, marginX, marginTop + 5)

  doc.setDrawColor(180, 180, 180)
  doc.line(marginX, marginTop + 10, pageWidth - marginX, marginTop + 10)

  /* Información principal */
  doc.setFontSize(10)
  let infoY = marginTop + 18

  infoY = drawInfoRow({ doc, label: "Cliente:", value: invoiceCustomerName, x: marginX, y: infoY, maxWidth: usableWidth })
  infoY = drawInfoRow({ doc, label: "Contacto:", value: contactPhone || "------", x: marginX, y: infoY, maxWidth: usableWidth })
  infoY = drawInfoRow({ doc, label: "Vendedor:", value: sellerName, x: marginX, y: infoY, maxWidth: usableWidth })
  infoY = drawInfoRow({ doc, label: "Empresa:", value: companyName, x: marginX, y: infoY, maxWidth: usableWidth })
  infoY = drawInfoRow({ doc, label: "Sucursal:", value: branchName, x: marginX, y: infoY, maxWidth: usableWidth })
  infoY = drawInfoRow({ doc, label: "Fecha:", value: invoiceDate || "No especificada", x: marginX, y: infoY, maxWidth: usableWidth })

  const addressDescription = safePdfText(orderFac.DatosDireccion?.Descripcion)
  const addressReference = safePdfText(orderFac.DatosDireccion?.Referencia)

  if (addressDescription) {
    infoY = drawInfoRow({ doc, label: "Dirección:", value: addressDescription, x: marginX, y: infoY, maxWidth: usableWidth })
  }
  if (addressReference) {
    infoY = drawInfoRow({ doc, label: "Referencia:", value: addressReference, x: marginX, y: infoY, maxWidth: usableWidth })
  }

  /* Productos */
  const productRows: ProductRow[] = []

  for (const item of orderFac.Carrito ?? []) {
    productRows.push([
      safePdfText(item.Descripcion, safePdfText(item.Codigo, "Producto")),
      safePdfText(item.Cantidad),
      safePdfText(item.UnidadMedida),
      money(item.Precio),
      money(item.TotalMenu),
    ])

    for (const option of item.Opciones ?? []) {
      productRows.push([
        `   • ${safePdfText(option.Descripcion, safePdfText(option.Codigo, "Opción"))}`,
        safePdfText(option.Cantidad),
        safePdfText(option.UnidadMedida),
        money(option.Precio),
        money(option.TotalMenu),
      ])
    }
  }

  if (productRows.length === 0) {
    productRows.push(["No se encontraron productos", "", "", "", ""])
  }

  autoTable(doc, {
    startY: infoY + 3,
    head: [["Descripción", "Cant.", "UM", "Precio", "Total"]],
    body: productRows,
    margin: { left: marginX, right: marginX },
    styles: { font: "helvetica", fontSize: 9, cellPadding: 3, overflow: "linebreak", valign: "middle" },
    headStyles: { fillColor: [49, 86, 168], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { halign: "left", cellWidth: 76 },
      1: { halign: "center", cellWidth: 16 },
      2: { halign: "center", cellWidth: 20 },
      3: { halign: "right", cellWidth: 28 },
      4: { halign: "right", cellWidth: 30 },
    },
  })

  /* Procesamiento del detalle de pago */
  const paymentDetails = Array.isArray(orderFac.DetallePago) ? orderFac.DetallePago : []
  const mainPayment = paymentDetails[0] ?? {}

  const subtotal = safeNumber(mainPayment.SubTotal)
  const discount = safeNumber(mainPayment.Descuento)
  const tax = safeNumber(mainPayment.Iva)
  const tip = safeNumber(mainPayment.Propina)
  const transportation = safeNumber(mainPayment.Transporte)

  let totalPaymentsSum = 0
  paymentDetails.forEach((p) => {
    totalPaymentsSum += safeNumber(p.Monto) > 0 ? safeNumber(p.Monto) : safeNumber(p.TotalPago)
  })

  const calculatedTotal = subtotal - discount + tax + tip + transportation
  const finalTotal = totalPaymentsSum > 0 ? totalPaymentsSum : calculatedTotal

  let summaryY = (doc.lastAutoTable?.finalY ?? infoY) + 10
  let amountRows = 3
  if (discount > 0) amountRows++
  if (tip > 0) amountRows++
  if (transportation > 0) amountRows++

  const summaryBoxWidth = 90
  const summaryBoxHeight = amountRows * 6 + 12

  summaryY = ensurePageSpace(doc, summaryY, summaryBoxHeight + 25)

  const summaryBoxX = pageWidth - marginX - summaryBoxWidth

  doc.setDrawColor(209, 213, 219)
  doc.setFillColor(249, 250, 251)
  doc.roundedRect(summaryBoxX, summaryY, summaryBoxWidth, summaryBoxHeight, 3, 3, "FD")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.text("Resumen de montos", summaryBoxX + 5, summaryY + 7)

  const labelX = summaryBoxX + 5
  const valueX = summaryBoxX + summaryBoxWidth - 5
  const lineGap = 6
  let lineY = summaryY + 15

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)

  doc.text("Subtotal:", labelX, lineY)
  doc.text(money(subtotal), valueX, lineY, { align: "right" })

  if (discount > 0) {
    lineY += lineGap
    doc.text("Descuento:", labelX, lineY)
    doc.text(money(discount), valueX, lineY, { align: "right" })
  }

  if (tip > 0) {
    lineY += lineGap
    doc.text("Propina:", labelX, lineY)
    doc.text(money(tip), valueX, lineY, { align: "right" })
  }

  lineY += lineGap
  doc.text("IVA:", labelX, lineY)
  doc.text(money(tax), valueX, lineY, { align: "right" })

  if (transportation > 0) {
    lineY += lineGap
    doc.text("Transporte:", labelX, lineY)
    doc.text(money(transportation), valueX, lineY, { align: "right" })
  }

  lineY += lineGap
  doc.setFont("helvetica", "bold")
  doc.text("Total:", labelX, lineY)
  doc.text(money(finalTotal), valueX, lineY, { align: "right" })

  /* Formas de pago */
  let paymentY = summaryY + summaryBoxHeight + 10
  paymentY = ensurePageSpace(doc, paymentY, 40)

  doc.setDrawColor(209, 213, 219)
  doc.line(marginX, paymentY, pageWidth - marginX, paymentY)

  paymentY += 8
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.text("Formas de pago", marginX, paymentY)

  const paymentRows: PaymentRow[] = paymentDetails.map((pay) => [
    safePdfText(pay.MetodoPago, "No especificado"),
    money(safeNumber(pay.Monto) > 0 ? pay.Monto : pay.TotalPago),
  ])

  if (paymentRows.length === 0) {
    paymentRows.push(["No especificado", money(finalTotal)])
  }

  autoTable(doc, {
    startY: paymentY + 3,
    head: [["Método de Pago", "Monto"]],
    body: paymentRows,
    margin: { left: marginX, right: marginX },
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [229, 231, 235], textColor: [31, 41, 55], fontStyle: "bold" },
    columnStyles: {
      0: { halign: "left" },
      1: { halign: "right", cellWidth: 40 },
    },
  })

  return doc.output("blob")
}

/**
 * 2. Genera el Ticket / Comprobante de Pago Electrónico (80mm Formato Térmico).
 */
export const generatePagoElectronicoPDFFile = ({
  orderFac,
  transactionIdentifier,
  telefono = "",
  existingLog,
}: GeneratePagoElectronicoPDFParams): Blob => {
  const pageWidth = 80
  const pageHeight = 220 // Se aumentó ligeramente para garantizar espacio suficiente sin recortes

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [pageWidth, pageHeight],
  })

  const marginX = 6
  const maxWidth = pageWidth - marginX * 2
  let y = 10

  /* Extracción segura de DetallePago como Array */
  const paymentDetails = Array.isArray(orderFac.DetallePago) ? orderFac.DetallePago : []
  const mainPayment = paymentDetails[0] ?? {}

  /* Datos generales */
  const noFactura = safePdfText(orderFac.DatosGenerales?.NoFactura, "SN")
  const nombreCliente = safePdfText(orderFac.DatosGenerales?.Nombrede, "SN")
  const fechaFactura = fmtDate(orderFac.DatosGenerales?.FechaFactura) || "SN"
  const direccion = safePdfText(orderFac.DatosDireccion?.Descripcion, "SN")
  const sucursal = safePdfText(existingLog?.branchName, safePdfText(existingLog?.branch, "SN"))
  const atendidoPor = safePdfText(existingLog?.userName, "SN")

  // Obtener la concatenación de métodos de pago utilizados
  const metodosPagoText = paymentDetails.length > 0
    ? paymentDetails.map((p) => safePdfText(p.MetodoPago)).filter(Boolean).join(", ")
    : "Pago electrónico"

  /* Cálculos de Montos */
  const subtotal = safeNumber(mainPayment.SubTotal)
  const descuento = safeNumber(mainPayment.Descuento)
  const iva = safeNumber(mainPayment.Iva)
  const transporte = safeNumber(mainPayment.Transporte)
  const propina = safeNumber(mainPayment.Propina)

  let totalPaymentsSum = 0
  paymentDetails.forEach((p) => {
    totalPaymentsSum += safeNumber(p.Monto) > 0 ? safeNumber(p.Monto) : safeNumber(p.TotalPago)
  })

  const valorPagarDirecto = safeNumber(mainPayment.Valor_Pagar)
  const total = totalPaymentsSum > 0 ? totalPaymentsSum : (valorPagarDirecto > 0 ? valorPagarDirecto : subtotal - descuento + iva + transporte + propina)

  /* Helpers de Renderizado */
  const addCentered = (text: string, size = 10, style: "normal" | "bold" = "normal") => {
    doc.setFont("helvetica", style)
    doc.setFontSize(size)

    const lines = doc.splitTextToSize(text, maxWidth)
    lines.forEach((line: string) => {
      const textWidth = doc.getTextWidth(line)
      const x = (pageWidth - textWidth) / 2
      doc.text(line, x, y)
      y += 4.5
    })
  }

  const addDivider = () => {
    y += 1
    doc.setDrawColor(180)
    doc.line(marginX, y, pageWidth - marginX, y)
    y += 4
  }

  const addText = (label: string, value: string, options?: { boldValue?: boolean; gapAfter?: number }) => {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8.5)
    doc.text(label, marginX, y)

    y += 3.8

    doc.setFont("helvetica", options?.boldValue ? "bold" : "normal")
    doc.setFontSize(8.5)

    const lines = doc.splitTextToSize(value || "SN", maxWidth)
    doc.text(lines, marginX, y)

    y += lines.length * 3.8 + (options?.gapAfter ?? 2)
  }

  const addAmountLine = (label: string, value: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal")
    doc.setFontSize(bold ? 10 : 9)

    doc.text(label, marginX, y)

    const valueWidth = doc.getTextWidth(value)
    doc.text(value, pageWidth - marginX - valueWidth, y)

    y += bold ? 6 : 5
  }

  /* Construcción del Ticket */
  addCentered("COMPROBANTE DE PAGO", 12, "bold")
  addCentered("Pago electrónico", 10, "normal")

  addDivider()

  addText("No. factura", noFactura)
  addText("Pedido / transacción", safePdfText(transactionIdentifier, "SN"))
  addText("Fecha", fechaFactura)
  addText("Cliente", nombreCliente)
  addText("Sucursal", sucursal)
  addText("Atendido por", atendidoPor)
  addText("Dirección", direccion)
  addText("Método de pago", metodosPagoText)

  addDivider()

  addAmountLine("Subtotal", money(subtotal))
  if (descuento > 0) addAmountLine("Descuento", money(descuento))
  addAmountLine("IVA", money(iva))
  if (transporte > 0) addAmountLine("Transporte", money(transporte))
  if (propina > 0) addAmountLine("Propina", money(propina))

  addDivider()

  addAmountLine("TOTAL PAGADO", money(total), true)

  addDivider()

  addText(
    "Observación",
    "Pago registrado como electrónico. Este comprobante puede utilizarse como soporte de confirmación del pago.",
    { gapAfter: 3 }
  )

  if (telefono.trim()) {
    addText("Contacto", `Atención al cliente: ${telefono.trim()}`, { gapAfter: 3 })
  }

  y += 2
  addCentered("Gracias por su compra", 9, "bold")

  return doc.output("blob")
}
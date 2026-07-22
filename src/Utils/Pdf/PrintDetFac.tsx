import type {
  LogCartResponseDto
} from "@/Interfaces/Crm/LogCartInterface"

import type {
  PrintDetallePagoRaw,
  PrintOrdenFactInterfaceRaw
} from "@/Interfaces/Ecommerce/InvoiceOrderInterface"

import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

import {
  safeNumber
} from "@/Utils/ECommerce/utils"

type AutoTableDoc = jsPDF & {
  lastAutoTable?: {
    finalY: number
  }
}

type ProductRow = [
  string,
  string,
  string,
  string,
  string
]

export type OrderPdfContext = {
  /**
   * Nombre completo o nickname del vendedor.
   */
  sellerName?: string | null

  /**
   * Nombre del contacto.
   */
  contactName?: string | null

  /**
   * Número telefónico del contacto.
   */
  contactPhone?: string | null

  /**
   * Nombre de la empresa.
   */
  companyName?: string | null
}

/**
 * Formatea cantidades monetarias en córdobas.
 */
const money = (
  value?: number | string | null
): string => {
  return new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency: "NIO",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(safeNumber(value))
}

/**
 * Devuelve el primer número mayor que cero.
 */
const firstPositive = (
  ...values: unknown[]
): number => {
  for (const value of values) {
    const numberValue = safeNumber(value)

    if (numberValue > 0) {
      return numberValue
    }
  }

  return 0
}

/**
 * Formatea la fecha de la factura.
 */
const fmtDate = (
  isoOrText?: string | null
): string => {
  const rawValue = String(isoOrText ?? "").trim()

  if (!rawValue) {
    return ""
  }

  const date = new Date(rawValue)

  if (Number.isNaN(date.getTime())) {
    return rawValue
  }

  return new Intl.DateTimeFormat("es-NI", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date)
}

/**
 * Limpia texto para evitar caracteres no soportados por jsPDF.
 */
const safePdfText = (
  value?: string | number | null,
  fallback = ""
): string => {
  const text = String(value ?? "")
    .normalize("NFC")
    .trim()

  if (!text) {
    return fallback
  }

  const cleaned = Array.from(text)
    .map((character) => {
      const codePoint =
        character.codePointAt(0) ?? 0

      /*
       * Caracteres de control.
       */
      if (
        codePoint < 32 &&
        codePoint !== 9 &&
        codePoint !== 10 &&
        codePoint !== 13
      ) {
        return ""
      }

      if (codePoint === 127) {
        return ""
      }

      /*
       * Latin básico y extendido.
       */
      if (
        (codePoint >= 32 && codePoint <= 126) ||
        (codePoint >= 160 && codePoint <= 591)
      ) {
        return character
      }

      /*
       * Símbolos frecuentes.
       */
      if (
        codePoint === 8211 ||
        codePoint === 8212 ||
        codePoint === 8216 ||
        codePoint === 8217 ||
        codePoint === 8220 ||
        codePoint === 8221 ||
        codePoint === 8226 ||
        codePoint === 8364
      ) {
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
 * Normaliza DetallePago.
 *
 * La API actual devuelve un arreglo. El respaldo para objeto individual
 * evita que el PDF falle si algún ambiente antiguo todavía devuelve
 * un solo objeto.
 */
const normalizePaymentDetails = (
  value: unknown
): PrintDetallePagoRaw[] => {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is PrintDetallePagoRaw =>
        item != null &&
        typeof item === "object"
    )
  }

  if (
    value != null &&
    typeof value === "object"
  ) {
    return [
      value as PrintDetallePagoRaw
    ]
  }

  return []
}

/**
 * Verifica si existe suficiente espacio en la página.
 */
const ensurePageSpace = (
  doc: jsPDF,
  currentY: number,
  requiredHeight: number,
  marginTop = 20,
  marginBottom = 20
): number => {
  const pageHeight =
    doc.internal.pageSize.getHeight()

  if (
    currentY + requiredHeight <=
    pageHeight - marginBottom
  ) {
    return currentY
  }

  doc.addPage()

  return marginTop
}

/**
 * Imprime una fila de información.
 */
const drawInfoRow = ({
  doc,
  label,
  value,
  x,
  y,
  maxWidth,
  labelWidth = 26
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

  doc.text(
    label,
    x,
    y
  )

  doc.setFont("helvetica", "normal")

  const valueLines =
    doc.splitTextToSize(
      value || "No especificado",
      Math.max(
        maxWidth - labelWidth,
        20
      )
    )

  doc.text(
    valueLines,
    x + labelWidth,
    y
  )

  return (
    y +
    Math.max(
      valueLines.length,
      1
    ) * 5 +
    2
  )
}

/**
 * Obtiene el monto mostrado para una forma de pago.
 */
const getPaymentAmount = ({
  detail,
  paymentCount,
  finalTotal
}: {
  detail: PrintDetallePagoRaw
  paymentCount: number
  finalTotal: number
}): number => {
  const amount = safeNumber(
    detail.Monto
  )

  if (amount > 0) {
    return amount
  }

  /*
   * En pago único se puede utilizar el total como respaldo.
   *
   * En multipago no se utiliza TotalPago como monto individual
   * porque normalmente representa el total completo de la factura.
   */
  if (paymentCount === 1) {
    return firstPositive(
      detail.Valor_Pagar,
      detail.TotalPago,
      finalTotal
    )
  }

  return 0
}

/**
 * Genera el PDF del pedido facturado.
 */
export const generateOrdeFacPDFFile = (
  orderFac: PrintOrdenFactInterfaceRaw,
  existingLog: LogCartResponseDto | null,
  context: OrderPdfContext = {}
): Blob => {
  const doc = new jsPDF({
    unit: "mm",
    format: "a4",
    orientation: "portrait"
  }) as AutoTableDoc

  const marginX = 18
  const marginTop = 18

  const pageWidth =
    doc.internal.pageSize.getWidth()

  const usableWidth =
    pageWidth - marginX * 2

  /*
   * Datos generales.
   */
  const invoiceNumber = safePdfText(
    orderFac.DatosGenerales?.NoFactura,
    "S/N"
  )

  const invoiceCustomerName = safePdfText(
    orderFac.DatosGenerales?.Nombrede,
    "Cliente"
  )

  const contactName = safePdfText(
    context.contactName,
    invoiceCustomerName
  )

  const contactPhone = safePdfText(
    context.contactPhone
  )

  const sellerName = safePdfText(
    context.sellerName,
    "Venta en línea"
  )

  const companyName = safePdfText(
    context.companyName,
    "No especificada"
  )

  const branchName = safePdfText(
    existingLog?.branchName,
    safePdfText(
      existingLog?.branch,
      "No especificada"
    )
  )

  const invoiceDate = fmtDate(
    orderFac.DatosGenerales?.FechaFactura
  )

  /*
   * Encabezado.
   */
  doc.setFont(
    "helvetica",
    "bold"
  )

  doc.setFontSize(18)

  doc.text(
    `Detalle Pedido ${invoiceNumber}`,
    marginX,
    marginTop + 5
  )

  doc.setDrawColor(
    180,
    180,
    180
  )

  doc.line(
    marginX,
    marginTop + 10,
    pageWidth - marginX,
    marginTop + 10
  )

  /*
   * Información principal.
   */
  doc.setFontSize(10)

  let infoY =
    marginTop + 18

  infoY = drawInfoRow({
    doc,
    label: "Cliente:",
    value: invoiceCustomerName,
    x: marginX,
    y: infoY,
    maxWidth: usableWidth
  })

  const contactDescription =
    contactPhone
      ? `${contactName} - ${contactPhone}`
      : contactName

  infoY = drawInfoRow({
    doc,
    label: "Contacto:",
    value: contactDescription,
    x: marginX,
    y: infoY,
    maxWidth: usableWidth
  })

  infoY = drawInfoRow({
    doc,
    label: "Vendedor:",
    value: sellerName,
    x: marginX,
    y: infoY,
    maxWidth: usableWidth
  })

  infoY = drawInfoRow({
    doc,
    label: "Empresa:",
    value: companyName,
    x: marginX,
    y: infoY,
    maxWidth: usableWidth
  })

  infoY = drawInfoRow({
    doc,
    label: "Sucursal:",
    value: branchName,
    x: marginX,
    y: infoY,
    maxWidth: usableWidth
  })

  infoY = drawInfoRow({
    doc,
    label: "Fecha:",
    value:
      invoiceDate ||
      "No especificada",
    x: marginX,
    y: infoY,
    maxWidth: usableWidth
  })

  /*
   * Dirección.
   */
  const addressName = safePdfText(
    orderFac.DatosDireccion?.Nombre
  )

  const addressDescription = safePdfText(
    orderFac.DatosDireccion?.Descripcion
  )

  const addressReference = safePdfText(
    orderFac.DatosDireccion?.Referencia
  )

  if (addressName) {
    infoY = drawInfoRow({
      doc,
      label: "Lugar:",
      value: addressName,
      x: marginX,
      y: infoY,
      maxWidth: usableWidth
    })
  }

  if (addressDescription) {
    infoY = drawInfoRow({
      doc,
      label: "Dirección:",
      value: addressDescription,
      x: marginX,
      y: infoY,
      maxWidth: usableWidth
    })
  }

  if (addressReference) {
    infoY = drawInfoRow({
      doc,
      label: "Referencia:",
      value: addressReference,
      x: marginX,
      y: infoY,
      maxWidth: usableWidth
    })
  }

  /*
   * Productos.
   */
  const productRows: ProductRow[] = []

  for (
    const item of
    orderFac.Carrito ?? []
  ) {
    productRows.push([
      safePdfText(
        item.Descripcion,
        safePdfText(
          item.Codigo,
          "Producto"
        )
      ),
      safePdfText(item.Cantidad),
      safePdfText(item.UnidadMedida),
      money(item.Precio),
      money(item.TotalMenu)
    ])

    for (
      const option of
      item.Opciones ?? []
    ) {
      productRows.push([
        `   • ${safePdfText(
          option.Descripcion,
          safePdfText(
            option.Codigo,
            "Opción"
          )
        )}`,
        safePdfText(option.Cantidad),
        safePdfText(
          option.UnidadMedida
        ),
        money(option.Precio),
        money(option.TotalMenu)
      ])
    }
  }

  if (productRows.length === 0) {
    productRows.push([
      "No se encontraron productos",
      "",
      "",
      "",
      ""
    ])
  }

  autoTable(doc, {
    startY: infoY + 3,

    head: [[
      "Descripción",
      "Cant.",
      "UM",
      "Precio",
      "Total"
    ]],

    body: productRows,

    margin: {
      left: marginX,
      right: marginX
    },

    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 3,
      overflow: "linebreak",
      valign: "middle"
    },

    headStyles: {
      fillColor: [49, 86, 168],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center"
    },

    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },

    columnStyles: {
      0: {
        halign: "left",
        cellWidth: 76
      },

      1: {
        halign: "center",
        cellWidth: 16
      },

      2: {
        halign: "center",
        cellWidth: 20
      },

      3: {
        halign: "right",
        cellWidth: 28
      },

      4: {
        halign: "right",
        cellWidth: 30
      }
    }
  })

  /*
   * Detalles de pago.
   *
   * Puede contener una o varias formas de pago.
   */
  const paymentDetails =
    normalizePaymentDetails(
      orderFac.DetallePago
    )

  /*
   * Los totales generales normalmente se repiten en cada
   * registro de pago. Se toma un único registro para evitar
   * duplicar subtotal, IVA o total en multipago.
   */
  const summaryDetail =
    paymentDetails.find((detail) => {
      return (
        safeNumber(detail.SubTotal) > 0 ||
        safeNumber(detail.TotalPago) > 0 ||
        safeNumber(detail.Valor_Pagar) > 0
      )
    }) ??
    paymentDetails[0] ??
    null

  const subtotal = safeNumber(
    summaryDetail?.SubTotal
  )

  const discount = safeNumber(
    summaryDetail?.Descuento
  )

  const tax = safeNumber(
    summaryDetail?.Iva
  )

  const tip = safeNumber(
    summaryDetail?.Propina
  )

  const transportation = safeNumber(
    summaryDetail?.Transporte
  )

  const paymentValue = safeNumber(
    summaryDetail?.Valor_Pagar
  )

  const totalPayment = safeNumber(
    summaryDetail?.TotalPago
  )

  /*
   * Solo se suman los montos individuales.
   *
   * No se suman TotalPago, SubTotal o IVA porque pueden
   * repetirse en cada registro cuando existe multipago.
   */
  const totalPaidByMethods =
    paymentDetails.reduce(
      (total, detail) => {
        return (
          total +
          safeNumber(detail.Monto)
        )
      },
      0
    )

  const calculatedTotal =
    subtotal -
    discount +
    tax +
    tip +
    transportation

  const finalTotal = firstPositive(
    totalPayment,
    paymentValue,
    calculatedTotal,
    totalPaidByMethods
  )

  /*
   * Resumen de montos.
   */
  let summaryY =
    (
      doc.lastAutoTable?.finalY ??
      infoY
    ) + 10

  let amountRows = 3

  if (discount > 0) {
    amountRows++
  }

  if (tip > 0) {
    amountRows++
  }

  if (transportation > 0) {
    amountRows++
  }

  const summaryBoxWidth = 90

  const summaryBoxHeight =
    amountRows * 6 + 12

  summaryY = ensurePageSpace(
    doc,
    summaryY,
    summaryBoxHeight + 25
  )

  const summaryBoxX =
    pageWidth -
    marginX -
    summaryBoxWidth

  doc.setDrawColor(
    209,
    213,
    219
  )

  doc.setFillColor(
    249,
    250,
    251
  )

  doc.roundedRect(
    summaryBoxX,
    summaryY,
    summaryBoxWidth,
    summaryBoxHeight,
    3,
    3,
    "FD"
  )

  doc.setFont(
    "helvetica",
    "bold"
  )

  doc.setFontSize(11)

  doc.text(
    "Resumen de montos",
    summaryBoxX + 5,
    summaryY + 7
  )

  const labelX =
    summaryBoxX + 5

  const valueX =
    summaryBoxX +
    summaryBoxWidth -
    5

  const lineGap = 6

  let lineY =
    summaryY + 15

  doc.setFont(
    "helvetica",
    "normal"
  )

  doc.setFontSize(10)

  doc.text(
    "Subtotal:",
    labelX,
    lineY
  )

  doc.text(
    money(subtotal),
    valueX,
    lineY,
    {
      align: "right"
    }
  )

  if (discount > 0) {
    lineY += lineGap

    doc.text(
      "Descuento:",
      labelX,
      lineY
    )

    doc.text(
      money(discount),
      valueX,
      lineY,
      {
        align: "right"
      }
    )
  }

  if (tip > 0) {
    lineY += lineGap

    doc.text(
      "Propina:",
      labelX,
      lineY
    )

    doc.text(
      money(tip),
      valueX,
      lineY,
      {
        align: "right"
      }
    )
  }

  lineY += lineGap

  doc.text(
    "IVA:",
    labelX,
    lineY
  )

  doc.text(
    money(tax),
    valueX,
    lineY,
    {
      align: "right"
    }
  )

  if (transportation > 0) {
    lineY += lineGap

    doc.text(
      "Transporte:",
      labelX,
      lineY
    )

    doc.text(
      money(transportation),
      valueX,
      lineY,
      {
        align: "right"
      }
    )
  }

  lineY += lineGap

  doc.setFont(
    "helvetica",
    "bold"
  )

  doc.text(
    "Total:",
    labelX,
    lineY
  )

  doc.text(
    money(finalTotal),
    valueX,
    lineY,
    {
      align: "right"
    }
  )

  /*
   * Formas de pago.
   */
  let paymentY =
    summaryY +
    summaryBoxHeight +
    10

  paymentY = ensurePageSpace(
    doc,
    paymentY,
    30
  )

  doc.setDrawColor(
    209,
    213,
    219
  )

  doc.line(
    marginX,
    paymentY,
    pageWidth - marginX,
    paymentY
  )

  paymentY += 8

  doc.setFont(
    "helvetica",
    "bold"
  )

  doc.setFontSize(11)

  doc.text(
    paymentDetails.length > 1
      ? "Formas de pago"
      : "Forma de pago",
    marginX,
    paymentY
  )

  paymentY += 4

  const hasChange =
    paymentDetails.some(
      (detail) =>
        safeNumber(detail.Vuelto) > 0
    )

  const paymentRows =
    paymentDetails.length > 0
      ? paymentDetails.map((detail) => {
          const method = safePdfText(
            detail.MetodoPago,
            "No especificado"
          )

          const amount = getPaymentAmount({
            detail,
            paymentCount:
              paymentDetails.length,
            finalTotal
          })

          if (hasChange) {
            return [
              method,
              money(amount),
              money(detail.Vuelto)
            ]
          }

          return [
            method,
            money(amount)
          ]
        })
      : hasChange
        ? [[
            "No especificado",
            money(0),
            money(0)
          ]]
        : [[
            "No especificado",
            money(0)
          ]]

  if (hasChange) {
    autoTable(doc, {
      startY: paymentY,

      head: [[
        "Método",
        "Monto",
        "Vuelto"
      ]],

      body: paymentRows,

      margin: {
        left: marginX,
        right: marginX
      },

      styles: {
        font: "helvetica",
        fontSize: 10,
        cellPadding: 3,
        valign: "middle"
      },

      headStyles: {
        fillColor: [49, 86, 168],
        textColor: [255, 255, 255],
        fontStyle: "bold"
      },

      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },

      columnStyles: {
        0: {
          halign: "left",
          cellWidth: 90
        },

        1: {
          halign: "right",
          cellWidth: 40
        },

        2: {
          halign: "right",
          cellWidth: 40
        }
      }
    })
  } else {
    autoTable(doc, {
      startY: paymentY,

      head: [[
        "Método",
        "Monto"
      ]],

      body: paymentRows,

      margin: {
        left: marginX,
        right: marginX
      },

      styles: {
        font: "helvetica",
        fontSize: 10,
        cellPadding: 3,
        valign: "middle"
      },

      headStyles: {
        fillColor: [49, 86, 168],
        textColor: [255, 255, 255],
        fontStyle: "bold"
      },

      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },

      columnStyles: {
        0: {
          halign: "left",
          cellWidth: 110
        },

        1: {
          halign: "right",
          cellWidth: 60
        }
      }
    })
  }

  return doc.output("blob")
}
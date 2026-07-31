/* eslint-disable @typescript-eslint/no-explicit-any */

import type { ContactLogInterface } from "@/Interfaces/Auth/ContactInterface"
import type {
  CarDto,
  InvoiceTotalsDto,
  ListDetalleCarrito
} from "@/Interfaces/Crm/CartPCGInterface"
import type { SINO } from "@/Interfaces/Ecommerce/FacturaTempo"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

type CartPdfOptions = {
  transCost?: number
  retiraSucursal?: SINO
  addressText?: string | null
  addressName?: string | null
  observation?: string | null
  finalTotal?: number | null
}

const sanitizeMoney = (value: unknown): number => {
  const amount = Number(value ?? 0)

  if (!Number.isFinite(amount) || amount < 0) {
    return 0
  }

  return amount
}

const formatMoney = (value: unknown): string => {
  return sanitizeMoney(value).toFixed(2)
}

const buildRowsFromCart = (cart: CarDto): any[][] => {
  const rows: any[][] = []

  cart.listDetalle?.forEach((detail: ListDetalleCarrito) => {
    const description = String(detail.descripcion ?? "").trim()

    const options =
      detail.listOpciones
        ?.map((option) => String(option.descripcionOp ?? "").trim())
        .filter(Boolean)
        .join(", ") ?? ""

    rows.push([
      description,
      sanitizeMoney(detail.cantidad),
      formatMoney(detail.precioV),
      formatMoney(detail.totalMenu),
      options
    ])
  })

  return rows
}

export const generateCartPdfFile = (
  cart: CarDto,
  invoiceTotalsDto: InvoiceTotalsDto | null,
  contact: ContactLogInterface,
  opts?: CartPdfOptions,
  branchName?: string
): File => {
  const doc = new jsPDF()

  const marginX = 20
  const marginY = 20
  const lineHeight = 5

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const contentWidth = pageWidth - marginX * 2

  const date = new Date()

  const dateOptions: Intl.DateTimeFormatOptions = {
    timeZone: "America/Managua",
    dateStyle: "short",
    timeStyle: "short"
  }

  const formattedDate = date.toLocaleString("es-NI", dateOptions)

  const clientName = String(
    contact.fullName ?? contact.waName ?? ""
  ).trim()

  const branch = String(branchName ?? "").trim()

  const isPickup = opts?.retiraSucursal === "S"

  const addressName = String(opts?.addressName ?? "").trim()
  const addressText = String(opts?.addressText ?? "").trim()
  const observation = String(opts?.observation ?? "").trim()

  const hasAddress =
    !isPickup &&
    (addressName.length > 0 || addressText.length > 0)

  const shipping = isPickup
    ? 0
    : opts?.transCost != null
      ? sanitizeMoney(opts.transCost)
      : sanitizeMoney(invoiceTotalsDto?.transporte)

  /*
   * Encabezado
   */
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)

  doc.text(
    `Resumen de N.º Pedido ${cart.noPedido}`,
    marginX,
    marginY + 5
  )

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")

  doc.text(
    `Sucursal: ${branch || "No especificada"}`,
    marginX,
    marginY + 15
  )

  doc.text(
    `Cliente: ${clientName || "No especificado"}`,
    marginX,
    marginY + 22
  )

  doc.text(
    `Fecha: ${formattedDate}`,
    marginX,
    marginY + 29
  )

  /*
   * Información de entrega, dirección y observación.
   * La posición aumenta dinámicamente según la cantidad de líneas.
   */
  let infoY = marginY + 39

  const writeLabelValue = (
    label: string,
    value: string,
    extraBottomSpace = 2
  ): void => {
    const safeValue = value.trim() || "No especificado"

    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")

    const labelWidth = doc.getTextWidth(label)
    const valueX = marginX + labelWidth + 3
    const availableWidth = pageWidth - marginX - valueX

    doc.text(label, marginX, infoY)

    doc.setFont("helvetica", "normal")

    const wrappedLines = doc.splitTextToSize(
      safeValue,
      availableWidth
    ) as string[]

    doc.text(wrappedLines, valueX, infoY)

    infoY +=
      Math.max(wrappedLines.length, 1) * lineHeight +
      extraBottomSpace
  }

  if (isPickup) {
    writeLabelValue("Entrega:", "Retira en sucursal", 4)
  } else if (hasAddress) {
    writeLabelValue("Entrega:", "Envío a domicilio", 4)

    if (addressName.length > 0) {
      writeLabelValue("Dirección:", addressName, 3)
    }

    if (
      addressText.length > 0 &&
      addressText !== addressName
    ) {
      writeLabelValue(
        addressName.length > 0 ? "Detalle:" : "Dirección:",
        addressText,
        4
      )
    }
  } else {
    writeLabelValue("Entrega:", "Pendiente de dirección", 4)
  }

  if (observation.length > 0) {
    infoY += 2

    writeLabelValue(
      "Observación:",
      observation,
      2
    )
  }

  /*
   * Tabla de productos
   */
  const body = buildRowsFromCart(cart)

  autoTable(doc, {
    startY: infoY + 3,
    head: [
      [
        "Producto",
        "Cant.",
        "Precio",
        "Total",
        "Más detalles"
      ]
    ],
    body,
    margin: {
      left: marginX,
      right: marginX
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
      overflow: "linebreak",
      valign: "middle"
    },
    headStyles: {
      fillColor: [49, 86, 168],
      textColor: 255,
      fontStyle: "bold"
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    columnStyles: {
      0: {
        cellWidth: 45
      },
      1: {
        halign: "center",
        cellWidth: 15
      },
      2: {
        halign: "right",
        cellWidth: 22
      },
      3: {
        halign: "right",
        cellWidth: 24
      },
      4: {
        cellWidth: 65
      }
    }
  })

  /*
   * Resumen de montos
   */
  const subtotal = sanitizeMoney(
    invoiceTotalsDto?.subTotal
  )

  const discount = sanitizeMoney(
    invoiceTotalsDto?.descuento
  )

  const iva = sanitizeMoney(
    invoiceTotalsDto?.iva
  )

  const total = sanitizeMoney(
    opts?.finalTotal ?? invoiceTotalsDto?.total
  )

  const amountRows: Array<{
    label: string
    value: number
    bold?: boolean
  }> = [
    {
      label: "Subtotal:",
      value: subtotal
    }
  ]

  if (discount > 0) {
    amountRows.push({
      label: "Descuento:",
      value: discount
    })
  }

  amountRows.push({
    label: "IVA:",
    value: iva
  })

  if (shipping > 0) {
    amountRows.push({
      label: "Envío:",
      value: shipping
    })
  }

  amountRows.push({
    label: "Total:",
    value: total,
    bold: true
  })

  const boxWidth = 90
  const boxHeight = 17 + amountRows.length * 6
  const boxX = pageWidth - marginX - boxWidth

  let boxY =
    ((doc as any).lastAutoTable?.finalY ?? infoY + 30) + 10

  /*
   * Si el resumen no cabe, se agrega otra página.
   */
  if (boxY + boxHeight > pageHeight - marginY) {
    doc.addPage()
    boxY = marginY
  }

  doc.setDrawColor(209, 213, 219)
  doc.setFillColor(249, 250, 251)

  doc.roundedRect(
    boxX,
    boxY,
    boxWidth,
    boxHeight,
    3,
    3,
    "FD"
  )

  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")

  doc.text(
    "Resumen de montos",
    boxX + 4,
    boxY + 8
  )

  const labelX = boxX + 4
  const valueX = boxX + boxWidth - 4

  let amountY = boxY + 17

  amountRows.forEach((row) => {
    doc.setFontSize(10)
    doc.setFont(
      "helvetica",
      row.bold ? "bold" : "normal"
    )

    doc.text(
      row.label,
      labelX,
      amountY
    )

    doc.text(
      `C$ ${formatMoney(row.value)}`,
      valueX,
      amountY,
      {
        align: "right"
      }
    )

    amountY += 6
  })

  const blob = doc.output("blob")

  const safeClientName =
    clientName || "Cliente"

  return new File(
    [blob],
    `N.º Pedido ${cart.noPedido} - ${safeClientName}.pdf`,
    {
      type: "application/pdf"
    }
  )
}
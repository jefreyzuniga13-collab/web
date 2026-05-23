import type { ContactLogInterface } from "@/Interfaces/Auth/ContactInterface"
import type { CarDto, InvoiceTotalsDto, ListDetalleCarrito } from "@/Interfaces/Crm/CartPCGInterface"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

/* eslint-disable @typescript-eslint/no-explicit-any */
const buildRowsFromCart = (cart: CarDto): any[][] => {
  const rows: any[][] = []
  cart.listDetalle.forEach((d: ListDetalleCarrito) => {
    const opciones = d.listOpciones?.map((o) => o.descripcionOp).join(", ") ?? ""
    const descripcion = (d.descripcion ?? "").trim()
    const productoCell = [descripcion].filter(Boolean).join("\n")

    rows.push([productoCell, d.cantidad, d.precioV.toFixed(2), d.totalMenu.toFixed(2), opciones])
  })
  return rows
}

type CartPdfOptions = {
  transCost?: number
  retiraSucursal?: "S" | "N"
  addressText?: string | null
  addressName?: string | null
  finalTotal?: number | null
}

const sanitizeMoney = (v: any): number => {
  const n = Number(v ?? 0)
  if (!Number.isFinite(n) || n < 0) return 0
  return n
}

export const generateCartPdfFile = (cart: CarDto, invoiceTotalsDto: InvoiceTotalsDto | null, 
  contact: ContactLogInterface, opts?: CartPdfOptions, branchName?: string | undefined): File => {
  const doc = new jsPDF()

  const date = new Date()
  const options: Intl.DateTimeFormatOptions = { timeZone: "America/Managua" }
  const time = date.toLocaleString("es-NI", options)

  const marginX = 20
  const marginY = 20
  const pageWidth = doc.internal.pageSize.getWidth()

  const retiraSucursal = opts?.retiraSucursal === "S" ? "S" : "N"
  const isPickup = retiraSucursal === "S"

  const addressText = String(opts?.addressText ?? "").trim()
  const addressName = String(opts?.addressName ?? "").trim()
  const hasAddress = !isPickup && (addressText.length > 0 || addressName.length > 0)

  const shipping = !isPickup && hasAddress ? sanitizeMoney(opts?.transCost) : invoiceTotalsDto?.transporte ?? 0

  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text(`Resumen de N.º Pedido ${cart.noPedido}`, marginX, marginY + 5)

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(`Sucursal : ${branchName}`, marginX, marginY + 15)
  doc.text(`A nombre de: ${contact.fullName != null ? contact.fullName : contact.waName}`, marginX, marginY + 22)
  doc.setFont("helvetica", "normal")
  doc.text(`Fecha: ${time}`, marginX, marginY + 29)

  let infoY = marginY + 36
  doc.setFont("helvetica", "bold")
  doc.text("Entrega:", marginX, infoY)

  if (isPickup) {
    doc.text("Retira en sucursal", marginX + 18, infoY)
  } else if (hasAddress) {
    const addrLine = addressName.length > 0 ? addressName : addressText
    const descLine = addressText.length > 0 && addrLine !== addressText ? addressText : ""
    doc.text("Envío a domicilio", marginX + 18, infoY)
    infoY += 3
    doc.text(`Dirección: ${addrLine}`, marginX, infoY)
    if (descLine.length > 0) {
      infoY += 3
      doc.text(`Referencia: ${descLine}`, marginX, infoY)
    }
  } else {
    doc.text("Pendiente de dirección", marginX + 18, infoY)
  }
    doc.setFont("helvetica", "normal")

  const body = buildRowsFromCart(cart)

  autoTable(doc, {
    startY: infoY + 8,
    head: [["Producto", "Cant.", "Precio", "Total", "Más detalles"]],
    body,
    margin: { left: marginX, right: marginX },
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [49, 86, 168], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { halign: "left", cellWidth: 15 },
      2: { halign: "left", cellWidth: 22 },
      3: { halign: "left", cellWidth: 24 },
      4: { cellWidth: 65 }
    }
  })

  let y = (doc as any).lastAutoTable?.finalY ?? marginY + 40
  if (y < marginY + 30) y = marginY + 40
  y += 10

  const boxWidth = 90
  const boxHeightBase = 36
  const boxHeight = hasAddress && shipping > 0 ? boxHeightBase + 6 : boxHeightBase
  const boxX = pageWidth - marginX - boxWidth

  doc.setDrawColor(209, 213, 219)
  doc.setFillColor(249, 250, 251)
  ;(doc as any).roundedRect(boxX, y - 6, boxWidth, boxHeight, 3, 3, "FD")

  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text("Resumen de montos", boxX + 4, y - 1)

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")

  const lineGap = 6
  const labelX = boxX + 4
  const valueX = boxX + boxWidth - 4

  const subtotal = sanitizeMoney(invoiceTotalsDto?.subTotal ?? 0)
  const descuento = sanitizeMoney(invoiceTotalsDto?.descuento ?? 0)
  const iva = sanitizeMoney(invoiceTotalsDto?.iva ?? 0)
  const totalBase = sanitizeMoney(opts?.finalTotal ?? 0)


  let lineY = y + 6
  doc.text("Subtotal:", labelX, lineY)
  doc.text(`C$ ${subtotal}`, valueX, lineY, { align: "right" })

  if (descuento != null && Number(descuento) > 0) {
    lineY += lineGap
    doc.text("Descuento:", labelX, lineY)
    doc.text(`C$ ${descuento}`, valueX, lineY, { align: "right" })
  }

  lineY += lineGap
  doc.text("IVA:", labelX, lineY)
  doc.text(`C$ ${iva}`, valueX, lineY, { align: "right" })

  if (shipping > 0) {
    lineY += lineGap
    doc.text("Envío:", labelX, lineY)
    doc.text(`C$ ${shipping.toFixed(2)}`, valueX, lineY, { align: "right" })
  }

  doc.setFont("helvetica", "bold")
  lineY += lineGap
  doc.text("Total:", labelX, lineY)
  doc.text(`C$ ${totalBase}`, valueX, lineY, { align: "right" })

  const blob = doc.output("blob")
  return new File([blob], `N.º Pedido ${cart.noPedido} - ${contact.fullName ?? contact.waName}`, { type: "application/pdf" })
}
import type { ContactLogInterface } from "@/Interfaces/Contact/ContactInterface"
import type { CarDto, ListDetalleCarrito } from "@/Interfaces/Crm/CartPCGInterface"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

/* eslint-disable @typescript-eslint/no-explicit-any */
const buildRowsFromCart = (cart: CarDto): any[][] => {
  const rows: any[][] = []
  cart.listDetalle.forEach((d: ListDetalleCarrito) => {
    const opciones = d.listOpciones?.map(o => o.descripcionOp).join(", ") ?? ""
    const descripcion = d.descripcion.trim() ?? ""
    // const imagenLine = d.imagen ? `Imagen: ${d.imagen}` : ""
    // const productoCell = [descripcion, imagenLine].filter(Boolean).join("\n")
    const productoCell = [descripcion].filter(Boolean).join("\n")

    rows.push([productoCell, d.cantidad, d.precioV.toFixed(2), d.totalMenu.toFixed(2), opciones])
  })
  return rows
}

export const generateCartPdfFile = (cart: CarDto, contact: ContactLogInterface): File => {
  const doc = new jsPDF()

  const date = new Date()
  const options: Intl.DateTimeFormatOptions = { timeZone: "America/Managua" }
  const time = date.toLocaleString("es-NI", options)

  const marginX = 20
  const marginY = 20
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text(`Resumen de N.º Pedido ${cart.noPedido}`, marginX, marginY + 5)

  doc.setFontSize(10)
  doc.text(`A nombre de: ${contact.fullName != null ? contact.fullName : contact.waName}`, marginX, marginY + 15)
  doc.setFont("helvetica", "normal")
  doc.text(`Fecha: ${time}`, marginX, marginY + 25)

  const body = buildRowsFromCart(cart)

  autoTable(doc, {
    startY: marginY + 30,
    head: [["Producto", "Cant.", "Precio", "Total", "Más detalles"]],
    body,
    margin: { left: marginX, right: marginX },
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [49, 86, 168], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { halign: "left", cellWidth: 15 },
      2: { halign: "left", cellWidth: 22 },
      3: { halign: "left", cellWidth: 24 },
      4: { cellWidth: 80 }
    }
  })

  let y = (doc as any).lastAutoTable?.finalY ?? marginY + 40
  if (y < marginY + 30) y = marginY + 40
  y += 10

  const boxWidth = 80
  const boxHeight = 36
  const boxX = pageWidth - marginX - boxWidth

  doc.setDrawColor(209, 213, 219)
  doc.setFillColor(249, 250, 251)
    ; (doc as any).roundedRect(boxX, y - 6, boxWidth, boxHeight, 3, 3, "FD")

  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text("Resumen de montos", boxX + 4, y - 1)

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")

  const lineGap = 6
  const labelX = boxX + 4
  const valueX = boxX + boxWidth - 4

  const subtotal = (cart.subTotal ?? 0).toFixed(2)
  const descuento = (cart.descuento ?? 0).toFixed(2)
  const iva = (cart.iva ?? 0).toFixed(2)
  const total = cart.total.toFixed(2)

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

  doc.setFont("helvetica", "bold")
  lineY += lineGap
  doc.text("Total:", labelX, lineY)
  doc.text(`C$ ${total}`, valueX, lineY, { align: "right" })

  const blob = doc.output("blob")
  return new File([blob], `N.º Pedido ${cart.noPedido} - ${contact.fullName ?? contact.waName}`, { type: "application/pdf" })
}
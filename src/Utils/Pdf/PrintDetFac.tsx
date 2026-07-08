import type { LogCartResponseDto } from "@/Interfaces/Crm/LogCartInterface";
import type { PrintOrdenFactInterfaceRaw } from "@/Interfaces/Ecommerce/InvoiceOrderInterface";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type AutoTableDoc = jsPDF & { lastAutoTable?: { finalY: number } };
type Row = [string, string, string, string, string];

const money = (v: number) =>
  new Intl.NumberFormat("es-NI", { style: "currency", currency: "NIO" }).format(v ?? 0);

const fmtDate = (isoOrText: string) => {
  const d = new Date(isoOrText);
  if (Number.isNaN(d.getTime())) return isoOrText;
  return new Intl.DateTimeFormat("es-NI", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
};

const safeText = (v?: string) => (v ?? "").toString().trim();

export const generateOrdeFacPDFFile = (
  orderFac: PrintOrdenFactInterfaceRaw,
  existingLog: LogCartResponseDto | null
): Blob => {
  const doc = new jsPDF({ unit: "mm", format: "a4" }) as AutoTableDoc;

  const marginX = 20;
  const marginY = 20;
  const pageWidth = doc.internal.pageSize.getWidth();

  const yInfo = marginY + 7;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(
    `Detalle Pedido ${safeText(orderFac.DatosGenerales?.NoFactura)}`,
    marginX,
    marginY + 5
  );

  // Separador
  doc.setDrawColor(180);
  doc.line(marginX, yInfo + 10, pageWidth - marginX, yInfo + 10);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Cliente: ${safeText(orderFac.DatosGenerales?.Nombrede)}`, marginX, marginY + 15);
  doc.text(`Sucursal: ${safeText(existingLog?.branchName ?? "")}`, marginX, marginY + 22);
  doc.text(`Vendedor: ${safeText(existingLog?.userName ?? existingLog?.createdByName)}`, marginX, marginY + 29);
  doc.text(
    `Fecha: ${fmtDate(orderFac.DatosGenerales?.FechaFactura ?? "")}`,
    marginX,
    marginY + 36
  );

  let infoY = marginY + 43;

  const direccion = safeText(orderFac.DatosDireccion?.Descripcion);
  if (direccion.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.text("Dirección:", marginX, infoY);
    doc.setFont("helvetica", "normal");
    doc.text(direccion, marginX + 22, infoY);
    infoY += 7;
  }

  const carritoRows: Row[] = [];
  for (const item of orderFac.Carrito ?? []) {
    carritoRows.push([
      safeText(item.Descripcion),
      safeText(item.Cantidad.toString()),
      safeText(item.UnidadMedida),
      money(item.Precio ?? 0),
      money(item.TotalMenu ?? 0),
    ]);

    for (const op of item.Opciones ?? []) {
      carritoRows.push([
        `   ${safeText(op.Descripcion)}`,
        safeText(op.Cantidad.toString()),
        safeText(op.UnidadMedida),
        money(op.Precio ?? 0),
        money(op.TotalMenu ?? 0),
      ]);
    }
  }

  autoTable(doc, {
    startY: infoY + 3,
    head: [["Descripción", "Cant.", "UM", "Precio", "Total"]],
    body: carritoRows,
    margin: { left: marginX, right: marginX },
    styles: { font: "helvetica", fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [49, 86, 168], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { halign: "left", cellWidth: 80 },
      1: { halign: "center", cellWidth: 15 },
      2: { halign: "center", cellWidth: 20 },
      3: { halign: "right", cellWidth: 25 },
      4: { halign: "right", cellWidth: 30 },
    },
  });

  let y = doc.lastAutoTable?.finalY ?? infoY + 10;
  y += 10;

  const pago = orderFac.DetallePago;
  const p = Array.isArray(pago) ? pago[0] : pago;

  const subtotal = p?.SubTotal ?? 0;
  const descuento = p?.Descuento ?? 0;
  const propina = p?.Propina ?? 0;
  const iva = p?.Iva ?? p?.iva ?? 0;
  const transporte = p?.Transporte ?? 0;
  const totalPagar = p?.Valor_Pagar ?? 0;

  let rowCount = 3;
  if (descuento > 0) rowCount++;
  if (propina > 0) rowCount++;
  if (transporte > 0) rowCount++;

  const boxWidth = 90;
  const boxHeight = rowCount * 6 + 10;
  const boxX = pageWidth - marginX - boxWidth;

  doc.setDrawColor(209, 213, 219);
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(boxX, y - 6, boxWidth, boxHeight, 3, 3, "FD");

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Resumen de montos", boxX + 4, y - 1);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const lineGap = 6;
  const labelX = boxX + 4;
  const valueX = boxX + boxWidth - 4;
  let lineY = y + 6;

  doc.text("SubTotal:", labelX, lineY);
  doc.text(money(subtotal), valueX, lineY, { align: "right" });

  if (descuento > 0) {
    lineY += lineGap;
    doc.text("Descuento:", labelX, lineY);
    doc.text(money(descuento), valueX, lineY, { align: "right" });
  }

  if (propina > 0) {
    lineY += lineGap;
    doc.text("Propina:", labelX, lineY);
    doc.text(money(propina), valueX, lineY, { align: "right" });
  }

  lineY += lineGap;
  doc.text("IVA:", labelX, lineY);
  doc.text(money(iva), valueX, lineY, { align: "right" });

  if (transporte > 0) {
    lineY += lineGap;
    doc.text("Transporte:", labelX, lineY);
    doc.text(money(transporte), valueX, lineY, { align: "right" });
  }

  doc.setFont("helvetica", "bold");
  lineY += lineGap;
  doc.text("Total:", labelX, lineY);
  doc.text(money(totalPagar), valueX, lineY, { align: "right" });

  const formasPago = Array.isArray(pago) ? pago : pago ? [pago] : [];

  if (formasPago.length > 0) {
    let pagoY = Math.max(y + boxHeight + 5, lineY + 12);

    doc.setDrawColor(209, 213, 219);
    doc.line(marginX, pagoY, pageWidth - marginX, pagoY);
    pagoY += 8;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Formas de Pago", marginX, pagoY);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    pagoY += 6;

    for (const e of formasPago) {
      const metodo = safeText(e.MetodoPago);
      const monto = money(e.Valor_Pagar ?? 0);
      doc.text(`• ${metodo}: ${monto}`, marginX, pagoY);
      pagoY += 5;
    }
  }

  return doc.output("blob");
};
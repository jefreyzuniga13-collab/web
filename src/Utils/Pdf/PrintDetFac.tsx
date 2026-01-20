import type { PrintOrdenFactInterfaceRaw } from "@/Interfaces/Ecommerce/InvoiceOrderInterface";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type AutoTableDoc = jsPDF & { lastAutoTable?: { finalY: number } };
type Row = [string, string, string, string];

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

export const generateOrdeFacPDFFile = (orderFac: PrintOrdenFactInterfaceRaw): Blob => {
  const doc = new jsPDF({ unit: "mm", format: "a4" }) as AutoTableDoc;

  const marginX = 14;
  const marginY = 14;
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`Detalle Pedidio ${safeText(orderFac.DatosGenerales?.NoFactura)}`, marginX, marginY);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");

  const yInfo = marginY + 7;
  doc.text(`A nombre de: ${safeText(orderFac.DatosGenerales?.Nombrede)}`, marginX, yInfo);
  doc.text(`Fecha: ${fmtDate(orderFac.DatosGenerales?.FechaFactura ?? "")}`, marginX, yInfo + 6);

  // Separador
  doc.setDrawColor(180);
  doc.line(marginX, yInfo + 10, pageWidth - marginX, yInfo + 10);

  // Dirección
  const yDir = yInfo + 16;
  doc.setFont("helvetica", "bold");
  doc.text("Dirección:", marginX, yDir);
  doc.setFont("helvetica", "normal");
  doc.text(`Nombre: ${safeText(orderFac.DatosDireccion?.Nombre)}`, marginX, yDir + 6);
  doc.text(`Descripción: ${safeText(orderFac.DatosDireccion?.Descripcion)}`, marginX, yDir + 12);
  doc.text(`Referencia: ${safeText(orderFac.DatosDireccion?.Referencia)}`, marginX, yDir + 18);

  // Tabla del carrito
  const carritoRows: Row[] = [];

  for (const item of orderFac.Carrito ?? []) {
    carritoRows.push([
      safeText(item.Descripcion),
      safeText(item.UnidadMedida),
      money(item.Precio ?? 0),
      money(item.TotalMenu ?? 0),
    ]);

    for (const op of item.Opciones ?? []) {
      carritoRows.push([
        `   ${safeText(op.Descripcion)} (x${op.Cantidad ?? 0})`,
        safeText(op.UnidadMedida),
        money(op.Precio ?? 0),
        money(op.TotalMenu ?? 0),
      ]);
    }
  }

  const startCarritoY = yDir + 24;

  autoTable(doc, {
    startY: startCarritoY,
    theme: "grid",
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2 },
    head: [["Descripción", "UM", "Precio", "Total"]],
    body: carritoRows,
    headStyles: { fillColor: [245, 245, 245], textColor: 20 },
    columnStyles: {
      0: { halign: "left", cellWidth: 100 },
      1: { cellWidth: 25 },
      2: { cellWidth: 15 },
      3: { halign: "left", cellWidth: 25 },
    },
  });

  // Totales
  const yTotals = (doc.lastAutoTable?.finalY ?? startCarritoY) + 6;
  const p = orderFac.DetallePago;

  autoTable(doc, {
    startY: yTotals,
    theme: "plain",
    styles: { font: "helvetica", fontSize: 10, cellPadding: 1.5 },
    body: [
      ["SubTotal:", money(p?.SubTotal ?? 0)],
      ["Descuento:", money(p?.Descuento ?? 0)],
      ["IVA:", money(p?.Iva ?? 0)],
      ["Transporte:", money(p?.Transporte ?? 0)],
      ["Propina:", money(p?.Propina ?? 0)],
      ["Método de pago:", safeText(p?.MetodoPago)],
      [
        { content: "TOTAL A PAGAR:", styles: { fontStyle: "bold" } },
        { content: money(p?.Valor_Pagar ?? 0), styles: { fontStyle: "bold" } },
      ],
    ],
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 45, halign: "right" },
    },
    margin: { left: pageWidth - marginX - 90 },
  });

  return doc.output("blob");
};
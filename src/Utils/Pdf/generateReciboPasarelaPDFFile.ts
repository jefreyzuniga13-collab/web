import type { LogCartResponseDto } from "@/Interfaces/Crm/LogCartInterface";
import type { PrintOrdenFactInterfaceRaw } from "@/Interfaces/Ecommerce/InvoiceOrderInterface";
import jsPDF from "jspdf";

type GeneratePagoElectronicoPDFParams = {
  orderFac: PrintOrdenFactInterfaceRaw;
  transactionIdentifier?: string;
  telefono?: string;
  existingLog: LogCartResponseDto | null;
};

const money = (v: number) =>
  new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency: "NIO",
  }).format(v ?? 0);

    const fmtDate = (isoOrText: string) => {
    const d = new Date(isoOrText);
    if (Number.isNaN(d.getTime())) return isoOrText;

    return new Intl.DateTimeFormat("es-NI", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        // hour: "2-digit",
        // minute: "2-digit",
    }).format(d);
    };

const safeText = (v?: string | number | null) => (v ?? "").toString().trim();

export const generatePagoElectronicoPDFFile = ({
  orderFac,
  transactionIdentifier,
  telefono = "+505 7545 4150",
  existingLog,
}: GeneratePagoElectronicoPDFParams): Blob => {
  const pageWidth = 80;
  const pageHeight = 220;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [pageWidth, pageHeight],
  });

  const marginX = 6;
  const maxWidth = pageWidth - marginX * 2;
  let y = 10;

  const noFactura = safeText(orderFac.DatosGenerales?.NoFactura) || "SN";
  const nombreCliente = safeText(orderFac.DatosGenerales?.Nombrede) || "SN";
  const fechaFactura = fmtDate(orderFac.DatosGenerales?.FechaFactura ?? "") || "SN";
  const direccion = safeText(orderFac.DatosDireccion?.Descripcion) || "SN";
  const metodoPago = safeText(orderFac.DetallePago?.MetodoPago) || "Pago electrónico";
  const sucursal = safeText(existingLog?.branchName) || "SN";
  const atendidoPor = safeText(existingLog?.userName) || "SN";

  const subtotal = orderFac.DetallePago?.SubTotal ?? 0;
  const descuento = orderFac.DetallePago?.Descuento ?? 0;
  const iva = orderFac.DetallePago?.Iva ?? 0;
  const transporte = orderFac.DetallePago?.Transporte ?? 0;
  const propina = orderFac.DetallePago?.Propina ?? 0;
  const total = orderFac.DetallePago?.Valor_Pagar ?? 0;

  const addText = (
    label: string,
    value: string,
    options?: { boldValue?: boolean; gapAfter?: number }
  ) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(label, marginX, y);

    y += 4;

    doc.setFont("helvetica", options?.boldValue ? "bold" : "normal");
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(value || "SN", maxWidth);
    doc.text(lines, marginX, y);

    y += lines.length * 4 + (options?.gapAfter ?? 2);
  };

  const addDivider = () => {
    doc.setDrawColor(180);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 4;
  };

  const addCentered = (text: string, size = 10, style: "normal" | "bold" = "normal") => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, maxWidth);
    lines.forEach((line: string) => {
      const textWidth = doc.getTextWidth(line);
      const x = (pageWidth - textWidth) / 2;
      doc.text(line, x, y);
      y += 4.5;
    });
  };

  const addAmountLine = (label: string, value: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(9);
    doc.text(label, marginX, y);
    const valueWidth = doc.getTextWidth(value);
    doc.text(value, pageWidth - marginX - valueWidth, y);
    y += 5;
  };

  addCentered("COMPROBANTE DE PAGO", 12, "bold");
  addCentered("Pago electrónico", 10, "normal");
  y += 2;

  addDivider();

  addText("No. factura", noFactura);
  addText("Pedido / transacción", safeText(transactionIdentifier) || "SN");
  addText("Fecha", fechaFactura);
  addText("Cliente", nombreCliente);
  addText("Sucursal", sucursal);
  addText("Atendido por", atendidoPor);
  addText("Dirección", direccion);
  addText("Método de pago", metodoPago);

  addDivider();

  addAmountLine("Subtotal", money(subtotal));
  if (descuento > 0) addAmountLine("Descuento", money(descuento));
  addAmountLine("IVA", money(iva));
  addAmountLine("Transporte", money(transporte));
  if (propina > 0) addAmountLine("Propina", money(propina));

  addDivider();

  addAmountLine("TOTAL PAGADO", money(total), true);

  y += 3;
  addDivider();

  addText(
    "Observación",
    "Pago registrado como electrónico. Este comprobante puede utilizarse como soporte de confirmación del pago.",
    { gapAfter: 3 }
  );

  addText("Contacto", `Atención al cliente: ${telefono}`);

  y += 4;
  addCentered("Gracias por su compra", 9, "bold");

  const finalHeight = Math.max(y + 10, 120);
  doc.internal.pageSize.height = finalHeight;

  return doc.output("blob");
};
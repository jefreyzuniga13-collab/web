import dayjs from "dayjs";
import type { NavigateFunction } from "react-router-dom";
import type { AppDispatch } from "@/Context";
import { setContactCartBadge } from "@/Context/Slices/Ecommerce/cartBadgeSlice";
import { UserSessionService } from "@/Services/auth/UserSessionService";
import { CartService } from "@/Services/Ecommerce/CarPCGService";
import { InvoiceOrderService } from "@/Services/Ecommerce/InvoiceOrderService";
import { sendMediaEcommerce } from "@/Services/chat/MessageService";
import { generateOrdeFacPDFFile } from "@/Utils/Pdf/PrintDetFac";
import type { FacturaTempo } from "@/Interfaces/Ecommerce/FacturaTempo";
import type { LogCartResponseDto } from "@/Interfaces/Crm/LogCartInterface";
import type { ApiResponse } from "@/Interfaces/Auth/AuthInterface";
import type { Payload } from '@/Interfaces/Crm/LogCartInterface';

type ProcesarCheckoutExitosoParams = {
  invoiceReqFinal: FacturaTempo;
  payload: Payload;
  orderId: number;
  codSucursalFactura: string;
  consecutivo: number;
  fetchByContactId: (contactId: number) => Promise<LogCartResponseDto | null>;
  updatedStatus: (
    id: number,
    status: number,
  ) => Promise<LogCartResponseDto | null>;

  insertaFacturaAsync: (
    invoice: FacturaTempo,
  ) => Promise<ApiResponse<unknown>>;
  dispatch: AppDispatch;
  navigate: NavigateFunction;
};

export async function procesarCheckoutExitoso({
  invoiceReqFinal,
  payload,
  orderId,
  codSucursalFactura,
  consecutivo,
  fetchByContactId,
  updatedStatus,
  insertaFacturaAsync,
  dispatch,
  navigate,
}: ProcesarCheckoutExitosoParams): Promise<void> {
  const insertFacRes = await insertaFacturaAsync(invoiceReqFinal);

  if (!insertFacRes?.success) {
    throw new Error(
      insertFacRes?.message ?? "No fue posible insertar la factura.",
    );
  }

  const existingLog = await fetchByContactId(payload.contactId);

  if (existingLog?.id) {
    await updatedStatus(existingLog.id, 3);
  }

  await UserSessionService.revokeCartTempLink(orderId);

  const limRes = (await CartService.LimpiarFacturaTempo(
    String(payload.contactId),
    `CRM-${payload.contactId}`,
  ));

  if (limRes.success) {
    dispatch(
      setContactCartBadge({
        contactId: payload.contactId,
        hasCart: false,
        count: 0,
      }),
    );
  } else {
    throw new Error(limRes.message);
  }

  const date = dayjs().format("YYYYMMDD");

  const resPrintPDF = await InvoiceOrderService.PrintDetFac(
    codSucursalFactura,
    date,
    consecutivo,
    8,
  );

  if (resPrintPDF) {
    const pdfBlob = generateOrdeFacPDFFile(resPrintPDF.data);

    if (!(pdfBlob instanceof Blob) || pdfBlob.size < 100) {
      throw new Error("El PDF generado está vacío o inválido.");
    }

    const head = new Uint8Array(await pdfBlob.slice(0, 5).arrayBuffer());
    const magic = String.fromCharCode(...head);

    if (magic !== "%PDF-") {
      throw new Error(`El archivo no parece PDF válido (magic=${magic}).`);
    }

    const noFactura = String(
      resPrintPDF.data.DatosGenerales?.NoFactura ?? "",
    ).trim();
    
    const fileName = `Pedido-${noFactura || "SN"}.pdf`;
    const mime = pdfBlob.type || "application/pdf";
    const file = new File([pdfBlob], fileName, { type: mime });
    await sendMediaEcommerce(payload.conversationId, file, "");
  }

  navigate("/successOrder", { replace: true });
}
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
import { generatePagoElectronicoPDFFile } from "../Pdf/generateReciboPasarelaPDFFile";
import type {
  PowertranzVoidRequestDto
} from "@/Interfaces/Ecommerce/powertranzInterface";
import { powertranzService } from "@/Services/Ecommerce/PowerTranzService";
import { GENERAL_STATUS } from "@/Constants/status";
import { PCG_SERVICES } from "@/Constants/pcgservices";


type ProcesarCheckoutExitosoParams = {
  invoiceReqFinal: FacturaTempo;
  payload: Payload;
  orderId: number;
  transactionIdentifier: string
  usarPdfPagoElectronico: boolean
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
  transactionIdentifier,
  usarPdfPagoElectronico= false,
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

    const voidReq: PowertranzVoidRequestDto ={
      transactionIdentifier:transactionIdentifier,
      externalIdentifier:orderId.toString()
    }
    const voidRes = await powertranzService.void(
      voidReq
    )
    throw new Error(
      insertFacRes?.message ?? "No fue posible insertar la factura.",
    );

    if(voidRes.data.approved){
      throw new Error(
      voidRes.data.responseMessage ?? "Se ha anulado la transacción. Intente procesar el pago de nuevo",
      );
    }

    else if(!voidRes.data.approved){
      throw new Error(
      voidRes.data.responseMessage ?? "No fue posible anular la transacción",
      );
    }
  }

  const existingLog = await fetchByContactId(payload.contactId);


  if (existingLog?.id) {
    await updatedStatus(existingLog.id, GENERAL_STATUS.Cancelada);
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
    PCG_SERVICES.CRM,
  );

    if (resPrintPDF) {
    const archivos: File[] = [];

    const noFactura = String(
      resPrintPDF.data.DatosGenerales?.NoFactura ?? ""
    ).trim();

    const nombreBase = `Pedido-${noFactura || "SN"}`;

    const validarPdf = async (pdfBlob: Blob, fileName: string): Promise<File> => {
      if (!(pdfBlob instanceof Blob) || pdfBlob.size < 100) {
        throw new Error(`El PDF ${fileName} está vacío o inválido.`);
      }

      const head = new Uint8Array(await pdfBlob.slice(0, 5).arrayBuffer());
      const magic = String.fromCharCode(...head);

      if (magic !== "%PDF-") {
        throw new Error(`El archivo ${fileName} no parece PDF válido (magic=${magic}).`);
      }

      return new File([pdfBlob], fileName, {
        type: pdfBlob.type || "application/pdf",
      });
    };

    const pdfPedido = generateOrdeFacPDFFile(resPrintPDF.data, existingLog);
    archivos.push(await validarPdf(pdfPedido, `${nombreBase}.pdf`));

    if (usarPdfPagoElectronico) {
      const pdfPagoElectronico = generatePagoElectronicoPDFFile({
        orderFac: resPrintPDF.data,
        transactionIdentifier,
        telefono: "+505 7545 4150",
        existingLog,
      });

      archivos.push(
        await validarPdf(pdfPagoElectronico, `${nombreBase}-PagoElectronico.pdf`)
      );
    }

    for (const archivo of archivos) {
      await sendMediaEcommerce(payload.conversationId, archivo, "");
    }
  }

  navigate("/successOrder", { replace: true });
}
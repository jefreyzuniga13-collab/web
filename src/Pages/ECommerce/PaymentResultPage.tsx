import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { procesarCheckoutExitoso } from "@/Utils/ECommerce/procesarCheckoutExitoso";
import useInvoiceOrder from "@/Hooks/Ecommerce/payment/useInvoiceOrder";
import useLogCart from "@/Hooks/Crm/useLogCard";
import { useTarjetaPCG } from "@/Hooks/Ecommerce/payment/useTarjeta";
import type { FacturaTempo } from "@/Interfaces/Ecommerce/FacturaTempo";
import type { TarjetaModelInterface } from "@/Interfaces/Ecommerce/TarjetaInterface";
import { getLast4, getParam } from "@/Utils/ECommerce/formatters";
import {
  CHECKOUT_INVOICE_KEY,
  CHECKOUT_PAYLOAD_KEY,
  ECOMMERCEUSERID_KEY,
  SAVE_CARD_AFTER_PAYMENT_KEY,
} from "@/Utils/ECommerce/keys";

export default function PaymentResultPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const executedRef = useRef(false);

  const approved = getParam(params.get("approved"));
  const orderIdRaw = getParam(params.get("orderId"));
  const transactionIdentifier = getParam(params.get("transactionIdentifier"));
  const panToken =
    getParam(params.get("PanToken")) || getParam(params.get("panToken"));
  const cardBrand =
    getParam(params.get("CardBrand")) || getParam(params.get("cardBrand"));
  const cardSuffix =
    getParam(params.get("CardSuffix")) || getParam(params.get("cardSuffix"));
  const code = getParam(params.get("code"));
  const message = getParam(params.get("message"));

  const orderId = Number(orderIdRaw);
  const isApproved = approved.toLowerCase() === "true";

  const { InsertaFacturaAsync } = useInvoiceOrder();
  const { fetchByContactId, UpdatedStatus } = useLogCart();
  const { CreateCard } = useTarjetaPCG();

  useEffect(() => {
    if (executedRef.current) return;
    executedRef.current = true;

    const run = async () => {
      try {
        if (!isApproved) {
          throw new Error(message || code || "Pago no aprobado.");
        }

        if (!orderIdRaw || Number.isNaN(orderId) || orderId <= 0) {
          throw new Error("orderId inválido.");
        }

        if (!transactionIdentifier) {
          throw new Error("transactionIdentifier inválido.");
        }

        const payloadRaw = sessionStorage.getItem(CHECKOUT_PAYLOAD_KEY);
        const invoiceRaw = sessionStorage.getItem(CHECKOUT_INVOICE_KEY);
        const ecommerceUserIdRaw = sessionStorage.getItem(ECOMMERCEUSERID_KEY);
        const saveCardFlag = sessionStorage.getItem(SAVE_CARD_AFTER_PAYMENT_KEY);

        if (!payloadRaw || !invoiceRaw) {
          throw new Error("No hay contexto de checkout.");
        }

        const payload = JSON.parse(payloadRaw);
        const invoiceReqFinal = JSON.parse(invoiceRaw) as FacturaTempo;
        const ecommerceUserId = Number(JSON.parse(ecommerceUserIdRaw ?? "0"));

        const invoiceActualizada: FacturaTempo = {
          ...invoiceReqFinal,
          detallePago: (invoiceReqFinal.detallePago ?? []).map((item) => ({
            ...item,
            CodStrCadsaccion: String(orderId),
            Codtransaccion: transactionIdentifier,
            CuentaHabiente: cardBrand,
            ultDigito: cardSuffix,
          })),
        };

        await procesarCheckoutExitoso({
          invoiceReqFinal: invoiceActualizada,
          payload,
          orderId,
          transactionIdentifier,
          usarPdfPagoElectronico: true,
          codSucursalFactura: invoiceActualizada.sucursal,
          consecutivo: invoiceActualizada.numero,
          fetchByContactId,
          updatedStatus: UpdatedStatus,
          insertaFacturaAsync: InsertaFacturaAsync,
          dispatch,
          navigate,
        });

        if (saveCardFlag === "S" && ecommerceUserId > 0 && panToken) {
          const tarjetaNueva: TarjetaModelInterface = {
            numero: getLast4(cardSuffix || panToken),
            cVV2: "",
            fechaVencimiento: "",
            idUsuario: ecommerceUserId,
            porDefecto: false,
            titular: payload?.fullName ?? "",
            correo: payload?.email ?? "",
            telefono: payload?.phoneNumber ?? "",
            panToken,
            spiToken: "",
            marca: cardBrand || "",
            ultimos4: getLast4(cardSuffix || panToken),
          };

          await CreateCard(tarjetaNueva);
        }

        sessionStorage.removeItem(SAVE_CARD_AFTER_PAYMENT_KEY);
      } catch (err: unknown) {
        navigate("/unauthorized", { replace: true });

        if (err instanceof Error) {
          console.log(err.message);
        } else {
          console.log(err);
        }
      }
    };
    void run();
  }, [
    isApproved,
    orderId,
    orderIdRaw,
    transactionIdentifier,
    panToken,
    cardBrand,
    cardSuffix,
    code,
    message,
    fetchByContactId,
    UpdatedStatus,
    InsertaFacturaAsync,
    dispatch,
    navigate,
    CreateCard,
  ]);

  return null;
}
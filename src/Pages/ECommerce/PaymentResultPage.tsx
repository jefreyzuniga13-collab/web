import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { procesarCheckoutExitoso } from "@/Utils/ECommerce/procesarCheckoutExitoso";
import useInvoiceOrder from "@/Hooks/Ecommerce/useInvoiceOrder";
import useLogCart from "@/Hooks/Crm/useLogCard";
import type { FacturaTempo } from "@/Interfaces/Ecommerce/FacturaTempo";
import { getLast4, getParam } from "@/Utils/ECommerce/formatters";

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

  const orderId = Number(orderIdRaw);
  const isApproved = approved.toLowerCase() === "true";

  const { InsertaFacturaAsync } = useInvoiceOrder();
  const { fetchByContactId, UpdatedStatus } = useLogCart();

  useEffect(() => {
    if (executedRef.current) return;
    executedRef.current = true;

    const run = async () => {
      try {
        if (!isApproved) {
          console.log("Pago no aprobado en PaymentResultPage");
          navigate("/unauthorized", { replace: true });
          return;
        }

        if (!orderIdRaw || Number.isNaN(orderId) || orderId <= 0) {
          throw new Error("orderId inválido.");
        }

        const payloadRaw = sessionStorage.getItem("checkout_payload");
        const invoiceRaw = sessionStorage.getItem("checkout_invoice");

        if (!payloadRaw || !invoiceRaw) {
          throw new Error("No hay contexto de checkout.");
        }

        const payload = JSON.parse(payloadRaw);
        const invoiceReqFinal = JSON.parse(invoiceRaw) as FacturaTempo;

        const invoiceActualizada: FacturaTempo = {
          ...invoiceReqFinal,
          detallePago: (invoiceReqFinal.detallePago ?? []).map((item) => ({
            ...item,
            CodStrCadsaccion: String(orderId),
            Codtransaccion: transactionIdentifier,
            CuentaHabiente: cardBrand,
            ultDigito: getLast4(panToken),
          })),
        };

        await procesarCheckoutExitoso({
          invoiceReqFinal: invoiceActualizada,
          payload,
          orderId,
          codSucursalFactura: invoiceActualizada.sucursal,
          consecutivo: invoiceActualizada.numero,
          fetchByContactId,
          updatedStatus: UpdatedStatus,
          insertaFacturaAsync: InsertaFacturaAsync,
          dispatch,
          navigate,
        });
        
        //evitar err: unknown
      } catch (err: unknown) {
        console.log("Se produjo un error en PaymentResultPage:", err);
        navigate("/unauthorized", { replace: true });
        // navigate("/successOrder", { replace: true });
        if (err instanceof Error) {
          console.log(err.message); // Seguro
        } else {
          console.log(err);
        }

      }
    };

    run();
  }, [
    isApproved,
    orderId,
    orderIdRaw,
    transactionIdentifier,
    panToken,
    cardBrand,
    fetchByContactId,
    UpdatedStatus,
    InsertaFacturaAsync,
    dispatch,
    navigate,
  ]);

  return null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { procesarCheckoutExitoso } from "@/Utils/ECommerce/procesarCheckoutExitoso";
import useInvoiceOrder from "@/Hooks/Ecommerce/useInvoiceOrder";
import useLogCart from "@/Hooks/Crm/useLogCard";
import { useDispatch } from "react-redux";

function getParam(value: string | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export default function PaymentResultPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const executedRef = useRef(false);

  const approved = getParam(params.get("approved"));
  const orderId = Number(getParam(params.get("orderId")));
  const transactionIdentifier = getParam(params.get("transactionIdentifier"));

  const isApproved = useMemo(
    () => approved.toLowerCase() === "true",
    [approved]
  );

  const { InsertaFacturaAsync } = useInvoiceOrder();
  const { fetchByContactId, UpdatedStatus } = useLogCart();

  useEffect(() => {
    if (executedRef.current) return;
    executedRef.current = true;

    const run = async () => {
      try {

        //axitoso pasa
        if (!isApproved) {
          console.log("isApproved es: ", isApproved)
          navigate("/unauthorized", { replace: true });
          return;
        }

        // Aquí debes recuperar lo necesario para reconstruir la factura
        // Ideal: que backend ya tenga esto y solo confirmes
        //nueva factura creada en base a los datos proporcionado por la pasarela de pago, no por otro medio, ya no usar lo viejo, factura simplete nada completo
        const payloadRaw = sessionStorage.getItem("checkout_payload");
        const invoiceRaw = sessionStorage.getItem("checkout_invoice");

        if (!payloadRaw || !invoiceRaw) {
          throw new Error("No hay contexto de checkout.");
        }

        const payload = JSON.parse(payloadRaw);
        const invoiceReqFinal = JSON.parse(invoiceRaw);

        console.log("procesarCheckoutExitoso")
        await procesarCheckoutExitoso({
          invoiceReqFinal,
          payload,
          orderId,
          codSucursalFactura: invoiceReqFinal.sucursal,
          consecutivo: invoiceReqFinal.numero,
          fetchByContactId,
          updatedStatus: UpdatedStatus,
          insertaFacturaAsync: InsertaFacturaAsync,
          dispatch,
          navigate
        });

      } catch (err: any) {
        console.log("Se produce un error o no: ", err)
        
        navigate("/unauthorized", { replace: true });
      }
    };

    run();
  }, [
    isApproved,
    navigate,
    orderId,
    transactionIdentifier,
    fetchByContactId,
    UpdatedStatus,
    InsertaFacturaAsync,
    dispatch
  ]);

  return null;
}
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthenticate3ds2 } from "@/Hooks/Ecommerce/payment/useAuthenticate3ds2";
import { useCompleteFpi } from "@/Hooks/Ecommerce/payment/useCompleteFpi";
import type { PowertranzProcessPaymentResultDto } from "@/Interfaces/Ecommerce/powertranzInterface";

type PaymentHostedState = {
  payment?: {
    redirectData?: string | null;
    spiToken?: string | null;
    orderId?: string | null;
    mode?: "hosted" | "token-3ds" | null;
  };
};

function buildResultParamsFromProcess(data: PowertranzProcessPaymentResultDto): string {
  const payment = data.payment;

  // Construir los parámetros que se enviarán a la pantalla final del pago.
  const params = new URLSearchParams({
    approved: String(data.approved ?? false),
    orderId: payment?.orderIdentifier ?? "",
    transactionIdentifier: payment?.transactionIdentifier ?? "",
    panToken: payment?.panToken ?? "",
    cardBrand: payment?.cardBrand ?? "",
    cardSuffix: payment?.cardSuffix ?? "",
    code: data.isoResponseCode ?? "",
    message: data.responseMessage ?? "",
  });

  return params.toString();
}

export default function PaymentHostedPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const { mutateAsync: authenticate3dsAsync } = useAuthenticate3ds2();
  const { mutateAsync: completeFpiAsync } = useCompleteFpi();

  const state = location.state as PaymentHostedState | null;

  // Datos enviados desde el checkout al navegar hacia esta página.
  const redirectData = state?.payment?.redirectData ?? "";
  const spiToken = state?.payment?.spiToken ?? "";
  const orderId = state?.payment?.orderId ?? "";
  const mode = state?.payment?.mode ?? null;

  useEffect(() => {
    // Si no viene HTML de PowerTranz, no hay formulario que mostrar.
    if (!redirectData) {
      navigate("/unauthorized", { replace: true });
      return;
    }

    // Si no es flujo de token con 3DS, solo se muestra el iframe.
    if (mode !== "token-3ds") {
      return;
    }

    if (!orderId) {
      navigate("/unauthorized", { replace: true });
      return;
    }

    if (!spiToken) {
      return;
    }

    // Continuar el flujo 3DS desde el frontend.
    // Si PowerTranz devuelve otro redirectData, se muestra el nuevo challenge.
    // Si el 3DS ya viene completado sin challenge, se llama completeFpi.
    // Ojo: cuando el usuario completa un challenge en el iframe,
    // PowerTranz redirige al merchant-response y el backend completa el pago.
    const timer = window.setTimeout(async () => {
      try {
        const authRes = await authenticate3dsAsync({
          spiToken,
          orderId,
        });

        const authData = authRes.data;
        const threeDS = authData.riskManagement?.threeDSecure;
        const challengeRedirectData = threeDS?.redirectData ?? "";
        const authStatus = threeDS?.authenticationStatus ?? "";
        const isoCode = authData.isoResponseCode ?? "";

        // Si viene otro redirectData, todavía hay challenge 3DS que mostrar.
        // No se debe completar el pago aquí.
        if (challengeRedirectData) {
          navigate("/payment-hosted", {
            replace: true,
            state: {
              payment: {
                redirectData: challengeRedirectData,
                spiToken: null,
                orderId: authData.orderIdentifier ?? orderId,
                mode: "token-3ds",
              },
            },
          });
          return;
        }

        // Si PowerTranz indica que 3DS ya fue completado, se puede completar desde frontend.
        const threeDsCompleted = authStatus === "Y" || isoCode === "3D0";

        if (!threeDsCompleted) {
          navigate("/unauthorized", { replace: true });
          return;
        }

        // Completar el pago solo cuando no hay challenge pendiente.
        const completeRes = await completeFpiAsync({
          spiToken: authData.spiToken ?? spiToken,
          orderId: authData.orderIdentifier ?? orderId,
        });

        navigate(`/payment-result?${buildResultParamsFromProcess(completeRes.data)}`, {
          replace: true,
        });
      } catch {
        console.log("catch PaymentHostedPage");
        navigate("/unauthorized", { replace: true });
      }
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [
    redirectData,
    spiToken,
    orderId,
    mode,
    navigate,
    authenticate3dsAsync,
    completeFpiAsync,
  ]);

  if (!redirectData) {
    return null;
  }

  // Mostrar al montar la hosted-page, ocultar cuando se autentica
  return (
    <iframe
      srcDoc={redirectData}
      title="Powertranz Checkout"
      style={{ width: "100%", height: "100vh", border: "none" }}
      sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation allow-top-navigation-by-user-activation"
      allow="payment *"
      referrerPolicy="no-referrer"
    />
  );
}
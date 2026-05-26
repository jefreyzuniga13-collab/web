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
  const redirectData = state?.payment?.redirectData ?? "";
  const spiToken = state?.payment?.spiToken ?? "";
  const orderId = state?.payment?.orderId ?? "";
  const mode = state?.payment?.mode ?? null;

  useEffect(() => {
    if (!redirectData) {
      console.log("redirectData PaymentHostedPage", )
      navigate("/unauthorized", { replace: true });
      return;
    }

    if (mode !== "token-3ds") {
      return;
    }

    if (!orderId) {
      console.log("orderId PaymentHostedPage")
      navigate("/unauthorized", { replace: true });
      return;
    }

    if (!spiToken) {
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        const authRes = await authenticate3dsAsync({
          spiToken,
          orderId
        });

        const authData = authRes.data;
        const threeDS = authData.riskManagement?.threeDSecure;
        const challengeRedirectData = threeDS?.redirectData ?? "";
        const authStatus = threeDS?.authenticationStatus ?? "";
        const isoCode = authData.isoResponseCode ?? "";

        
        if (challengeRedirectData) {
          navigate("/payment-hosted", {
            replace: true,
            state: {
              payment: {
                redirectData: challengeRedirectData,
                spiToken: null,
                orderId: authData.orderIdentifier ?? orderId,
                mode: "token-3ds"
              }
            }
          });
          return;
        }

        const threeDsCompleted = authStatus === "Y" || isoCode === "3D0";

        if (!threeDsCompleted) {
          console.log("threeDsCompleted PaymentHostedPage", )
          navigate("/unauthorized", { replace: true });
          return;
        }

        const completeRes = await completeFpiAsync({
          spiToken: authData.spiToken ?? spiToken,
          orderId: authData.orderIdentifier ?? orderId
        });

        navigate(`/payment-result?${buildResultParamsFromProcess(completeRes.data)}`, {
          replace: true
        });
      } catch {
        console.log("catch  PaymentHostedPage")
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
    completeFpiAsync
  ]);

  if (!redirectData) {
    return null;
  }

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


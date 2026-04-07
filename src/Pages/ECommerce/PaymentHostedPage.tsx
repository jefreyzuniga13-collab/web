import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

type PaymentHostedState = {
  payment?: {
    redirectData?: string;
  };
};

export default function PaymentHostedPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as PaymentHostedState | null;
  const redirectData = state?.payment?.redirectData ?? "";

  useEffect(() => {
    if (!redirectData) {
      navigate("/unauthorized", { replace: true });
    }
  }, [redirectData, navigate]);

  if (!redirectData) {
    return null;
  }

  return (
    <section style={{ width: "100%", height: "100vh", overflow: "hidden" }}>
      <iframe
        srcDoc={redirectData}
        title="Powertranz Checkout"
        style={{ width: "100%", height: "100%", border: "none" }}
        sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation allow-top-navigation-by-user-activation"
        allow="payment *"
        referrerPolicy="no-referrer"
      />
    </section>
  );
}
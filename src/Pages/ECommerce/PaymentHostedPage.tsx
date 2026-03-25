import { useLocation } from "react-router-dom";

export default function PaymentHostedPage() {
  const location = useLocation();
  const payment = location.state?.payment;

  if (!payment?.redirectData) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        No se recibió información del pago.
      </div>
    );
  }

  return (
    <section style={{ width: "100%", height: "100vh" }}>
      <iframe
        srcDoc={payment.redirectData}
        title="Powertranz Checkout"
        style={{ width: "100%", height: "100%", border: "none" }}
        sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation allow-top-navigation-by-user-activation"
        allow="payment *"
        referrerPolicy="no-referrer"
      />
    </section>
  );
}
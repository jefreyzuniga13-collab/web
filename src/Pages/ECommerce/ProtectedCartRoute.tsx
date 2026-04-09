import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "@/Utils/ApiConfig";
import NotFound from "@/Pages/Auth/NotFound";
import CarPage from "@/Pages/ECommerce/CarPage";
import type { TempLinkResolveResponseDto } from "@/Interfaces/Common/GlobalPCGInterface";

type Status = "loading" | "ok" | "unauthorized";

const ProtectedCartRoute = () => {
  const [status, setStatus] = useState<Status>("loading");
  const [payload, setPayload] = useState<TempLinkResolveResponseDto | null>(null);
  const [searchParams] = useSearchParams();
  const token = searchParams.get("paynow");

  useEffect(() => {
    const validate = async () => {
      if (!token) {
        setStatus("unauthorized");
        return;
      }

      try {
        const { data } = await api.post<{ data: TempLinkResolveResponseDto }>(
          `/Auth/TempLink/Resolve`,
          token,
          {
            headers: { "Content-Type": "application/json" },
          }
        );

        const resolvedPayload = data.data;

        setPayload(resolvedPayload);

        console.log("Datos del resolve", JSON.stringify(data));

        const empresaId = resolvedPayload?.empresaId?.trim() ?? "";

        if (empresaId) {
          sessionStorage.setItem("EmpresaId", empresaId);
          localStorage.setItem("EmpresaId", empresaId);
          console.log("EmpresaId guardado:", empresaId);
        } else {
          sessionStorage.removeItem("EmpresaId");
          localStorage.removeItem("EmpresaId");
          console.warn("empresaId no vino en el payload");
        }

        console.log("sessionStorage EmpresaId:", sessionStorage.getItem("EmpresaId"));
        console.log("localStorage EmpresaId:", localStorage.getItem("EmpresaId"));

        setStatus("ok");
      } catch (error) {
        console.error("Error resolviendo token temporal:", error);
        sessionStorage.removeItem("EmpresaId");
        localStorage.removeItem("EmpresaId");
        setStatus("unauthorized");
      }
    };

    validate();
  }, [token]);

  if (status === "loading") {
    return (
      <main className="cart-page cart-page--centered">
        <p>Validando enlace...</p>
      </main>
    );
  }

  if (status === "unauthorized" || !payload) {
    return <NotFound />;
  }

  return <CarPage payload={payload} />;
};

export default ProtectedCartRoute;
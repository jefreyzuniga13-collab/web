import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import NotFound from "@/Pages/Auth/NotFound";
import CarPage from "@/Pages/ECommerce/CarPage";
import type { TempLinkResolveResponseDto } from "@/Interfaces/Common/GlobalPCGInterface";
import { CartService } from "@/Services/Ecommerce/CartService";

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
        //EL SERVICIO SOLO SE LLAMA DESDE AQUI NODESDE  OTRA PARTE
        const { data } = await CartService.resolveToken(token)

        const resolvedPayload = data;

        setPayload(resolvedPayload);

        const empresaId = resolvedPayload?.empresaId?.trim() ?? "";

        if (empresaId) {
          sessionStorage.setItem("EmpresaId", empresaId);
        } else {
          sessionStorage.removeItem("EmpresaId");
          localStorage.removeItem("EmpresaId");
          console.warn("empresaId no vino en el payload");
        }


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
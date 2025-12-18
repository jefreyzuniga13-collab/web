import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "@/Utils/ApiConfig";
type Status = "loading" | "ok" | "unauthorized";
import NotFound from '@/Pages/NotFound'
import CarPage from '@/Pages/Car/CarPage'
import type { TempLinkResolveResponseDto } from "@/Interfaces/GlobalPCGInterface";
// import type { ApiResponse } from "@/Interfaces/Auth/AuthInterface";

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
        const { data } = await api.post(`/Auth/TempLink/Resolve`, token, {
          headers: { "Content-Type": "application/json" },
        });

        // ApiResponse<TempLinkResolveResponseDto>
        setPayload(data.data);
        setStatus("ok");
      } catch {
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
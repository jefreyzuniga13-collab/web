import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { powertranzService, type Authenticate3dsRequest } from "@/Services/Ecommerce/PowerTranzService";
import type { PagarConTokenServiceResponse } from "@/Interfaces/Ecommerce/powertranzInterface";

type UseAuthenticate3ds2Options = {
  onSuccess?: (response: PagarConTokenServiceResponse) => void;
  onError?: (message: string, detail: string) => void;
};

function parsearError(error: Error): { message: string; detail: string } {
  try {
    const errorParseado = JSON.parse(error.message) as {
      message?: string;
      detail?: string;
    };

    return {
      message:
        typeof errorParseado.message === "string" && errorParseado.message.trim().length > 0
          ? errorParseado.message
          : "Ocurrió un error al autenticar 3DS.",
      detail:
        typeof errorParseado.detail === "string"
          ? errorParseado.detail
          : ""
    };
  } catch {
    return {
      message: "Ocurrió un error al autenticar 3DS.",
      detail: error.message
    };
  }
}

export function useAuthenticate3ds2(options?: UseAuthenticate3ds2Options) {
  return useMutation<PagarConTokenServiceResponse, Error, Authenticate3dsRequest>({
    mutationFn: powertranzService.authenticate3ds,
    onSuccess: (response) => {
      toast.success(response.data.responseMessage || response.message || "3DS autenticado correctamente.");
      options?.onSuccess?.(response);
    },
    onError: (error) => {
      const errorNormalizado = parsearError(error);
      toast.error(errorNormalizado.detail || errorNormalizado.message);
      options?.onError?.(errorNormalizado.message, errorNormalizado.detail);
    }
  });
}
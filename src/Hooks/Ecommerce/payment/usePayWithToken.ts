export default usePayWithToken
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {type PagarConTokenServiceResponse, type PowertranzPayWithTokenRequestDto} from "@/Interfaces/Ecommerce/powertranzInterface";
import { powertranzService } from "@/Services/Ecommerce/PowerTranzService";

type UsePayWithTokenOptions = {
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
          : "Ocurrió un error al procesar el pago con token.",
      detail:
        typeof errorParseado.detail === "string"
          ? errorParseado.detail
          : ""
    };

  } catch {
    return {
      message: "Ocurrió un error al procesar el pago con token.",
      detail: error.message
    };
  }
}

export function usePayWithToken(options?: UsePayWithTokenOptions) {
  return useMutation<PagarConTokenServiceResponse, Error, PowertranzPayWithTokenRequestDto>({
    mutationFn: powertranzService.payWithTokensync,
    onSuccess: (response) => {
      toast.success(response.data.responseMessage || response.message || "Pago iniciado correctamente.");
      options?.onSuccess?.(response);
    },
    onError: (error) => {
      const errorNormalizado = parsearError(error);
      toast.error(errorNormalizado.detail || errorNormalizado.message);
      options?.onError?.(errorNormalizado.message, errorNormalizado.detail);
    }
  });
}
import { useMutation } from "@tanstack/react-query";
import {toast} from 'react-toastify'
import { powertranzService } from "@/Services/Ecommerce/PowerTranzService";
import type { IniciarPagoServiceResponse, InitPaymentRequest } from "@/Interfaces/Ecommerce/powertranzInterface";

type UseIniciarPagoOptions = {
  onSuccess?: (response: IniciarPagoServiceResponse) => void;
  onError?: (message: string, detail: string) => void;
};

function parsearError(error: Error): { message: string; detail: string } {
  try {
    const errorParseado = JSON.parse(error.message) as {
      message?: string;
      detail?: string;
    };

    return {
      message: typeof errorParseado.message === "string" ? errorParseado.message : "Ocurrió un error.",
      detail: typeof errorParseado.detail === "string" ? errorParseado.detail : ""
    };
  } catch {
    return {
      message: "Ocurrió un error.",
      detail: error.message
    };
  }
}

export function useIniciarPago(options?: UseIniciarPagoOptions) {
  return useMutation<IniciarPagoServiceResponse, Error, InitPaymentRequest>({
    mutationFn: powertranzService.iniciarPago,
    onSuccess: (response) => {
      toast.success(response.data.responseMessage);

      options?.onSuccess?.(response);
    },
    onError: (error) => {
      const errorNormalizado = parsearError(error);

      toast.error(errorNormalizado.detail);

      options?.onError?.(errorNormalizado.message, errorNormalizado.detail);
    }
  });
}

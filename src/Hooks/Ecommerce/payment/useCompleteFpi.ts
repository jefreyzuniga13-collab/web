import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { powertranzService, type CompleteFpiRequest, type CompleteFpiServiceResponse } from "@/Services/Ecommerce/PowerTranzService";

type UseCompleteFpiOptions = {
  onSuccess?: (response: CompleteFpiServiceResponse) => void;
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
          : "Ocurrió un error al completar el pago FPI.",
      detail:
        typeof errorParseado.detail === "string"
          ? errorParseado.detail
          : ""
    };
  } catch {
    return {
      message: "Ocurrió un error al completar el pago FPI.",
      detail: error.message
    };
  }
}

export function useCompleteFpi(options?: UseCompleteFpiOptions) {
  return useMutation<CompleteFpiServiceResponse, Error, CompleteFpiRequest>({
    mutationFn: powertranzService.completeFpi,
    onSuccess: (response) => {
      toast.success(response.data.responseMessage || response.message || "Pago completado correctamente.");
      options?.onSuccess?.(response);
    },
    onError: (error) => {
      const errorNormalizado = parsearError(error);
      toast.error(errorNormalizado.detail || errorNormalizado.message);
      options?.onError?.(errorNormalizado.message, errorNormalizado.detail);
    }
  });
}
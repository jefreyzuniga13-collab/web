import { AxiosError } from "axios";
import { apiPCG } from "@/Utils/ApiConfig";
import type { ApiErrorResponse, ApiResponse, IniciarPagoServiceResponse, InitPaymentRequest, 
  InitResponse, PagarConTokenServiceResponse, PowertranzFpiResponseDto, PowertranzPayWithTokenRequestDto, 
  PowertranzVoidRequestDto, PowertranzVoidResponseDto } from "@/Interfaces/Ecommerce/powertranzInterface";

function obtenerMensajeError(
  error: unknown,
  fallbackMessage: string
): { message: string; detail: string } {
  if (error instanceof AxiosError) {
    const data = error.response?.data as Partial<ApiErrorResponse> | undefined;

    return {
      message:
        typeof data?.messages === "string" && data.messages.trim().length > 0
          ? data.messages
          : fallbackMessage,
      detail:
        typeof data?.details === "string" && data.details.trim().length > 0
          ? data.details
          : error.message
    };
  }

  if (error instanceof Error) {
    return {
      message: fallbackMessage,
      detail: error.message
    };
  }

  return {
    message: fallbackMessage,
    detail: "Ocurrió un error inesperado."
  };
}

function validarRespuestaInit(response: ApiResponse<InitResponse>): IniciarPagoServiceResponse {
  if (!response.success) {
    throw new Error(
      JSON.stringify({
        message: response.messages || "No fue posible iniciar el pago.",
        detail: response.details || ""
      })
    );
  }

  return {
    data: response.data,
    message: response.messages
  };
}

function validarRespuestaPayWithToken(
  response: ApiResponse<PowertranzFpiResponseDto>
): PagarConTokenServiceResponse {
  if (!response.success) {
    throw new Error(
      JSON.stringify({
        message: response.messages || "No fue posible iniciar el pago con token.",
        detail: response.details || ""
      })
    );
  }

  return {
    data: response.data,
    message: response.messages
  };
}

async function iniciarPago(payload: InitPaymentRequest): Promise<IniciarPagoServiceResponse> {
  try {
    const respuesta = await apiPCG.post<ApiResponse<InitResponse>>("/powertranz/init", payload);
    return validarRespuestaInit(respuesta.data);
  } catch (error: unknown) {
    const errorNormalizado = obtenerMensajeError(error, "No fue posible iniciar el pago.");
    throw new Error(JSON.stringify(errorNormalizado));
  }
}

async function voidsync(
  payload: PowertranzVoidRequestDto
): Promise<ApiResponse<PowertranzVoidResponseDto>> {
  const res = await apiPCG.post<ApiResponse<PowertranzVoidResponseDto>>("/powertranz/void", payload);
  return res.data;
}

async function payWithTokensync(
  payload: PowertranzPayWithTokenRequestDto
): Promise<PagarConTokenServiceResponse> {
  try {
    const res = await apiPCG.post<ApiResponse<PowertranzFpiResponseDto>>(
      "/powertranz/pay-with-token",
      payload
    );

    return validarRespuestaPayWithToken(res.data);
  } catch (error: unknown) {
    const errorNormalizado = obtenerMensajeError(error, "No fue posible iniciar el pago con token.");
    throw new Error(JSON.stringify(errorNormalizado));
  }
}

export const powertranzService = {
  iniciarPago,
  voidsync,
  payWithTokensync
};
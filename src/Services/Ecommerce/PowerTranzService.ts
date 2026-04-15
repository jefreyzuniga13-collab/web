import { AxiosError } from "axios";
import {apiPCG} from '@/Utils/ApiConfig'

import type {
  ApiErrorResponse,
  ApiResponse,
  InitPaymentRequest,
  InitResponse,
  // PowertranzRefundRequestDto,
  // PowertranzRefundResponseDto,
  PowertranzVoidRequestDto,
  PowertranzVoidResponseDto
} from "@/Interfaces/Ecommerce/powertranzInterface";

export type IniciarPagoServiceResponse = {
  data: InitResponse;
  message: string;
};

function obtenerMensajeError(error: unknown): { message: string; detail: string } {
  if (error instanceof AxiosError) {
    const data = error.response?.data as Partial<ApiErrorResponse> | undefined;

    return {
      message:
        typeof data?.messages === "string" && data.messages.trim().length > 0
          ? data.messages
          : "No fue posible iniciar el pago.",
      detail:
        typeof data?.details === "string" && data.details.trim().length > 0
          ? data.details
          : error.message
    };
  }

  if (error instanceof Error) {
    return {
      message: "No fue posible iniciar el pago.",
      detail: error.message
    };
  }

  return {
    message: "No fue posible iniciar el pago.",
    detail: "Ocurrió un error inesperado."
  };
}

function validarRespuestaApi(response: ApiResponse<InitResponse>): IniciarPagoServiceResponse {
  if (!response.success) {
    throw new Error(
      JSON.stringify({
        message: response.messages || "No fue posible iniciar el pago.",
        detail: ""
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

    return validarRespuestaApi(respuesta.data);
  } catch (error: unknown) {
    console.log("Accedio al catch", error)
    const errorNormalizado = obtenerMensajeError(error);
    throw new Error(JSON.stringify(errorNormalizado));
  }
}

async function voidsync(payload: PowertranzVoidRequestDto): Promise<ApiResponse<PowertranzVoidResponseDto>> {
    const res = await apiPCG.post<ApiResponse<PowertranzVoidResponseDto>>("/powertranz/void", payload);
    return res.data;
}

export const powertranzService = {
  iniciarPago,
  voidsync
}
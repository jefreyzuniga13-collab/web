import { AxiosError } from "axios";
import {apiPowerTranz} from '@/Utils/ApiConfig'

import type {
  ApiErrorResponse,
  ApiResponse,
  InitPaymentRequest,
  InitResponse
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
        typeof data?.mensaje === "string" && data.mensaje.trim().length > 0
          ? data.mensaje
          : "No fue posible iniciar el pago.",
      detail:
        typeof data?.detalle === "string" && data.detalle.trim().length > 0
          ? data.detalle
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
  if (!response.exito) {
    throw new Error(
      JSON.stringify({
        message: response.mensaje || "No fue posible iniciar el pago.",
        detail: ""
      })
    );
  }

  return {
    data: response.datos,
    message: response.mensaje
  };
}

async function iniciarPago(payload: InitPaymentRequest): Promise<IniciarPagoServiceResponse> {
  try {
    const respuesta = await apiPowerTranz.post<ApiResponse<InitResponse>>("/powertranz/init", payload);
    return validarRespuestaApi(respuesta.data);
  } catch (error: unknown) {
    const errorNormalizado = obtenerMensajeError(error);
    throw new Error(JSON.stringify(errorNormalizado));
  }
}

export const powertranzService = {
  iniciarPago
}
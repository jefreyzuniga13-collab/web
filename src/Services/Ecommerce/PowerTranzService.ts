import { AxiosError } from "axios";
import { apiPCG } from "@/Utils/ApiConfig";
import type {
  ApiErrorResponse,
  ApiResponse,
  IniciarPagoServiceResponse,
  InitPaymentRequest,
  InitResponse,
  PagarConTokenServiceResponse,
  PowertranzFpiResponseDto,
  PowertranzPayWithTokenRequestDto,
  PowertranzProcessPaymentResultDto,
  PowertranzVoidRequestDto,
  PowertranzVoidResponseDto
} from "@/Interfaces/Ecommerce/powertranzInterface";

type Authenticate3dsRequest = {
  spiToken: string;
  orderId: string;
};


type CompleteFpiRequest = {
  spiToken: string;
  orderId: string;
};

type CompleteFpiServiceResponse = {
  data: PowertranzProcessPaymentResultDto;
  message?: string;
};

function obtenerMensajeError(error: unknown, fallbackMessage: string) {
  if (error instanceof AxiosError) {
    const data = error.response?.data as Partial<ApiErrorResponse> | undefined;
    return {
      message: data?.messages || fallbackMessage,
      detail: data?.details || error.message
    };
  }

  if (error instanceof Error) {
    return { message: fallbackMessage, detail: error.message };
  }

  return { message: fallbackMessage, detail: "Error inesperado." };
}

function validarRespuestaInit(response: ApiResponse<InitResponse>): IniciarPagoServiceResponse {
  if (!response.success) {
    throw new Error(JSON.stringify({
      message: response.messages || "Error init",
      detail: response.details || ""
    }));
  }

  return { data: response.data, message: response.messages };
}

function validarRespuestaToken(
  response: ApiResponse<PowertranzFpiResponseDto>
): PagarConTokenServiceResponse {
  if (!response.success) {
    throw new Error(JSON.stringify({
      message: response.messages || "Error token",
      detail: response.details || ""
    }));
  }

  return { data: response.data, message: response.messages };
}

function validarRespuestaComplete(
  response: ApiResponse<PowertranzProcessPaymentResultDto>
): CompleteFpiServiceResponse {
  if (!response.success) {
    throw new Error(JSON.stringify({
      message: response.messages || "Error complete",
      detail: response.details || ""
    }));
  }

  return { data: response.data, message: response.messages };
}

export const powertranzService = {
  async iniciarPago(payload: InitPaymentRequest) {
    try {
      const res = await apiPCG.post<ApiResponse<InitResponse>>("/powertranz/init", payload);
      return validarRespuestaInit(res.data);
    } catch (e) {
      throw new Error(JSON.stringify(obtenerMensajeError(e, "Error init")));
    }
  },

  async payWithToken(payload: PowertranzPayWithTokenRequestDto) {
    try {
      const res = await apiPCG.post<ApiResponse<PowertranzFpiResponseDto>>(
        "/powertranz/pay-with-token",
        payload
      );
      return validarRespuestaToken(res.data);
    } catch (e) {
      throw new Error(JSON.stringify(obtenerMensajeError(e, "Error token")));
    }
  },

  async authenticate3ds(payload: Authenticate3dsRequest) {
    try {
      const res = await apiPCG.post<ApiResponse<PowertranzFpiResponseDto>>(
        "/powertranz/fpi/3ds2/authenticate",
        payload
      );
      return validarRespuestaToken(res.data);
    } catch (e) {
      throw new Error(JSON.stringify(obtenerMensajeError(e, "Error 3DS")));
    }
  },

  async completeFpi(payload: CompleteFpiRequest) {
    try {
      const res = await apiPCG.post<ApiResponse<PowertranzProcessPaymentResultDto>>(
        "/powertranz/fpi/complete",
        payload
      );
      return validarRespuestaComplete(res.data);
    } catch (e) {
      throw new Error(JSON.stringify(obtenerMensajeError(e, "Error complete FPI")));
    }
  },

  async void(payload: PowertranzVoidRequestDto) {
    const res = await apiPCG.post<ApiResponse<PowertranzVoidResponseDto>>(
      "/powertranz/void",
      payload
    );
    return res.data;
  }
};

export type {
  Authenticate3dsRequest,
  CompleteFpiRequest,
  CompleteFpiServiceResponse
};
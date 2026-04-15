export type InitPaymentRequest = {
  orderId: string;
  amount: number;
  currencyCode: string;
};

export type InitResponse = {
  orderId: string;
  transactionIdentifier: string;
  isoResponseCode: string;
  responseMessage: string;
  redirectData: string;
  spiToken: string;
};

export type ApiResponse<T> = {
  success: boolean;
  messages: string;
  data: T;
  details: string;
};

export type ApiErrorResponse = {
  success: boolean;
  messages: string;
  details: string;
};

export type PaymentFormState = {
  orderId: string;
  amount: string;
  currencyCode: string;
};

export type PaymentResultState =
  | {
      status: "idle";
    }
  | {
      status: "success";
      data: InitResponse;
      message: string;
    }
  | {
      status: "error";
      message: string;
      detail: string;
    };

export type PowertranzState = {
  form: PaymentFormState;
  result: PaymentResultState;
};

export type PaymentResultQuery = {
  approved: string;
  code: string;
  message: string;
  orderId: string;
};

/**
 * Representa un error individual en la respuesta de Powertranz
 */
export interface PowertranzErrorItemDto {
  code?: string;
  message?: string;
}

/**
 * Representa la respuesta de una operación de reembolso (Refund)
 */
export interface PowertranzRefundResponseDto {
  approved: boolean;
  authorizationCode?: string;
  isoResponseCode?: string;
  responseMessage?: string;
  transactionIdentifier?: string;
  originalTrxnIdentifier?: string;
  externalIdentifier?: string;
  orderIdentifier?: string;
  currencyCode?: string;
  cardBrand?: string;
  cardSuffix?: string;
  panToken?: string;
  rrn?: string;
  totalAmount?: number; // double en C# es number en TS
  transactionType: number;
  errors?: PowertranzErrorItemDto[];
}

/**
 * Representa la solicitud para realizar un reembolso
 */
export interface PowertranzRefundRequestDto {
  transactionIdentifier: string;
  totalAmount: number;
  externalIdentifier?: string;
  refund: boolean; // Valor por defecto true en C#
  taxAmount?: number;
  tipAmount?: number;
}

/**
 * Representa la solicitud para anulacion
 */
export interface PowertranzVoidRequestDto {
  externalIdentifier: string;
  transactionIdentifier: string;
}

/**
 * Representa la respuesta para anulacion
 */
export interface PowertranzVoidResponseDto {
  Approved: boolean;
  IsoResponseCode: string;
  ResponseMessage: string;
  spiToken: string;
}

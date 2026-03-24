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
  exito: boolean;
  mensaje: string;
  datos: T;
};

export type ApiErrorResponse = {
  exito: boolean;
  mensaje: string;
  detalle: string;
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
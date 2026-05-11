
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
      data: InitResponse | PowertranzFpiResponseDto;
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

export interface PowertranzErrorItemDto {
  code?: string;
  message?: string;
}

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
  totalAmount?: number;
  transactionType: number;
  errors?: PowertranzErrorItemDto[];
}

export interface PowertranzRefundRequestDto {
  transactionIdentifier: string;
  totalAmount: number;
  externalIdentifier?: string;
  refund: boolean;
  taxAmount?: number;
  tipAmount?: number;
}

export interface PowertranzVoidRequestDto {
  externalIdentifier: string;
  transactionIdentifier: string;
}

export interface PowertranzVoidResponseDto {
  approved: boolean;
  isoResponseCode: string;
  responseMessage: string;
  spiToken?: string | null;
  errors?: PowertranzErrorItemDto[] | null;
}

export interface PowertranzPayWithTokenRequestDto {
  transactionIdentifier: string | null;
  orderId: string;
  amount: number;
  currencyCode: string;
  capturaAutomatica: boolean;
  externalIdentifier: string | null;
  addressMatch: boolean;
  panToken: string;
  tokenType: string | null;
  cardCvv: string | null;
  billingAddress: PowertranzAddressDto | null;
  shippingAddress: PowertranzAddressDto | null;
  browserInfo: PowertranzBrowserInfoDto | null;
}

export interface PowertranzAddressDto {
  firstName: string | null;
  lastName: string | null;
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  countryCode: string | null;
  emailAddress: string | null;
  phoneNumber: string | null;
}

export interface PowertranzBrowserInfoDto {
  Language: string | null;
  ScreenHeight: string | null;
  ScreenWidth: string | null;
  TimeZone: string | null;
  UserAgent: string | null;
  Ip: string | null;
  JavaEnabled: boolean;
  JavascriptEnabled: boolean;
  ColorDepth: string | null;
  ChallengeWindowSize: number;
  ChallengeIndicator: string;
  AcceptHeader: string | null;
}

export interface PowertranzFpiResponseDto {
  transactionType: number | null;
  approved: boolean;
  authorizationCode: string | null;
  transactionIdentifier: string | null;
  totalAmount: number;
  currencyCode: string | null;
  cardBrand: string | null;
  cardSuffix: string | null;
  panToken: string | null;
  isoResponseCode: string | null;
  responseMessage: string | null;
  orderIdentifier: string | null;
  externalIdentifier: string | null;
  redirectData: string | null;
  spiToken: string | null;
  rRN: string | null;
  riskManagement: PowertranzRiskManagementDto | null;
  errors: PowertranzErrorItemDto[] | null;
}

export interface PowertranzRiskManagementDto {
  threeDSecure: PowertranzThreeDSecureInfoDto | null;
  fraudCheck: PowertranzFraudCheckDto | null;
}

export interface PowertranzThreeDSecureInfoDto {
  eci: string | null;
  xid: string | null;
  cavv: string | null;
  authenticationStatus: string | null;
  protocolVersion: string | null;
  fingerprintIndicator: string | null;
  dsTransId: string | null;
  responseCode: string | null;
  redirectData: string | null;
  authenticateUrl: string | null;
  cardholderInfo: string | null;
}

export interface PowertranzFraudCheckDto {
  fcResponseCode: string | null;
  fcScore: string | null;
  fcResponseMessage: string | null;
}

export interface IniciarPagoServiceResponse {
  data: InitResponse;
  message: string;
}

export interface PagarConTokenServiceResponse {
  data: PowertranzFpiResponseDto;
  message: string;
}

export interface PowertranzFpiResponseDto {
    transactionType: number | null;
    approved: boolean;
    authorizationCode: string | null;
    transactionIdentifier: string | null;
    totalAmount: number;
    currencyCode: string | null;
    cardBrand: string | null;
    cardSuffix: string | null;
    panToken: string | null;
    isoResponseCode: string | null;
    responseMessage: string | null;
    orderIdentifier: string | null;
    externalIdentifier: string | null;
    redirectData: string | null;
    spiToken: string | null;
    rRN: string | null;
    riskManagement: PowertranzRiskManagementDto | null;
    errors: PowertranzErrorItemDto[] | null;
}

export interface PowertranzRiskManagementDto {
    threeDSecure: PowertranzThreeDSecureInfoDto | null;
    fraudCheck: PowertranzFraudCheckDto | null;
}

export interface PowertranzRiskManagementDto {
    threeDSecure: PowertranzThreeDSecureInfoDto | null;
    fraudCheck: PowertranzFraudCheckDto | null;
}

export interface PowertranzThreeDSecureInfoDto {
    eci: string | null;
    xid: string | null;
    cavv: string | null;
    authenticationStatus: string | null;
    protocolVersion: string | null;
    fingerprintIndicator: string | null;
    dsTransId: string | null;
    responseCode: string | null;
    redirectData: string | null;
    authenticateUrl: string | null;
    cardholderInfo: string | null;
}

export interface PowertranzFraudCheckDto {
    fcResponseCode: string | null;
    fcScore: string | null;
    fcResponseMessage: string | null;
}

export interface PowertranzSpiTokenRequestDto {
    spiToken: string;
    orderId: string | null;
}

export interface PowertranzProcessPaymentResultDto {
  approved: boolean;
  isoResponseCode?: string | null;
  responseMessage?: string | null;
  transactionIdentifier?: string | null;
  spiToken?: string | null;
  payment?: {
    transactionType?: number | null;
    approved?: boolean;
    authorizationCode?: string | null;
    transactionIdentifier?: string | null;
    totalAmount?: number;
    currencyCode?: string | null;
    cardBrand?: string | null;
    cardSuffix?: string | null;
    panToken?: string | null;
    isoResponseCode?: string | null;
    responseMessage?: string | null;
    orderIdentifier?: string | null;
    externalIdentifier?: string | null;
    rrn?: string | null;
  };
}

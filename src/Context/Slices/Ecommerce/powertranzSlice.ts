import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  InitResponse,
  PaymentFormState,
  PaymentResultState,
  PowertranzState
} from "@/Interfaces/Ecommerce/powertranzInterface";

function generarOrderId(): string {
  return `ORD-${Date.now()}`;
}

const initialForm: PaymentFormState = {
  orderId: generarOrderId(),
  amount: "1",
  currencyCode: "558"
};

const initialResult: PaymentResultState = {
  status: "idle"
};

const initialState: PowertranzState = {
  form: initialForm,
  result: initialResult
};

type ResultadoExitosoPayload = {
  data: InitResponse;
  message: string;
};

type ResultadoErrorPayload = {
  message: string;
  detail: string;
};

const powertranzSlice = createSlice({
  name: "powertranz",
  initialState,
  reducers: {
    
    setOrderId: (state, action: PayloadAction<string>) => {
      state.form.orderId = action.payload;
    },

    setAmount: (state, action: PayloadAction<string>) => {
      state.form.amount = action.payload;
    },
    
    setCurrencyCode: (state, action: PayloadAction<string>) => {
      state.form.currencyCode = action.payload;
    },
    
    generarNuevoOrderId: (state) => {
      state.form.orderId = generarOrderId();
    },

    limpiarResultado: (state) => {
      state.result = { status: "idle" };
    },

    setResultadoExitoso: (state, action: PayloadAction<ResultadoExitosoPayload>) => {
      state.result = {
        status: "success",
        data: action.payload.data,
        message: action.payload.message
      };
    },
    setResultadoError: (state, action: PayloadAction<ResultadoErrorPayload>) => {
      state.result = {
        status: "error",
        message: action.payload.message,
        detail: action.payload.detail
      };
    }
  }
});

export const {
  setOrderId,
  setAmount,
  setCurrencyCode,
  generarNuevoOrderId,
  limpiarResultado,
  setResultadoExitoso,
  setResultadoError
} = powertranzSlice.actions;

export default powertranzSlice.reducer;
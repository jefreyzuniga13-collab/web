import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { toast } from "react-toastify";

import type {
  // ApiResponse,
  CarDto,
  DetalleFacturaTempoData,
  DetalleFacturaTempoRequest,
  ListDetalleCarrito,
} from "@/Interfaces/Crm/CartPCGInterface";

import { CartService } from "@/Services/Ecommerce/CarPCGService";
import type { RootState } from "@/Context/index";
import type { AxiosError } from "axios";

interface ApiErrorResponse {
  message?: string;
  data?: {
    header?: {
      msj?: string;
    };
  };
}

function getApiErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<ApiErrorResponse>;

  return (
    axiosError.response?.data?.data?.header?.msj ||
    axiosError.response?.data?.message ||
    axiosError.message ||
    "Ocurrió un error inesperado"
  );
}
export interface CartState {
  carPCG: CarDto[];
  listDetail: ListDetalleCarrito[];
  tempoState: DetalleFacturaTempoData | null;
  loading: boolean;
  error: string | null;
  activeContactId: number | null;
}

const initialState: CartState = {
  carPCG: [],
  listDetail: [],
  tempoState: null,
  loading: false,
  error: null,
  activeContactId: null,
};

function errMsg(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  const m = (error as { message?: unknown })?.message;
  return typeof m === "string" && m.trim() ? m : fallback;
}

/** Ajusta este mapper si ListDetalleCarrito tiene otros campos */
function mapTempoDetalleToListDetail(
  data: DetalleFacturaTempoData,
): ListDetalleCarrito[] {
  return data.detalle.map((d) => ({
    codigo: d.codigo,
    producto: d.producto,
    cantidad: d.cantidad,
    precio: d.precio,
    total: d.total,
    lote: d.lote,
    vencimiento: d.vencimiento,
    medida: d.medida,
    barras: d.barras,
    observacion: d.observacion,
  })) as unknown as ListDetalleCarrito[];
}

/* ======================= THUNKS ======================= */

export const addProductToCarAsync = createAsyncThunk<
  CarDto[],
  CarDto,
  { rejectValue: string }
>("cart/addProductToCar", async (req, { rejectWithValue }) => {
  // try {
  const res = await CartService.AddProductToCar(req);

  if (!res.success) {
    toast.error(res.message);
    return rejectWithValue(res.message);
  }

  return res.data;
  // } catch (error: unknown) {
  //   // const message = errMsg(error, "Error al agregar al carrito");
  //   // toast.error(message);
  //   return rejectWithValue(message);
  // }
});

export const addProductTempoAsync = createAsyncThunk<
  DetalleFacturaTempoData,
  DetalleFacturaTempoRequest,
  { rejectValue: string }
>("cart/addProductToTempo", async (req, { rejectWithValue }) => {
  try {
    const res = await CartService.AddProductToTempo(req);

    if (!res.success) {
      const message =
        res.data?.header?.msj ||
        res.message ||
        "No fue posible agregar el producto";

      // toast.error(message);
      return rejectWithValue(message);
    }

    return res.data;
  } catch (error: unknown) {
    const message = getApiErrorMessage(error);
    return rejectWithValue(message);
  }
});

// Obtener carrito normal
export const getProductFromCarAsync = createAsyncThunk<
  CarDto[],
  { codCliente: number; noPedido: number },
  { rejectValue: string }
>(
  "cart/getProductFromCar",
  async ({ codCliente, noPedido }, { rejectWithValue }) => {
    try {
      const data = await CartService.getProductFromCar(codCliente, noPedido);
      return data;
    } catch (error: unknown) {
      const message = errMsg(error, "Error al obtener el carrito");
      toast.error(message);
      return rejectWithValue(message);
    }
  },
);

// Quitar producto del carrito normal
export const updateCarAsync = createAsyncThunk<
  CarDto[],
  { idUsuario: number; noPedido: number; codProducto: string; unico: string },
  { rejectValue: string }
>(
  "cart/updateCar",
  async ({ idUsuario, noPedido, codProducto, unico }, { rejectWithValue }) => {
    // try {
    const res = await CartService.removeProductFromCar(
      idUsuario,
      noPedido,
      codProducto,
      unico,
    );

    if (!res.success) {
      toast.error(res.message);
      return rejectWithValue(res.message);
    }

    return res.data;
    // } catch (error: unknown) {
    //   const message = errMsg(error, "Error al actualizar el carrito");
    //   toast.error(message);
    //   return rejectWithValue(message);
    // }
  },
);

// Agregar varios productos al carrito normal
export const addProductsToCarAsync = createAsyncThunk<
  CarDto[],
  CarDto[],
  { rejectValue: string }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
>("cart/addProductsToCar", async (req, { rejectWithValue }) => {
  // try {
  const data = await CartService.AddProductsToCar(req);
  return data;
  // } catch (error: unknown) {
  //   // const message = errMsg(error, "Error al agregar productos al carrito");
  //   // toast.error(message);
  //   return rejectWithValue("");
  // }
});

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setListDetail(state, action: PayloadAction<ListDetalleCarrito[]>) {
      state.listDetail = action.payload;
    },
    setActiveContactId(state, action: PayloadAction<number | null>) {
      state.activeContactId = action.payload;
    },
    clearCart(state) {
      state.carPCG = [];
      state.listDetail = [];
      state.tempoState = null;
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    
    // ===== TEMPO =====
    builder
      .addCase(addProductTempoAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addProductTempoAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.tempoState = action.payload;

        // Si quieres reflejar detalle en listDetail:
        state.listDetail = mapTempoDetalleToListDetail(action.payload);
      })
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .addCase(addProductTempoAsync.rejected, (state, action) => {
        state.loading = false;
        // state.error =  "Error al agregar al carrito";
      });

    // ===== COMPATIBILIDAD (carrito normal: agregar 1) =====
    builder
      .addCase(addProductToCarAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addProductToCarAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.carPCG = action.payload;
      })
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .addCase(addProductToCarAsync.rejected, (state, action) => {
        state.loading = false;
        // state.error = action.payload ?? "Error al agregar al carrito";
      });

    // ===== CARRITO NORMAL: agregar varios =====
    builder
      .addCase(addProductsToCarAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addProductsToCarAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.carPCG = action.payload;
      })
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .addCase(addProductsToCarAsync.rejected, (state, action) => {
        state.loading = false;
        // state.error = action.payload ?? "Error al agregar productos al carrito";
      });

    // ===== CARRITO NORMAL: obtener =====
    builder
      .addCase(getProductFromCarAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProductFromCarAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.carPCG = action.payload;
      })
      .addCase(getProductFromCarAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Error al obtener el carrito";
      });

    // ===== CARRITO NORMAL: actualizar/remover =====
    builder
      .addCase(updateCarAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCarAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.carPCG = action.payload;
      })
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .addCase(updateCarAsync.rejected, (state, action) => {
        state.loading = false;
        // state.error = action.payload ?? "Error al actualizar el carrito";
      });
  },
});

export const { setListDetail, clearCart, setActiveContactId } =
  cartSlice.actions;
export default cartSlice.reducer;

/* ======================= SELECTORS ======================= */

export const selectCartState = (state: RootState): CartState => state.cart;

export const selectCarPCG = (state: RootState): CarDto[] =>
  selectCartState(state).carPCG;

export const selectTempoState = (
  state: RootState,
): DetalleFacturaTempoData | null => selectCartState(state).tempoState;

export const selectTempoHeader = (state: RootState) =>
  selectCartState(state).tempoState?.header ?? null;

export const selectTempoDetalle = (state: RootState) =>
  selectCartState(state).tempoState?.detalle ?? [];

export const selectCartLoading = (state: RootState): boolean =>
  selectCartState(state).loading;

export const selectCartError = (state: RootState): string | null =>
  selectCartState(state).error;

export const selectActiveContactId = (state: RootState): number | null =>
  selectCartState(state).activeContactId;

export const selectCartItemsCount = (state: RootState): number => {
  const tempo = selectCartState(state).tempoState;
  if (tempo?.detalle?.length) {
    return tempo.detalle.reduce((acc, d) => acc + (d.cantidad ?? 0), 0);
  }

  const { carPCG } = selectCartState(state);
  if (!Array.isArray(carPCG) || carPCG.length === 0) return 0;

  return carPCG.reduce((acc, cart) => {
    
    //No cotar los tipoComponene  'O', por qyue son opciones de los principlae no productos princiaples
    const count =
      cart.listDetalle?.reduce((sum, d) => sum + d.cantidad, 0) ?? 0;
    return acc + count;
  }, 0);
};

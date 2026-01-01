/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

import type { CarDto, ListDetalleCarrito } from "@/Interfaces/Crm/CartPCGInterface";
import { CartService } from "@/Services/Ecommerce/CarPCGService";
import type { RootState } from "@/Context/index"


export interface CartState {
  carPCG: CarDto[];
  listDetail: ListDetalleCarrito[];
  loading: boolean;
  error: string | null;
  activeContactId: number | null;
}


const initialState: CartState = {
  carPCG: [],
  listDetail: [],
  loading: false,
  error: null,
  activeContactId: null,
};

export const addProductToCarAsync = createAsyncThunk<
  CarDto[],
  CarDto,
  { rejectValue: string }
>(
  "cart/addProductToCar",
  async (req, { rejectWithValue }) => {
    try {
      const res = await CartService.AddProductToCar(req);

      if (res.success) {
        return res.data;
      } else {
        toast.error(res.message);
        return rejectWithValue(res.message);
      }
    } catch (error: any) {
      const message = error?.message ?? "Error al agregar al carrito";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const addProductsToCarAsync = createAsyncThunk<
  CarDto[],   // Resultado (CarDto[])
  CarDto[],   // Parámetro (CarDto[])
  { rejectValue: string }
>(
  "cart/addProductsToCar",
  async (req, { rejectWithValue }) => {
    try {
      const data = await CartService.AddProductsToCar(req); // CarDto[]
      return data;
    } catch (error: any) {
      const message = error?.message ?? "Error al agregar productos al carrito";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);


export const getProductFromCarAsync = createAsyncThunk<
  CarDto[],                         // Resultado
  { codCliente: number; noPedido: number },   // Parámetros
  { rejectValue: string }
>(
  "cart/getProductFromCar",
  async ({ codCliente, noPedido }, { rejectWithValue }) => {
    try {
      const data = await CartService.getProductFromCar(codCliente, noPedido);
      return data;
    } catch (error: any) {
      const message = error?.message ?? "Error al obtener el carrito";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);



export const updateCarAsync = createAsyncThunk<
  CarDto[],
  { idUsuario: number; noPedido: number, codProducto: string, unico: string },
  { rejectValue: string }
>(
  "cart/updateCar",
  async ({ idUsuario, noPedido, codProducto, unico }, { rejectWithValue }) => {
    try {

      const res = await CartService.removeProductFromCar(idUsuario, 
        noPedido, codProducto, unico);

      if (res.success) {
        // toast.success(res.message);
        return res.data;
      } else {
        toast.error(res.message);
        return rejectWithValue(res.message);
      }
    } catch (error: any) {
      const message = error?.message ?? "Error al actualizar el carrito";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

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
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(addProductToCarAsync.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addProductToCarAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.carPCG = action.payload;
      })
      .addCase(addProductToCarAsync.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload ?? "Error al agregar al carrito";
      });

    builder
      .addCase(addProductsToCarAsync.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addProductsToCarAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.carPCG = action.payload;
      })
      .addCase(addProductsToCarAsync.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload ?? "Error al agregar productos al carrito";
      });

    builder
      .addCase(getProductFromCarAsync.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProductFromCarAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.carPCG = action.payload;
      })
      .addCase(getProductFromCarAsync.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload ?? "Error al obtener el carrito";
      });

    builder
      .addCase(updateCarAsync.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCarAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.carPCG = action.payload;
      })
      .addCase(updateCarAsync.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload ?? "Error al actualizar el carrito";
      });
  },
});

export const { setListDetail, clearCart, setActiveContactId } = cartSlice.actions;
export default cartSlice.reducer;

export const selectCartState = (state: RootState): CartState => state.cart;

export const selectCarPCG = (state: RootState): CarDto[] =>
  selectCartState(state).carPCG;

export const selectCartLoading = (state: RootState): boolean =>
  selectCartState(state).loading;

export const selectCartError = (state: RootState): string | null =>
  selectCartState(state).error;

export const selectActiveContactId = (state: RootState): number | null =>
  state.cart.activeContactId;

export const selectCartItemsCount = (state: RootState): number => {
  const { carPCG } = selectCartState(state)

  // Asegurar que sea SIEMPRE un array
  if (!Array.isArray(carPCG) || carPCG.length === 0) return 0

  return carPCG.reduce((acc, cart) => {
    const count =
      cart.listDetalle?.reduce((sum, d) => sum + d.cantidad, 0) ?? 0
    return acc + count
  }, 0)
  
}

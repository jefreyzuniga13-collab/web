import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/Context";

type CartBadgeState = {
  byContactId: Record<number, { hasCart: boolean; count: number }>;
};

const initialState: CartBadgeState = { byContactId: {} };

const cartBadgeSlice = createSlice({
  name: "cartBadge",
  initialState,
  reducers: {
    setContactCartBadge(
      state,
      action: PayloadAction<{ contactId: number; hasCart: boolean; count: number }>
    ) {
      state.byContactId[action.payload.contactId] = {
        hasCart: action.payload.hasCart,
        count: action.payload.count
      };
    },
    clearContactCart(state, action: PayloadAction<number>) {
      delete state.byContactId[action.payload];
    },
    clearAllCartBadges(state) {
      state.byContactId = {};
    }
  }
});

export const { setContactCartBadge, clearContactCart, clearAllCartBadges } =
  cartBadgeSlice.actions;

export default cartBadgeSlice.reducer;

export const selectCartBadgeByContactId = (state: RootState) =>
  state.cartBadge.byContactId;

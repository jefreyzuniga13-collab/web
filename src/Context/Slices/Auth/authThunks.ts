import { createAsyncThunk } from "@reduxjs/toolkit";
import { logout } from "./authSlice";
import { limpiarAlmacenamientoCliente } from "@/Utils/clearClientStorage";

export const logoutThunk = createAsyncThunk(
  "auth/logoutThunk",
  async (_, { dispatch }) => {
    dispatch(logout());
    await limpiarAlmacenamientoCliente();
  }
);
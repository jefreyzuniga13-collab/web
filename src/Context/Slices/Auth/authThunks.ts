import { createAsyncThunk } from "@reduxjs/toolkit";
import { logout } from "./authSlice";
import { limpiarAlmacenamientoCliente } from "@/Utils/clearClientStorage";

// Al cerrar sesión, se limpia data local del navegador
export const logoutThunk = createAsyncThunk(
  "auth/logoutThunk",
  async (_, { dispatch }) => {
    dispatch(logout());
    await limpiarAlmacenamientoCliente();
  }
);
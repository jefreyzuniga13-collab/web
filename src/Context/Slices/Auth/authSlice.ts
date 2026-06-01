import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { authService } from "@/Services/auth/AuthService";
import type { AuthData, AuthMe } from "@/Interfaces/Auth/AuthInterface";
import type { RootState } from "@/Context/index";

interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  expiresAt: string | null;
  checkingSession: boolean;
  isRoot: boolean;
  isAdmin: boolean
  empresaId: string;
  companyImageUrl: string;
  companySistema: string;
  codReferenciaPCG: string;
  licenseExpireAt:string;
  showLicenseWarning: boolean
}

const initialState: AuthState = {
  isAuthenticated: false,
  userId: null,
  expiresAt: null,
  checkingSession: false,
  isRoot: false,
  isAdmin: false,
  empresaId: "",
  companyImageUrl: "",
  companySistema: "",
  codReferenciaPCG: "",
  licenseExpireAt:"",
  showLicenseWarning:false,
};

export const refreshTokenThunk = createAsyncThunk<
  AuthData,
  void,
  { rejectValue: string }
>(
  "auth/refreshToken",
  async (_, { rejectWithValue }) => {
    try {
      return await authService.refreshTokenAsync();
    } catch {
      return rejectWithValue("No se pudo renovar token");
    }
  }
);

export const checkSessionThunk = createAsyncThunk<
  AuthMe,
  void,
  { rejectValue: string }
>(
  "auth/checkSession",
  async (_, { rejectWithValue }) => {
    try {
      return await authService.meAsync();
    } catch {
      return rejectWithValue("No hay sesión activa");
    }
  }
);

const limpiarSesion = (state: AuthState) => {
  state.isAuthenticated = false;
  state.userId = null;
  state.expiresAt = null;
  state.checkingSession = false;
  state.isRoot = false;
  state.isAdmin = false;
  state.empresaId = "";
  state.companyImageUrl = "";
  state.companySistema = "";
  state.codReferenciaPCG = "";
  state.licenseExpireAt = "";
  state.showLicenseWarning = false;
};

const aplicarSesion = (state: AuthState, payload: AuthData | AuthMe) => {
  state.isAuthenticated = true;
  state.userId = String(payload.userId);
  state.empresaId = String(payload.empresaId ?? "");
  state.companyImageUrl = payload.companyImageUrl ?? "";
  state.companySistema = payload.companySistema ?? "";
  state.codReferenciaPCG = payload.codReferenciaPCG ?? "";
  state.isRoot = payload.isRoot;
  state.isAdmin = payload.isAdmin;
  state.checkingSession = false;
  state.licenseExpireAt = payload.licenseExpireAt;
  state.showLicenseWarning = payload.showLicenseWarning;
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<AuthData>) {
      aplicarSesion(state, action.payload);
      state.expiresAt = action.payload.expiresAt;
    },

    setAuthenticated(state, action: PayloadAction<boolean>) {
      if (action.payload) {
        state.isAuthenticated = true;
        state.checkingSession = false;
        return;
      }

      limpiarSesion(state);
    },

    startCheckingSession(state) {
      state.checkingSession = true;
    },

    finishCheckingSession(state) {
      state.checkingSession = false;
    },

    logout(state) {
      limpiarSesion(state);
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(refreshTokenThunk.pending, (state) => {
        state.checkingSession = true;
      })

      .addCase(refreshTokenThunk.fulfilled, (state, { payload }) => {
        aplicarSesion(state, payload);
        state.expiresAt = payload.expiresAt;
      })

      .addCase(refreshTokenThunk.rejected, (state) => {
        limpiarSesion(state);
      })

      .addCase(checkSessionThunk.pending, (state) => {
        state.checkingSession = true;
      })

      .addCase(checkSessionThunk.fulfilled, (state, { payload }) => {
        aplicarSesion(state, payload);
        state.expiresAt = null;
      })

      .addCase(checkSessionThunk.rejected, (state) => {
        limpiarSesion(state);
      });
  },
});

export const {
  setCredentials,
  setAuthenticated,
  startCheckingSession,
  finishCheckingSession,
  logout,
} = authSlice.actions;

export const selectIsAdmin = (state: RootState) =>
  state.auth.isAdmin;


export const selectIsRoot = (state: RootState) =>
  state.auth.isRoot

export const selectUserId = (state: RootState) =>
  Number(state.auth.userId);

export const selectEmpresaId = (state: RootState) =>
  state.auth.empresaId;

export const selectCompanyImageUrl = (state: RootState) =>
  state.auth.companyImageUrl || null;

export const selectCompanySistema = (state: RootState) =>
  state.auth.companySistema;

export const selectCodReferenciaPCG = (state: RootState) =>
  state.auth.codReferenciaPCG;

export const selectLicenseExpireAt = (state: RootState) =>
  state.auth.licenseExpireAt;

export const selectShowLicenseWarning = (state: RootState) =>
  state.auth.showLicenseWarning;

export const selectIsAuthenticated = (state: RootState) =>
  state.auth.isAuthenticated;


export default authSlice.reducer;
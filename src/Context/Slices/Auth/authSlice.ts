import {createAsyncThunk,createSlice,type PayloadAction} from "@reduxjs/toolkit";
import { authService } from "@/Services/auth/AuthService";
import type { AuthData, AuthMe } from "@/Interfaces/Auth/AuthInterface";
import type { RootState } from "@/Context";

interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  fullName: string;
  email: string;
  userImageUrl: string;
  expiresAt: string | null;
  checkingSession: boolean;
  isRoot: boolean;
  isAdmin: boolean;
  // Valor encriptado de empresa PCG
  empresaId: string;
  companyImageUrl: string;
  isClientEditableByAgent: boolean;
  // Vertical restaurante o PCG
  companySistema: string;
  // Permite más de un método de pago
  permiteMultiPago: boolean;
  //Permite multimoneda
  aplicaMultimoneda: boolean
  // Cliente permite pasarela
  permitePasarela: boolean;
  // Parametriza si la empresa permite aplicar descuentos
  aplicaDescuento: boolean;
  codReferenciaPCG: string;
  // Licencia
  licenseExpireAt: string;
  showLicenseWarning: boolean;
  showLicenseModalOnLogin: boolean;
  isAutomaticallyAssigned: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  userId: null,
  fullName: "",
  email: "",
  userImageUrl: "",
  expiresAt: null,
  checkingSession: false,
  isRoot: false,
  isAdmin: false,

  empresaId: "",
  companyImageUrl: "",
  companySistema: "",
  permiteMultiPago: false,
  permitePasarela: false,
  aplicaMultimoneda: false,
  aplicaDescuento: false,
  codReferenciaPCG: "",

  
  licenseExpireAt: "",
  showLicenseWarning: false,
  showLicenseModalOnLogin: false,


  isAutomaticallyAssigned: false,
  isClientEditableByAgent: false,
};

/**
 * Renovar token usando cookie refresh.
 */
export const refreshTokenThunk = createAsyncThunk<
  AuthData,
  void,
  { rejectValue: string }
>("auth/refreshToken", async (_, { rejectWithValue }) => {
  try {
    return await authService.refreshTokenAsync();
  } catch {
    return rejectWithValue("No se pudo renovar token");
  }
});

/**
 * Validar sesión actual desde backend.
 */
export const checkSessionThunk = createAsyncThunk<
  AuthMe,
  void,
  { rejectValue: string }
>("auth/checkSession", async (_, { rejectWithValue }) => {
  try {
    return await authService.meAsync();
  } catch {
    return rejectWithValue("No hay sesión activa");
  }
});

const limpiarSesion = (state: AuthState): void => {
  state.isAuthenticated = false;

  state.userId = null;

  state.fullName = "";
  state.email = "";
  state.userImageUrl = "";

  state.expiresAt = null;

  state.checkingSession = false;

  state.isRoot = false;
  state.isAdmin = false;

  state.empresaId = "";

  state.companyImageUrl = "";

  state.companySistema = "";

  state.permiteMultiPago = false;

  state.aplicaMultimoneda = false;
  state.permitePasarela = false;

  state.aplicaDescuento = false;

  state.codReferenciaPCG = "";

  state.licenseExpireAt = "";

  state.showLicenseWarning = false;

  state.showLicenseModalOnLogin = false;

  state.isAutomaticallyAssigned = false;

  state.isClientEditableByAgent = false;
};

const aplicarSesion = (state: AuthState, payload: AuthData | AuthMe): void => {
  state.isAuthenticated = true;

  state.userId = String(payload.userId ?? "");

  state.fullName = payload.fullName ?? "";

  state.email = payload.email ?? "";

  state.userImageUrl = payload.imageUrl ?? "";

  state.empresaId = String(payload.empresaId ?? "");

  state.companyImageUrl = payload.companyImageUrl ?? "";

  state.companySistema = payload.companySistema ?? "";

  state.permiteMultiPago = payload.permiteMultiPago ?? false;

  state.permitePasarela = payload.permitePasarela ?? false;
  state.aplicaMultimoneda = payload.aplicaMultimoneda;

  state.aplicaDescuento = payload.aplicaDescuento ?? false;

  state.codReferenciaPCG = payload.codReferenciaPCG ?? "";

  state.isRoot = Boolean(payload.isRoot);

  state.isAdmin = Boolean(payload.isAdmin);

  state.checkingSession = false;

  state.licenseExpireAt = payload.licenseExpireAt ?? "";

  state.showLicenseWarning = Boolean(payload.showLicenseWarning);

  state.isAutomaticallyAssigned = Boolean(payload.isAutomaticallyAssigned);

  state.isClientEditableByAgent = Boolean(payload.isClientEditableByAgent);
};

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    setCredentials(state, action: PayloadAction<AuthData>) {
      aplicarSesion(state, action.payload);

      state.expiresAt = action.payload.expiresAt;

      state.showLicenseModalOnLogin = Boolean(
        action.payload.showLicenseWarning,
      );
    },

    markLicenseModalShown(state) {
      state.showLicenseModalOnLogin = false;
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
  markLicenseModalShown,
} = authSlice.actions;

export const selectIsAdmin = (state: RootState) => state.auth.isAdmin;

export const selectIsRoot = (state: RootState) => state.auth.isRoot;

export const selectUserId = (state: RootState) =>
  Number(state.auth.userId ?? 0);

export const selectUserFullName = (state: RootState) => state.auth.fullName;

export const selectUserEmail = (state: RootState) => state.auth.email;

export const selectUserImageUrl = (state: RootState) =>
  state.auth.userImageUrl || null;

export const selectEmpresaId = (state: RootState) => state.auth.empresaId;

export const selectCompanyImageUrl = (state: RootState) =>
  state.auth.companyImageUrl || null;

export const selectCompanySistema = (state: RootState) =>
  state.auth.companySistema;

export const selectPermiteMultipago = (state: RootState) =>
  state.auth.permiteMultiPago;

export const selectPermiteMultiMoneda = (state: RootState) =>
  state.auth.aplicaMultimoneda;

export const selectPermitePasarela = (state: RootState) =>
  state.auth.permitePasarela;

export const selectAplicaDescuento = (state: RootState) =>
  state.auth.aplicaDescuento;

export const selectCodReferenciaPCG = (state: RootState) =>
  state.auth.codReferenciaPCG;

export const selectLicenseExpireAt = (state: RootState) =>
  state.auth.licenseExpireAt;

export const selectShowLicenseWarning = (state: RootState) =>
  state.auth.showLicenseWarning;

export const selectShowLicenseModalOnLogin = (state: RootState) =>
  state.auth.showLicenseModalOnLogin;

export const selectIsAuthenticated = (state: RootState) =>
  state.auth.isAuthenticated;

export const selectIsAutomaticallyAssigned = (state: RootState) =>
  state.auth.isAutomaticallyAssigned;

export const selectIsClientEditableByAgent = (state: RootState) =>
  state.auth.isClientEditableByAgent;

export default authSlice.reducer;
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { authService } from '@/Services/auth/AuthService';
import type { AuthData, AuthMe } from '@/Interfaces/Auth/AuthInterface';
import type { RootState } from '@/Context/index';

interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  expiresAt: string | null;
  checkingSession: boolean;
  roles: string[];
  empresaId: string;
  companyImageUrl: string;
  companySistema: string
}

const initialState: AuthState = {
  isAuthenticated: false,
  userId: null,
  expiresAt: null,
  checkingSession: false,
  roles: [],
  empresaId: '',
  companyImageUrl: '',
  companySistema:''
};

export const refreshTokenThunk = createAsyncThunk<
  AuthData,
  void,
  { rejectValue: string }
>(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      return await authService.refreshTokenAsync();
    } catch {
      return rejectWithValue('No se pudo renovar token');
    }
  }
);

export const checkSessionThunk = createAsyncThunk<
  AuthMe,
  void,
  { rejectValue: string }
>(
  'auth/checkSession',
  async (_, { rejectWithValue }) => {
    try {
      return await authService.meAsync();
    } catch {
      return rejectWithValue('No hay sesión activa');
    }
  }
);

const limpiarSesion = (state: AuthState) => {
  state.isAuthenticated = false;
  state.userId = null;
  state.expiresAt = null;
  state.checkingSession = false;
  state.roles = [];
  state.empresaId = '';
  state.companyImageUrl = '';
  state.companySistema = ''
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<AuthData>) {
      const creds = action.payload;

      state.isAuthenticated = true;
      state.userId = String(creds.userId);
      state.expiresAt = creds.expiresAt;
      state.empresaId = String(creds.empresaId ?? '');
      state.companyImageUrl = creds.companyImageUrl ?? '';
      state.checkingSession = false;
      state.companySistema = creds.companySistema
    },

    setAuthenticated(state, action: PayloadAction<boolean>) {
      state.isAuthenticated = action.payload;
      state.checkingSession = false;

      if (!action.payload) {
        limpiarSesion(state);
      }
    },

    startCheckingSession(state) {
      state.checkingSession = true;
    },

    finishCheckingSession(state) {
      state.checkingSession = false;
    },

    logout(state) {
      limpiarSesion(state);
    }
  },

  extraReducers: (builder) => {
    builder.addCase(refreshTokenThunk.pending, (state) => {
      state.checkingSession = true;
    });

    builder.addCase(refreshTokenThunk.fulfilled, (state, { payload }) => {
      state.isAuthenticated = true;
      state.userId = String(payload.userId);
      state.expiresAt = payload.expiresAt;
      state.empresaId = String(payload.empresaId ?? '');
      state.companyImageUrl = payload.companyImageUrl ?? '';
      state.checkingSession = false;
      state.companySistema = payload.companySistema
    });

    builder.addCase(refreshTokenThunk.rejected, (state) => {
      limpiarSesion(state);
    });

    builder.addCase(checkSessionThunk.pending, (state) => {
      state.checkingSession = true;
    });

    builder.addCase(checkSessionThunk.fulfilled, (state, { payload }) => {
      state.isAuthenticated = true;
      state.userId = String(payload.userId);
      state.expiresAt = null;
      state.roles = payload.roles ?? [];
      state.empresaId = String(payload.empresaId ?? '');
      state.companyImageUrl = payload.companyImageUrl ?? '';
      state.checkingSession = false;
      state.companySistema = payload.companySistema
    });

    builder.addCase(checkSessionThunk.rejected, (state) => {
      limpiarSesion(state);
    });
  }
});

export const {
  setCredentials,
  setAuthenticated,
  startCheckingSession,
  finishCheckingSession,
  logout
} = authSlice.actions;

export const selectIsAdmin = (state: RootState) =>
  state.auth.roles.some(
    role =>
      role.toLowerCase() === 'admin' ||
      role.toLowerCase() === 'root'
  );

export const selectUserId = (state: RootState) =>
  Number(state.auth.userId);

export const selectEmpresaId = (state: RootState) =>
  state.auth.empresaId;

export const selectCompanyImageUrl = (state: RootState) =>
  state.auth.companyImageUrl || null;

export const selectCompanySistema = (state: RootState) =>
  state.auth.companySistema;

export const selectIsAuthenticated = (state: RootState) =>
  state.auth.isAuthenticated;

export const selectRoles = (state: RootState) =>
  state.auth.roles;

export default authSlice.reducer;
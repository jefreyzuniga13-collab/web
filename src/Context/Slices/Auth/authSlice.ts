import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { authService } from '@/Services/auth/AuthService';
import type { AuthData, AuthMe } from '@/Interfaces/Auth/AuthInterface';
import type { RootState } from '@/Context/index';
interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  expiresAt: string | null;
  checkingSession: boolean;
  roles: string[];
}

const initialState: AuthState = {
  isAuthenticated: false,
  userId: null,
  expiresAt: null,
  checkingSession: false,
  roles: []
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

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<AuthData>) {
      const creds = action.payload;
      state.isAuthenticated = true;
      state.userId = String(creds.userId);
      state.expiresAt = creds.expiresAt;
      state.checkingSession = false;
    },
    setAuthenticated(state, action: PayloadAction<boolean>) {
      state.isAuthenticated = action.payload;
      state.checkingSession = false;

      if (!action.payload) {
        state.userId = null;
        state.expiresAt = null;
        state.roles = [];
      }
    },
    startCheckingSession(state) {
      state.checkingSession = true;
    },
    finishCheckingSession(state) {
      state.checkingSession = false;
    },
    logout(state) {
      state.isAuthenticated = false;
      state.userId = null;
      state.expiresAt = null;
      state.checkingSession = false;
      state.roles = [];
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
      state.checkingSession = false;
    });

    builder.addCase(refreshTokenThunk.rejected, (state) => {
      state.isAuthenticated = false;
      state.userId = null;
      state.expiresAt = null;
      state.checkingSession = false;
      state.roles = [];
    });

    builder.addCase(checkSessionThunk.pending, (state) => {
      state.checkingSession = true;
    });

    builder.addCase(checkSessionThunk.fulfilled, (state, { payload }) => {
      state.isAuthenticated = true;
      state.userId = String(payload.userId);
      state.expiresAt = null;
      state.roles = payload.roles ?? [];
      state.checkingSession = false;
    });

    builder.addCase(checkSessionThunk.rejected, (state) => {
      state.isAuthenticated = false;
      state.userId = null;
      state.expiresAt = null;
      state.roles = [];
      state.checkingSession = false;
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
    r => r.toLowerCase() === 'admin' || r.toLowerCase() === 'root'
  );

  export const selectUserId = (state: RootState) => Number(state.auth.userId);

export default authSlice.reducer;
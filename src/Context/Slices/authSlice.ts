import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { authService } from '@/Services/AuthService'
import type { AuthData } from '@/Interfaces/Auth/AuthInterface'

interface AuthState {
  accessToken:  string | null
  refreshToken: string | null
  userId:       string | null
  contactId:    string | null
  expiresAt:    string | null
}

const saved = localStorage.getItem('auth')
const parsed: AuthData | null = saved ? JSON.parse(saved) : null

const initialState: AuthState = parsed
  ? {
      accessToken:  parsed.accessToken,
      refreshToken: parsed.refreshToken,
      userId:       parsed.userId,
      contactId:    parsed.contactId,
      expiresAt:    parsed.expiresAt
    }
  : {
      accessToken:  null,
      refreshToken: null,
      userId:       null,
      contactId:    null,
      expiresAt:    null
    }

// Thunk para renovar tokens cuando expira el accessToken
export const refreshTokenThunk = createAsyncThunk<
  AuthData,
  void,
  { rejectValue: string; state: { auth: AuthState } }
>(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    const token = getState().auth.refreshToken
    if (!token) return rejectWithValue('No hay refresh token')
    try {
      return await authService.refreshTokenAsync({ refreshToken: token })
    } catch {
      return rejectWithValue('No se pudo renovar token')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<AuthData>) {
      const creds = action.payload
      state.accessToken  = creds.accessToken
      state.refreshToken = creds.refreshToken
      state.userId       = creds.userId
      state.contactId    = creds.contactId
      state.expiresAt    = creds.expiresAt

      localStorage.setItem('auth', JSON.stringify(creds))
    },
    logout(state) {
      state.accessToken  = null
      state.refreshToken = null
      state.userId       = null
      state.contactId    = null
      state.expiresAt    = null

      // 3. Eliminar del storage
      localStorage.removeItem('auth')
    }
  },
  extraReducers: builder => {
    builder.addCase(refreshTokenThunk.fulfilled, (state, { payload }) => {
      state.accessToken  = payload.accessToken
      state.refreshToken = payload.refreshToken
      state.expiresAt    = payload.expiresAt

      // Actualizar storage tras refresh exitoso
      localStorage.setItem('auth', JSON.stringify(payload))
    })
  }
})

export const { setCredentials, logout } = authSlice.actions
export default authSlice.reducer
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AuthData } from '@/Interfaces/Auth/AuthInterface'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  userId: string | null
  contactId: string | null
  expiresAt: string | null
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  userId: null,
  contactId: null,
  expiresAt: null
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<AuthData>) {
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      state.userId = action.payload.userId
      state.contactId = action.payload.contactId
      state.expiresAt = action.payload.expiresAt
    },
    setTokens(
      state,
      action: PayloadAction<{
        accessToken: string
        refreshToken: string
      }>
    ) {
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
    },
    logout(state) {
      state.accessToken = null
      state.refreshToken = null
      state.userId = null
      state.contactId = null
      state.expiresAt = null
    }
  }
})

export const { setCredentials, setTokens, logout } = authSlice.actions
export default authSlice.reducer
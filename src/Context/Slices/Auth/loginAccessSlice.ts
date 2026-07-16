import {
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit"

import type {
  LoginAccessRequestResponseDto,
  LoginAccessRequestStatus,
  LoginConflictResponseDto,
  LoginRequestResolvedDto,
} from "@/Interfaces/Auth/AuthInterface"

export interface LoginAccessState {
  /**
   * Indica que el nuevo dispositivo está esperando
   * una respuesta del dispositivo actualmente conectado.
   */
  waiting: boolean

  /**
   * Indica que se está aprobando, rechazando,
   * cancelando o completando la solicitud.
   */
  processing: boolean

  requestKey: string | null
  status: LoginAccessRequestStatus | string | null

  requestedAt: string | null
  expiresAt: string | null
  resolvedAt: string | null
  completedAt: string | null

  currentDevice: string | null
  currentLocation: string | null
  currentPublicIp: string | null

  error: string | null
}

const initialState: LoginAccessState = {
  waiting: false,
  processing: false,

  requestKey: null,
  status: null,

  requestedAt: null,
  expiresAt: null,
  resolvedAt: null,
  completedAt: null,

  currentDevice: null,
  currentLocation: null,
  currentPublicIp: null,

  error: null,
}

const loginAccessSlice = createSlice({
  name: "loginAccess",
  initialState,

  reducers: {
    /**
     * Se ejecuta cuando el login devuelve
     * 409 ACTIVE_SESSION_EXISTS.
     */
    startLoginAccessWaiting(
      state,
      action: PayloadAction<LoginConflictResponseDto>
    ) {
      const payload = action.payload

      state.waiting = true
      state.processing = false

      state.requestKey = payload.requestKey
      state.status = payload.status

      state.requestedAt = payload.requestedAt
      state.expiresAt = payload.expiresAt
      state.resolvedAt = null
      state.completedAt = null

      state.currentDevice =
        payload.currentDevice ?? null

      state.currentLocation =
        payload.currentLocation ?? null

      state.currentPublicIp =
        payload.currentPublicIp ?? null

      state.error = null
    },

    /**
     * Sincroniza el estado completo obtenido
     * mediante consulta HTTP.
     */
    setLoginAccessRequest(
      state,
      action: PayloadAction<LoginAccessRequestResponseDto>
    ) {
      const payload = action.payload

      state.requestKey = payload.requestKey
      state.status = payload.status

      state.requestedAt = payload.requestedAt
      state.expiresAt = payload.expiresAt
      state.resolvedAt = payload.resolvedAt ?? null
      state.completedAt = payload.completedAt ?? null

      /*
       * Cuando viene la solicitud completa, estos datos
       * representan el nuevo dispositivo.
       */
      state.currentDevice =
        payload.device ?? state.currentDevice

      state.currentLocation =
        payload.location ?? state.currentLocation

      state.currentPublicIp =
        payload.publicIp ?? state.currentPublicIp

      state.error = null
    },

    /**
     * Actualiza el estado mediante un evento SignalR.
     */
    resolveLoginAccessRequest(
      state,
      action: PayloadAction<LoginRequestResolvedDto>
    ) {
      const payload = action.payload

      if (
        state.requestKey &&
        state.requestKey !== payload.requestKey
      ) {
        return
      }

      state.requestKey = payload.requestKey
      state.status = payload.status
      state.resolvedAt = payload.resolvedAt ?? null
      state.processing = false
      state.error = null

      /*
       * Approved permanece en waiting mientras
       * se completa el login y se reciben las cookies.
       */
      state.waiting =
        payload.status.toLowerCase() === "approved"
    },

    setLoginAccessProcessing(
      state,
      action: PayloadAction<boolean>
    ) {
      state.processing = action.payload
    },

    setLoginAccessError(
      state,
      action: PayloadAction<string | null>
    ) {
      state.error = action.payload
      state.processing = false
    },

    markLoginAccessCompleted(state) {
      state.status = "Completed"
      state.waiting = false
      state.processing = false
      state.completedAt = new Date().toISOString()
      state.error = null
    },

    clearLoginAccessState() {
      return initialState
    },
  },
})

export const {
  startLoginAccessWaiting,
  setLoginAccessRequest,
  resolveLoginAccessRequest,
  setLoginAccessProcessing,
  setLoginAccessError,
  markLoginAccessCompleted,
  clearLoginAccessState,
} = loginAccessSlice.actions

export default loginAccessSlice.reducer
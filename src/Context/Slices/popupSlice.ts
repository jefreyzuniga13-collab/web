import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { NotificationEvent } from '@/Hooks/Hub/useNotificationsHub'

interface PopupState {
  /** Cola de eventos pendientes de mostrar */
  queue: NotificationEvent[]
}

const initialState: PopupState = {
  queue: []
}

const popupSlice = createSlice({
  name: 'popup',
  initialState,
  reducers: {
    /** Añade un nuevo evento a la cola */
    enqueuePopup(state, action: PayloadAction<NotificationEvent>) {
      state.queue.push(action.payload)
    },
    /** Elimina el evento ya mostrado de la cola */
    dequeuePopup(state) {
      state.queue.shift()
    }
  }
})

export const { enqueuePopup, dequeuePopup } = popupSlice.actions
export default popupSlice.reducer

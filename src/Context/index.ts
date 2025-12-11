import { configureStore } from '@reduxjs/toolkit'

import authReducer from '@/Context/Slices/authSlice'
import uiReducer from '@/Context/Slices/uiSlice'
import userReducer from '@/Context/Slices/userSlice'
import notificationsReducer from '@/Context/Slices/notificationsSlice'
import popupReducer from '@/Context/Slices/popupSlice'
import assignModalReducer from '@/Context/Slices/assignModalSlice'
import activeSesionModalReducer from '@/Context/Slices/activeSesionModalSlice'
import cartReducer from '@/Context/Slices/Cart/cartSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    users: userReducer,
    notifications: notificationsReducer,
    popup: popupReducer,
    assignModal: assignModalReducer,
    activeSesionModal: activeSesionModalReducer,
    cart: cartReducer,
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
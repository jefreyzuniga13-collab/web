import { configureStore } from '@reduxjs/toolkit'

import authReducer from '@/Context/Slices/Auth/authSlice'
import uiReducer from '@/Context/Slices/Chat/uiSlice'
import userReducer from '@/Context/Slices/Auth/userSlice'
import notificationsReducer from '@/Context/Slices/Crm/notificationsSlice'
import popupReducer from '@/Context/Slices/Chat/popupSlice'
import assignModalReducer from '@/Context/Slices/Chat/assignModalSlice'
import activeSesionModalReducer from '@/Context/Slices/Chat/activeSesionModalSlice'
import cartReducer from '@/Context/Slices/Ecommerce/cartSlice'
import cartBadgeReducer from '@/Context/Slices/Ecommerce/cartBadgeSlice'
import powerTranzReducer from '@/Context/Slices/Ecommerce/powertranzSlice'

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
    cartBadge: cartBadgeReducer,

    //pasarela de pago con powertranz
    powerTranz: powerTranzReducer
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch;
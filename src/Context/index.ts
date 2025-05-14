import { configureStore } from '@reduxjs/toolkit'
import authReducer      from '@/Context/Slices/authSlice'
import uiReducer        from '@/Context/Slices/uiSlice'
import userReducer from '@/Context/Slices/userSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui:   uiReducer,
    users: userReducer
  }
})

export type RootState  = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
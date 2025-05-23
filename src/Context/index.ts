  import { configureStore } from '@reduxjs/toolkit'
  import authReducer      from '@/Context/Slices/authSlice'
  import uiReducer        from '@/Context/Slices/uiSlice'
  import userReducer from '@/Context/Slices/userSlice'
  import notificationsReducer from '@/Context/Slices/notificationsSlice'

  export const store = configureStore({
    reducer: {
      auth: authReducer,
      ui:   uiReducer,
      users: userReducer,
      notifications: notificationsReducer,
    }
  })

  export type RootState  = ReturnType<typeof store.getState>
  export type AppDispatch = typeof store.dispatch
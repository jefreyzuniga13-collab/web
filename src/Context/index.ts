  import { configureStore } from '@reduxjs/toolkit'
  import authReducer      from '@/Context/Slices/authSlice'
  import uiReducer        from '@/Context/Slices/uiSlice'
  import userReducer from '@/Context/Slices/userSlice'
  import notificationsReducer from '@/Context/Slices/notificationsSlice'
  import popupReducer     from '@/Context/Slices/popupSlice'
  import assignModalSlice     from '@/Context/Slices/assignModalSlice'
  import  activeSesionModalSlice from '@/Context/Slices/activeSesionModalSlice'

  export const store = configureStore({
    reducer: {
      auth: authReducer,
      ui:   uiReducer,
      users: userReducer,
      notifications: notificationsReducer,
      popup:          popupReducer,
      assignModal: assignModalSlice,
      activeSesionModal: activeSesionModalSlice
    }
  })

  export type RootState  = ReturnType<typeof store.getState>
  export type AppDispatch = typeof store.dispatch
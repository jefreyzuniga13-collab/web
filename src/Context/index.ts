import authReducer from "@/Context/Slices/Auth/authSlice"

import uiReducer from "@/Context/Slices/Chat/uiSlice"
import userReducer from "@/Context/Slices/Auth/userSlice"
import notificationsReducer from "@/Context/Slices/Crm/notificationsSlice"
import popupReducer from "@/Context/Slices/Chat/popupSlice"
import assignModalReducer from "@/Context/Slices/Chat/assignModalSlice"
import activeSesionModalReducer from "@/Context/Slices/Chat/activeSesionModalSlice"

import cartReducer from "@/Context/Slices/Ecommerce/cartSlice"
import cartBadgeReducer from "@/Context/Slices/Ecommerce/cartBadgeSlice"
import powerTranzReducer from "@/Context/Slices/Ecommerce/powertranzSlice"

import companyReducer from "@/Context/Slices/Auth/companySlice"

import {
  combineReducers,
  configureStore,
} from "@reduxjs/toolkit"

import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
} from "redux-persist"

import storage from "redux-persist/lib/storage"

/**
 * Solo se persisten estados que deben sobrevivir
 * una recarga normal del navegador.
 *
 * loginAccess no se persiste:
 * - la solicitud tiene una duración corta;
 * - no debe compartirse entre pestañas;
 * - evita que otra pestaña abra el flujo de espera.
 */
const persistConfig = {
  key: "root",
  version: 1,
  storage,

  whitelist: [
    "auth",
    "cart",
    "company",
  ],
}

const rootReducer = combineReducers({
  auth: authReducer,

  ui: uiReducer,
  users: userReducer,
  notifications: notificationsReducer,
  popup: popupReducer,
  assignModal: assignModalReducer,
  activeSesionModal: activeSesionModalReducer,

  cart: cartReducer,
  cartBadge: cartBadgeReducer,
  powerTranz: powerTranzReducer,

  company: companyReducer,
})

const persistedReducer = persistReducer(
  persistConfig,
  rootReducer
)

export const store = configureStore({
  reducer: persistedReducer,

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          FLUSH,
          REHYDRATE,
          PAUSE,
          PERSIST,
          PURGE,
          REGISTER,
        ],
      },
    }),
})

export const persistor = persistStore(store)

export type RootState =
  ReturnType<typeof store.getState>

export type AppDispatch =
  typeof store.dispatch
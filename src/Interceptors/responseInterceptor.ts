import api from '@/Utils/ApiConfig'
import axios from 'axios'
import { store } from '@/Context/index'
import { setTokens, logout } from '@/Context/Slices/authSlice'

export function setupResponseInterceptor() {
  api.interceptors.response.use(
    response => response,
    async error => {
      const originalReq = error.config
      if (error.response?.status === 401 && originalReq && !originalReq._retry) {
        originalReq._retry = true
        const refreshToken = store.getState().auth.refreshToken
        const { data } = await axios.post(
          `${api.defaults.baseURL}/Auth/refresh`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        )
        const { accessToken, refreshToken: newRefresh } = data.data
        store.dispatch(setTokens({ accessToken, refreshToken: newRefresh }))
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`
        if (originalReq.headers) {
          originalReq.headers.Authorization = `Bearer ${accessToken}`
        }
        return api(originalReq)
      }
      store.dispatch(logout())
      return Promise.reject(error)
    }
  )
}
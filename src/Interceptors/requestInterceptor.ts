import api from '@/Utils/ApiConfig'
import { store } from '@/Context/index'

export function setupRequestInterceptor() {
  api.interceptors.request.use(config => {
    const token = store.getState().auth.accessToken
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })
}
import api from '@/Utils/ApiConfig'
import {getAccessToken} from '@/Utils/jwt'

export function setupRequestInterceptor() {
  api.interceptors.request.use(config => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })
}
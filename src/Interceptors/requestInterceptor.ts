import api from '@/Utils/ApiConfig'

export function setupRequestInterceptor() {
  api.interceptors.request.use(config => {
    try {
      const authRaw = localStorage.getItem('auth')
      if (authRaw && config.headers) {
        const { accessToken } = JSON.parse(authRaw)
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`
        }
      }
    } catch {
      // si algo falla al parsear, simplemente seguimos sin header
    }
    return config
  })
}
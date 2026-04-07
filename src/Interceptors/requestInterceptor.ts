import type { AxiosInstance } from "axios";

export function setupRequestInterceptor(instance: AxiosInstance) {
  instance.interceptors.request.use((config) => {
    return config;
  });
}
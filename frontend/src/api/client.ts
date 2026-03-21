import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { createClient, createConfig } from '@hey-api/client-axios'
import { useAuthStore } from '@/stores/auth.store'

// --- Axios instance (used directly for non-generated calls) ---

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT access token to every request
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto-refresh on 401 with _retry guard to prevent infinite loops
interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        await useAuthStore.getState().refresh()
        const token = useAuthStore.getState().accessToken
        if (token) {
          originalRequest.headers.Authorization = `Bearer ${token}`
        }
        return await apiClient.request(originalRequest)
      } catch (refreshError) {
        useAuthStore.getState().logout()
        throw refreshError
      }
    }

    return Promise.reject(error)
  }
)

// --- @hey-api/client-axios instance (used by generated SDK functions) ---

export const heyApiClient = createClient(
  createConfig({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
    withCredentials: true,
  })
)

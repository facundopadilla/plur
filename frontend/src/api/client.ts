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

// Auto-refresh on 401 — single attempt, then logout
interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

let isRefreshing = false
let refreshFailed = false

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined
    const url = originalRequest?.url ?? ''

    // Never retry the refresh endpoint itself
    if (url.includes('/auth/refresh')) {
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // If refresh already failed, don't try again — just logout
      if (refreshFailed) {
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      originalRequest._retry = true

      // Prevent concurrent refresh calls
      if (!isRefreshing) {
        isRefreshing = true
        try {
          await useAuthStore.getState().refresh()
          isRefreshing = false
        } catch {
          isRefreshing = false
          refreshFailed = true
          useAuthStore.getState().logout()
          window.location.href = '/login'
          return Promise.reject(error)
        }
      }

      // Retry with new token
      const token = useAuthStore.getState().accessToken
      if (token) {
        originalRequest.headers.Authorization = `Bearer ${token}`
        return await apiClient.request(originalRequest)
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

import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { apiClient } from '@/api/client'

interface UserMeResponse {
  id: number
  email: string
  first_name: string
  last_name: string
}

export const PrivateRoute = () => {
  const token = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  useEffect(() => {
    if (token && !user) {
      apiClient
        .get<UserMeResponse>('/auth/me')
        .then((res) => setUser(res.data))
        .catch(() => {})
    }
  }, [token, user, setUser])

  return token ? <Outlet /> : <Navigate to="/login" replace />
}

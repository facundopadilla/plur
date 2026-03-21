import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'

export const PrivateRoute = () => {
  const token = useAuthStore((s) => s.accessToken)
  return token ? <Outlet /> : <Navigate to="/login" replace />
}

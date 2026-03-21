import { createBrowserRouter } from 'react-router-dom'
import { PrivateRoute } from './PrivateRoute'

export const router = createBrowserRouter([
  {
    path: '/',
    lazy: () => import('@/pages/Landing'),
  },
  {
    path: '/login',
    lazy: () => import('@/pages/Login'),
  },
  {
    path: '/signup',
    lazy: () => import('@/pages/Signup'),
  },
  {
    path: '/password-recovery',
    lazy: () => import('@/pages/PasswordRecovery'),
  },
  {
    path: '/activate',
    lazy: () => import('@/pages/Activate'),
  },
  {
    element: <PrivateRoute />,
    children: [
      {
        path: '/dashboard',
        lazy: () => import('@/pages/Home'),
      },
    ],
  },
])

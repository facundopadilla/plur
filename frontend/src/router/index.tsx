import { createBrowserRouter } from 'react-router-dom'
import { PrivateRoute } from './PrivateRoute'

/** Retry a dynamic import once by reloading the page when chunks are stale */
function lazyWithReload<T>(factory: () => Promise<T>): () => Promise<T> {
  return () =>
    factory().catch((err: unknown) => {
      const alreadyReloaded = sessionStorage.getItem('chunk-reload')
      if (!alreadyReloaded) {
        sessionStorage.setItem('chunk-reload', '1')
        window.location.reload()
      }
      throw err
    })
}

// Clear the reload flag on successful page load
sessionStorage.removeItem('chunk-reload')

export const router = createBrowserRouter([
  {
    path: '/',
    lazy: lazyWithReload(() => import('@/pages/Landing')),
  },
  {
    path: '/login',
    lazy: lazyWithReload(() => import('@/pages/Login')),
  },
  {
    path: '/signup',
    lazy: lazyWithReload(() => import('@/pages/Signup')),
  },
  {
    path: '/password-recovery',
    lazy: lazyWithReload(() => import('@/pages/PasswordRecovery')),
  },
  {
    path: '/activate',
    lazy: lazyWithReload(() => import('@/pages/Activate')),
  },
  {
    element: <PrivateRoute />,
    children: [
      {
        path: '/dashboard',
        lazy: lazyWithReload(() => import('@/pages/Home')),
      },
    ],
  },
])

import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'
import type { ReactNode } from 'react'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token, user } = useAuth()
  if (!token) return <Navigate to="/auth" replace />
  if (user && user.hasAccess === false) return <Navigate to="/billing" replace />
  return <>{children}</>
}

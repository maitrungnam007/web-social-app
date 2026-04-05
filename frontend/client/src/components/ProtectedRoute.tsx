import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export default function ProtectedRoute({ 
  children, 
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    // Lưu đường dẫn hiện tại để redirect sau khi login
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />
  }

  return <>{children}</>
}

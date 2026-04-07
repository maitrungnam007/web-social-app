import { Outlet, Navigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../contexts/AuthContext'

export default function MainLayout() {
  const { user } = useAuth()
  
  // Redirect admin to admin panel
  if (user?.role === 'Admin') {
    return <Navigate to="/admin" replace />
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:ml-64 pt-16">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

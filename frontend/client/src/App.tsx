import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Stories from './pages/Stories'
import Notifications from './pages/Notifications'
import Friends from './pages/Friends'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      
      <Route path="/" element={<MainLayout />}>
        <Route index element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        <Route path="profile/:userId?" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="stories" element={
          <ProtectedRoute>
            <Stories />
          </ProtectedRoute>
        } />
        <Route path="notifications" element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        } />
        <Route path="friends" element={
          <ProtectedRoute>
            <Friends />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 1000,
            style: {
              background: '#333',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10b981',
              },
              duration: 1000,
            },
            error: {
              style: {
                background: '#ef4444',
              },
              duration: 3000,
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

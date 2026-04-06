import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'
import ProtectedRoute from './components/ProtectedRoute'
import LoadingSkeleton from './components/LoadingSkeleton'

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Profile = lazy(() => import('./pages/Profile'))
const Stories = lazy(() => import('./pages/Stories'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Friends = lazy(() => import('./pages/Friends'))

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <LoadingSkeleton variant="circular" width={48} height={48} className="mx-auto" />
        <p className="text-gray-500">Đang tải...</p>
      </div>
    </div>
  )
}

// Scroll restoration component
function ScrollRestoration() {
  const location = useLocation()
  
  // Save scroll position continuously while on home page
  useEffect(() => {
    if (location.pathname !== '/') return
    
    const handleScroll = () => {
      sessionStorage.setItem('scrollPosition', String(window.scrollY))
    }
    
    // Save on scroll
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [location.pathname])
  
  // Restore scroll position when coming back to home
  useEffect(() => {
    if (location.pathname === '/') {
      const savedPosition = sessionStorage.getItem('scrollPosition')
      if (savedPosition) {
        // Wait longer for content to load (infinite scroll needs time)
        const timer = setTimeout(() => {
          window.scrollTo(0, parseInt(savedPosition))
        }, 500)
        return () => clearTimeout(timer)
      }
    }
  }, [location.pathname])
  
  return null
}

function AppRoutes() {
  return (
    <>
      <ScrollRestoration />
      <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={
          <Suspense fallback={<PageLoader />}>
            <Login />
          </Suspense>
        } />
        <Route path="/register" element={
          <Suspense fallback={<PageLoader />}>
            <Register />
          </Suspense>
        } />
      </Route>
      
      <Route path="/" element={<MainLayout />}>
        <Route index element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <Home />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="profile/:userId?" element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <Profile />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="stories" element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <Stories />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="notifications" element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <Notifications />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="friends" element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <Friends />
            </Suspense>
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
    </>
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
